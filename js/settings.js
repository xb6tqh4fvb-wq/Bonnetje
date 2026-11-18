// Weergave-instellingen: thema, tekstgrootte en hoog contrast. Lokaal onthouden.
const KEY = 'bonnetje.display';
const DEFAULTS = { theme: 'auto', size: 'normal', contrast: null };

export function loadSettings() {
  let s = {};
  try {
    s = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {}
  const out = { ...DEFAULTS, ...s };
  // Nog niet gekozen: volg 'meer contrast' van het systeem.
  if (out.contrast == null) out.contrast = !!globalThis.matchMedia?.('(prefers-contrast: more)').matches;
  return out;
}

export function applySettings(s) {
  const root = document.documentElement;
  if (s.theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.dataset.size = s.size;
  root.dataset.contrast = s.contrast ? 'on' : 'off';
  const brand = getComputedStyle(root).getPropertyValue('--brand').trim();
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', brand || '#0f766e');
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  applySettings(s);
}
