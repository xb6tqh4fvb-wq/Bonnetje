import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReceiptText, linesFromPositioned, judgeReceipt } from '../js/parse.js';

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

test('Spaanse bon', () => {
  const r = parseReceiptText(`RESTAURANTE EL FARO
C/ Mayor 5, Málaga  CIF B12345678
Mesa 4   Camarero: Juan
Fecha 18/11/2026  Hora 21:15
2 Cerveza          2,50   5,00
1 Pollo a la plancha      14,50
1 Calamares a la romana   12,00
1 Tarta de queso           6,50
Base imponible 10%  34,55
IVA 10%              3,45
TOTAL               38,00
Efectivo            50,00
Cambio              12,00
Gracias por su visita`);
  assert.equal(r.title, 'RESTAURANTE EL FARO');
  assert.equal(r.totalCents, 3800);
  assert.deepEqual(r.items.map((i) => [i.name, i.qty, i.priceCents]), [
    ['Cerveza', 2, 500],
    ['Pollo a la plancha', 1, 1450],
    ['Calamares a la romana', 1, 1200],
    ['Tarta de queso', 1, 650],
  ]);
});

test('Engelse bon met punt als decimaalteken', () => {
  const r = parseReceiptText(`The Red Lion
Table 3  Server: Sam
2 x Pint of lager      11.00
Fish and chips         15.50
Sticky toffee pudding   7.25
Subtotal               33.75
Service charge 12.5%    4.22
Total                  37.97
Card                   37.97
Thank you!`);
  assert.equal(r.totalCents, 3797);
  assert.deepEqual(r.items.map((i) => [i.name, i.qty, i.priceCents, !!i.everyone]), [
    ['Pint of lager', 2, 1100, false],
    ['Fish and chips', 1, 1550, false],
    ['Sticky toffee pudding', 1, 725, false],
    ['Service charge 12.5', 1, 422, true],
  ]);
});

test('bedragen boven 1000 met duizendtalscheiding', () => {
  const r = parseReceiptText('Groepsmenu 24 pers   1.234,56\nWijnarrangement        315,00\nTotaal              1.549,56');
  assert.deepEqual(r.items.map((i) => i.priceCents), [123456, 31500]);
  assert.equal(r.totalCents, 154956);
  const en = parseReceiptText('Group dinner   1,234.56\nTotal   1,234.56');
  assert.equal(en.items[0].priceCents, 123456);
});

test('kortingsregel staat standaard op "iedereen"', () => {
  const r = parseReceiptText('Biefstuk 24,50\nKorting -5,00\nTotaal 19,50');
  assert.equal(r.items[1].priceCents, -500);
  assert.equal(r.items[1].everyone, true);
  assert.equal(r.items[0].everyone, false);
});

test('aantal achter de naam ("Coca-Cola x2")', () => {
  const r = parseReceiptText('Coca-Cola x2   6.00€\nHelado x3   10.50€\nTOTAL: 16.50€');
  assert.deepEqual(r.items.map((i) => [i.name, i.qty, i.priceCents]), [['Coca-Cola', 2, 600], ['Helado', 3, 1050]]);
});

test('typische leesfouten: "| Jamón 1berico", "$,00"', () => {
  const r = parseReceiptText('----------\n| Jamón 1berico   22,00\n1 Flan casero   $,00\nTOTAL 27,00');
  assert.deepEqual(r.items.map((i) => [i.name, i.qty, i.priceCents]), [['Jamón iberico', 1, 2200], ['Flan casero', 1, 500]]);
  assert.equal(r.totalCents, 2700);
  // "1L" (liter) blijft staan: te kort woord
  assert.equal(parseReceiptText('2 AGUA MIN. 1L   2,80   5,60').items[0].name, 'AGUA MIN. 1L');
});

test('naam en bedrag op aparte regels (scheve foto) worden op volgorde gekoppeld', () => {
  const r = parseReceiptText(`TABERNA LOS AMIGOS
Calle Mayor 7, Madrid
--------------------------------
                    7,50
3 Cerveza           3,80
1 Vino blanco copa
TOTAL 11,30`);
  assert.deepEqual(r.items.map((i) => [i.name, i.qty, i.priceCents]), [['Cerveza', 3, 750], ['Vino blanco copa', 1, 380]]);
  assert.equal(r.title, 'TABERNA LOS AMIGOS');
});

test('zekerheid per regel wordt doorgegeven', () => {
  const r = parseReceiptText('Cola   3,40\nBier   4,50\nTotaal 7,90', [95, 41, 90]);
  assert.deepEqual(r.items.map((i) => i.conf), [95, 41]);
});

test('beoordeling van een leespoging', () => {
  assert.equal(judgeReceipt('Cola 3,40\nBier 4,50\nTotaal 7,90').good, true);
  const bad = judgeReceipt('Cola 3,40\nTotaal 7,90');
  assert.equal(bad.good, false);
  assert.ok(judgeReceipt('Cola 3,40\nBier 4,50\nTotaal 7,90').score > bad.score);
});
