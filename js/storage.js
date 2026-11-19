// Bonnetje - Lokale opslag, dagteller Gemini & Undo-geschiedenis (100% op het toestel)

const STORAGE_KEY = 'bonnetje_state_v1';
const NAMES_KEY = 'bonnetje_saved_names_v1';
const SETTINGS_KEY = 'bonnetje_settings_v1';
const DICT_KEY = 'bonnetje_custom_dict_v1';
const GEMINI_KEY_STORAGE = 'bonnetje_gemini_api_key_v1';
const GEMINI_QUOTA_KEY = 'bonnetje_gemini_quota_v1';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const DEFAULT_SETTINGS = {
  lang: 'nl',
  theme: 'system', // 'system' | 'light' | 'dark'
  largeText: false,
  geminiModel: DEFAULT_GEMINI_MODEL,
  onlineTranslateEnabled: false,
  geminiPrivacyAccepted: false
};

export function createEmptySession() {
  return {
    step: 1,
    items: [],
    unparsedLines: [],
    rawText: '',
    receiptLanguage: null,
    receiptCurrency: 'EUR',
    receiptTotalCents: null,
    receiptTotalSource: null, // 'gemini' | 'pdf_text' | 'live_text' | 'manual' | null
    participants: [],
    activeParticipantId: null,
    tipMode: 'none', // 'none' | 'per_person' | 'target_total'
    tipPerPersonCents: {},
    targetTotalCents: null,
    includeZeroConsumersInSharedTip: false,
    // v13: per deelnemer-id een regel voor "betaalt niet mee" (te gast, jarig, ...)
    // { enabled, carrierIds: null | [id], mode: 'equal' | 'percent' | 'fixed', percent: {id: %}, fixedCents: {id: centen} }
    hosted: {}
  };
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptySession();
    return { ...createEmptySession(), ...JSON.parse(raw) };
  } catch {
    return createEmptySession();
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

export function loadSavedNames() {
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNameToHistory(name) {
  const clean = String(name || '').trim();
  if (!clean) return loadSavedNames();
  const names = loadSavedNames();
  if (!names.some((n) => n.toLowerCase() === clean.toLowerCase())) {
    names.unshift(clean);
    const trimmed = names.slice(0, 40);
    try {
      localStorage.setItem(NAMES_KEY, JSON.stringify(trimmed));
    } catch {}
    return trimmed;
  }
  return names;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function loadGeminiApiKey() {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(key) {
  const clean = String(key || '').trim();
  try {
    if (!clean) localStorage.removeItem(GEMINI_KEY_STORAGE);
    else localStorage.setItem(GEMINI_KEY_STORAGE, clean);
  } catch {}
  return clean;
}

function getTodayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Lokale dagteller voor Gemini-aanroepen (reset automatisch elke dag).
 */
export function getDailyGeminiCallCount() {
  try {
    const raw = localStorage.getItem(GEMINI_QUOTA_KEY);
    if (!raw) return { date: getTodayDateKey(), count: 0 };
    const parsed = JSON.parse(raw);
    const today = getTodayDateKey();
    if (parsed.date !== today) {
      return { date: today, count: 0 };
    }
    return { date: today, count: Number.isInteger(parsed.count) ? parsed.count : 0 };
  } catch {
    return { date: getTodayDateKey(), count: 0 };
  }
}

export function incrementDailyGeminiCallCount() {
  const cur = getDailyGeminiCallCount();
  const next = { date: cur.date, count: cur.count + 1 };
  try {
    localStorage.setItem(GEMINI_QUOTA_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function loadCustomDict() {
  try {
    const raw = localStorage.getItem(DICT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomDictEntry(source, target) {
  const dict = loadCustomDict();
  const k = String(source || '').trim().toLowerCase();
  const v = String(target || '').trim();
  if (!k || !v) return dict;
  dict[k] = v;
  try {
    localStorage.setItem(DICT_KEY, JSON.stringify(dict));
  } catch {}
  return dict;
}

export function wipeAllLocalData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NAMES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(DICT_KEY);
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    localStorage.removeItem(GEMINI_QUOTA_KEY);
  } catch {}
}

export class UndoManager {
  constructor(maxDepth = 50) {
    this.stack = [];
    this.maxDepth = maxDepth;
  }
  push(snapshot) {
    this.stack.push(JSON.stringify(snapshot));
    if (this.stack.length > this.maxDepth) {
      this.stack.shift();
    }
  }
  canUndo() {
    return this.stack.length > 0;
  }
  pop() {
    if (!this.canUndo()) return null;
    return JSON.parse(this.stack.pop());
  }
  clear() {
    this.stack = [];
  }
}
