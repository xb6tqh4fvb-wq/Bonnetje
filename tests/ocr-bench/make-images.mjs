// Maakt reproduceerbare "foto's" van de zelfgemaakte testbonnen (tests/ocr-bench/images/).
// Gebruik: node tests/ocr-bench/make-images.mjs   (vereist Playwright met Chromium)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECEIPTS } from './receipts.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = path.dirname(fileURLToPath(import.meta.url));

// Verslechtering per soort foto. rotX = perspectief (scheef van boven gefotografeerd).
const DEGRADE = {
  licht: { rot: -1.0, rotX: 0, blur: 0.35, ink: 0.88, contrast: 0.95, shadow: 0.1, noise: 0.05, paper: '#f6f3ea' },
  middel: { rot: 2.0, rotX: 4, blur: 0.6, ink: 0.8, contrast: 0.88, shadow: 0.25, noise: 0.09, paper: '#f2efe6' },
  vaag: { rot: 0.6, rotX: 0, blur: 0.55, ink: 0.42, contrast: 0.8, shadow: 0.12, noise: 0.07, paper: '#f4f0e2' },
  scheef: { rot: -4.0, rotX: 10, blur: 0.7, ink: 0.75, contrast: 0.85, shadow: 0.3, noise: 0.1, paper: '#f3f0e8' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const row = (l) =>
  typeof l === 'string'
    ? `<div class="t">${esc(l)}</div>`
    : `<div class="r"><span>${esc(l[0])}</span><span>${esc(l[1])}</span><span class="n">${esc(l[2])}</span><span class="n">${esc(l[3])}</span></div>`;

function html(r) {
  const d = DEGRADE[r.degrade];
  return `<html><body style="margin:0;background:#5b5853;display:grid;place-items:center;min-height:100vh">
  <div id="p" style="position:relative;width:420px;padding:24px 20px;background:${d.paper};
    font:15px/1.4 '${r.font}',monospace;color:rgba(25,25,25,${d.ink});
    transform:perspective(900px) rotateX(${d.rotX}deg) rotate(${d.rot}deg);
    box-shadow:0 8px 24px rgba(0,0,0,.5);filter:blur(${d.blur}px) contrast(${d.contrast})">
    <style>.r{display:grid;grid-template-columns:34px 1fr 60px 76px;white-space:pre}.n{text-align:right}.t{white-space:pre}</style>
    ${r.lines.map(row).join('')}
    <div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(0,0,0,${d.shadow}) 0%,transparent 45%,rgba(0,0,0,${d.shadow / 2}) 100%)"></div>
    <canvas id="nz" width="460" height="900" style="position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:multiply;opacity:${d.noise * 4}"></canvas>
  </div>
  <script>
    // ruis met vaste startwaarde (mulberry32), zodat elke run dezelfde foto oplevert
    let a = ${[...r.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)};
    const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const c = document.getElementById('nz'), x = c.getContext('2d'), im = x.createImageData(c.width, c.height);
    for (let i = 0; i < im.data.length; i += 4) { const v = 255 - rnd() * 90; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0);
  </script></body></html>`;
}

const browser = await chromium.launch();
for (const r of RECEIPTS.filter((x) => !x.real)) {
  const page = await browser.newPage({ viewport: { width: 640, height: 1000 }, deviceScaleFactor: 2.5 });
  await page.setContent(html(r));
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(DIR, 'images', r.id + '.jpg');
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  console.log('gemaakt:', path.relative(process.cwd(), file), `(${r.degrade}, ${r.font})`);
  await page.close();
}
await browser.close();
