// Zet (OCR- of PDF-)tekst van een kassabon om in losse regels met aantal en bedrag.
// Heuristisch: de gebruiker controleert en corrigeert het resultaat altijd zelf.

// Bedrag met 2 decimalen, optioneel met duizendtallen (1.234,56 / 1,234.56) en minteken voor of achter.
// Niet direct gevolgd door een letter: "0,75L" (inhoud) is geen bedrag.
const AMOUNT = /(-\s?)?€?\s?(\d{1,3}(?:[.,]\d{3})+|\d{1,5})\s?[,.]\s?(\d{2})(?![\d\p{L}])(\s?-)?/gu;
const DATE = /\b\d{1,2}[-./]\d{1,2}[-./]\d{2,4}\b/;
const TIME = /\b\d{1,2}:\d{2}\b/;
const TOTAL = /\b(totaal|total|te\s?betalen|eindtotaal|amount\s?due|grand\s?total|balance\s?due|a\s?pagar|importe\s?total)\b/i;
const SUBTOTAL = /\b(sub\s?-?\s?totaal|sub\s?-?\s?total)\b/i;
const SKIP = new RegExp(
  '\\b(' +
    [
      'btw', 'b\\.t\\.w', 'vat', 'tax', 'excl\\w*', 'incl\\w*', 'pin', 'pinnen', 'betaling', 'betaald', 'contant',
      'cash', 'wisselgeld', 'terug', 'retour', 'visa', 'mastercard', 'maestro', 'v\\s?pay', 'amex', 'debit',
      'credit', 'kaart', 'card', 'transactie', 'autorisatie', 'auth', 'terminal', 'merchant', 'token',
      'saldo', 'change', 'bonnummer', 'bon\\s?nr', 'tafel', 'kassa', 'ober', 'bediende', 'datum', 'tijd',
      'tel', 'kvk', 'iban', 'bedankt', 'tot\\s?ziens',
      // Spaans
      'iva', 'base', 'imponible', 'cuota', 'efectivo', 'tarjeta', 'entregado', 'cambio', 'devolver', 'devuelto',
      'mesa', 'camarero', 'camarera', 'factura', 'ticket', 'gracias', 'cif', 'nif', 'fecha', 'hora', 'comensales',
      'atendido', 'pagado', 'pago', 'operacion', 'importe',
      // Engels
      'tax', 'gst', 'cash', 'tendered', 'server', 'table', 'guests?', 'thank', 'receipt', 'check', 'order', 'paid',
      'payment', 'approved', 'balance',
    ].join('|') +
    ')\\b',
  'i'
);

const INCLUSIVE = /\b(incl\w*|inclusief|incluido|incluida|included|including)\b/i;
const EXCLUSIVE = /\b(excl\w*|exclusief|zonder|sin|base|imponible|netto|net|before|pre)\b/i;
const TAX_WORD = /\b(btw|b\.t\.w\.?|vat|iva|tax|gst)\b/i;

/** Is deze totaalregel het eindtotaal (dus niet "excl. btw" of alleen het btw-bedrag)? */
function isGrandTotal(line) {
  if (INCLUSIVE.test(line)) return true;
  if (EXCLUSIVE.test(line)) return false;
  return !TAX_WORD.test(line);
}

/** Veelvoorkomende OCR-fouten in getallen herstellen (O->0, l/I->1 naast cijfers). */
function fixDigits(line) {
  return line
    .replace(/(\d)[Oo]/g, (_, d) => d + '0')
    .replace(/[Oo](\d)/g, (_, d) => '0' + d)
    .replace(/(\d)[lI|]/g, (_, d) => d + '1')
    .replace(/[lI|](\d)/g, (_, d) => '1' + d);
}

function amountsIn(line) {
  const out = [];
  for (const m of line.matchAll(AMOUNT)) {
    const neg = !!(m[1] || m[4]);
    const cents = Number(m[2].replace(/[.,]/g, '')) * 100 + Number(m[3]);
    out.push({ cents: neg ? -cents : cents, index: m.index });
  }
  return out;
}

function cleanName(s) {
  return s
    .replace(/[€*#_=~|]+/g, ' ')
    .replace(/\s+[xX×]\s*$/, '')
    .replace(/^[^\p{L}\d]+|[^\p{L}\d)]+$/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Zet bontekst om in regels.
 * - text: platte tekst (PDF-tekstlaag, of als er geen regels van de OCR zijn).
 * - lines (optioneel): regels van de tekstherkenning met zekerheid en woorden met positie;
 *   dan krijgt elk gevonden item conf (regelzekerheid), amountConf (zekerheid van het bedrag)
 *   en minConf (laagste woordzekerheid), zodat onzekere regels gemarkeerd kunnen worden.
 * - opts.fromWords: regels zelf opbouwen uit de woorden en hun positie (rowsFromWords),
 *   in plaats van de regelindeling van de tekstherkenning te gebruiken.
 */
export function parseReceiptText(text, lines = null, opts = {}) {
  const items = [];
  const totals = [];
  let subtotal = null;
  let title = null;
  let afterTotal = false;
  const source = lines?.length
    ? opts.fromWords
      ? rowsFromWords(lines)
      : lines
    : String(text || '').split(/\r?\n/).map((t) => ({ text: t }));

  for (const src of source) {
    const rawLine = src.text || '';
    const line = fixDigits(rawLine.trim());
    if (!line) continue;
    const amounts = amountsIn(line);

    if (!amounts.length) {
      if (!title && !items.length && /\p{L}{3,}/u.test(line) && !DATE.test(line) && !SKIP.test(line)) {
        title = cleanName(line).slice(0, 40) || null;
      }
      continue;
    }
    const last = amounts[amounts.length - 1];

    if (SUBTOTAL.test(line)) {
      subtotal = last.cents;
      continue;
    }
    if (TOTAL.test(line)) {
      // Elke totaalregel sluit de gerechten af. Het echte totaal is incl. btw;
      // "totaal exclusief", "zonder btw" of alleen het btw-bedrag tellen niet mee.
      afterTotal = true;
      if (isGrandTotal(line)) totals.push(last.cents);
      continue;
    }
    if (afterTotal) continue; // na het totaal volgen betaal- en btw-regels
    if (SKIP.test(line) || DATE.test(line) || TIME.test(line)) continue;
    if (/%/.test(line) && !/korting|discount|descuento|service|servicio|propina|gratuity/i.test(line)) continue;
    if (!last.cents) continue;

    let name = line.slice(0, amounts[0].index);
    let qty = 1;
    const q = name.match(/^\s*(\d{1,2})\s*[xX×*]?\s+(.*)$/) || name.match(/^\s*(\d{1,2})\s*[xX×*]\s*(.*)$/);
    if (q && Number(q[1]) > 0) {
      qty = Number(q[1]);
      name = q[2];
    } else {
      // aantal achter de naam: "Cola 2x" of "Cola x2"
      const qEnd = name.match(/^(.*?)\s+(\d{1,2})\s*[xX×]\s*$/) || name.match(/^(.*?)\s*[xX×]\s*(\d{1,2})\s*$/);
      if (qEnd) {
        name = qEnd[1];
        qty = Number(qEnd[2]);
      }
    }
    if (qty === 1 && amounts.length >= 2 && amounts[0].cents > 0) {
      const ratio = last.cents / amounts[0].cents;
      const r = Math.round(ratio);
      if (r >= 2 && r <= 30 && Math.abs(amounts[0].cents * r - last.cents) <= 1) qty = r;
    }
    name = cleanName(name);
    if (!/\p{L}{2,}/u.test(name)) name = 'Onbekend item';
    const unitCents = amounts.length >= 2 && amounts[0].cents > 0 ? amounts[0].cents : null;

    items.push({
      name,
      qty,
      priceCents: last.cents,
      // Service/couvert en kortingen standaard over iedereen; aanpasbaar bij Verdelen.
      everyone: last.cents < 0 || /\b(service|bediening|fooi|couvert|tip|gratuity|cover|servicio|propina|cubierto)\b/i.test(name),
      ...(unitCents ? { unitCents } : {}),
      ...confidence(src),
    });
  }

  const totalCents = totals.length ? Math.max(...totals) : subtotal;
  return { title, items, totalCents };
}

/** Zekerheid van een OCR-regel: regel, het bedrag (woorden met een getal met 2 decimalen) en het laagste woord. */
function confidence(src) {
  if (src.conf == null) return {};
  const words = (src.words || []).filter((w) => w.text.trim());
  const amountWords = words.filter((w) => /\d[.,]\s?\d{2}/.test(w.text));
  return {
    conf: src.conf,
    amountConf: amountWords.length ? Math.min(...amountWords.map((w) => w.conf)) : src.conf,
    minConf: words.length ? Math.min(...words.map((w) => w.conf)) : src.conf,
  };
}

const median = (arr) => {
  const a = [...arr].sort((x, y) => x - y);
  return a.length ? a[a.length >> 1] : 0;
};

/**
 * Bouwt regels op uit de woorden van de tekstherkenning en hun positie, zoals
 * linesFromPositioned dat voor PDF's doet. Woorden op dezelfde hoogte (gecorrigeerd voor de
 * scheefstand van de foto) vormen één regel; een grote horizontale tussenruimte wordt een
 * kolomscheiding. Zo komen naam en bedrag ook samen als de OCR ze in aparte blokken zette.
 */
export function rowsFromWords(ocrLines) {
  const words = ocrLines.flatMap((l) => l.words || []).filter((w) => w.text && w.text.trim());
  if (!words.length) return [];
  const medH = median(words.map((w) => w.y1 - w.y0)) || 10;
  // scheefstand: mediane helling binnen de OCR-regels (eerste tot laatste woord)
  const slope = median(
    ocrLines
      .map((l) => l.words || [])
      .filter((ws) => ws.length >= 2)
      .map((ws) => {
        const a = ws[0], b = ws[ws.length - 1];
        const dx = (b.x0 + b.x1) / 2 - (a.x0 + a.x1) / 2;
        return dx > medH * 3 ? (b.y0 + b.y1 - a.y0 - a.y1) / 2 / dx : null;
      })
      .filter((v) => v != null)
  );
  const ws = words.map((w) => ({ ...w, cy: (w.y0 + w.y1) / 2 - slope * ((w.x0 + w.x1) / 2) })).sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const w of ws) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row.cy - w.cy) <= medH * 0.5) {
      row.words.push(w);
      row.cy = row.words.reduce((s, x) => s + x.cy, 0) / row.words.length;
    } else rows.push({ cy: w.cy, words: [w] });
  }
  return rows.map((r) => {
    const rw = r.words.sort((a, b) => a.x0 - b.x0);
    let text = '';
    rw.forEach((w, i) => {
      if (i) text += w.x0 - rw[i - 1].x1 > medH * 1.2 ? '   ' : ' ';
      text += w.text;
    });
    return { text, conf: Math.round(rw.reduce((s, w) => s + w.conf, 0) / rw.length), words: rw };
  });
}

/**
 * Kwaliteit van één leespoging, om tussen twee passages te kiezen. Combineert controles en
 * zekerheid; er wordt niets aan de bedragen veranderd.
 * - good: totaal gevonden, som sluit aan én de bedragen zijn met voldoende zekerheid gelezen.
 * - score: totaal gevonden (+20), som sluit aan (+30), gemiddelde zekerheid van de bedragen
 *   (0..50), aandeel regels waar stukprijs x aantal klopt (0..10), aantal regels (max +15).
 * mode 'som': alleen op aansluiting met het totaal (ter vergelijking in de meting).
 */
export function passQuality(text, lines, opts = {}) {
  const p = parseReceiptText(text, lines, opts);
  const sum = p.items.reduce((a, it) => a + it.priceCents, 0);
  const hasTotal = p.totalCents != null;
  const matches = hasTotal && p.items.length > 0 && sum === p.totalCents;
  const confs = p.items.map((it) => it.amountConf).filter((c) => c != null);
  const meanConf = confs.length ? confs.reduce((a, c) => a + c, 0) / confs.length : 0;
  const withUnit = p.items.filter((it) => it.unitCents);
  const consistent = withUnit.length ? withUnit.filter((it) => it.unitCents * it.qty === it.priceCents).length / withUnit.length : 1;
  if (opts.select === 'som') return { good: matches, score: (matches ? 100 : 0) + p.items.length };
  const score = (hasTotal ? 20 : 0) + (matches ? 30 : 0) + meanConf / 2 + consistent * 10 + Math.min(p.items.length, 15);
  const good = matches && (!confs.length || Math.min(...confs) >= UNSURE_BELOW);
  return { good, score: Math.round(score * 10) / 10 };
}

/** Grens voor "onzeker": zekerheid van het bedrag-woord onder deze waarde (zie meting stap 2.1). */
export const UNSURE_BELOW = 70;

/** Groepeert PDF-tekstfragmenten ({str, x, y}) tot regels, van boven naar beneden. */
export function linesFromPositioned(fragments, tolerance = 3) {
  const rows = [];
  for (const f of fragments) {
    if (!f.str || !f.str.trim()) continue;
    let row = rows.find((r) => Math.abs(r.y - f.y) <= tolerance);
    if (!row) rows.push((row = { y: f.y, parts: [] }));
    row.parts.push(f);
  }
  rows.sort((a, b) => b.y - a.y);
  return rows
    .map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.str.trim()).join('  '))
    .join('\n');
}
