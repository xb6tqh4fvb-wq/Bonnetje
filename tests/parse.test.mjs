import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReceiptText, linesFromPositioned } from '../js/parse.js';

const SAMPLE = `
Restaurant De Gouden Lepel
Kerkstraat 12, Utrecht
Tafel 7        Bon nr 4711
18-11-2026  19:42
2 Cola              3,40   6,80
1 Biefstuk               24,50
Pasta pesto              17,5O
3x Heineken               13,50
Fles huiswijn            29,00
Korting                  -5,00
Service                   2,50
Subtotaal                88,80
Totaal                   88,80
BTW 9%    72,94  6,56
PIN                      88,80
Bedankt en tot ziens!
`;

test('herkent regels, aantallen, korting en totaal', () => {
  const r = parseReceiptText(SAMPLE);
  assert.equal(r.title, 'Restaurant De Gouden Lepel');
  assert.equal(r.totalCents, 8880);
  assert.deepEqual(
    r.items.map((i) => [i.name, i.qty, i.priceCents]),
    [
      ['Cola', 2, 680],
      ['Biefstuk', 1, 2450],
      ['Pasta pesto', 1, 1750],
      ['Heineken', 3, 1350],
      ['Fles huiswijn', 1, 2900],
      ['Korting', 1, -500],
      ['Service', 1, 250],
    ]
  );
  assert.equal(r.items.find((i) => i.name === 'Service').everyone, true);
  assert.equal(r.items.reduce((a, i) => a + i.priceCents, 0), 8880);
});

test('aantal afleiden uit stukprijs en regeltotaal', () => {
  const r = parseReceiptText('Spa rood   2,80   8,40\nTotaal 8,40');
  assert.deepEqual(r.items.map((i) => [i.name, i.qty, i.priceCents]), [['Spa rood', 3, 840]]);
});

test('PDF-fragmenten tot regels groeperen', () => {
  const text = linesFromPositioned([
    { str: '12,00', x: 200, y: 700 },
    { str: 'Burger', x: 10, y: 701 },
    { str: 'Friet', x: 10, y: 680 },
    { str: '4,50', x: 200, y: 680 },
  ]);
  assert.equal(text, 'Burger  12,00\nFriet  4,50');
});
