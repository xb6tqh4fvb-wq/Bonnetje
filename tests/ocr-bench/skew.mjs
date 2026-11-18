// Hulpmeting: welke scheefstand meet estimateSkew per testbon (na schalen, zoals in ocr.js)?
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECEIPTS } from './receipts.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(DIR, '../../js/image.js'), 'utf8').replace(/^export /gm, '');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<body></body>');
await page.addScriptTag({ content: src });
for (const r of RECEIPTS) {
  const data = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(DIR, 'images', r.id + '.jpg')).toString('base64');
  const a = await page.evaluate(async (u) => {
    const im = new Image();
    im.src = u;
    await im.decode();
    const s = Math.max(1600 / Math.max(im.width, im.height), Math.min(1, 2200 / Math.max(im.width, im.height)));
    const c = document.createElement('canvas');
    c.width = Math.round(im.width * s);
    c.height = Math.round(im.height * s);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const g = new Uint8Array(c.width * c.height);
    for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    return estimateSkew(g, c.width, c.height);
  }, data);
  console.log(`${r.id.padEnd(20)} gemeten ${a}°`);
}
await browser.close();
