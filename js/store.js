// Opslag lokaal op het toestel (localStorage). Geen account, geen server.
const KEY = 'bonnetje.v1';

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.bills)) return s;
  } catch {}
  return { bills: [], currentId: null };
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    // Opslag vol: foto's van oudere bonnen opofferen, dan opnieuw proberen.
    const others = state.bills.filter((b) => b.id !== state.currentId && b.image);
    for (const b of others) {
      b.image = null;
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        return true;
      } catch {}
    }
    return false;
  }
}
