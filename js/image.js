// Beeldbewerking voor de tekstherkenning. Pure functies op grijswaarden
// (Uint8Array, rij na rij, breedte w en hoogte h), dus ook buiten de browser te testen.

/** Drempelwaarde volgens Otsu: scheidt licht en donker zo goed mogelijk (één waarde voor het hele beeld). */
export function otsuLevel(gray) {
  const hist = new Float64Array(256);
  for (const v of gray) hist[v]++;
  const n = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = -1, level = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = n - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const between = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2;
    if (between > best) {
      best = between;
      level = t;
    }
  }
  return level;
}

/** Globale drempel (Otsu): elke pixel wordt zwart (0) of wit (255). */
export function thresholdOtsu(gray) {
  const level = otsuLevel(gray);
  const out = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) out[i] = gray[i] <= level ? 0 : 255;
  return out;
}

/**
 * Lokale, adaptieve drempel (Sauvola): T = m * (1 + k * (s / R - 1)) met m en s het
 * gemiddelde en de standaardafwijking in een venster rond de pixel. Werkt bij schaduw
 * en ongelijk licht, waar één globale drempel faalt.
 */
export function thresholdSauvola(gray, w, h, k = 0.2, windowFrac = 1 / 20, R = 128) {
  const W = w + 1;
  const sum = new Float64Array(W * (h + 1));
  const sq = new Float64Array(W * (h + 1));
  for (let y = 1; y <= h; y++) {
    let rs = 0, rq = 0;
    for (let x = 1; x <= w; x++) {
      const v = gray[(y - 1) * w + (x - 1)];
      rs += v;
      rq += v * v;
      sum[y * W + x] = sum[(y - 1) * W + x] + rs;
      sq[y * W + x] = sq[(y - 1) * W + x] + rq;
    }
  }
  const r = Math.max(7, Math.round((w * windowFrac) / 2));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const ya = Math.max(0, y - r), yb = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - r), xb = Math.min(w - 1, x + r);
      const cnt = (xb - xa + 1) * (yb - ya + 1);
      const s1 = sum[(yb + 1) * W + xb + 1] - sum[ya * W + xb + 1] - sum[(yb + 1) * W + xa] + sum[ya * W + xa];
      const s2 = sq[(yb + 1) * W + xb + 1] - sq[ya * W + xb + 1] - sq[(yb + 1) * W + xa] + sq[ya * W + xa];
      const m = s1 / cnt;
      const sd = Math.sqrt(Math.max(0, s2 / cnt - m * m));
      out[y * w + x] = gray[y * w + x] <= m * (1 + k * (sd / R - 1)) ? 0 : 255;
    }
  }
  return out;
}

/**
 * Schat de scheefstand van tekstregels in graden (positief = met de klok mee gedraaid):
 * de hoek waarbij de horizontale projectie van de inkt het scherpst is. Inkt = pixels die
 * duidelijk donkerder zijn dan hun omgeving; zo tellen tafel, schaduw en randen niet mee.
 */
export function estimateSkew(gray, w, h, maxDeg = 6, step = 0.25) {
  // verkleinen tot ±600 px breed (sneller, en ruis valt weg)
  const sc = Math.min(1, 600 / w);
  const sw = Math.max(1, Math.round(w * sc)), sh = Math.max(1, Math.round(h * sc));
  const small = new Float64Array(sw * sh);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) small[y * sw + x] = gray[Math.min(h - 1, Math.floor(y / sc)) * w + Math.min(w - 1, Math.floor(x / sc))];
  // plaatselijk gemiddelde via een integraalbeeld (venster 17x17)
  const W = sw + 1, integ = new Float64Array(W * (sh + 1));
  for (let y = 1; y <= sh; y++) {
    let row = 0;
    for (let x = 1; x <= sw; x++) {
      row += small[(y - 1) * sw + x - 1];
      integ[y * W + x] = integ[(y - 1) * W + x] + row;
    }
  }
  const r = 8, pts = [];
  for (let y = 0; y < sh; y++) {
    const ya = Math.max(0, y - r), yb = Math.min(sh - 1, y + r);
    for (let x = 0; x < sw; x++) {
      const xa = Math.max(0, x - r), xb = Math.min(sw - 1, x + r);
      const mean = (integ[(yb + 1) * W + xb + 1] - integ[ya * W + xb + 1] - integ[(yb + 1) * W + xa] + integ[ya * W + xa]) / ((xb - xa + 1) * (yb - ya + 1));
      if (small[y * sw + x] < mean * 0.82) pts.push(x, y);
    }
  }
  if (pts.length < 200) return 0;
  const H = Math.ceil(Math.hypot(sw, sh)) + 2;
  let bestAngle = 0, bestScore = -1;
  for (let a = -maxDeg; a <= maxDeg + 1e-9; a += step) {
    const rad = (a * Math.PI) / 180, s = Math.sin(rad), c = Math.cos(rad);
    const bins = new Float64Array(2 * H);
    for (let i = 0; i < pts.length; i += 2) {
      const yy = Math.round(-pts[i] * s + pts[i + 1] * c) + H;
      if (yy >= 0 && yy < bins.length) bins[yy]++;
    }
    let score = 0;
    for (let i = 1; i < bins.length; i++) score += (bins[i] - bins[i - 1]) ** 2;
    if (score > bestScore) {
      bestScore = score;
      bestAngle = a;
    }
  }
  return bestAngle;
}
