// Bonnetje - Service Worker (v14: app-shell + zelf-gehoste PP-OCRv6_tiny cache + PDF.js, geen Tesseract)
const CACHE_NAME = 'bonnetje-v20';

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
  './js/image-downscale.js',
  './js/item-rows.js',
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
  // v19: clients die een OUDE pagina draaien zonder eigen update-logica (bijv. v17,
  // die zichzelf niet kan herladen) navigeren we vanuit de sw naar hun eigen URL,
  // zodat ze direct op de nieuwe versie draaien. De sessie in localStorage raakt
  // daarbij NIET kwijt (caches wissen raakt localStorage niet). Alleen doen als er
  // echt een oudere bonnetje-cache wordt vervangen, niet bij de allereerste installatie.
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const hadOldVersion = keys.some((k) => k.startsWith('bonnetje-') && k !== CACHE_NAME);
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
      if (hadOldVersion) {
        const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        // NIET awaiten: een navigate loopt door de fetch-handler van deze nog-activerende sw;
        // wachten erop zou de activatie met zichzelf in deadlock zetten (oude pagina bevriest).
        // Afvuren en activatie laten voltooien: de pagina herlaadt zodra de sw actief is.
        wins.forEach((w) => w.navigate(w.url).catch(() => null));
      }
    })()
  );
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

  // v19: paginanavigaties network-first (verse index bij elke start), cache als
  // offline-terugval. Zo kan een actieve sw nooit een verouderde app blijven serveren.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          }
          return networkRes;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((cached) => cached || caches.match('./index.html'))
        )
    );
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
