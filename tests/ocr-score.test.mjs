import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreReceipt, normName, nameSimilarity } from './ocr-bench/score.mjs';

const truth = [[3, 'Cappuccino', 780], [2, 'Jus vers', 770], [1, 'Tosti', 495]];

test('normaliseren van namen', () => {
  assert.equal(normName('Tostì'), 'tosti');
  assert.equal(normName('Ch.fontaine  plat'), 'ch fontaine plat');
  assert.ok(nameSimilarity('12 wrtje', '12 uurtje') > 0.6);
});

test('alles goed: geen correcties', () => {
  const s = scoreReceipt(truth, 2045, { items: [{ qty: 3, name: 'Cappuccino', priceCents: 780 }, { qty: 2, name: 'Jus vers', priceCents: 770 }, { qty: 1, name: 'Tostì', priceCents: 495 }], totalCents: 2045 });
  assert.equal(s.full, 3);
  assert.equal(s.corrections, 0);
  assert.equal(s.sumMatches, true);
});

test('fout aantal, fout bedrag, ontbrekende en overbodige regel worden geteld', () => {
  const s = scoreReceipt(truth, 2045, {
    items: [
      { qty: 8, name: 'Jus vers', priceCents: 770 }, // fout aantal
      { qty: 3, name: 'Cappuccino', priceCents: 760 }, // fout bedrag
      { qty: 1, name: 'Totaal exclusief', priceCents: 4000 }, // overbodig
    ],
    totalCents: 2045,
  });
  assert.equal(s.full, 0);
  assert.equal(s.amountOk, 1);
  assert.equal(s.missing, 1); // Tosti
  assert.equal(s.extra, 1);
  assert.equal(s.corrections, 1 + 1 + 1 + 1); // aantal + bedrag + toevoegen + verwijderen
  assert.equal(s.sumMatches, false);
});

test('niet herkend totaal kost een correctie', () => {
  const s = scoreReceipt([[1, 'Cola', 300]], 300, { items: [{ qty: 1, name: 'Cola', priceCents: 300 }], totalCents: null });
  assert.equal(s.corrections, 1);
  assert.equal(s.totalOk, false);
});

test('markering "onzeker": telt terecht en onterecht gemarkeerde regels', () => {
  const s = scoreReceipt(truth, 2045, {
    items: [{ qty: 3, name: 'Cappuccino', priceCents: 780, unsure: true }, { qty: 2, name: 'Jus vers', priceCents: 700, unsure: true }, { qty: 1, name: 'Tosti', priceCents: 495 }],
    totalCents: 2045,
  });
  assert.equal(s.flaggedRight, 1);
  assert.equal(s.flaggedWrong, 1);
  assert.equal(s.wrongLines, 1);
});
