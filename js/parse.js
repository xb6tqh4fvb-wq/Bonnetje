// Zet (OCR- of PDF-)tekst van een kassabon om in losse regels met aantal en bedrag.
// Heuristisch: de gebruiker controleert en corrigeert het resultaat altijd zelf.

const AMOUNT = /(-\s?)?€?\s?(\d{1,5})\s?[,.]\s?(\d{2})(?!\d)(\s?-)?/g;
const DATE = /\b\d{1,2}[-./]\d{1,2}[-./]\d{2,4}\b/;
const TIME = /\b\d{1,2}:\d{2}\b/;
const TOTAL = /\b(totaal|total|te\s?betalen|eindtotaal|amount\s?due)\b/i;
const SUBTOTAL = /\b(sub\s?-?\s?totaal|subtotal)\b/i;
const SKIP = new RegExp(
  '\\b(' +
    [
      'btw', 'b\\.t\\.w', 'vat', 'tax', 'excl', 'incl', 'pin', 'pinnen', 'betaling', 'betaald', 'contant',
      'cash', 'wisselgeld', 'terug', 'retour', 'visa', 'mastercard', 'maestro', 'v\\s?pay', 'amex', 'debit',
      'credit', 'kaart', 'card', 'transactie', 'autorisatie', 'auth', 'terminal', 'merchant', 'token',
      'saldo', 'change', 'bonnummer', 'bon\\s?nr', 'tafel', 'kassa', 'ober', 'bediende', 'datum', 'tijd',
      'tel', 'kvk', 'iban', 'bedankt', 'tot\\s?ziens',
    ].join('|') +
    ')\\b',
  'i'
);

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
    const cents = Number(m[2]) * 100 + Number(m[3]);
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

export function parseReceiptText(text) {
  const items = [];
  const totals = [];
  let subtotal = null;
  let title = null;
  let afterTotal = false;

  for (const rawLine of String(text || '').split(/\r?\n/)) {
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
    if (TOTAL.test(line) && !/excl|btw|vat/i.test(line)) {
      totals.push(last.cents);
      afterTotal = true;
      continue;
    }
    if (afterTotal) continue; // na het totaal volgen betaal- en btw-regels
    if (SKIP.test(line) || DATE.test(line) || TIME.test(line)) continue;
    if (/%/.test(line) && !/korting|discount|service/i.test(line)) continue;
    if (!last.cents) continue;

    let name = line.slice(0, amounts[0].index);
    let qty = 1;
    const q = name.match(/^\s*(\d{1,2})\s*[xX×*]?\s+(.*)$/) || name.match(/^\s*(\d{1,2})\s*[xX×*]\s*(.*)$/);
    if (q && Number(q[1]) > 0) {
      qty = Number(q[1]);
      name = q[2];
    } else {
      const qEnd = name.match(/^(.*?)\s+(\d{1,2})\s*[xX×]\s*$/);
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

    items.push({
      name,
      qty,
      priceCents: last.cents,
      everyone: /\b(service|bediening|fooi|couvert|tip)\b/i.test(name),
    });
  }

  const totalCents = totals.length ? Math.max(...totals) : subtotal;
  return { title, items, totalCents };
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
