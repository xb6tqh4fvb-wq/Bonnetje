// Bonnetje - Foto verkleinen vóór de online AI-scan (v18)
// Een iPhone-foto is 3-5 MB (bijv. 3024x4032); die als volledige base64 meesturen
// maakte de online aanroep traag genoeg om over de time-out te lopen. Voor de
// online aanroep verkleinen we de foto in de browser (canvas) naar een leesbaar
// formaat. Het lokale terugvalpad gebruikt altijd het originele bestand.
//
// downscalePlan is DOM-vrij en direct te testen in Node.

export const ONLINE_SCAN_MAX_LONG_SIDE = 1800;
export const ONLINE_SCAN_JPEG_QUALITY = 0.85;

/**
 * Bereken de doelafmetingen voor de online scan. Schaalt alleen verkleinend,
 * behoudt de verhouding, rondt af op hele pixels. Bij onbekende of ongeldige
 * afmetingen: geen verkleining (needsResize false).
 */
export function downscalePlan(width, height, maxLongSide = ONLINE_SCAN_MAX_LONG_SIDE) {
  const w = Number(width), h = Number(height), max = Number(maxLongSide);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0 || !Number.isFinite(max) || max <= 0) {
    return { needsResize: false, width: w > 0 ? Math.round(w) : null, height: h > 0 ? Math.round(h) : null };
  }
  const longSide = Math.max(w, h);
  if (longSide <= max) {
    return { needsResize: false, width: Math.round(w), height: Math.round(h) };
  }
  const scale = max / longSide;
  return {
    needsResize: true,
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale))
  };
}

/** True als het bestand waarschijnlijk een HEIC/HEIF-foto is (iPhone-standaard). */
export function isLikelyHeic(file) {
  const type = (file && file.type) || '';
  const name = (file && file.name) || '';
  return /image\/(heic|heif)/i.test(type) || /\.(heic|heif)$/i.test(name);
}

/** True als het bestand een afbeelding is die voor de online scan verkleind kan worden. */
export function isDownscalableImage(file) {
  const type = (file && file.type) || '';
  return type.startsWith('image/');
}

/**
 * Verklein een afbeeldingsbestand voor de online scan.
 * Geeft { blob, resized, width, height, originalWidth, originalHeight, note } terug;
 * blob is het originele bestand als verkleinen niet nodig of niet mogelijk is.
 * Kan de browser het formaat niet decoderen (bijv. HEIC in een browser zonder
 * HEIC-ondersteuning), dan gaat het origineel mee met note 'not-decodable' —
 * de online API accepteert HEIC zelf wel.
 */
export async function prepareImageForOnlineScan(
  file,
  { maxLongSide = ONLINE_SCAN_MAX_LONG_SIDE, quality = ONLINE_SCAN_JPEG_QUALITY } = {}
) {
  const passthrough = (note, dims = {}) => ({
    blob: file,
    resized: false,
    width: dims.width ?? null,
    height: dims.height ?? null,
    originalWidth: dims.width ?? null,
    originalHeight: dims.height ?? null,
    note
  });
  if (!file || !isDownscalableImage(file)) return passthrough('geen-afbeelding');
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return passthrough('geen-canvas');
  }

  let bmp;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    // Niet decodeerbaar in deze browser (bijv. HEIC buiten Safari): origineel meesturen.
    return passthrough(isLikelyHeic(file) ? 'heic-niet-decodeerbaar' : 'niet-decodeerbaar');
  }
  const plan = downscalePlan(bmp.width, bmp.height, maxLongSide);
  if (!plan.needsResize) {
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    return passthrough('klein-genoeg', dims);
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = plan.width;
    canvas.height = plan.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, plan.width, plan.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    if (!blob) return passthrough('canvas-mislukt', dims);
    return {
      blob,
      resized: true,
      width: plan.width,
      height: plan.height,
      originalWidth: dims.width,
      originalHeight: dims.height,
      note: 'verkleind'
    };
  } catch {
    try { bmp.close(); } catch {}
    return passthrough('canvas-mislukt', { width: plan.width, height: plan.height });
  }
}
