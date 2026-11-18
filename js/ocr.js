// Uitlezen van een bon: foto via Tesseract (OCR op het toestel), PDF via pdf.js
// (tekstlaag; valt terug op OCR als de PDF een scan is). Geen server, geen API-sleutel.
import { linesFromPositioned, passQuality } from './parse.js';
import { t } from './i18n.js';
import { thresholdOtsu, thresholdSauvola, estimateSkew } from './image.js';

/**
 * Instelling waarmee de app leest (gekozen op basis van de meting in tests/ocr-bench):
 * eerst de huidige voorbewerking met PSM 6; overtuigt die leespoging niet (geen totaal,
 * som sluit niet aan of onzekere bedragen), dan een tweede passage met Sauvola-drempeling,
 * en de beste van de twee op controles en zekerheid. Bedragen worden nooit aangepast.
 */
export const APP_OCR = { second: { pre: 'sauvola' } };

const TESS_LANG = { nl: 'nld', es: 'spa', en: 'eng', auto: 'nld+spa+eng' };

const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

const scripts = {};
function loadScript(src) {
  scripts[src] ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => {
      delete scripts[src];
      reject(new Error(t('ocrLoadFail')));
    };
    document.head.appendChild(s);
  });
  return scripts[src];
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(t('ocrImgFail')));
    img.src = url;
  });
}

function scaledCanvas(source, maxSide, minSide = 0) {
  const w = source.naturalWidth || source.width;
  const h = source.naturalHeight || source.height;
  let scale = Math.min(1, maxSide / Math.max(w, h));
  if (minSide && Math.max(w, h) * scale < minSide) scale = minSide / Math.max(w, h);
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return c;
}

/**
 * Voorbewerking. opts.pre:
 *  - 'stretch' (standaard): grijswaarden + contrast oprekken;
 *  - 'otsu': daarna één globale zwart-witdrempel (Otsu);
 *  - 'sauvola': daarna een lokale, adaptieve drempel (Sauvola).
 * opts.deskew: scheefstand meten en rechtzetten.
 */
function preprocess(source, opts = {}) {
  let c = scaledCanvas(source, 2200, 1600);
  if (opts.deskew) c = deskewCanvas(c);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    d[i] = g;
    hist[g | 0]++;
  }
  const n = d.length / 4;
  let lo = 0, hi = 255, acc = 0;
  for (; lo < 255 && (acc += hist[lo]) < n * 0.02; lo++);
  acc = 0;
  for (; hi > 0 && (acc += hist[hi]) < n * 0.02; hi--);
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / span));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  if (opts.pre === 'otsu' || opts.pre === 'sauvola') {
    const gray = new Uint8Array(n);
    for (let i = 0, j = 0; j < n; i += 4, j++) gray[j] = d[i];
    const bin = opts.pre === 'otsu' ? thresholdOtsu(gray) : thresholdSauvola(gray, c.width, c.height, opts.k ?? 0.2);
    for (let i = 0, j = 0; j < n; i += 4, j++) d[i] = d[i + 1] = d[i + 2] = bin[j];
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Tesseract-resultaat -> regels met tekst, zekerheid (0-100) en woorden met positie. */
function linesFromData(data, yOffset = 0) {
  const lines = (data.lines || []).map((l) => ({
    text: l.text.replace(/\n$/, ''),
    conf: Math.round(l.confidence),
    words: (l.words || []).map((w) => ({ text: w.text, conf: Math.round(w.confidence), x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0 + yOffset, y1: w.bbox.y1 + yOffset })),
  }));
  return lines;
}

async function ocr(canvases, onProgress, lang = 'auto', opts = {}) {
  await loadScript(TESSERACT);
  onProgress({ label: t('ocrStart'), progress: 0 });
  let page = 0;
  const worker = await window.Tesseract.createWorker(TESS_LANG[lang] || TESS_LANG.auto, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress({ label: t('ocrRecog'), progress: (page + m.progress) / canvases.length });
      } else if (/load|initializ/i.test(m.status)) {
        onProgress({ label: t('ocrLang'), progress: m.progress || 0 });
      }
    },
  });
  await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: String(opts.psm ?? 6) });
  let text = '';
  const lines = [];
  for (; page < canvases.length; page++) {
    const { data } = await worker.recognize(canvases[page]);
    text += data.text + '\n';
    lines.push(...linesFromData(data, page * 100000));
  }
  await worker.terminate();
  return { text, lines };
}

function stack(canvases) {
  const w = Math.max(...canvases.map((c) => c.width));
  const h = canvases.reduce((a, c) => a + c.height, 0);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  let y = 0;
  for (const c of canvases) {
    ctx.drawImage(c, 0, y);
    y += c.height;
  }
  return out;
}

/** Canvas rechtzetten volgens de gemeten scheefstand (wit opvullen). */
function deskewCanvas(c) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const gray = new Uint8Array(c.width * c.height);
  for (let i = 0, j = 0; j < gray.length; i += 4, j++) gray[j] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
  const angle = estimateSkew(gray, c.width, c.height);
  if (Math.abs(angle) < 0.3) return c;
  const out = document.createElement('canvas');
  out.width = c.width;
  out.height = c.height;
  const o = out.getContext('2d');
  o.fillStyle = '#fff';
  o.fillRect(0, 0, out.width, out.height);
  o.translate(out.width / 2, out.height / 2);
  o.rotate((-angle * Math.PI) / 180);
  o.drawImage(c, -c.width / 2, -c.height / 2);
  return out;
}

const preview = (source) => scaledCanvas(source, 1400).toDataURL('image/jpeg', 0.7);

async function readImage(file, onProgress, lang, opts) {
  onProgress({ label: t('ocrPhoto'), progress: 0 });
  const img = await loadImage(file);
  const previewUrl = preview(img);
  let res = await ocr([preprocess(img, opts)], onProgress, lang, opts);
  let chosen = 1;
  // Dubbele passage: overtuigt de eerste leespoging niet, lees dan nogmaals met een andere
  // voorbewerking en kies de beste op controles en zekerheid (bedragen blijven ongewijzigd).
  if (opts.second) {
    const q1 = passQuality(res.text, res.lines, opts);
    if (!q1.good) {
      const o2 = { ...opts, ...opts.second, second: null };
      const res2 = await ocr([preprocess(img, o2)], onProgress, lang, o2);
      const q2 = passQuality(res2.text, res2.lines, opts);
      if (q2.score > q1.score) {
        res = res2;
        chosen = 2;
      }
    }
  }
  URL.revokeObjectURL(img.src);
  return { text: res.text, lines: res.lines, chosen, previewUrl, source: 'foto' };
}

async function readPdf(file, onProgress, lang, opts) {
  onProgress({ label: t('ocrPdf'), progress: 0 });
  await loadScript(PDFJS);
  const pdfjs = window.pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = Math.min(pdf.numPages, 4);
  const canvases = [];
  let text = '';
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      linesFromPositioned(content.items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))) + '\n';
    const viewport = page.getViewport({ scale: 2 });
    const c = document.createElement('canvas');
    c.width = viewport.width;
    c.height = viewport.height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    canvases.push(c);
    onProgress({ label: t('ocrPdfRead'), progress: i / pages });
  }
  const sheet = stack(canvases);
  const previewUrl = preview(sheet);
  if (text.replace(/\s/g, '').length < 20) {
    // Gescande PDF zonder tekstlaag: alsnog OCR.
    const res = await ocr(canvases.map((c) => preprocess(c, opts)), onProgress, lang, opts);
    return { text: res.text, lines: res.lines, previewUrl, source: 'pdf-scan' };
  }
  return { text, lines: null, previewUrl, source: 'pdf' };
}

/**
 * lang: 'nl' | 'es' | 'en' | 'auto' (alle drie; iets trager).
 * opts (optioneel, standaard = huidige werking): { pre, deskew, psm }.
 * Geeft { text, lines, previewUrl, source } terug; lines = regels met zekerheid en
 * woorden met positie (null bij een PDF met tekstlaag).
 */
export function readReceiptFile(file, onProgress = () => {}, lang = 'auto', opts = {}) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  return isPdf ? readPdf(file, onProgress, lang, opts) : readImage(file, onProgress, lang, opts);
}
