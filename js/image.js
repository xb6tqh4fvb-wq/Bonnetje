// Beeldvoorbewerking voor tekstherkenning van kassabonnen. Pure functies op grijswaarden
// (Uint8Array, breedte w, hoogte h), zodat ze ook buiten de browser te testen zijn.

/** RGBA -> grijswaarden. */
export function toGray(rgba, w, h) {
  const g = new Uint8Array(w * h);
  for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = (rgba[i] * 299 + rgba[i + 1] * 587 + rgba[i + 2] * 114) / 1000;
  return g;
}

/** Drempel volgens Otsu (scheidt licht en donker optimaal). */
export function otsu(gray) {
  const hist = new Float64Array(256);
  for (const v of gray) hist[v]++;
  const n = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = n - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      thr = t;
    }
  }
  return thr;
}

/**
 * Zoekt het (lichte) bonpapier tegen een donkerdere achtergrond.
 * Geeft {x0,y0,x1,y1} terug, of null als er geen duidelijke achtergrond is.
 */
export function findPaper(gray, w, h) {
  const thr = otsu(gray);
  const rows = new Float64Array(h), cols = new Float64Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (gray[y * w + x] > thr) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  const span = (arr, len, other) => {
    let a = 0, b = len - 1;
    while (a < len && arr[a] / other < 0.3) a++;
    while (b > a && arr[b] / other < 0.3) b--;
    return [a, b];
  };
  const [y0, y1] = span(rows, h, w);
  const [x0, x1] = span(cols, w, h);
  const area = ((x1 - x0) * (y1 - y0)) / (w * h);
  if (!(area > 0.08 && area < 0.9)) return null; // geen (zinvolle) achtergrond gevonden
  const mx = Math.round((x1 - x0) * 0.03), my = Math.round((y1 - y0) * 0.03);
  return { x0: Math.max(0, x0 - mx), y0: Math.max(0, y0 - my), x1: Math.min(w - 1, x1 + mx), y1: Math.min(h - 1, y1 + my) };
}

/**
 * Schat de scheefstand van tekstregels (graden, positief = met de klok mee gedraaid)
 * door te zoeken naar de hoek waarbij de horizontale projectie het scherpst is.
 */
export function estimateSkew(gray, w, h, maxDeg = 8, step = 0.25) {
  const scale = Math.min(1, 500 / w);
  const thr = Math.min(otsu(gray), 200);
  const pts = [];
  const stride = Math.max(1, Math.round(1 / scale));
  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) if (gray[y * w + x] < thr) pts.push(x * scale, y * scale);
  }
  if (pts.length < 200) return 0;
  const H = Math.ceil(Math.hypot(w, h) * scale) + 2;
  let bestA = 0, bestS = -1;
  for (let a = -maxDeg; a <= maxDeg + 1e-9; a += step) {
    const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
    const bins = new Float64Array(H * 2);
    for (let i = 0; i < pts.length; i += 2) {
      const yy = Math.round(-pts[i] * s + pts[i + 1] * c) + H;
      if (yy >= 0 && yy < bins.length) bins[yy]++;
    }
    let score = 0;
    for (let i = 1; i < bins.length; i++) score += (bins[i] - bins[i - 1]) ** 2;
    if (score > bestS) {
      bestS = score;
      bestA = a;
    }
  }
  return bestA;
}

/**
 * Plaatselijke zwart-witdrempel (Bradley): elke pixel wordt vergeleken met het gemiddelde
 * van zijn omgeving. Werkt goed bij schaduw en vaal thermisch papier.
 */
export function binarize(gray, w, h, windowFrac = 1 / 16, t = 0.1) {
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) {
    let row = 0;
    for (let x = 1; x <= w; x++) {
      row += gray[(y - 1) * w + (x - 1)];
      integ[y * (w + 1) + x] = integ[(y - 1) * (w + 1) + x] + row;
    }
  }
  const s2 = Math.max(8, Math.round((w * windowFrac) / 2));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const ya = Math.max(0, y - s2), yb = Math.min(h - 1, y + s2);
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - s2), xb = Math.min(w - 1, x + s2);
      const cnt = (xb - xa + 1) * (yb - ya + 1);
      const sum = integ[(yb + 1) * (w + 1) + (xb + 1)] - integ[ya * (w + 1) + (xb + 1)] - integ[(yb + 1) * (w + 1) + xa] + integ[ya * (w + 1) + xa];
      out[y * w + x] = gray[y * w + x] * cnt <= sum * (1 - t) ? 0 : 255;
    }
  }
  return out;
}

/**
 * Achtergrond egaliseren: deel elke pixel door de lokale achtergrondhelderheid (schaduw,
 * vaal papier verdwijnen) en rek daarna het contrast op. Geen harde drempel: de randen van
 * letters blijven zacht, wat de tekstherkenning beter leest dan pure zwart-wit.
 */
export function flatten(gray, w, h, windowFrac = 1 / 12) {
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) {
    let row = 0;
    for (let x = 1; x <= w; x++) {
      row += gray[(y - 1) * w + (x - 1)];
      integ[y * (w + 1) + x] = integ[(y - 1) * (w + 1) + x] + row;
    }
  }
  const s2 = Math.max(10, Math.round((w * windowFrac) / 2));
  const out = new Uint8Array(w * h);
  const hist = new Uint32Array(256);
  for (let y = 0; y < h; y++) {
    const ya = Math.max(0, y - s2), yb = Math.min(h - 1, y + s2);
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - s2), xb = Math.min(w - 1, x + s2);
      const cnt = (xb - xa + 1) * (yb - ya + 1);
      const mean = (integ[(yb + 1) * (w + 1) + (xb + 1)] - integ[ya * (w + 1) + (xb + 1)] - integ[(yb + 1) * (w + 1) + xa] + integ[ya * (w + 1) + xa]) / cnt;
      // tekst is een klein deel van het venster, dus het gemiddelde ligt dicht bij de achtergrond
      const v = Math.min(255, Math.round((gray[y * w + x] / Math.max(1, mean * 1.05)) * 255));
      out[y * w + x] = v;
      hist[v]++;
    }
  }
  // contrast oprekken: donkerste 1% -> zwart, achtergrond -> wit
  const n = w * h;
  let lo = 0, acc = 0;
  for (; lo < 255 && (acc += hist[lo]) < n * 0.01; lo++);
  const hi = 245;
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < n; i++) out[i] = Math.max(0, Math.min(255, Math.round(((out[i] - lo) * 255) / span)));
  return out;
}
