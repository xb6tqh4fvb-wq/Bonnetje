import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateName, detectLanguage, translateOnline } from '../js/translate.js';

test('Spaans naar Nederlands en Engels, bijvoeglijk naamwoord vooraan', () => {
  assert.equal(translateName('Pollo a la plancha', 'es', 'nl').text, 'Gegrilde kip');
  assert.equal(translateName('Pollo a la plancha', 'es', 'en').text, 'Grilled chicken');
  assert.equal(translateName('Agua con gas', 'es', 'nl').text, 'Bruisend water');
  assert.equal(translateName('Croquetas de jamón', 'es', 'nl').text, 'Hamkroketten');
  assert.equal(translateName('Tarta de queso casera', 'es', 'nl').text, 'Huisgemaakte cheesecake');
});

test('Engels naar Nederlands', () => {
  assert.equal(translateName('Fish and chips', 'en', 'nl').text, 'Vis met friet');
  assert.equal(translateName('Garlic prawns', 'en', 'nl').text, 'Knoflookgarnalen');
});

test('onbekende woorden blijven staan, dekking wordt gemeld', () => {
  // merknaam (Rioja) blijft staan en telt als bekend
  const r = translateName('Botella vino tinto Rioja', 'es', 'nl');
  assert.equal(r.text, 'Fles rode wijn Rioja');
  assert.equal(r.coverage, 1);
  const u = translateName('Pollo con salsa xyz', 'es', 'nl');
  assert.ok(u.coverage < 1);
  assert.equal(translateName('Pimientos rellenos', 'es', 'nl').text, 'Gevulde paprika');
  assert.equal(translateName('Berenjenas con miel', 'es', 'en').text, 'Aubergine with honey');
  assert.equal(translateName('Spotted dick', 'en', 'nl').coverage, 0);
});

test('zelfde taal: niets doen', () => {
  assert.deepEqual(translateName('Biefstuk', 'nl', 'nl'), { text: 'Biefstuk', coverage: 1 });
});

test('taal herkennen', () => {
  assert.equal(detectLanguage('TOTAL 38,00 IVA 10% Gracias', ['Pollo a la plancha']), 'es');
  assert.equal(detectLanguage('Subtotal 33.75 Total Thank you', ['Fish and chips']), 'en');
  assert.equal(detectLanguage('Totaal 88,80 BTW 9% Bedankt', ['Biefstuk']), 'nl');
  assert.equal(detectLanguage('', []), null);
});

test('online vertalen (nagebootste dienst)', async () => {
  let url;
  const fake = async (u) => {
    url = u;
    return { ok: true, json: async () => ({ responseStatus: 200, responseData: { translatedText: 'kleverige karamelpudding' } }) };
  };
  assert.equal(await translateOnline('Sticky toffee pudding', 'en', 'nl', fake), 'Kleverige karamelpudding');
  assert.match(url, /langpair=en\|nl/);
  const bad = async () => ({ ok: true, json: async () => ({ responseStatus: 429, responseData: { translatedText: 'MYMEMORY WARNING' } }) });
  await assert.rejects(translateOnline('x', 'en', 'nl', bad));
});

test('Spaanse afkortingen, verpakkingen en "X de Y"', () => {
  const nl = (x) => translateName(x, 'es', 'nl').text;
  const en = (x) => translateName(x, 'es', 'en').text;
  assert.equal(nl('CERV. ALHAMBRA'), 'Bier Alhambra');
  assert.equal(nl('CROQ. JAMON (6)'), 'Hamkroketten 6');
  assert.equal(nl('AGUA MIN. 1L'), 'Mineraalwater 1l');
  assert.equal(nl('Croquetas caseras'), 'Huisgemaakte kroketten');
  assert.equal(nl('vino blanco copa'), 'Glas witte wijn');
  assert.equal(nl('Racion de calamares'), 'Portie inktvis');
  assert.equal(en('Racion de calamares'), 'Portion of squid');
  assert.equal(nl('Sopa de mejillones'), 'Soep van mosselen');
  assert.equal(en('Tarta de limon'), 'Lemon cake');
  assert.equal(nl('Pollo al ajillo'), 'Kip in knoflooksaus');
  assert.equal(nl('Helado'), 'IJs');
  assert.equal(translateName('Pint of Guinness', 'en', 'nl').text, 'Pint Guinness');
});
