// Meet hoe goed een uitgelezen bon overeenkomt met de juiste inhoud.
//
// Definities:
// - Een regel "klopt volledig" als naam, aantal én bedrag goed zijn. Naam: gelijk na
//   normaliseren (kleine letters, zonder accenten en leestekens, enkele spaties).
// - Handcorrecties = wat een gebruiker moet aanpassen om de bon goed te krijgen:
//   per gevonden regel 1 voor een foute naam, 1 voor een fout aantal, 1 voor een fout bedrag;
//   1 per ontbrekende regel (regel toevoegen); 1 per overbodige regel (verwijderen);
//   1 als het bontotaal niet (goed) is herkend.
// - Aansluiting: de som van de herkende regels is gelijk aan het herkende bontotaal.

export const normName = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/** Gelijkenis van twee namen (0..1) na normaliseren. */
export function nameSimilarity(a, b) {
  const x = normName(a), y = normName(b);
  if (!x && !y) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

/**
 * truth: [[aantal, naam, centen], ...]; trueTotal: centen.
 * result: { items: [{ qty, name, priceCents, unsure? }], totalCents }.
 */
export function scoreReceipt(truth, trueTotal, result) {
  const items = result.items || [];
  const used = new Set();
  const rows = [];
  for (const [qty, name, cents] of truth) {
    let best = -1, bestScore = 0;
    items.forEach((it, k) => {
      if (used.has(k)) return;
      const sim = nameSimilarity(it.name, name);
      const amountEq = it.priceCents === cents;
      if (!amountEq && sim < 0.6) return; // te weinig gemeen om dezelfde regel te zijn
      const s = (amountEq ? 2 : 0) + (it.qty === qty ? 0.5 : 0) + sim;
      if (s > bestScore) {
        bestScore = s;
        best = k;
      }
    });
    if (best < 0) {
      rows.push({ name, found: false });
      continue;
    }
    used.add(best);
    const it = items[best];
    const nameOk = normName(it.name) === normName(name);
    const qtyOk = it.qty === qty;
    const amountOk = it.priceCents === cents;
    rows.push({ name, found: true, nameOk, qtyOk, amountOk, full: nameOk && qtyOk && amountOk, unsure: !!it.unsure, got: it });
  }
  const extra = items.filter((_, k) => !used.has(k));
  const found = rows.filter((r) => r.found);
  const sum = items.reduce((a, it) => a + it.priceCents, 0);
  const totalOk = result.totalCents === trueTotal;
  const corrections =
    found.reduce((a, r) => a + !r.nameOk + !r.qtyOk + !r.amountOk, 0) + rows.filter((r) => !r.found).length + extra.length + (totalOk ? 0 : 1);
  // Markeringen "onzeker": hoe goed wijzen ze de regels aan die gecorrigeerd moeten worden?
  const wrong = rows.filter((r) => !r.found || !r.full);
  const flaggedWrong = found.filter((r) => r.unsure && !r.full).length;
  const flaggedRight = found.filter((r) => r.unsure && r.full).length;
  return {
    lines: truth.length,
    full: rows.filter((r) => r.full).length,
    amountOk: found.filter((r) => r.amountOk).length,
    qtyOk: found.filter((r) => r.qtyOk).length,
    nameOk: found.filter((r) => r.nameOk).length,
    missing: rows.filter((r) => !r.found).length,
    extra: extra.length,
    totalOk,
    sumMatches: result.totalCents != null && sum === result.totalCents,
    corrections,
    wrongLines: wrong.length,
    flaggedWrong,
    flaggedRight,
    rows,
    extraItems: extra,
  };
}
