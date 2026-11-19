// Bonnetje - Centrale lijst van app-bestanden (v14: online AI via Firebase AI Logic met
// Agent Platform Gemini API + App Check, ppu-paddle-ocr PP-OCRv6_tiny als enige lokale backup)
// Geen Tesseract meer in de app. Backup volledig zelf-gehost: modellen, browsermodule én onnxruntime-WASM lokaal.
// Licenties:
// - ppu-paddle-ocr / PP-OCRv6_tiny (Apache 2.0)
// - PDF.js 4.8.69 (Apache 2.0)
// - Firebase JS SDK 12.17.0 (Apache 2.0), geladen vanaf googles CDN (gstatic) bij de eerste online AI-aanroep

export const CACHE_NAME = 'bonnetje-v20';

// v19: zichtbaar versienummer onder Instellingen & privacy. Afgeleid van de cache-naam,
// zodat het nummer nooit kan verspringen van wat er echt draait.
export const APP_VERSION = CACHE_NAME.replace('bonnetje-v', '');

export const APP_SHELL_URLS = [
  './',
  './index.html',
  './css/styles.css',
  './js/assets-manifest.js',
  './js/app.js',
  './js/calculator.js',
  './js/firebase-ai.js',
  './js/firebase-config.js',
  './js/gemini.js',
  './js/image-downscale.js',
  './js/item-rows.js',
  './js/local-ocr.js',
  './js/i18n.js',
  './js/dictionary.js',
  './js/errors.js',
  './js/parser.js',
  './js/storage.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Zelf-gehoste modelbestanden voor ppu-paddle-ocr/web (PP-OCRv6_tiny, ~6 MB totaal)
// Echte bestandsnamen uit PT-Perkasa-Pilar-Utama/ppu-paddle-ocr (snowfluke/ppu-paddle-ocr-models).
// PP-OCRv6_tiny hoort bij ppocrv6_tiny_dict.txt (zo paart de eigen preset van de bibliotheek ze).
// Ook de rekenmotor (onnxruntime-web WASM) wordt lokaal gehost: niets gaat naar een CDN.
export const LOCAL_OCR_MODELS = {
  basePath: './models/pp-ocrv6-tiny/',
  detModel: './models/pp-ocrv6-tiny/PP-OCRv6_tiny_det.ort',
  recModel: './models/pp-ocrv6-tiny/PP-OCRv6_tiny_rec.ort',
  dictFile: './models/pp-ocrv6-tiny/ppocrv6_tiny_dict.txt',
  vendorModule: './js/vendor/ppu-paddle-ocr.mjs',
  wasmBase: './js/vendor/ort-wasm/',
  wasmFile: './js/vendor/ort-wasm/ort-wasm-simd-threaded.jsep.wasm'
};

export const LIB_URLS = {
  pdfjsScript: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs',
  pdfjsWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs'
};
