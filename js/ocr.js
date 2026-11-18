// Uitlezen van een bon: foto via Tesseract (OCR op het toestel), PDF via pdf.js
// (tekstlaag; valt terug op OCR als de PDF een scan is). Geen server, geen API-sleutel.
import { linesFromPositioned } from './parse.js';
import { t } from './i18n.js';
import { toGray, findPaper, estimateSkew, flatten, binarize } from './image.js';

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
 * Voorbewerking voor tekstherkenning:
 * 1. bon uit de achtergrond knippen (tafel e.d.),
 * 2. scheefstand rechtzetten,
 * 3. achtergrond egaliseren tegen schaduw en vaal papier (geen harde zwart-wit-omzetting).
 */
/** Eenvoudige voorbewerking: grijs + contrast oprekken over het hele beeld (nette foto's). */
function preprocessBasic(source) {
  const c = scaledCanvas(source, 2200, 1600);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const g = toGray(img.data, c.width, c.height);
  const hist = new Uint32Array(256);
  for (const v of g) hist[v]++;
  let lo = 0, hi = 255, acc = 0;
  for (; lo < 255 && (acc += hist[lo]) < g.length * 0.02; lo++);
  acc = 0;
  for (; hi > 0 && (acc += hist[hi]) < g.length * 0.02; hi--);
  const span = Math.max(1, hi - lo);
  for (let i = 0, j = 0; j < g.length; i += 4, j++) img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, ((g[j] - lo) * 255) / span));
  ctx.putImageData(img, 0, 0);
  return c;
}

function preprocess(source, mode = 'flat') {
  if (mode === 'basic') return preprocessBasic(source);
  let c = scaledCanvas(source, 2200, 1600);
  let ctx = c.getContext('2d', { willReadFrequently: true });
  let img = ctx.getImageData(0, 0, c.width, c.height);
  let gray = toGray(img.data, c.width, c.height);

  const box = findPaper(gray, c.width, c.height);
  // Scheefstand meten op de bon zelf (of het hele beeld als er geen achtergrond is).
  const bx = box || { x0: 0, y0: 0, x1: c.width - 1, y1: c.height - 1 };
  const bw = bx.x1 - bx.x0 + 1, bh = bx.y1 - bx.y0 + 1;
  // Scheefstand meten in het midden van de bon (randen en tafelhoeken verstoren de meting).
  const ix = Math.round(bw * 0.12), iy = Math.round(bh * 0.08);
  const iw = bw - 2 * ix, ih = bh - 2 * iy;
  const sub = new Uint8Array(iw * ih);
  for (let y = 0; y < ih; y++) {
    const from = (y + bx.y0 + iy) * c.width + bx.x0 + ix;
    sub.set(gray.subarray(from, from + iw), y * iw);
  }
  const angle = estimateSkew(sub, iw, ih);

  // Uitsnijden, rechtzetten en vergroten in één stap (letters moeten ±20 px hoog zijn).
  const k = Math.min(3, Math.max(1, 1600 / bw));
  const ow = Math.round(bw * k), oh = Math.round(bh * k);
  const out = document.createElement('canvas');
  out.width = ow;
  out.height = oh;
  const octx = out.getContext('2d', { willReadFrequently: true });
  octx.imageSmoothingQuality = 'high';
  octx.fillStyle = '#fff';
  octx.fillRect(0, 0, ow, oh);
  octx.translate(ow / 2, oh / 2);
  octx.rotate((-angle * Math.PI) / 180);
  octx.scale(k, k);
  octx.drawImage(c, -bx.x0 - bw / 2, -bx.y0 - bh / 2);
  octx.setTransform(1, 0, 0, 1, 0, 0);

  img = octx.getImageData(0, 0, ow, oh);
  gray = toGray(img.data, ow, oh);
  const bin = mode === 'bin' ? binarize(gray, ow, oh) : flatten(gray, ow, oh);
  for (let i = 0, j = 0; j < bin.length; i += 4, j++) img.data[i] = img.data[i + 1] = img.data[i + 2] = bin[j];
  octx.putImageData(img, 0, 0);
  return out;
}

// Volgorde van voorbewerkingen: eerst de snelle; alleen als de bon dan niet klopt de zwaardere.
const MODES = ['basic', 'flat', 'bin'];

/**
 * Tekstherkenning met beoordeling: probeert voorbewerkingen tot judge(tekst).good,
 * en geeft anders de beste uitkomst terug. Ook de zekerheid per regel (0-100).
 */
async function ocr(sources, onProgress, lang = 'auto', judge = () => ({ good: true, score: 0 })) {
  await loadScript(TESSERACT);
  onProgress({ label: t('ocrStart'), progress: 0 });
  let step = 0;
  const total = sources.length * MODES.length;
  const worker = await window.Tesseract.createWorker(TESS_LANG[lang] || TESS_LANG.auto, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress({ label: step >= sources.length ? t('ocrRetryImg') : t('ocrRecog'), progress: Math.min(1, (step + m.progress) / (step >= sources.length ? total : sources.length)) });
      } else if (/load|initializ/i.test(m.status)) {
        onProgress({ label: t('ocrLang'), progress: m.progress || 0 });
      }
    },
  });
  await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '6' });
  let best = null;
  try {
    for (const mode of MODES) {
      const lines = [];
      for (const src of sources) {
        const { data } = await worker.recognize(preprocess(src, mode));
        if (data.lines?.length) for (const l of data.lines) lines.push({ text: l.text.replace(/\n$/, ''), conf: Math.round(l.confidence) });
        else for (const tl of String(data.text || '').split('\n')) lines.push({ text: tl, conf: Math.round(data.confidence ?? 0) });
        step++;
      }
      const text = lines.map((l) => l.text).join('\n');
      const verdict = judge(text);
      const result = { text, conf: lines.map((l) => l.conf), mode, ...verdict };
      if (!best || verdict.score > best.score) best = result;
      if (verdict.good) break;
    }
  } finally {
    await worker.terminate();
  }
  return best;
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

const preview = (source) => scaledCanvas(source, 1400).toDataURL('image/jpeg', 0.7);

async function readImage(file, onProgress, lang, judge) {
  onProgress({ label: t('ocrPhoto'), progress: 0 });
  const img = await loadImage(file);
  const previewUrl = preview(img);
  const res = await ocr([img], onProgress, lang, judge);
  URL.revokeObjectURL(img.src);
  return { text: res.text, conf: res.conf, mode: res.mode, previewUrl, source: 'foto' };
}

async function readPdf(file, onProgress, lang, judge) {
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
    const res = await ocr(canvases, onProgress, lang, judge);
    return { text: res.text, conf: res.conf, mode: res.mode, previewUrl, source: 'pdf-scan' };
  }
  return { text, conf: null, previewUrl, source: 'pdf' };
}

/**
 * lang: 'nl' | 'es' | 'en' | 'auto' (alle drie; iets trager).
 * judge(tekst) -> { good, score }: beoordeelt of de uitgelezen bon klopt (bv. som = totaal).
 */
export function readReceiptFile(file, onProgress = () => {}, lang = 'auto', judge) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  return isPdf ? readPdf(file, onProgress, lang, judge) : readImage(file, onProgress, lang, judge);
}
