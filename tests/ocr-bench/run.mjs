// Meet de bonherkenning op de testset, met de echte app-code in Chromium.
//
// Gebruik:
//   npm install                         (tesseract.js + taalbestanden als dev-afhankelijkheid)
//   node tests/ocr-bench/run.mjs [config ...]
// Zonder argument: alleen 'huidig'. Configuraties staan in CONFIGS hieronder.
// Tesseract en de taalbestanden komen uit node_modules (zelfde versies als de CDN van de app),
// zodat de meting offline en reproduceerbaar is. Uitvoer: tabel op het scherm en
// tests/ocr-bench/results/<config>.json.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECEIPTS } from './receipts.mjs';
import { scoreReceipt } from './score.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const NM = path.join(ROOT, 'node_modules');

// Elke configuratie = opties voor readReceiptFile (leeg = huidige werking van de app).
export const CONFIGS = {
  huidig: {},
  // stap 2.2 voorbewerking, elk apart
  otsu: { pre: 'otsu' },
  sauvola: { pre: 'sauvola' },
  rechtzetten: { deskew: true },
  // stap 2.3 pageseg-modus, elk apart
  psm4: { psm: 4 },
  psm11: { psm: 11 },
  // stap 2.5 regels opbouwen uit woorden met positie (ook met PSM 4 en 11)
  woorden: { fromWords: true },
  woordenPsm4: { fromWords: true, psm: 4 },
  woordenPsm11: { fromWords: true, psm: 11 },
  // stap 2.4 dubbele passage: tweede passage met Sauvola als de eerste niet overtuigt
  dubbel: { second: { pre: 'sauvola' } },
  dubbelSom: { second: { pre: 'sauvola' }, select: 'som' },
  // de instelling die de app gebruikt (APP_OCR in js/ocr.js)
  app: 'app',
};

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end();
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0) + '%';

async function runConfig(page, name, opts) {
  const results = [];
  for (const r of RECEIPTS) {
    const out = await page.evaluate(([u, l, o]) => window.runOne(u, l, o), [`/tests/ocr-bench/images/${r.id}.jpg`, r.lang, opts]);
    const s = scoreReceipt(r.truth, r.total, out);
    results.push({ id: r.id, ms: out.ms, chosen: out.chosen, ...s, text: out.text });
  }
  const T = results.reduce(
    (a, x) => ({ lines: a.lines + x.lines, full: a.full + x.full, amountOk: a.amountOk + x.amountOk, qtyOk: a.qtyOk + x.qtyOk, nameOk: a.nameOk + x.nameOk, corrections: a.corrections + x.corrections, sum: a.sum + x.sumMatches, total: a.total + x.totalOk, ms: a.ms + x.ms, wrong: a.wrong + x.wrongLines, fw: a.fw + x.flaggedWrong, fr: a.fr + x.flaggedRight }),
    { lines: 0, full: 0, amountOk: 0, qtyOk: 0, nameOk: 0, corrections: 0, sum: 0, total: 0, ms: 0, wrong: 0, fw: 0, fr: 0 }
  );
  console.log(`\n### ${name}\n`);
  console.log('| bon | regels volledig goed | bedrag goed | aantal goed | naam goed | totaal herkend | som sluit aan | correcties | tijd |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const x of results)
    console.log(`| ${x.id} | ${x.full}/${x.lines} | ${x.amountOk}/${x.lines} | ${x.qtyOk}/${x.lines} | ${x.nameOk}/${x.lines} | ${x.totalOk ? 'ja' : 'nee'} | ${x.sumMatches ? 'ja' : 'nee'} | ${x.corrections} | ${(x.ms / 1000).toFixed(1)} s |`);
  console.log(`| **totaal** | **${T.full}/${T.lines} (${pct(T.full, T.lines)})** | ${T.amountOk}/${T.lines} | ${T.qtyOk}/${T.lines} | ${T.nameOk}/${T.lines} | ${T.total}/${results.length} | ${T.sum}/${results.length} | **${T.corrections}** | ${(T.ms / 1000).toFixed(0)} s |`);
  // Stap 2.1: hoe goed wijzen zekerheidsscores de foute regels aan? (verschillende drempels)
  const rules = [
    ['regelzekerheid < 60', (it) => it.conf < 60],
    ['regelzekerheid < 70', (it) => it.conf < 70],
    ['regelzekerheid < 80', (it) => it.conf < 80],
    ['woordzekerheid bedrag < 60', (it) => it.amountConf < 60],
    ['woordzekerheid bedrag < 70', (it) => it.amountConf < 70],
    ['woordzekerheid bedrag < 80', (it) => it.amountConf < 80],
    ['laagste woordzekerheid < 70', (it) => it.minConf < 70],
  ];
  if (results.some((x) => x.rows.some((r) => r.got?.conf != null))) {
    console.log('\n| markeerregel | foute regels gemarkeerd | goede regels onterecht gemarkeerd |\n|---|---|---|');
    for (const [label, rule] of rules) {
      let fw = 0, fr = 0, wrong = 0;
      for (const x of results) for (const r of x.rows) {
        if (!r.found) { wrong++; continue; }
        const flagged = r.got.conf != null && rule(r.got);
        if (!r.full) { wrong++; if (flagged) fw++; } else if (flagged) fr++;
      }
      const right = results.reduce((a, x) => a + x.full, 0);
      console.log(`| ${label} | ${fw}/${wrong} | ${fr}/${right} |`);
    }
  }
  fs.mkdirSync(path.join(DIR, 'results'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'results', name + '.json'), JSON.stringify({ name, opts, totals: T, results }, null, 1));
  return T;
}

// argument "config" of "label=config" (label = naam van het resultaatbestand)
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['huidig'];
const srv = await serve();
const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: 'block' });
await ctx.route('https://cdn.jsdelivr.net/**', (route) => {
  const p = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/npm\//, '');
  const m = p.match(/^(@[^/]+\/[^/@]+|[^/@]+)(?:@[^/]+)?(\/.*)?$/);
  const f = path.join(NM, m[1], m[2] || '');
  if (!fs.existsSync(f)) return route.fulfill({ status: 404 });
  route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': f.endsWith('.wasm') ? 'application/wasm' : 'application/javascript' } });
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('paginafout:', e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/tests/ocr-bench/bench.html`);
await page.waitForFunction(() => window.benchReady);
for (const arg of names) {
  const [label, n] = arg.includes('=') ? arg.split('=') : [arg, arg];
  if (!CONFIGS[n]) throw new Error('Onbekende configuratie: ' + n);
  await runConfig(page, label, CONFIGS[n]);
}
await browser.close();
srv.close();
