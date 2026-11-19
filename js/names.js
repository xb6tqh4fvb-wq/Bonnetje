// Korte, gegarandeerd eenduidige weergavenamen voor de tik-chips in stap 3
// (verzoek Henk: kleinere chips; volledige naam blijft in "Toegewezen aan:" en
// het overzicht). Alleen weergave: de volledige naam blijft overal de bron.

import { normalizeSavedName } from './storage.js';

const MAX_EERSTE = 8; // voornamen langer dan dit worden afgekapt met …

/** Alle kandidaat-labels voor een naam, van kort naar lang. Eindigt met de volledige naam. */
function kandidaten(volledigeNaam) {
  const woorden = volledigeNaam.split(' ');
  const eerste = woorden[0];
  const basis = eerste.length > MAX_EERSTE ? `${eerste.slice(0, MAX_EERSTE)}…` : eerste;
  const lijst = [basis];
  if (woorden.length > 1) {
    const achternaam = woorden[woorden.length - 1]; // "Jan V" (tussenvoegsels slaan we over)
    for (let k = 1; k <= achternaam.length; k++) lijst.push(`${basis} ${achternaam.slice(0, k)}`.trimEnd());
    // was de voornaam afgekapt, probeer daarna de volledige voornaam + toevoeging
    if (basis !== eerste) {
      for (let k = 1; k <= achternaam.length; k++) lijst.push(`${eerste} ${achternaam.slice(0, k)}`.trimEnd());
    }
  }
  lijst.push(volledigeNaam);
  return lijst;
}

/**
 * Geeft Map(id => kortLabel). Labels zijn uniek (hoofdletterongevoelig) binnen de lijst.
 * Botst de korte vorm, dan wordt per naam net zo lang aangevuld ("Jan d", "Jan S")
 * tot alles uniek is. Zelfs twee identieke volledige namen krijgen een eigen label ("Jan 2").
 */
export function shortDisplayNames(deelnemers) {
  const labels = new Map();
  const kandPerId = new Map();
  deelnemers.forEach((p) => {
    kandPerId.set(p.id, kandidaten(normalizeSavedName(p.name) || '?'));
    labels.set(p.id, kandPerId.get(p.id)[0]);
  });
  const bezet = () => {
    const telling = new Map();
    labels.forEach((label) => telling.set(label.toLowerCase(), (telling.get(label.toLowerCase()) || 0) + 1));
    return telling;
  };
  // verleng botsende labels stap voor stap; iedereen in een botsgroep schuift mee door
  for (let ronde = 0; ronde < 60; ronde++) {
    const telling = bezet();
    const botsend = new Set([...telling.entries()].filter(([, n]) => n > 1).map(([l]) => l));
    if (botsend.size === 0) return labels;
    let ietsVerlengd = false;
    labels.forEach((label, id) => {
      if (!botsend.has(label.toLowerCase())) return;
      const kand = kandPerId.get(id);
      const huidigeIndex = kand.findIndex((k) => k.toLowerCase() === label.toLowerCase());
      if (huidigeIndex >= 0 && huidigeIndex + 1 < kand.length) {
        labels.set(id, kand[huidigeIndex + 1]);
        ietsVerlengd = true;
      }
    });
    if (!ietsVerlengd) break; // identieke volledige namen: hieronder nummeren
  }
  const telling = new Map();
  labels.forEach((label, id) => {
    const sleutel = label.toLowerCase();
    const n = (telling.get(sleutel) || 0) + 1;
    telling.set(sleutel, n);
    if (n > 1) labels.set(id, `${label} ${n}`);
  });
  return labels;
}
