// Bonnetje - Service Worker (v14: app-shell + zelf-gehoste PP-OCRv6_tiny cache + PDF.js, geen Tesseract)
const CACHE_NAME = 'bonnetje-v16';

const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/assets-manifest.js',
  './js/app.js',
  './js/calculator.js',
  './js/firebase-ai.js',
  './js/firebase-config.js',
  './js/gemini.js',
  './js/local-ocr.js',
  './js/i18n.js',
  './js/dictionary.js',
  './js/errors.js',
  './js/parser.js',
  './js/storage.js',
  './js/vendor/ppu-paddle-ocr.mjs',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Punt B7 (v10): PDF.js werd pas gecachet na het eerste online pdf-gebruik; cache hem al bij de
// installatie zodat de pdf-tekstroute daarna ook offline werkt. Apart en best-effort: als jsDelivr
// onbereikbaar is mag de installatie van de app zelf niet mislukken.
const PDFJS_URLS = [
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache
        .addAll(APP_SHELL)
        .then(() => Promise.all(PDFJS_URLS.map((u) => cache.add(u).catch(() => null))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // API-verkeer (Firebase AI Logic, App Check, installations e.d.) nooit cachen.
  // De Firebase-SDK zelf (gstatic, versie-vastgepind) mag wel gecachet worden.
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseio.com')) {
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((networkRes) => {
        if (networkRes && (networkRes.ok || networkRes.type === 'opaque')) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      });
    })
  );
});
