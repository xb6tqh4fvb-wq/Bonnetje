// Rekenkern: verdeling van een bon over deelnemers, inclusief fooi.
// Alle bedragen in centen (gehele getallen) om afrondingsfouten te voorkomen.

export const uid = () => Math.random().toString(36).slice(2, 10);

let locale = 'nl-NL';
let euroFmt, euroShortFmt, plainFmt;
/** Notatie van bedragen: 'nl-NL' (€ 22,50) of 'en-IE' (€22.50). */
export function setNumberLocale(l) {
  locale = l;
  euroFmt = new Intl.NumberFormat(l, { style: 'currency', currency: 'EUR' });
  euroShortFmt = new Intl.NumberFormat(l, { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  plainFmt = new Intl.NumberFormat(l, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
}
setNumberLocale(locale);

export const formatEuro = (cents) => euroFmt.format((cents || 0) / 100);
/** Zonder ",00" bij ronde bedragen (voor knoppen): "€ 50" / "€ 22,50". */
export const formatEuroShort = (cents) =>
  (cents || 0) % 100 === 0 ? euroShortFmt.format((cents || 0) / 100) : formatEuro(cents);
/** Bedrag zonder valutateken, bv. "22,50" (handig voor Tikkie en invoervelden). */
export const formatPlain = (cents) => plainFmt.format((cents || 0) / 100);

/** "22,50" / "22.50" / "€ 22" / "-3,00" / "1.234,56" / "1,234.56" -> centen. Ongeldig -> null. */
export function parseEuro(input) {
  if (input === null || input === undefined) return null;
  let s = String(input).trim().replace(/[€\s]/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // Het laatste scheidingsteken is de decimale komma/punt.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    s = s.replace(',', '.');
  }
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

/** Ronde bedragen boven het bontotaal als suggestie voor "maak er maar ... van". */
export function roundUpSuggestions(cents) {
  let first = Math.ceil(Math.max(0, cents) / 500) * 500;
  if (first === cents) first += 500;
  return [first, first + 500, first + 1000, Math.ceil((first + 1500) / 1000) * 1000];
}

/** Suggesties om het eigen deel af te ronden: volgende hele euro, vijf en tien euro. */
export function personRoundUps(cents) {
  const out = [];
  for (const step of [100, 500, 1000]) {
    let v = Math.ceil(Math.max(0, cents) / step) * step;
    if (v === cents) v += step;
    if (!out.includes(v)) out.push(v);
  }
  return out;
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
 * Fooi: doelbedrag T (geen / vast bedrag / wat er boven het bonbedrag aan het restaurant
 * is betaald, bv. "maak er maar 110 van"), verdeeld gelijk of
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
  else if (tip.mode === 'total') tipTarget = Math.max(0, (tip.paidTotalCents || 0) - itemsTotal);

  const n = people.length;
  const sumSubs = subs.reduce((a, b) => a + Math.max(0, b), 0);
  const shares = people.map((p, i) => {
    if (!n || !tipTarget) return 0;
    if (tip.distribution === 'equal' || sumSubs <= 0) return tipTarget / n;
    return (tipTarget * Math.max(0, subs[i])) / sumSubs;
  });
  // Modus 'Per persoon': fooi = wat iemand betaalt min wat hij/zij verschuldigd is.
  const perPerson = tip.mode === 'perPerson';
  const extras = people.map((p, i) =>
    perPerson
      ? p.payCents != null ? Math.max(0, p.payCents - subs[i]) : 0
      : Math.max(0, p.extraTipCents || 0)
  );
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
      payCents: perPerson ? (p.payCents ?? null) : null,
      underpaidCents: perPerson && p.payCents != null ? Math.max(0, subs[i] - p.payCents) : 0,
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
