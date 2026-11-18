import { test } from 'node:test';
import assert from 'node:assert/strict';
import { otsuLevel, thresholdOtsu, thresholdSauvola, estimateSkew } from '../js/image.js';

test('Otsu scheidt twee groepen grijswaarden', () => {
  const g = new Uint8Array([20, 25, 30, 200, 210, 220]);
  const lvl = otsuLevel(g);
  assert.ok(lvl >= 30 && lvl < 200, 'drempel ' + lvl);
  assert.deepEqual([...thresholdOtsu(g)], [0, 0, 0, 255, 255, 255]);
});

test('Sauvola vindt tekst ook in de schaduw, waar één drempel faalt', () => {
  // links licht papier (220) met tekst (150), rechts schaduw (120) met tekst (60)
  const w = 200, h = 40, g = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dark = x >= 100, text = y >= 15 && y < 25 && x % 10 < 4;
    g[y * w + x] = dark ? (text ? 60 : 120) : (text ? 150 : 220);
  }
  const s = thresholdSauvola(g, w, h, 0.2, 1 / 8);
  const at = (x, y) => s[y * w + x];
  assert.equal(at(51, 20), 0); // tekst links
  assert.equal(at(151, 20), 0); // tekst in de schaduw
  assert.equal(at(155, 5), 255); // schaduwpapier blijft wit
});

test('scheefstand wordt gemeten', () => {
  const w = 400, h = 300, g = new Uint8Array(w * h).fill(255);
  const ang = (3 * Math.PI) / 180;
  for (let line = 0; line < 6; line++) for (let x = 40; x < 360; x++) {
    const y = Math.round(60 + line * 35 + x * Math.tan(ang));
    for (let t = 0; t < 4; t++) if (y + t < h && x % 7 < 5) g[(y + t) * w + x] = 0;
  }
  const a = estimateSkew(g, w, h);
  assert.ok(Math.abs(a - 3) <= 0.5, 'gemeten ' + a);
});
