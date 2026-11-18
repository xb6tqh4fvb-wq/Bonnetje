// Zet (OCR- of PDF-)tekst van een kassabon om in losse regels met aantal en bedrag.
// Heuristisch: de gebruiker controleert en corrigeert het resultaat altijd zelf.

// Bedrag met 2 decimalen, optioneel met duizendtallen (1.234,56 / 1,234.56) en minteken voor of achter.
const AMOUNT = /(-\s?)?€?\s?(\d{1,3}(?:[.,]\d{3})+|\d{1,5})\s?[,.]\s?(\d{2})(?!\d)(\s?-)?/g;
const DATE = /\b\d{1,2}[-./]\d{1,2}[-./]\d{2,4}\b/;
const TIME = /\b\d{1,2}:\d{2}\b/;
const TOTAL = /\b(totaal|total|te\s?betalen|eindtotaal|amount\s?due|grand\s?total|balance\s?due|a\s?pagar|importe\s?total)\b/i;
const SUBTOTAL = /\b(sub\s?-?\s?totaal|sub\s?-?\s?total)\b/i;
const SKIP = new RegExp(
  '\\b(' +
    [
      'btw', 'b\\.t\\.w', 'vat', 'tax', 'excl', 'incl', 'pin', 'pinnen', 'betaling', 'betaald', 'contant',
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

/** Veelvoorkomende OCR-fouten in getallen herstellen (O->0, l/I->1 naast cijfers, $,00 -> 5,00). */
function fixDigits(line) {
  return line
    .replace(/[$§](?=\s?[,.]\s?\d{2}(?!\d))/g, '5')
    .replace(/(^|\s)S(?=[,.]\d{2}(?!\d))/g, '$15')
    .replace(/(\d)[Oo]/g, (_, d) => d + '0')
    .replace(/[Oo](\d)/g, (_, d) => '0' + d)
    .replace(/(\d)[lI|]/g, (_, d) => d + '1')
    .replace(/[lI|](\d)/g, (_, d) => '1' + d);
}

/** In woorden juist andersom: "1berico" -> "iberico", "C0la" -> "Cola" (alleen bij woorden van 3+ letters). */
function fixWordDigits(name) {
  return name.replace(/\S+/g, (w) => {
    if ((w.match(/\p{L}/gu) || []).length < 3) return w;
    return w.replace(/1(?=\p{L})|(?<=\p{L})1/gu, 'i').replace(/0(?=\p{L})|(?<=\p{L})0/gu, 'o');
  });
}

function amountsIn(line) {
  const out = [];
  for (const m of line.matchAll(AMOUNT)) {
    const neg = !!(m[1] || m[4]);
    const cents = Number(m[2].replace(/[.,]/g, '')) * 100 + Number(m[3]);
    out.push({ cents: neg ? -cents : cents, index: m.index, end: m.index + m[0].length });
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

const SEPARATOR = /^[\s\-=_*.·—–~]{6,}$/;
const COLUMN_HEADER = /\b(uds|cant|descripcion|descripción|concepto|omschrijving|aantal|qty|description|item|articulo|artículo)\b/i;

/** Aantal en naam uit het tekstdeel van een regel: "2 Cola", "2x Cola", "Cola x2", "Cola 2x", "| Cola". */
function splitQty(raw) {
  let name = raw;
  let qty = 1;
  const q = name.match(/^\s*(\d{1,2})\s*[xX×*]?\s+(.*)$/) || name.match(/^\s*(\d{1,2})\s*[xX×*]\s*(.*)$/);
  if (q && Number(q[1]) > 0) return { qty: Number(q[1]), name: q[2] };
  const qEnd = name.match(/^(.*?)\s+(\d{1,2})\s*[xX×]\s*$/) || name.match(/^(.*?)\s*[xX×]\s*(\d{1,2})\s*$/);
  if (qEnd && Number(qEnd[2]) > 0) return { qty: Number(qEnd[2]), name: qEnd[1] };
  // "|", "]", "!" of losse l/I vooraan is meestal een verkeerd gelezen "1"
  const one = name.match(/^\s*[|\]!lI]\s+(\p{L}.*)$/u);
  if (one) return { qty: 1, name: one[1] };
  return { qty, name };
}

/**
 * Zet bontekst om in regels. conf (optioneel): zekerheid van de tekstherkenning per regel
 * (0-100, zelfde volgorde als de regels van text); komt terug als item.conf.
 */
export function parseReceiptText(text, conf = null) {
  const items = [];
  const totals = [];
  let subtotal = null;
  let title = null;
  let afterTotal = false;
  let inItems = false;
  // Bij scheve foto's komen naam en bedrag soms op aparte regels terecht: koppel ze op volgorde.
  const nameQ = [];
  const amountQ = [];

  const makeItem = (rawName, amounts, c) => {
    const last = amounts[amounts.length - 1];
    let { qty, name } = splitQty(rawName);
    if (qty === 1 && amounts.length >= 2 && amounts[0].cents > 0) {
      const r = Math.round(last.cents / amounts[0].cents);
      if (r >= 2 && r <= 30 && Math.abs(amounts[0].cents * r - last.cents) <= 1) qty = r;
    }
    name = cleanName(fixWordDigits(name));
    if (!/\p{L}{2,}/u.test(name)) name = 'Onbekend item';
    items.push({
      name,
      qty,
      priceCents: last.cents,
      ...(amounts.length >= 2 && qty > 1 ? { unitCents: amounts[0].cents } : {}),
      ...(c != null ? { conf: c } : {}),
      // Service/couvert en kortingen standaard over iedereen; aanpasbaar bij Verdelen.
      everyone: last.cents < 0 || /\b(service|bediening|fooi|couvert|tip|gratuity|cover|servicio|propina|cubierto)\b/i.test(name),
    });
    inItems = true;
  };
  const pair = () => {
    while (nameQ.length && amountQ.length) {
      const n = nameQ.shift();
      const a = amountQ.shift();
      makeItem(n.text, a.amounts, Math.min(n.conf ?? 100, a.conf ?? 100));
    }
  };

  String(text || '')
    .split(/\r?\n/)
    .forEach((rawLine, idx) => {
      const c = conf ? conf[idx] : null;
      const line = fixDigits(rawLine.trim());
      if (!line) return;
      if (SEPARATOR.test(line) || (COLUMN_HEADER.test(line) && !amountsIn(line).length)) {
        if (!afterTotal && (items.length || SEPARATOR.test(line) || COLUMN_HEADER.test(line))) inItems = true;
        return;
      }
      const amounts = amountsIn(line);

      if (!amounts.length) {
        if (!title && !items.length && !inItems && /\p{L}{3,}/u.test(line) && !DATE.test(line) && !SKIP.test(line)) {
          title = cleanName(line).slice(0, 40) || null;
        } else if (inItems && !afterTotal && /\p{L}{3,}/u.test(line) && !SKIP.test(line) && !DATE.test(line) && !TIME.test(line) && !TOTAL.test(line)) {
          nameQ.push({ text: line, conf: c });
          pair();
        }
        return;
      }
      const last = amounts[amounts.length - 1];

      if (SUBTOTAL.test(line)) {
        subtotal = last.cents;
        return;
      }
      if (TOTAL.test(line) && !/excl|btw|vat|iva|tax/i.test(line)) {
        totals.push(last.cents);
        afterTotal = true;
        return;
      }
      if (afterTotal) return; // na het totaal volgen betaal- en btw-regels
      if (SKIP.test(line) || DATE.test(line) || TIME.test(line)) return;
      if (/%/.test(line) && !/korting|discount|descuento|service|servicio|propina|gratuity/i.test(line)) return;
      if (!last.cents) return;

      const textPart = line.slice(0, amounts[0].index);
      const rest = (textPart + line.slice(last.end)).replace(/[€\s]/g, '');
      if (!/\p{L}{2,}/u.test(rest) && inItems) {
        // alleen bedrag(en) op deze regel: hoort bij een naam op een andere regel
        amountQ.push({ amounts, conf: c });
        pair();
        return;
      }
      if (amountQ.length || nameQ.length) {
        // Er wacht nog een los bedrag of een losse naam: de regels zijn verschoven, dus ook
        // deze regel splitsen en op volgorde koppelen (anders krijgt hij het verkeerde bedrag).
        nameQ.push({ text: textPart, conf: c });
        amountQ.push({ amounts, conf: c });
        pair();
        return;
      }
      makeItem(textPart, amounts, c);
    });

  const totalCents = totals.length ? Math.max(...totals) : subtotal;
  return { title, items, totalCents };
}

/**
 * Beoordeelt hoe goed een uitgelezen bon "klopt": voor het kiezen tussen meerdere
 * leespogingen. good = er zijn regels én de som is gelijk aan het herkende totaal.
 */
export function judgeReceipt(text) {
  const p = parseReceiptText(text);
  const sum = p.items.reduce((a, it) => a + it.priceCents, 0);
  const hasTotal = p.totalCents != null;
  const good = p.items.length > 0 && hasTotal && sum === p.totalCents;
  const score = (good ? 1000 : 0) + (hasTotal ? 50 : 0) + p.items.length * 10 - (hasTotal ? Math.min(40, Math.abs(sum - p.totalCents) / 100) : 0);
  return { good, score };
}

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
