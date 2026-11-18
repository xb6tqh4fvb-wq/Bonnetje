import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSplit, parseEuro, roundAlloc, formatEuro, unitsLeft, roundUpSuggestions, personRoundUps } from '../js/calc.js';

const P = (id, extra = {}) => ({ id, name: id.toUpperCase(), method: 'contant', givenCents: null, extraTipCents: 0, paid: false, ...extra });

test('parseEuro', () => {
  assert.equal(parseEuro('22,50'), 2250);
  assert.equal(parseEuro('22.50'), 2250);
  assert.equal(parseEuro('€ 50'), 5000);
  assert.equal(parseEuro('1.234,56'), 123456);
  assert.equal(parseEuro('-3,00'), -300);
  assert.equal(parseEuro(''), null);
  assert.equal(parseEuro('abc'), null);
});

test('formatEuro gebruikt Nederlandse notatie', () => {
  assert.match(formatEuro(2750), /27,50/);
});

test('roundAlloc telt exact op', () => {
  const r = roundAlloc([1000 / 3, 1000 / 3, 1000 / 3]);
  assert.equal(r.reduce((a, b) => a + b), 1000);
  assert.deepEqual(r, [334, 333, 333]);
});

test('voorbeeld uit de vraag: 22,50 te betalen, geeft 50, krijgt 27,50 terug', () => {
  const bill = {
    people: [P('a', { givenCents: 5000 })],
    items: [{ id: 'i1', name: 'Pasta', qty: 1, priceCents: 2250, assign: { a: 1 } }],
    tip: { mode: 'none' },
  };
  const r = computeSplit(bill);
  assert.equal(r.persons[0].dueCents, 2250);
  assert.equal(r.persons[0].changeCents, 2750);
});

test('gedeeld item (fles wijn over 3) en aantallen (3 bier)', () => {
  const bill = {
    people: [P('a'), P('b'), P('c')],
    items: [
      { id: 'w', name: 'Wijn', qty: 1, priceCents: 3000, assign: { a: 1, b: 1, c: 1 } },
      { id: 'b', name: 'Bier', qty: 3, priceCents: 1200, assign: { a: 2, b: 1 } },
      { id: 'd', name: 'Dessert', qty: 1, priceCents: 700, assign: {} },
    ],
    tip: { mode: 'none' },
  };
  const r = computeSplit(bill);
  assert.deepEqual(r.persons.map((p) => p.subtotalCents), [1800, 1400, 1000]);
  assert.equal(r.unassignedCents, 700);
  assert.equal(unitsLeft(bill.items[1], bill.people), 0);
  assert.equal(unitsLeft(bill.items[2], bill.people), 1);
});

test('item "iedereen" wordt gelijk verdeeld, ook over later toegevoegde deelnemers', () => {
  const bill = { people: [P('a'), P('b')], items: [{ id: 's', name: 'Service', qty: 1, priceCents: 1001, everyone: true }], tip: {} };
  assert.deepEqual(computeSplit(bill).persons.map((p) => p.subtotalCents), [501, 500]);
  bill.people.push(P('c'));
  assert.deepEqual(computeSplit(bill).persons.map((p) => p.subtotalCents), [334, 334, 333]);
});

test('fooi naar verhouding en gelijk', () => {
  const items = [
    { id: '1', name: 'X', qty: 1, priceCents: 3000, assign: { a: 1 } },
    { id: '2', name: 'Y', qty: 1, priceCents: 1000, assign: { b: 1 } },
  ];
  const prop = computeSplit({ people: [P('a'), P('b')], items, tip: { mode: 'amount', amountCents: 400, distribution: 'proportional' } });
  assert.deepEqual(prop.persons.map((p) => p.tipCents), [300, 100]);
  const eq = computeSplit({ people: [P('a'), P('b')], items, tip: { mode: 'amount', amountCents: 500, distribution: 'equal' } });
  assert.deepEqual(eq.persons.map((p) => p.tipCents), [250, 250]);
  assert.equal(eq.dueTotal, 4500);
});

test('wisselgeld als fooi wordt verrekend met de fooi van anderen', () => {
  const items = [
    { id: '1', name: 'X', qty: 1, priceCents: 2000, assign: { a: 1 } },
    { id: '2', name: 'Y', qty: 1, priceCents: 2000, assign: { b: 1 } },
    { id: '3', name: 'Z', qty: 1, priceCents: 2000, assign: { c: 1 } },
  ];
  // fooi 6,00 -> 2,00 p.p. A laat 4,00 liggen: 2,00 eigen aandeel + 2,00 overschot
  // overschot verlaagt de 4,00 open bij B en C naar 2,00 -> 1,00 elk.
  const r = computeSplit({
    people: [P('a', { givenCents: 3000, extraTipCents: 400 }), P('b', { method: 'tikkie' }), P('c', { method: 'pin' })],
    items,
    tip: { mode: 'amount', amountCents: 600, distribution: 'equal' },
  });
  assert.deepEqual(r.persons.map((p) => p.tipCents), [400, 100, 100]);
  assert.deepEqual(r.persons.map((p) => p.dueCents), [2400, 2100, 2100]);
  assert.equal(r.persons[0].changeCents, 600);
  assert.equal(r.tipTotal, 600);
});

test('meer wisselgeld-fooi dan de gewenste fooi: anderen betalen geen fooi', () => {
  const r = computeSplit({
    people: [P('a', { givenCents: 5000, extraTipCents: 1000 }), P('b')],
    items: [
      { id: '1', name: 'X', qty: 1, priceCents: 2000, assign: { a: 1 } },
      { id: '2', name: 'Y', qty: 1, priceCents: 2000, assign: { b: 1 } },
    ],
    tip: { mode: 'amount', amountCents: 400, distribution: 'equal' },
  });
  assert.deepEqual(r.persons.map((p) => p.tipCents), [1000, 0]);
  assert.equal(r.persons[0].changeCents, 2000);
});

test('betaald / open', () => {
  const r = computeSplit({
    people: [P('a', { paid: true }), P('b')],
    items: [{ id: '1', name: 'X', qty: 2, priceCents: 1000, assign: { a: 1, b: 1 } }],
    tip: { mode: 'none' },
  });
  assert.equal(r.paidTotal, 500);
  assert.equal(r.openTotal, 500);
});

test('fooi = bedrag dat boven de bon aan het restaurant is betaald', () => {
  const items = [
    { id: '1', name: 'X', qty: 1, priceCents: 6000, assign: { a: 1 } },
    { id: '2', name: 'Y', qty: 1, priceCents: 3880, assign: { b: 1 } },
  ];
  const r = computeSplit({ people: [P('a'), P('b')], items, tip: { mode: 'total', paidTotalCents: 11000, distribution: 'equal' } });
  assert.equal(r.tipTarget, 1120);
  assert.deepEqual(r.persons.map((p) => p.tipCents), [560, 560]);
  assert.equal(r.dueTotal, 11000);
  const under = computeSplit({ people: [P('a'), P('b')], items, tip: { mode: 'total', paidTotalCents: 9000 } });
  assert.equal(under.tipTarget, 0);
});

test('suggesties voor afronden', () => {
  assert.deepEqual(roundUpSuggestions(9880), [10000, 10500, 11000, 12000]);
  assert.deepEqual(roundUpSuggestions(10000), [10500, 11000, 11500, 12000]);
});

test('fooi per persoon = betaald min eigen consumpties', () => {
  const r = computeSplit({
    people: [P('a', { payCents: 2500 }), P('b', { method: 'tikkie' }), P('c', { method: 'contant', givenCents: 2000, payCents: 1800 }), P('d', { payCents: 500 })],
    items: [
      { id: '1', name: 'X', qty: 1, priceCents: 2240, assign: { a: 1 } },
      { id: '2', name: 'Y', qty: 1, priceCents: 1500, assign: { b: 1 } },
      { id: '3', name: 'Z', qty: 1, priceCents: 1650, assign: { c: 1 } },
      { id: '4', name: 'W', qty: 1, priceCents: 800, assign: { d: 1 } },
    ],
    tip: { mode: 'perPerson', distribution: 'equal' },
  });
  assert.deepEqual(r.persons.map((p) => p.tipCents), [260, 0, 150, 0]);
  assert.deepEqual(r.persons.map((p) => p.dueCents), [2500, 1500, 1800, 800]);
  assert.equal(r.persons[2].changeCents, 200);
  assert.equal(r.persons[3].underpaidCents, 300);
  assert.equal(r.tipTotal, 410);
});

test('afrondsuggesties per persoon', () => {
  assert.deepEqual(personRoundUps(2240), [2300, 2500, 3000]);
  assert.deepEqual(personRoundUps(2500), [2600, 3000]);
});
