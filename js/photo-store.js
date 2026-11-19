// Bonnetje - bonfoto op het toestel bewaren (v22, verzoek Henk: "ik wil in stap 1
// de originele bon kunnen blijven zien").
// Opslag via IndexedDB: dat overleeft een herlaad van de pagina (het vroegere
// object-URL in het werkgeheugen niet). De foto gaat nooit mee naar een server;
// hij wordt bij "Nieuwe bon", "Alles wissen" en "Foto wissen" verwijderd.
// Alles is fail-soft: zonder IndexedDB (jsdom, sommige privémodi) doen de
// functies niets en blijft de app werken met alleen het in-memory voorbeeld.

const DB_NAME = 'bonnetje_photos';
const STORE = 'receipt';
const KEY = 'current';

function openDb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    let req;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      try {
        req.result.createObjectStore(STORE);
      } catch {}
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

/** Bewaar (of vervang) de huidige bonfoto. Geeft true als het gelukt is. */
export async function saveReceiptPhoto(blob) {
  const db = await openDb();
  if (!db || !blob) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/** Lees de bewaarde bonfoto (Blob) of null als er geen is of opslag ontbreekt. */
export async function loadReceiptPhoto() {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Verwijder de bewaarde bonfoto (bij Nieuwe bon / Alles wissen / Foto wissen). */
export async function clearReceiptPhoto() {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}
