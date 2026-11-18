// Rekenkern: verdeling van een bon over deelnemers, inclusief fooi.
// Alle bedragen in centen (gehele getallen) om afrondingsfouten te voorkomen.

export const uid = () => Math.random().toString(36).slice(2, 10);

const euroFmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
export const formatEuro = (cents) => euroFmt.format((cents || 0) / 100);

/** Bedrag zonder valutateken, bv. "22,50" (handig voor Tikkie). */
export const formatPlain = (cents) =>
  ((cents || 0) / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "22,50" / "22.50" / "€ 22" / "-3,00" -> centen. Ongeldig -> null. */
export function parseEuro(input) {
  if (input === null || input === undefined) return null;
  let s = String(input).trim().replace(/[€\s]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d*(\.\d*)?$/.test(s) || s === '-' || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/**
 * Rondt een lijst (fractionele) centbedragen af naar gehele centen zodat de som
 * exact gelijk is aan de afgeronde som (methode van de grootste overschotten).
 */
export function roundAlloc(values) {
  const total = Math.round(values.reduce((a, b) => a + b, 0));
  const floors = values.map((v) => Math.floor(v + 1e-9));
  let rest = total - floors.reduce((a, b) => a + b, 0);
  const order = values
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0 && order.length; k = (k + 1) % order.length, rest--) floors[order[k].i] += 1;
  return floors;
}

/** Effectieve gewichten (eenheden) per deelnemer voor een item. */
export function itemWeights(item, people) {
  const ids = new Set(people.map((p) => p.id));
  if (item.everyone) return people.map((p) => [p.id, 1]);
  return Object.entries(item.assign || {}).filter(([pid, w]) => ids.has(pid) && w > 0);
}

/** Aantal nog niet toegewezen eenheden van een item. */
export function unitsLeft(item, people) {
  if (item.everyone && people.length) return 0;
  const used = itemWeights(item, people).reduce((a, [, w]) => a + w, 0);
  return Math.max(0, (item.qty || 1) - used);
}

/**
 * Berekent per deelnemer wat hij/zij moet betalen.
 *
 * Item-verdeling: elk item heeft een aantal (qty) en een regelbedrag. Iedere deelnemer
 * krijgt eenheden toegewezen. Prijs per eenheid = regelbedrag / max(qty, totaal toegewezen).
 * Zijn er meer eenheden toegewezen dan het aantal (bv. 1 fles wijn met 3 personen), dan
 * wordt het item naar rato gedeeld.
 *
 * Fooi: doelbedrag T (geen / vast bedrag / percentage van de bon), verdeeld gelijk of
 * naar verhouding van consumpties -> aandeel s_i. Wat iemand vrijwillig extra geeft
 * (bv. wisselgeld laten liggen) = c_i wordt eerst met het eigen aandeel verrekend;
 * het overschot verlaagt de nog openstaande fooi-aandelen van de anderen naar rato.
 */
export function computeSplit(bill) {
  const people = bill.people || [];
  const items = bill.items || [];
  const itemsTotal = items.reduce((a, it) => a + (it.priceCents || 0), 0);

  const raw = new Map(people.map((p) => [p.id, 0]));
  const lines = new Map(people.map((p) => [p.id, []]));
  for (const item of items) {
    const weights = itemWeights(item, people);
    const W = weights.reduce((a, [, w]) => a + w, 0);
    if (!W) continue;
    const denom = Math.max(item.qty || 1, W);
    for (const [pid, w] of weights) {
      const share = ((item.priceCents || 0) * w) / denom;
      raw.set(pid, raw.get(pid) + share);
      lines.get(pid).push({ itemId: item.id, name: item.name, units: w, shared: W > (item.qty || 1), cents: share });
    }
  }
  const subs = roundAlloc(people.map((p) => raw.get(p.id)));
  const assignedTotal = subs.reduce((a, b) => a + b, 0);
  const unassignedCents = itemsTotal - assignedTotal;

  // Fooi
  const tip = bill.tip || { mode: 'none' };
  let tipTarget = 0;
  if (tip.mode === 'amount') tipTarget = Math.max(0, tip.amountCents || 0);
  else if (tip.mode === 'percent') tipTarget = Math.max(0, Math.round((itemsTotal * (tip.percent || 0)) / 100));

  const n = people.length;
  const sumSubs = subs.reduce((a, b) => a + Math.max(0, b), 0);
  const shares = people.map((p, i) => {
    if (!n || !tipTarget) return 0;
    if (tip.distribution === 'equal' || sumSubs <= 0) return tipTarget / n;
    return (tipTarget * Math.max(0, subs[i])) / sumSubs;
  });
  const extras = people.map((p) => Math.max(0, p.extraTipCents || 0));
  const open = shares.map((s, i) => Math.max(0, s - extras[i]));
  const surplus = shares.map((s, i) => Math.max(0, extras[i] - s));
  const E = open.reduce((a, b) => a + b, 0);
  const U = surplus.reduce((a, b) => a + b, 0);
  const factor = E > 0 ? Math.max(0, 1 - U / E) : 0;
  const tipOwed = roundAlloc(open.map((e) => e * factor));

  const persons = people.map((p, i) => {
    const tipCents = tipOwed[i] + extras[i];
    const dueCents = subs[i] + tipCents;
    const cash = p.method === 'contant';
    const given = cash && p.givenCents != null ? p.givenCents : null;
    return {
      id: p.id,
      name: p.name,
      method: p.method || 'contant',
      paid: !!p.paid,
      subtotalCents: subs[i],
      tipShareCents: tipOwed[i],
      extraTipCents: extras[i],
      tipCents,
      dueCents,
      givenCents: given,
      changeCents: given == null ? null : given - dueCents,
      lines: lines.get(p.id).map((l) => ({ ...l, cents: Math.round(l.cents) })),
    };
  });

  const tipTotal = persons.reduce((a, p) => a + p.tipCents, 0);
  const dueTotal = persons.reduce((a, p) => a + p.dueCents, 0);
  const paidTotal = persons.filter((p) => p.paid).reduce((a, p) => a + p.dueCents, 0);
  return {
    itemsTotal,
    assignedTotal,
    unassignedCents,
    tipTarget,
    tipTotal,
    dueTotal,
    paidTotal,
    openTotal: dueTotal - paidTotal,
    persons,
  };
}
