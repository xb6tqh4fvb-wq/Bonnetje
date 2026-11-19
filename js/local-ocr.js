// Bonnetje - Enige lokale backup: ppu-paddle-ocr/web met zelf-gehost PP-OCRv6_tiny (~6 MB)
// Geen Tesseract. Draait alleen als Gemini niet kan (geen internet, 429, 503, geen sleutel of geweigerd).
// Alles lokaal: modellen, browsermodule én onnxruntime-WASM worden van dezelfe server geladen.
// Echte interface van PT-Perkasa-Pilar-Utama/ppu-paddle-ocr:
//   import { PaddleOcrService } from './vendor/ppu-paddle-ocr.mjs'
//   new PaddleOcrService({ model: { detection, recognition, charactersDictionary } })
//   await service.initialize(); await service.recognize(buffer);

import { LOCAL_OCR_MODELS } from './assets-manifest.js';
import { mergeOcrLinesToSingleRow, parsePlainTextReceipt } from './parser.js';
import { localModelsOfflineMessage } from './errors.js';

let cachedEngine = null;

/**
 * Controleert of de zelf-gehoste PP-OCRv6_tiny modelbestanden lokaal bereikbaar zijn (geen 404, geen externe CDN).
 */
export async function checkLocalModelsAvailable(fetchImpl = fetch) {
  const urls = [
    LOCAL_OCR_MODELS.detModel,
    LOCAL_OCR_MODELS.recModel,
    LOCAL_OCR_MODELS.dictFile,
    LOCAL_OCR_MODELS.vendorModule,
    LOCAL_OCR_MODELS.wasmFile
  ];
  for (const url of urls) {
    try {
      const res = await fetchImpl(url, { method: 'HEAD' });
      if (!res.ok) return { ok: false, missingUrl: url, status: res.status };
    } catch {
      return { ok: false, missingUrl: url, status: 0 };
    }
  }
  return { ok: true };
}

/**
 * Verwerkt rauwe OCR-uitvoer van ppu-paddle-ocr (2D-array van { text, box }, 1D-array of strings)
 * via bounding-box kolomkoppeling en dezelfde bonparser & controles als Gemini.
 */
export function parseLocalOcrOutput(rawOcrLines, currency = 'EUR') {
  const merged = mergeOcrLinesToSingleRow(rawOcrLines);
  const parsed = parsePlainTextReceipt(merged.join('\n'), currency);
  parsed.items = parsed.items.map((it) => ({ ...it, sourceEngine: 'ppu-paddle-ocr' }));
  return {
    ...parsed,
    engine: 'ppu-paddle-ocr',
    rawText: merged.join('\n')
  };
}

/**
 * Laadt de drie zelf-gehoste modelbestanden via fetchImpl (in de browser via Service Worker / lokale cache).
 */
async function loadLocalModelBuffers(fetchImpl = fetch) {
  const [detRes, recRes, dictRes] = await Promise.all([
    fetchImpl(LOCAL_OCR_MODELS.detModel),
    fetchImpl(LOCAL_OCR_MODELS.recModel),
    fetchImpl(LOCAL_OCR_MODELS.dictFile)
  ]);
  if (!detRes.ok) throw new Error(`Detectiemodel ontbreekt (${LOCAL_OCR_MODELS.detModel}).`);
  if (!recRes.ok) throw new Error(`Herkenningsmodel ontbreekt (${LOCAL_OCR_MODELS.recModel}).`);
  if (!dictRes.ok) throw new Error(`Tekenwoordenboek ontbreekt (${LOCAL_OCR_MODELS.dictFile}).`);

  const [detection, recognition, charactersDictionary] = await Promise.all([
    detRes.arrayBuffer(),
    recRes.arrayBuffer(),
    dictRes.arrayBuffer()
  ]);
  return { detection, recognition, charactersDictionary };
}

/**
 * Voert lokale bonherkenning uit met ppu-paddle-ocr/web (PP-OCRv6_tiny).
 * Meldt bij de eerste keer laden eerlijk dat er eenmalig ~6 MB modelbestanden en ~24 MB
 * rekenmotor (WASM) lokaal van dezelfe server wordt opgehaald. Stuurt niets naar buiten.
 */
export async function runLocalBackupOcr(
  file,
  {
    onProgress = () => {},
    mockRunner = null,
    fetchImpl = fetch,
    moduleLoader = null
  } = {}
) {
  if (mockRunner) {
    const rawLines = await mockRunner(file);
    return parseLocalOcrOutput(rawLines);
  }

  onProgress({
    status: 'checking_models',
    message: 'Lokale backup (PP-OCRv6_tiny): eenmalig ~6 MB modelbestanden en ~24 MB rekenmotor ophalen van deze server en cachen…'
  });

  const avail = await checkLocalModelsAvailable(fetchImpl);
  if (!avail.ok) {
    // Punt 5 (v9): een netwerkfout (status 0) betekent offline met nog-gecachete modellen,
    // NIET "modellen ontbreken op de server". Alleen een echte HTTP-status (bijv. 404)
    // betekent dat de bestanden echt ontbreken.
    if (!avail.status || avail.status === 0) {
      throw new Error(localModelsOfflineMessage());
    }
    throw new Error(
      `De zelf-gehoste modelbestanden voor de lokale backup (${avail.missingUrl}) ontbreken op deze server (HTTP ${avail.status}). Voer scripts/fetch-local-ocr-assets.sh uit, of gebruik het plakvak (iPhone Live Text) / handmatig invoeren.`
    );
  }

  let engine = cachedEngine;
  if (!engine || moduleLoader) {
    const mod = moduleLoader
      ? await moduleLoader()
      : await import('./vendor/ppu-paddle-ocr.mjs').catch(() => null);

    if (!mod || (!mod.PaddleOcrService && !mod.default)) {
      throw new Error(
        'De lokale ppu-paddle-ocr browsermodule ontbreekt in ./js/vendor/ppu-paddle-ocr.mjs. Zie models/pp-ocrv6-tiny/README.md, of gebruik het plakvak (iPhone Live Text) / handmatig invoeren.'
      );
    }

    // Host de onnxruntime-WASM zelf: zet wasmPaths naar de eigen map vóór initialize,
    // zodat de rekenmotor niets van een externe CDN haalt.
    if (typeof mod.setLocalWasmPaths === 'function') {
      mod.setLocalWasmPaths(LOCAL_OCR_MODELS.wasmBase);
    }

    const model = await loadLocalModelBuffers(fetchImpl);
    const Service = mod.PaddleOcrService || mod.default;
    engine = new Service({ model });
    await engine.initialize();
    if (!moduleLoader) cachedEngine = engine;
  }

  onProgress({ status: 'recognizing', message: 'Bon wordt lokaal op je toestel gelezen (PP-OCRv6_tiny)…' });
  const buffer = await file.arrayBuffer();
  const result = await engine.recognize(buffer);
  const rawLines = Array.isArray(result)
    ? result
    : (result?.lines || result?.text?.split('\n') || []);
  return parseLocalOcrOutput(rawLines);
}
