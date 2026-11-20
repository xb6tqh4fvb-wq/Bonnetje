// Bonnetje - Hoofdapplicatie (v14: online AI-scan via Firebase AI Logic met de Agent Platform
// Gemini API (voorheen Vertex AI) en App Check; GEEN eigen sleutel meer in de app.
// Lokale backup ppu-paddle-ocr PP-OCRv6_tiny, volledig zelf-gehost incl. onnxruntime-WASM,
// valt in als de online aanroep mislukt of de spend cap bereikt is. Deelknop voor de uitslag)
import {
  parseEuroToCents,
  formatCentsNL,
  validateLineItem,
  isLineActive,
  validateReceiptTotal,
  calculateSettlement,
  buildSettlementShareText,
  payerOutstandingCents
} from './calculator.js';
import { t, STRINGS } from './i18n.js';
import { shortDisplayNames } from './names.js';
import { saveReceiptPhoto, loadReceiptPhoto, clearReceiptPhoto } from './photo-store.js';
import { translateOffline } from './dictionary.js';
import { extractPdfTextAllPages, parsePlainTextReceipt } from './parser.js';
import {
  friendlyScanError,
  emptyFileMessage,
  wrongFileTypeMessage,
  pdfReaderLoadFailedMessage,
  scannedPdfWithoutGeminiMessage,
  unreadableFileMessage,
  localModelsOfflineMessage
} from './errors.js';
import { runLocalBackupOcr } from './local-ocr.js';
import {
  scanReceiptWithGemini,
  translateItemsWithGemini
} from './gemini.js';
import {
  callFirebaseAiModel,
  isAiConfigured,
  isOnlineAiUsable,
  aiStatusText
} from './firebase-ai.js';
import {
  AI_MODEL,
  AI_TERMS_URL
} from './firebase-config.js';
import {
  isItemExpanded,
  toggleItemExpanded,
  deleteItemAt,
  restoreDeletedItem,
  compactRowModel
} from './item-rows.js';
import { prepareImageForOnlineScan, isDownscalableImage } from './image-downscale.js';
import { APP_VERSION } from './assets-manifest.js';
import {
  createEmptySession,
  loadSession,
  saveSession,
  loadSavedNames,
  saveNameToHistory,
  normalizeSavedName,
  removeSavedName,
  loadSettings,
  saveSettings,
  cleanupLegacyStorage,
  getDailyGeminiCallCount,
  loadCustomDict,
  saveCustomDictEntry,
  wipeAllLocalData,
  UndoManager
} from './storage.js';

// Externe koffielink (zelfde als de online versie); er gaat geen app-data mee.
const SUPPORT_URL = 'https://www.paypal.me/Inzane007';
cleanupLegacyStorage(); // v14: oude eigen Gemini-sleutel (<= v13) opruimen als die er nog staat
let session = loadSession();
let settings = loadSettings();
let savedNames = loadSavedNames();
// v20: beheermodus voor bewaarde namen (ui-only, geen sessiedata)
let customDict = loadCustomDict();
const undoManager = new UndoManager(50);

// v22: de bonfoto wordt (verkleind) bewaard in IndexedDB, alleen op dit toestel,
// zodat hij een herlaad overleeft (verzoek Henk: bon blijven zien in stap 1).
// Hij verdwijnt bij Nieuwe bon, Alles wissen en Foto wissen. Nooit in localStorage.
let currentPhotoObjectUrl = null;
let lastReceiptFile = null;

// v17: uitklaptoestand van bonregels (ui-only, geen sessiedata) + de laatst
// verwijderde regel voor de ongedaan-maken-balk onderin.
const expandedItemIds = new Set();
const collapsedItemIds = new Set();
let lastDeletedLine = null;

// Centrale DOM-helper: boolean eigenschappen via echte DOM-properties (NOOIT disabled="false")
const BOOL_PROPS = new Set(['disabled', 'checked', 'selected', 'required', 'hidden', 'readOnly', 'multiple']);
const $ = (sel) => document.querySelector(sel);

export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') {
      node.className = v;
    } else if (k === 'text') {
      node.textContent = v;
    } else if (k === 'value') {
      node.value = v ?? '';
    } else if (BOOL_PROPS.has(k)) {
      node[k] = Boolean(v);
    } else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined && v !== false) {
      node.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
};

function announce(message) {
  const region = $('#sr-announcements');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

function mutate(fn, announcementText = null) {
  undoManager.push(session);
  fn();
  saveSession(session);
  render();
  if (announcementText) announce(announcementText);
}

const STIJLEN = ['standaard', 'delft', 'cartoon', 'vangogh', 'rembrandt', 'straat', 'mondriaan'];

function applyThemeAndPrefs() {
  const html = document.documentElement;
  html.lang = settings.lang;
  html.dataset.theme = settings.theme;
  // v26: vormgevingsstijl; onbekende of ontbrekende waarde = de standaardstijl
  html.dataset.stijl = STIJLEN.includes(settings.stijl) ? settings.stijl : 'standaard';
  html.classList.toggle('large-text', Boolean(settings.largeText));
}

async function copyTextReliable(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// v16: het toestemmingsvenster voor elke online aanroep is weg (expliciet verzoek Henk).
// De scan en vertaling gaan direct via Firebase AI Logic; wat er wordt verstuurd staat
// onder Instellingen & privacy, en bij elke fout valt de app terug op de lokale backup.

// ============================================================
// SERVICE WORKER (alleen app-shell, geen lokale OCR-modellen)
// ============================================================
async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // v19: de geforceerde herlading na een versiewissel doet de SERVICE WORKER zelf
      // (bij activate navigeert hij oude vensters naar hun eigen URL). De pagina doet dat
      // bewust niet óók (controllerchange-herlaad uit v18 is weg): één mechanisme, geen
      // dubbele herlading. Mocht een navigate mislukken, dan pakt de network-first
      // navigatie in de sw de nieuwe versie alsnog bij de eerstvolgende start.
      const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }); // v19: sw.js altijd vers ophalen
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch {}
  }
}

function renderConnectionBanner() {
  const box = $('#offline-banner');
  if (!box) return;
  box.innerHTML = '';

  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (isOffline) {
    box.className = 'offline-banner status-missing';
    box.appendChild(
      el('span', {
        text: 'Geen internetverbinding: scannen en vertalen via Gemini werken alleen met internet. Het plakvak (iPhone Live Text), handmatig invoeren en verdelen werken wel gewoon.'
      })
    );
  } else {
    box.className = 'offline-banner';
    box.hidden = true;
    return;
  }
  box.hidden = false;
}

window.addEventListener('online', renderConnectionBanner);
window.addEventListener('offline', renderConnectionBanner);

// ============================================================
// HEADER & STAPPENBALK (MET VEILIGHEIDSCONTROLES)
// ============================================================
// Punt N1 (v11): fooi en erbovenop-getelde btw van de bon zelf horen bij het bontotaal.
function receiptExtrasFromSession() {
  return {
    tipCents: Number.isInteger(session.receiptTipCents) ? session.receiptTipCents : 0,
    vatAddedCents: Number.isInteger(session.receiptVatAddedCents) ? session.receiptVatAddedCents : 0
  };
}

function canNavigateToStep(targetStep) {
  if (targetStep <= session.step) return true;
  const totalCheck = validateReceiptTotal(session.items, session.receiptTotalCents, receiptExtrasFromSession());
  if (targetStep >= 2 && !totalCheck.canProceed) return false;
  if (targetStep >= 3 && session.participants.length === 0) return false;
  return true;
}

function renderHeader() {
  const lang = settings.lang;
  $('#app-title').textContent = t(lang, 'appName');
  const footer = $('#app-footer');
  if (footer) {
    footer.innerHTML = '';
    footer.appendChild(
      el('a', {
        href: SUPPORT_URL,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'support-link',
        text: t(lang, 'support')
      })
    );
  }
  $('#app-tagline').textContent = t(lang, 'tagline');

  // Compacte kop: korte tekst + lijnpictogram; de volledige naam staat in aria-label en title.
  const undoBtn = $('#btn-undo');
  undoBtn.innerHTML = `${ICON_UNDO}<span>${t(lang, 'undoShort')}</span>`;
  undoBtn.disabled = !undoManager.canUndo();
  undoBtn.setAttribute('aria-label', t(lang, 'undo'));
  undoBtn.title = t(lang, 'undo');

  const settingsBtn = $('#btn-settings');
  settingsBtn.innerHTML = ICON_SETTINGS;
  settingsBtn.setAttribute('aria-label', t(lang, 'settings'));
  settingsBtn.title = t(lang, 'settings');

  const stepper = $('#stepper');
  stepper.innerHTML = '';
  const stepNames = STRINGS[lang].steps;
  stepNames.forEach((label, idx) => {
    const stepNum = idx + 1;
    const isCurrent = session.step === stepNum;
    const isDone = stepNum < session.step;
    const allowed = canNavigateToStep(stepNum);
    const btn = el('button', {
      type: 'button',
      className: `step-pill ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`,
      disabled: !allowed,
      'aria-current': isCurrent ? 'step' : null,
      'aria-label': label,
      onClick: () => {
        if (session.step !== stepNum && canNavigateToStep(stepNum)) {
          mutate(() => {
            session.step = stepNum;
          });
        }
      }
    });
    // Bolletje met nummer (of vinkje als de stap achter je ligt) en een kort woord eronder.
    btn.appendChild(el('span', { className: 'step-dot', 'aria-hidden': 'true', text: isDone ? '✓' : String(stepNum) }));
    btn.appendChild(el('span', { className: 'step-label', 'aria-hidden': 'true', text: label.replace(/^\d+\.\s*/, '') }));
    stepper.appendChild(btn);
  });
}

// Lijnpictogrammen voor de kop (stroke = currentColor, dus licht/donker/hoog contrast werken vanzelf).
const ICON_UNDO =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>';
const ICON_SETTINGS =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

// ============================================================
// STAP 1: BON (GEMINI / PDF / PLAKVAK / HANDMATIG)
// ============================================================
function createNewItem(isDiscount = false) {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    description: isDiscount ? (settings.lang === 'nl' ? 'Korting' : 'Discount') : '',
    originalDescription: '',
    geminiTranslation: '',
    qty: 1,
    unitPriceCents: isDiscount ? -100 : 0,
    lineTotalCents: isDiscount ? -100 : 0,
    assignedTo: [],
    assignedQuantities: {},
    lineType: isDiscount ? 'discount' : 'item',
    isVatSummary: false,
    needsVatDecision: false,
    needsPriceConfirmation: false,
    needsDiscountConfirmation: false,
    excluded: false,
    lowConfidence: false
  };
}

function applyLineType(item, newType) {
  item.lineType = newType;
  item.isVatSummary = newType === 'vat_summary';
  item.excluded = newType === 'ignored';
  item.needsVatDecision = false;
  item.needsDiscountConfirmation = false;
  if (newType === 'discount' && Number.isInteger(item.lineTotalCents) && item.lineTotalCents > 0) {
    item.lineTotalCents = -Math.abs(item.lineTotalCents);
    if (Number.isInteger(item.unitPriceCents)) {
      item.unitPriceCents = -Math.abs(item.unitPriceCents);
    }
  } else if ((newType === 'item' || newType === 'surcharge') && Number.isInteger(item.lineTotalCents) && item.lineTotalCents < 0) {
    item.lineTotalCents = Math.abs(item.lineTotalCents);
    if (Number.isInteger(item.unitPriceCents)) {
      item.unitPriceCents = Math.abs(item.unitPriceCents);
    }
  }
}

// v27: meldingen over het bestand zelf zijn al in gewone taal en blijven de hoofdtekst;
// alle andere (technische) meldingen gaan achter "Meer info".
function isPlainFileMessage(message) {
  return [
    unreadableFileMessage(false),
    unreadableFileMessage(true),
    emptyFileMessage(),
    wrongFileTypeMessage(),
    localModelsOfflineMessage(),
    scannedPdfWithoutGeminiMessage(),
    pdfReaderLoadFailedMessage()
  ].includes(message);
}

function openPasteBox() {
  const box = document.querySelector('details.paste-box');
  if (box) {
    box.open = true;
    box.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  const area = $('#live-text-paste');
  if (area) area.focus();
}

function showScanError(message, { isPdf = false } = {}) {
  const lang = settings.lang;
  render();
  const errStatus = $('#scan-status');
  errStatus.hidden = false;
  errStatus.className = 'status-box error scan-error';
  errStatus.innerHTML = '';
  const plain = isPlainFileMessage(message);
  errStatus.appendChild(el('p', { className: 'scan-error-title', text: t(lang, 'scanFailedTitle') }));
  errStatus.appendChild(el('p', { text: plain ? message : t(lang, 'scanFailedHelp') }));

  const actions = el('div', { className: 'action-row' });
  actions.appendChild(
    el('button', { type: 'button', className: 'btn btn-sm btn-primary', text: t(lang, 'scanFailedPaste'), onClick: openPasteBox })
  );
  if (lastReceiptFile && isAiConfigured()) {
    actions.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        text: t(lang, 'scanFailedRetry'),
        onClick: () => handleReceiptFile(lastReceiptFile)
      })
    );
  }
  // Punt 6 (v9): geen doodlopende route — bied altijd de lokale backup aan bij foto's
  if (lastReceiptFile && !isPdf) {
    actions.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        text: t(lang, 'scanFailedLocal'),
        onClick: () => runLocalBackupFlow(lastReceiptFile)
      })
    );
  }
  errStatus.appendChild(actions);
  if (!plain && message) {
    errStatus.appendChild(
      el('details', { className: 'scan-error-details' }, [
        el('summary', { text: t(lang, 'moreInfo') }),
        el('p', { text: message })
      ])
    );
  }
  announce(`${t(lang, 'scanFailedTitle')} ${plain ? message : t(lang, 'scanFailedHelp')}`);
}

/**
 * Past een scanresultaat (Gemini of lokale backup) toe op de sessie en toont de status.
 */
function applyScanResult(scanRes, usedLocalBackup, fallbackReasonForStatus = null) {
  session.items = scanRes.items || [];
  session.unparsedLines = scanRes.unparsedLines || [];
  session.ambiguousCandidates = scanRes.ambiguousCandidates || [];
  // Punt B7 (v10): bewaar de ruwe scantekst in de sessie, net als op de plak- en pdf-tekstroutes
  session.rawText = scanRes.rawText || '';
  session.receiptCurrency = scanRes.currency || 'EUR';
  session.receiptLanguage = scanRes.language || null;
  session.receiptTotalCents = scanRes.receiptTotalCents;
  // Punt N1 (v11): fooi en erbovenop-getelde btw van de bon bewaren voor de afronding
  session.receiptTipCents = scanRes.tipCents || 0;
  session.receiptVatAddedCents = scanRes.taxMode === 'vat_added' ? scanRes.vatCents || 0 : 0;
  session.receiptTotalSource = scanRes.receiptTotalCents !== null ? (usedLocalBackup ? 'local_ocr' : 'gemini') : null;
  // N6-meting (v11): model + tokenkosten van de Gemini-aanroep bewaren (usageMetadata of gelabelde schatting)
  session.geminiMeta = scanRes.geminiMeta || null;
  saveSession(session);
  render();

  const postStatus = $('#scan-status');
  postStatus.hidden = false;
  if (usedLocalBackup) {
    postStatus.className = 'status-box warn';
    // v18: geen OCR-naam meer in beeld (verzoek Henk); wel de echte reden van de terugval.
    const why = fallbackReasonForStatus ? ` (${fallbackReasonForStatus})` : '';
    postStatus.textContent =
      `Lokaal gelezen met de backup${why}. Let op: de lokale backup vertaalt niet; bij een buitenlandse bon kun je later met internet alsnog vertalen.`;
  } else if (scanRes.emptyResult) {
    postStatus.className = 'status-box warn';
    postStatus.textContent =
      'Gemini vond geen bonregels in dit bestand. Gebruik het plakvak (iPhone Live Text) of voer de regels handmatig in.';
  } else if (scanRes.ambiguousCandidates && scanRes.ambiguousCandidates.length > 1) {
    postStatus.className = 'status-box warn';
    postStatus.textContent =
      'Er zijn meerdere mogelijke interpretaties voor het subtotaal of de btw. Kies hieronder zelf de juiste combinatie.';
  } else if (scanRes.totalMismatch) {
    postStatus.className = 'status-box warn';
    postStatus.textContent =
      'Bon gelezen via Gemini, maar de regelsom klopt niet met het bontotaal. De regels zijn gemarkeerd als onzeker — controleer en corrigeer ze hieronder.';
  } else {
    postStatus.className = 'status-box info';
    postStatus.textContent = `Bon gelezen via Gemini${scanRes.language ? ` (taal: ${scanRes.language})` : ''}. Controleer elke regel en het totaalbedrag.`;
  }
  announce(postStatus.textContent);
}

/**
 * Start de lokale backup (ppu-paddle-ocr) rechtstreeks voor een foto (knop in foutmeldingen,
 * punt 6 v9) en past het resultaat toe. Gooit niets weg; fouten krijgen een NL-melding.
 */
async function runLocalBackupFlow(file) {
  const statusBox = $('#scan-status');
  statusBox.hidden = false;
  statusBox.className = 'status-box info';
  statusBox.textContent = 'Lokale backup wordt gestart…';
  announce(statusBox.textContent);
  try {
    const scanRes = await runLocalBackupOcr(file, {
      onProgress: (p) => {
        if (p.message) statusBox.textContent = p.message;
      }
    });
    applyScanResult(scanRes, true);
  } catch (err) {
    showScanError(friendlyScanError(err, { isPdf: false }), { isPdf: false });
  }
}

async function handleReceiptFile(file) {
  if (!file) return;
  lastReceiptFile = file;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = !isPdf && typeof file.type === 'string' && file.type.startsWith('image/');

  // Punt 5 (v9): vriendelijke Nederlandse meldingen bij leeg of verkeerd bestand,
  // voordat er iets wordt gestart.
  if (file.size === 0) {
    showScanError(emptyFileMessage(), { isPdf });
    return;
  }
  if (!isPdf && !isImage) {
    showScanError(wrongFileTypeMessage(), { isPdf });
    return;
  }

  // Schone statusovergang: wis oude regels en oud totaal direct (bewaar in Undo)
  undoManager.push(session);
  session.items = [];
  session.unparsedLines = [];
  session.rawText = '';
  session.receiptLanguage = null;
  session.receiptTotalCents = null;
  session.receiptTotalSource = null;
  session.receiptTipCents = 0;
  session.geminiMeta = null;
  session.receiptVatAddedCents = 0;
  saveSession(session);
  render();

  const liveStatus = $('#scan-status');
  liveStatus.hidden = false;
  liveStatus.className = 'status-box info';
  let pdfJsLoadFailed = false;

  try {
    // 1. PDF met echte tekstlaag op alle pagina's: direct lokaal uitlezen zonder API-aanroep
    if (isPdf) {
      liveStatus.textContent = 'PDF-pagina\'s worden gecontroleerd op directe tekst…';
      try {
        const pdfRes = await extractPdfTextAllPages(file, (p) => {
          liveStatus.textContent = `PDF pagina ${p.page}/${p.totalPages} lezen…`;
        });
        if (!pdfRes.hasScannedPages && pdfRes.parsed.items.length > 0) {
          session.items = pdfRes.parsed.items;
          session.unparsedLines = pdfRes.parsed.unparsedLines;
          session.rawText = pdfRes.rawText;
          session.receiptTotalCents = pdfRes.parsed.receiptTotalCents;
          session.receiptTotalSource = pdfRes.parsed.receiptTotalCents !== null ? 'pdf_text' : null;
          saveSession(session);
          render();
          const post = $('#scan-status');
          post.hidden = false;
          post.className = 'status-box info';
          post.textContent = `Tekst direct uit alle ${pdfRes.totalPages} PDF-pagina's gelezen. Controleer elke regel en het totaal.`;
          announce(post.textContent);
          return;
        }
      } catch (pdfErr) {
        // Punt B6 (v10): als PDF.js zelf niet laadt (jsDelivr geblokkeerd / offline), onthoud dat;
        // de melding "scan zonder tekstlaag" is dan misleidend.
        if (pdfErr && pdfErr.code === 'pdfjs_load_failed') pdfJsLoadFailed = true;
        // Als PDF.js niet laadt of geen tekstlaag heeft, ga door naar Gemini voor de hele PDF
      }
    } else {
      if (currentPhotoObjectUrl) URL.revokeObjectURL(currentPhotoObjectUrl);
      currentPhotoObjectUrl = URL.createObjectURL(file);
      // v22: bewaar een (verkleinde) kopie in IndexedDB zodat de foto een herlaad
      // overleeft. Mislukken mag de scan nooit blokkeren.
      (async () => {
        try {
          let kopie = file;
          if (isDownscalableImage(file)) {
            const prep = await prepareImageForOnlineScan(file);
            kopie = prep.blob;
          }
          await saveReceiptPhoto(kopie);
        } catch {}
      })();
      render();
    }

    // 2. Foto of gescande PDF -> Gemini eerst, lokale backup (ppu-paddle-ocr PP-OCRv6_tiny) als Gemini niet kan
    const statusBox = $('#scan-status');
    statusBox.hidden = false;

    let fallbackReason = null;
    if (!isOnlineAiUsable(settings)) {
      // v17: schakelaar uit (of config ontbreekt) -> GEEN online aanroep, direct lokaal
      fallbackReason =
        settings.onlineAiEnabled === false
          ? 'online AI-scan staat uit op dit toestel (Instellingen & privacy)'
          : aiStatusText();
    } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      fallbackReason = 'geen internetverbinding';
    }

    let scanRes = null;
    let usedLocalBackup = false;

    if (!fallbackReason) {
      statusBox.className = 'status-box info';
      statusBox.textContent = `Bon wordt gelezen via Gemini (${AI_MODEL})…`;
      announce(statusBox.textContent);
      // v18: een grote iPhone-foto (3-5 MB) volledig meesturen duurde te lang (time-out).
      // Voor de online aanroep wordt de foto in de browser verkleind; het lokale
      // terugvalpad hieronder gebruikt altijd het originele bestand.
      let onlineFile = file;
      if (isDownscalableImage(file)) {
        try {
          const prep = await prepareImageForOnlineScan(file);
          onlineFile = prep.blob;
        } catch {
          onlineFile = file;
        }
      }
      try {
        scanRes = await scanReceiptWithGemini(onlineFile, { callModel: callFirebaseAiModel });
      } catch (gemErr) {
        // v14: elke mislukte online aanroep (quotum/spend cap, storing, netwerk, App Check,
        // ontbrekende config) valt terug op de lokale backup.
        // v18: de terugval is niet meer blind - de statusregel toont de echte foutcode
        // (bijv. 'app-check/...', 'resource-exhausted', 'time-out').
        if (gemErr.fallbackCode) {
          fallbackReason = `online scan mislukt: ${gemErr.rawCode || gemErr.fallbackCode}`;
        } else {
          throw gemErr;
        }
      }
    }

    if (!scanRes && fallbackReason) {
      // Punt 5 (v9): de lokale backup kan geen PDF's lezen. Bij een gescande PDF zonder
      // bruikbare Gemini-route: duidelijke NL-melding i.p.v. een Engelse decode-fout.
      if (isPdf) {
        // Punt B6 (v10): eerlijke melding als de pdf-lezer zelf niet laadde
        throw new Error(pdfJsLoadFailed ? pdfReaderLoadFailedMessage() : scannedPdfWithoutGeminiMessage());
      }
      usedLocalBackup = true;
      statusBox.className = 'status-box warn';
      statusBox.textContent = `Gemini niet beschikbaar (${fallbackReason}). De lokale backup wordt gestart…`;
      announce(statusBox.textContent);
      scanRes = await runLocalBackupOcr(file, {
        onProgress: (p) => {
          if (p.message) statusBox.textContent = p.message;
        }
      });
    }

    applyScanResult(scanRes, usedLocalBackup, fallbackReason);
  } catch (err) {
    // Punt 5 (v9): technische fouten (bijv. Engelse decode-fouten) worden vriendelijke NL-meldingen
    showScanError(friendlyScanError(err, { isPdf }), { isPdf });
  }
}

function renderStep1(container) {
  const lang = settings.lang;
  container.appendChild(el('h2', { text: t(lang, 'step1Title') }));
  container.appendChild(
    el('p', {
      className: 'help-text',
      text: 'Maak een foto van de bon of kies een foto of PDF met de knop hieronder (de camera zit in dezelfde kiezer), plak tekst via iPhone Live Text, of typ de regels handmatig in. Controleer herkende bedragen altijd zelf.'
    })
  );

  // v15: de vaste statusregel over AI-aanroepen is weg uit stap 1 (verzoek Henk);
  // de teller en status blijven zichtbaar onder Instellingen & privacy.

  // Foto of bestand kiezen. v15: de losse "Foto maken"-knop is weg; iOS/Android bieden
  // de camera al aan in de kiezer van deze knop, dus die knop was dubbel (verzoek Henk).
  const fileActions = el('div', { className: 'action-row' });

  const fileInput = el('input', {
    type: 'file',
    accept: 'image/*,application/pdf',
    className: 'sr-only',
    id: 'input-file'
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files?.[0]) handleReceiptFile(e.target.files[0]);
    e.target.value = '';
  });

  fileActions.appendChild(
    el('label', { for: 'input-file', className: 'btn btn-primary', text: `📷 ${t(lang, 'chooseFile')}` })
  );
  fileActions.appendChild(fileInput);

  if (currentPhotoObjectUrl) {
    fileActions.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-danger-outline',
        text: `🗑 ${t(lang, 'clearPhoto')}`,
        onClick: () => {
          URL.revokeObjectURL(currentPhotoObjectUrl);
          currentPhotoObjectUrl = null;
          clearReceiptPhoto();
          render();
          announce(t(lang, 'photoCleared'));
        }
      })
    );
  }
  container.appendChild(fileActions);

  if (currentPhotoObjectUrl) {
    // v22 (verzoek Henk): klein voorbeeld; tik opent de volledige foto in een
    // dialoog zodat je regels met de bon kunt vergelijken
    container.appendChild(
      el('button', {
        type: 'button',
        className: 'photo-preview',
        'aria-label': t(lang, 'photoEnlarge'),
        title: t(lang, 'photoEnlarge'),
        onClick: () => {
          const dlg = el('dialog', { className: 'photo-lightbox' }, [
            el('img', { src: currentPhotoObjectUrl, alt: t(lang, 'photoEnlarge') }),
            el('button', {
              type: 'button',
              className: 'btn btn-primary',
              text: t(lang, 'close'),
              onClick: () => {
                dlg.close();
                dlg.remove();
              }
            })
          ]);
          dlg.addEventListener('click', (ev) => {
            if (ev.target === dlg) {
              dlg.close();
              dlg.remove();
            }
          });
          window.document.body.appendChild(dlg);
          dlg.showModal();
        }
      }, [
        el('img', { src: currentPhotoObjectUrl, alt: 'Bonvoorbeeld (blijft op dit toestel)' })
      ])
    );
  }

  // Groot plakvak voor iPhone Live Text / Tekst van camera
  const pasteDetails = el('details', { className: 'card mt paste-box' });
  pasteDetails.appendChild(el('summary', { text: '📋 Plak bontekst (iPhone Live Text / Tekst van camera)' }));
  const pasteArea = el('textarea', {
    id: 'live-text-paste',
    rows: '5',
    className: 'paste-textarea',
    placeholder: 'Plak hier tekst uit iPhone Foto\'s (Live Text) of gebruik "Tekst van camera". Artikel en bedrag mogen op losse regels staan.'
  });
  const pasteBtn = el('button', {
    type: 'button',
    className: 'btn btn-secondary btn-sm mt',
    text: 'Verwerk geplakte tekst',
    onClick: () => {
      const txt = pasteArea.value.trim();
      if (!txt) return;
      const parsed = parsePlainTextReceipt(txt);
      mutate(() => {
        session.items = parsed.items;
        session.unparsedLines = parsed.unparsedLines;
        // Punt B5 (v10): het plakvak gaf de twijfelkandidaten niet door aan de sessie,
        // waardoor de keuze-UI alleen bij scanroutes verscheen.
        session.ambiguousCandidates = parsed.ambiguousCandidates || [];
        session.rawText = txt;
        session.receiptTotalCents = parsed.receiptTotalCents;
        session.receiptTotalSource = parsed.receiptTotalCents !== null ? 'live_text' : null;
        // Punt N1 (v11): fooi en erbovenop-getelde btw van de bon bewaren voor de afronding
        session.receiptTipCents = parsed.tipCents || 0;
        session.receiptVatAddedCents = parsed.taxMode === 'vat_added' ? parsed.vatCents || 0 : 0;
      }, 'Geplakte tekst verwerkt. Controleer de regels en het totaal.');
    }
  });
  pasteDetails.appendChild(pasteArea);
  pasteDetails.appendChild(pasteBtn);
  container.appendChild(pasteDetails);

  container.appendChild(el('div', { id: 'scan-status', className: 'status-box info', hidden: true, 'aria-live': 'polite' }));

  // Vertaalknop naar het Nederlands (kerneis, bewuste actie, alleen tekstregels)
  if (session.items.length > 0) {
    const transBox = el('div', { className: 'action-row' });
    const transFeedback = el('div', { id: 'translate-status', className: 'status-box info', hidden: true, 'aria-live': 'polite' });
    transBox.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-secondary btn-sm',
        disabled: !isOnlineAiUsable(settings),
        text: '🌐 Vertaal regels naar Nederlands (alleen tekst via Gemini)',
        onClick: async () => {
          transFeedback.hidden = false;
          transFeedback.className = 'status-box info';
          transFeedback.textContent = 'Regels worden naar het Nederlands vertaald…';
          try {
            const map = await translateItemsWithGemini(session.items, { callModel: callFirebaseAiModel });
            mutate(() => {
              session.items.forEach((it) => {
                if (map[it.id]) {
                  if (!it.originalDescription) it.originalDescription = it.description;
                  it.geminiTranslation = map[it.id];
                }
              });
            }, 'Nederlandse machinevertalingen toegevoegd. Controleer en pas aan waar nodig.');
          } catch (err) {
            transFeedback.className = 'status-box error';
            transFeedback.textContent = err?.message || 'Vertalen is mislukt.';
          }
        }
      })
    );
    container.appendChild(transBox);
    container.appendChild(transFeedback);
  }

  // Bij dubbele geldige som-combinaties: laat de gebruiker kiezen (nooit stil zelf kiezen)
  if (session.ambiguousCandidates && session.ambiguousCandidates.length > 1) {
    const ambCard = el('div', { className: 'status-box warn', role: 'alert' });
    ambCard.appendChild(
      el('p', {
        text: 'Meerdere combinaties kloppen met het bontotaal. Kies welke interpretatie bij deze bon hoort:'
      })
    );
    const btnRow = el('div', { className: 'action-row' });
    session.ambiguousCandidates.forEach((cand) => {
      btnRow.appendChild(
        el('button', {
          type: 'button',
          className: 'btn btn-sm btn-secondary',
          text: cand.label,
          onClick: () =>
            mutate(() => {
              session.items.forEach((it) => {
                if (cand.excludedSubtotalItemId && it.id === cand.excludedSubtotalItemId) {
                  it.excluded = true;
                  it.lineType = 'ignored';
                  it.probableSubtotal = true;
                }
                it.lowConfidence = false;
              });
              session.ambiguousCandidates = [];
            })
        })
      );
    });
    ambCard.appendChild(btnRow);
    container.appendChild(ambCard);
  }

  // Regels lijst
  const listWrap = el('div', { className: 'items-list' });
  session.items.forEach((item, idx) => {
    // v18: ongedaan-rij inline op de plek van de verwijderde regel (niet fixed onderaan)
    if (lastDeletedLine && lastDeletedLine.idx === idx) listWrap.appendChild(buildUndoRow(lang));
    const active = isLineActive(item);
    const lineCheck = validateLineItem(item);
    const trans = translateOffline(item.originalDescription || item.description, customDict);
    const needsReview =
      item.lowConfidence ||
      item.needsPriceConfirmation ||
      item.needsVatDecision ||
      item.needsDiscountConfirmation ||
      (active && lineCheck.mismatch);

    const cardClasses = ['item-card'];
    if (needsReview) cardClasses.push('needs-review');
    if (!active) cardClasses.push('is-vat');

    const card = el('div', { className: cardClasses.join(' ') });

    // v17: compacte kopregel (naam, aantal, regeltotaal) met klein kruisje rechts.
    // Eén tik op de rij klapt de volledige bewerker uit; twijfelregels staan standaard open.
    const expanded = isItemExpanded(item.id, {
      needsReview,
      expandedIds: expandedItemIds,
      collapsedIds: collapsedItemIds
    });
    const compact = compactRowModel(item, needsReview);
    const headRow = el('div', { className: 'item-head' });
    headRow.appendChild(
      el('button', {
        type: 'button',
        className: 'item-compact-row',
        'aria-expanded': expanded ? 'true' : 'false',
        'aria-label': `${compact.name} — ${t(lang, expanded ? 'collapseLine' : 'expandLine')}`,
        onClick: () => {
          toggleItemExpanded(item.id, {
            needsReview,
            expandedIds: expandedItemIds,
            collapsedIds: collapsedItemIds
          });
          render();
        }
      }, [
        el('span', { className: 'item-qty', text: `${compact.qty}×` }),
        el('span', { className: 'item-name', text: compact.name }),
        el('span', {
          className: 'item-total',
          text: compact.lineTotalCents !== null ? formatCentsNL(compact.lineTotalCents) : '—'
        }),
        el('span', { className: 'item-caret', text: expanded ? '▾' : '▸' })
      ])
    );
    headRow.appendChild(
      el('button', {
        type: 'button',
        className: 'item-delete-btn',
        text: '✕',
        'aria-label': `${t(lang, 'deleteLine')}: ${compact.name}`,
        onClick: () => {
          mutate(() => {
            const res = deleteItemAt(session.items, idx);
            if (res.deleted) {
              session.items = res.items;
              lastDeletedLine = res.deleted;
            }
          }, t(lang, 'undoBarLineRemoved'));
          hideUndoBarLater();
        }
      })
    );
    card.appendChild(headRow);

    // Uitklapdeel: alle details en bewerkvelden (alleen zichtbaar als de regel open staat)
    const body = el('div', { className: 'item-body' });

    // Badges
    const badges = el('div', { className: 'badge-row' });
    if (item.pageNumber && item.pageNumber > 1) {
      badges.appendChild(el('span', { className: 'badge badge-muted', text: `Pagina ${item.pageNumber}` }));
    }
    if (item.restoredDecimal) {
      badges.appendChild(el('span', { className: 'badge badge-warn', text: 'Herstelde komma — controleer bedrag' }));
    }
    if (item.probableSubtotal) {
      badges.appendChild(el('span', { className: 'badge badge-muted', text: 'Waarschijnlijk subtotaal (uit gerechtenlijst gehaald)' }));
    }
    if (item.lowConfidence) {
      badges.appendChild(el('span', { className: 'badge badge-warn', text: `⚠ ${t(lang, 'flagLowConf')}` }));
    }
    if (active && lineCheck.mismatch && !item.needsPriceConfirmation) {
      badges.appendChild(el('span', { className: 'badge badge-error', text: `⚠ ${t(lang, 'flagMismatch')}` }));
    }
    if (item.lineType === 'vat_summary' || item.isVatSummary) {
      badges.appendChild(el('span', { className: 'badge badge-muted', text: t(lang, 'flagVatSummary') }));
    } else if (item.lineType === 'ignored' || item.excluded) {
      badges.appendChild(el('span', { className: 'badge badge-muted', text: 'Genegeerd (telt niet mee)' }));
    } else if (item.lineType === 'discount') {
      badges.appendChild(el('span', { className: 'badge badge-info', text: 'Korting (negatief)' }));
    } else if (item.lineType === 'surcharge') {
      badges.appendChild(el('span', { className: 'badge badge-info', text: 'Extra heffing (telt mee)' }));
    }
    if (item.needsVatDecision) {
      badges.appendChild(el('span', { className: 'badge badge-warn', text: `❓ ${t(lang, 'flagVatUncertain')}` }));
    }
    if (!item.geminiTranslation && trans.translated && trans.text.toLowerCase() !== item.description.toLowerCase()) {
      badges.appendChild(el('span', { className: 'badge badge-info', text: `NL (woordenboek): ${trans.text}` }));
    }
    if (badges.childNodes.length > 0) body.appendChild(badges);

    // Origineel en Nederlandse machinevertaling naast elkaar (aanpasbaar, origineel blijft leidend)
    const grid = el('div', { className: 'item-edit-grid' });

    const descInput = el('input', {
      type: 'text',
      value: item.description,
      placeholder: t(lang, 'colDesc'),
      'aria-label': `Originele omschrijving ${idx + 1}`,
      className: 'field-desc'
    });
    descInput.addEventListener('change', (e) => {
      mutate(() => {
        item.description = e.target.value.trim();
        if (!item.originalDescription) item.originalDescription = item.description;
        item.lowConfidence = false;
      });
    });

    grid.appendChild(
      el('label', { className: 'field-wrap desc-wrap' }, [
        el('span', { text: 'Origineel op de bon' }),
        descInput
      ])
    );

    if (item.geminiTranslation) {
      const nlInput = el('input', {
        type: 'text',
        value: item.geminiTranslation,
        'aria-label': `Nederlandse machinevertaling ${idx + 1}`
      });
      nlInput.addEventListener('change', (e) => {
        mutate(() => {
          item.geminiTranslation = e.target.value.trim();
        });
      });
      grid.appendChild(
        el('label', { className: 'field-wrap desc-wrap' }, [
          el('span', { text: 'Nederlands (machinevertaling — aanpasbaar)' }),
          nlInput
        ])
      );
    }

    const qtyInput = el('input', {
      type: 'number',
      min: '1',
      step: '1',
      value: String(item.qty),
      'aria-label': `${t(lang, 'colQty')} ${idx + 1}`,
      className: 'field-qty'
    });
    qtyInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (Number.isInteger(val) && val > 0) {
        mutate(() => {
          item.qty = val;
          item.assignedQuantities = {};
        });
      }
    });

    const unitInput = el('input', {
      type: 'text',
      inputmode: 'decimal',
      value: Number.isInteger(item.unitPriceCents) ? (item.unitPriceCents / 100).toFixed(2).replace('.', ',') : '',
      'aria-label': `${t(lang, 'colUnit')} ${idx + 1}`,
      className: 'field-price'
    });
    unitInput.addEventListener('change', (e) => {
      const c = parseEuroToCents(e.target.value);
      if (c !== null) {
        mutate(() => {
          item.unitPriceCents = item.lineType === 'discount' ? -Math.abs(c) : c;
          if (item.qty === 1) item.lineTotalCents = item.unitPriceCents;
          item.lowConfidence = false;
          item.needsPriceConfirmation = false;
        });
      }
    });

    const totalInput = el('input', {
      type: 'text',
      inputmode: 'decimal',
      value: Number.isInteger(item.lineTotalCents) ? (item.lineTotalCents / 100).toFixed(2).replace('.', ',') : '',
      'aria-label': `${t(lang, 'colTotal')} ${idx + 1}`,
      className: 'field-price'
    });
    totalInput.addEventListener('change', (e) => {
      const c = parseEuroToCents(e.target.value);
      if (c !== null) {
        mutate(() => {
          item.lineTotalCents = item.lineType === 'discount' ? -Math.abs(c) : c;
          if (item.qty === 1) item.unitPriceCents = item.lineTotalCents;
          item.lowConfidence = false;
          item.needsPriceConfirmation = false;
        });
      }
    });

    const typeSelect = el('select', { 'aria-label': `Regeltype ${idx + 1}` }, [
      el('option', { value: 'item', selected: (item.lineType || 'item') === 'item', text: 'Consumptie (telt mee)' }),
      el('option', { value: 'discount', selected: item.lineType === 'discount', text: 'Korting (negatief, telt mee)' }),
      el('option', { value: 'surcharge', selected: item.lineType === 'surcharge', text: 'Extra heffing (telt mee)' }),
      el('option', { value: 'vat_summary', selected: item.lineType === 'vat_summary' || item.isVatSummary, text: 'Inbegrepen btw-info (telt niet mee)' }),
      el('option', { value: 'ignored', selected: item.lineType === 'ignored' || item.excluded, text: 'Genegeerde info (telt niet mee)' })
    ]);
    typeSelect.addEventListener('change', (e) => {
      mutate(() => applyLineType(item, e.target.value));
    });

    grid.appendChild(el('label', { className: 'field-wrap' }, [el('span', { text: t(lang, 'colQty') }), qtyInput]));
    grid.appendChild(el('label', { className: 'field-wrap' }, [el('span', { text: t(lang, 'colUnit') }), unitInput]));
    grid.appendChild(el('label', { className: 'field-wrap' }, [el('span', { text: t(lang, 'colTotal') }), totalInput]));
    grid.appendChild(el('label', { className: 'field-wrap desc-wrap' }, [el('span', { text: 'Regeltype' }), typeSelect]));
    body.appendChild(grid);

    const rowBtns = el('div', { className: 'item-row-actions' });
    if (item.lowConfidence && !item.needsPriceConfirmation) {
      rowBtns.appendChild(
        el('button', {
          type: 'button',
          className: 'btn btn-sm btn-primary',
          text: '✓ Gecontroleerd',
          onClick: () =>
            mutate(() => {
              item.lowConfidence = false;
            })
        })
      );
    }
    // Eén-tik-correctie (paragraaf 2): uit gerechtenlijst halen of weer terugzetten
    rowBtns.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        text: item.excluded ? '↩ Terugzetten als gerecht' : '⊘ Niet meetellen (geen gerecht)',
        onClick: () =>
          mutate(() => {
            item.excluded = !item.excluded;
            item.lineType = item.excluded ? 'ignored' : 'item';
            if (!item.excluded) item.probableSubtotal = false;
          })
      })
    );

    body.appendChild(rowBtns);
    if (expanded) card.appendChild(body);
    listWrap.appendChild(card);
  });
  if (lastDeletedLine && lastDeletedLine.idx >= session.items.length) {
    listWrap.appendChild(buildUndoRow(lang));
  }
  container.appendChild(listWrap);

  if (session.unparsedLines && session.unparsedLines.length > 0) {
    const details = el('details', { className: 'card' });
    details.appendChild(
      el('summary', {
        text: `Nog niet ingedeelde tekstregels (${session.unparsedLines.length}) — bekijk of voeg toe`
      })
    );
    session.unparsedLines.forEach((rawLine, rIdx) => {
      const row = el('div', { className: 'participant-row' }, [
        el('span', { text: `${rawLine.pageNumber > 1 ? `[p.${rawLine.pageNumber}] ` : ''}${rawLine.text}` }),
        el('button', {
          type: 'button',
          className: 'btn btn-sm btn-secondary',
          text: '+ Als regel',
          onClick: () =>
            mutate(() => {
              const newItem = createNewItem(false);
              newItem.description = rawLine.text;
              newItem.originalDescription = rawLine.text;
              session.items.push(newItem);
              session.unparsedLines.splice(rIdx, 1);
            })
        })
      ]);
      details.appendChild(row);
    });
    container.appendChild(details);
  }

  // Knoppen regel / korting toevoegen
  container.appendChild(
    el('div', { className: 'action-row' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: `+ ${t(lang, 'addLine')}`,
        onClick: () =>
          mutate(() => {
            session.items.push(createNewItem(false));
          })
      }),
      el('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: `− ${t(lang, 'addDiscount')}`,
        onClick: () =>
          mutate(() => {
            session.items.push(createNewItem(true));
          })
      })
    ])
  );

  // Totaalcontrole
  const totalCheck = validateReceiptTotal(session.items, session.receiptTotalCents, receiptExtrasFromSession());
  const totalBox = el('div', { className: 'total-check-card' });

  const totalInput = el('input', {
    type: 'text',
    inputmode: 'decimal',
    id: 'receipt-total-input',
    placeholder: t(lang, 'receiptTotalPlaceholder'),
    value:
      Number.isInteger(session.receiptTotalCents)
        ? (session.receiptTotalCents / 100).toFixed(2).replace('.', ',')
        : ''
  });
  totalInput.addEventListener('change', (e) => {
    const raw = e.target.value.trim();
    mutate(() => {
      if (raw === '') {
        session.receiptTotalCents = null;
        session.receiptTotalSource = null;
      } else {
        session.receiptTotalCents = parseEuroToCents(raw);
        session.receiptTotalSource = 'manual';
      }
    });
  });

  const sourceHint =
    session.receiptTotalSource === 'manual'
      ? ' (handmatig ingevoerd)'
      : session.receiptTotalSource === 'gemini'
        ? ' (uit bon gelezen door Gemini — controleer zelf)'
        : session.receiptTotalSource === 'pdf_text'
          ? ' (uit PDF-tekst gelezen)'
          : '';

  totalBox.appendChild(
    el('label', { for: 'receipt-total-input', className: 'field-wrap' }, [
      el('span', { text: `${t(lang, 'receiptTotalLabel')}${sourceHint}` }),
      totalInput
    ])
  );

  totalBox.appendChild(
    el('div', { className: 'summary-kv' }, [
      el('div', {}, [el('span', { text: t(lang, 'sumOfLines') }), el('strong', { text: formatCentsNL(totalCheck.itemsSumCents) })]),
      el('div', {}, [
        el('span', { text: t(lang, 'receiptTotal') }),
        el('strong', {
          text: totalCheck.receiptTotalCents !== null ? formatCentsNL(totalCheck.receiptTotalCents) : 'Ontbreekt'
        })
      ]),
      el('div', {}, [el('span', { text: t(lang, 'difference') }), el('strong', { text: formatCentsNL(totalCheck.diffCents) })])
    ])
  );

  if (totalCheck.missingReceiptTotal) {
    totalBox.appendChild(
      el('div', {
        className: 'status-box error',
        role: 'alert',
        text: 'Vul eerst het gecontroleerde totaalbedrag van de bon in. Zonder bontotaal kun je niet verder of afronden.'
      })
    );
  } else if (!totalCheck.matches) {
    totalBox.appendChild(
      el('div', {
        className: 'status-box error',
        role: 'alert',
        text: t(lang, 'totalMismatchWarning', { diff: formatCentsNL(totalCheck.diffCents) })
      })
    );
  } else if (session.items.length > 0) {
    totalBox.appendChild(el('div', { className: 'status-box success', text: `✓ ${t(lang, 'totalMatches')}` }));
  }

  if (totalCheck.mismatchItemIds.length > 0) {
    totalBox.appendChild(el('div', { className: 'status-box error', role: 'alert', text: t(lang, 'itemMismatchWarning') }));
  }
  if (totalCheck.uncertainVatItemIds.length > 0) {
    totalBox.appendChild(el('div', { className: 'status-box warn', role: 'alert', text: t(lang, 'vatUncertainWarning') }));
  }
  if (totalCheck.lowConfidenceItemIds.length > 0 || totalCheck.priceConfirmItemIds.length > 0) {
    totalBox.appendChild(
      el('div', {
        className: 'status-box warn',
        role: 'alert',
        text: 'Controleer en bevestig eerst alle gemarkeerde onzekere regels voordat je doorgaat.'
      })
    );
  }

  container.appendChild(totalBox);

  container.appendChild(
    el('div', { className: 'nav-row' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-primary btn-next',
        text: `${t(lang, 'next')} →`,
        disabled: !totalCheck.canProceed,
        onClick: () =>
          mutate(() => {
            session.step = 2;
          })
      })
    ])
  );
}

// ============================================================
// STAP 2: DEELNEMERS
// ============================================================
// v13: regel voor "betaalt niet mee" (te gast, jarig, andere reden)
function getHostedRule(pid) {
  if (!session.hosted) session.hosted = {};
  if (!session.hosted[pid]) {
    session.hosted[pid] = { enabled: false, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} };
  }
  return session.hosted[pid];
}

// Welke deelnemers mogen het deel overnemen: iedereen behalve de gast zelf en andere gasten.
function eligibleCarrierIds(guestId) {
  return session.participants
    .filter((q) => q.id !== guestId && !(session.hosted && session.hosted[q.id] && session.hosted[q.id].enabled))
    .map((q) => q.id);
}

// Gekozen dragers, of standaard "alle anderen" als er nog niets gekozen is.
function effectiveCarrierIds(rule, guestId) {
  const eligible = eligibleCarrierIds(guestId);
  if (Array.isArray(rule.carrierIds) && rule.carrierIds.length > 0) {
    return rule.carrierIds.filter((id) => eligible.includes(id));
  }
  return eligible;
}

// Ruim een verwijderde deelnemer ook op in de hosted-regels.
function cleanupHostedForRemoved(removedId) {
  if (!session.hosted) return;
  delete session.hosted[removedId];
  for (const key of Object.keys(session.hosted)) {
    const r = session.hosted[key];
    if (Array.isArray(r.carrierIds)) r.carrierIds = r.carrierIds.filter((id) => id !== removedId);
    if (r.percent) delete r.percent[removedId];
    if (r.fixedCents) delete r.fixedCents[removedId];
  }
}

function addParticipantByName(name) {
  // v20-fix (review): zelfde normalisatie als de bewaard-lijst (meerdere spaties, tab,
  // niet-brekende spatie), anders klopt de ✓-vergelijking niet en tik je een dubbele deelnemer erbij.
  const clean = normalizeSavedName(name);
  if (!clean) return;
  const cleanKey = clean.toLowerCase();
  if (session.participants.some((p) => normalizeSavedName(p.name).toLowerCase() === cleanKey)) return;
  mutate(() => {
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    session.participants.push({ id, name: clean, paidCashCents: null, settled: false });
    if (!session.activeParticipantId) session.activeParticipantId = id;
    savedNames = saveNameToHistory(clean);
  });
}

function renderStep2(container) {
  const lang = settings.lang;
  container.appendChild(el('h2', { text: t(lang, 'step2Title') }));
  container.appendChild(el('p', { className: 'help-text', text: t(lang, 'step2Help') }));

  const form = el('form', { className: 'inline-form' });
  const input = el('input', {
    type: 'text',
    placeholder: t(lang, 'participantPlaceholder'),
    'aria-label': t(lang, 'participantPlaceholder')
  });
  form.appendChild(input);
  form.appendChild(el('button', { type: 'submit', className: 'btn btn-primary', text: t(lang, 'addParticipant') }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addParticipantByName(input.value);
    input.value = '';
    input.focus();
  });
  container.appendChild(form);

  const chipList = el('div', { className: 'participant-list' });
  if (session.participants.length === 0) {
    chipList.appendChild(el('p', { className: 'muted', text: t(lang, 'noParticipants') }));
  } else {
    // v23 (verzoek Henk): één kleine Gast-schakelaar per deelnemer; de uitleg
    // staat één keer boven de lijst, niet bij elke rij
    chipList.appendChild(el('p', { className: 'help-text guest-help', text: t(lang, 'guestHelp') }));
    session.participants.forEach((p, idx) => {
      const isGast = Boolean(getHostedRule(p.id).enabled);
      chipList.appendChild(
        el('div', { className: 'participant-row' }, [
          el('strong', { className: 'participant-name', text: p.name }),
          el('button', {
            type: 'button',
            className: `chip-btn guest-toggle ${isGast ? 'active' : ''}`,
            'aria-pressed': String(isGast),
            'aria-label': `${t(lang, 'guestToggle')} ${p.name}`,
            text: `${isGast ? '✓ ' : ''}${t(lang, 'guestToggle')}`,
            onClick: () =>
              mutate(() => {
                getHostedRule(p.id).enabled = !isGast;
                // v25: een gast kan geen voorschietter zijn
                if (!isGast && session.paidById === p.id) session.paidById = null;
              })
          }),
          el('button', {
            type: 'button',
            className: 'btn btn-sm btn-danger-outline',
            'aria-label': `${t(lang, 'removeParticipant')} ${p.name}`,
            text: '✕',
            onClick: () => {
              // v23 (review): zonder toewijzingen direct wissen; met regels eerst
              // één korte bevestiging — een tik naast × mag nooit stilletjes
              // toewijzingen weggooien. Herstel kan altijd via Stap terug.
              const heeftRegels = session.items.some(
                (it) =>
                  (it.assignedTo || []).includes(p.id) ||
                  ((it.assignedQuantities || {})[p.id] || 0) > 0
              );
              if (heeftRegels && !window.confirm(t(lang, 'removeParticipantWithItems', { name: p.name }))) return;
              mutate(() => {
                session.participants.splice(idx, 1);
                session.items.forEach((it) => {
                  it.assignedTo = (it.assignedTo || []).filter((id) => id !== p.id);
                  if (it.assignedQuantities && p.id in it.assignedQuantities) {
                    delete it.assignedQuantities[p.id];
                  }
                });
                cleanupHostedForRemoved(p.id);
                // v25: de voorschietter is weg, dus de betaald-door-keuze ook
                if (session.paidById === p.id) session.paidById = null;
                if (session.activeParticipantId === p.id) {
                  session.activeParticipantId = session.participants[0]?.id || null;
                }
              });
            }
          })
        ])
      );
    });
  }
  container.appendChild(chipList);

  // v20: bewaarde namen als tik-chips (verzoek Henk). Alleen namen die nog niet
  // op deze bon staan; één tik voegt toe, daarna verdwijnt de chip.
  const unusedSaved = savedNames.filter(
    (n) => !session.participants.some((p) => normalizeSavedName(p.name).toLowerCase() === n.toLowerCase())
  );
  if (unusedSaved.length > 0) {
    container.appendChild(el('h3', { text: t(lang, 'savedNamesTitle') }));
    const savedWrap = el('div', { className: 'chip-wrap' });
    unusedSaved.forEach((n) => {
      savedWrap.appendChild(
        el('span', { className: 'saved-chip' }, [
          el('button', {
            type: 'button',
            className: 'chip-btn',
            text: `+ ${n}`,
            onClick: () => addParticipantByName(n)
          }),
          // klein kruisje: naam alleen uit de bewaarlijst halen (verzoek Henk),
          // zonder bevestiging; deelnemers van deze bon blijven staan
          el('button', {
            type: 'button',
            className: 'chip-remove',
            text: '×',
            'aria-label': `${t(lang, 'namesRemoveLabel')}: ${n}`,
            onClick: () => {
              savedNames = removeSavedName(n);
              render();
            }
          })
        ])
      );
    });
    container.appendChild(savedWrap);
  }

  container.appendChild(
    el('div', { className: 'nav-row' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: `← ${t(lang, 'back')}`,
        onClick: () => mutate(() => { session.step = 1; })
      }),
      el('button', {
        type: 'button',
        className: 'btn btn-primary btn-next',
        text: `${t(lang, 'next')} →`,
        disabled: session.participants.length === 0,
        onClick: () => mutate(() => { session.step = 3; })
      })
    ])
  );
}

// ============================================================
// STAP 3: VERDELEN
// ============================================================
// v27: stap 3 klapt volledig verdeelde regels in tot één regel. De regel waar je net op
// tikte blijft open (je wilt misschien nog met − / + schuiven); pas als je een andere
// regel aanraakt, klapt hij in. Alleen weergave: geen undo-stap, niet bewaard.
let lastEditedSplitId = null;
let splitScrollAnchor = null;

function renderStep3(container) {
  const lang = settings.lang;
  container.appendChild(el('h2', { text: t(lang, 'step3Title') }));
  container.appendChild(el('p', { className: 'help-text', text: t(lang, 'step3Help') }));

  if (session.participants.length === 0) {
    container.appendChild(el('div', { className: 'status-box warn', text: t(lang, 'noParticipants') }));
    return;
  }

  const activeItems = session.items.filter(isLineActive);
  const allIds = session.participants.map((p) => p.id);
  // v22 (verzoek Henk): korte, altijd eenduidige labels op de chips; volledige
  // naam blijft in aria-label, "Toegewezen aan:" en het overzicht
  const korteNamen = shortDisplayNames(session.participants);

  const isComplete = (item) => {
    const qm = item.assignedQuantities || {};
    const sum = Object.values(qm).reduce((s, q) => s + (Number.isInteger(q) ? q : 0), 0);
    return sum > 0 ? sum === item.qty : (item.assignedTo || []).length > 0;
  };
  const doneCount = activeItems.filter(isComplete).length;
  container.appendChild(
    el('div', { className: `split-progress ${doneCount === activeItems.length ? 'all-done' : ''}` }, [
      el('strong', {
        text: doneCount === activeItems.length
          ? t(lang, 'splitAllDone')
          : t(lang, 'splitProgress', { done: doneCount, total: activeItems.length })
      })
    ])
  );

  const list = el('div', { className: 'split-list' });
  activeItems.forEach((item) => {
    const assigned = item.assignedTo || [];
    const qtyMap = item.assignedQuantities || {};
    const assignedQtySum = Object.values(qtyMap).reduce((s, q) => s + (Number.isInteger(q) ? q : 0), 0);
    const usingQtyMode = assignedQtySum > 0;

    const labelText = item.geminiTranslation
      ? `${item.geminiTranslation} (${item.description})`
      : item.description;

    let assignedLabel;
    if (usingQtyMode) {
      const parts = session.participants
        .filter((p) => (qtyMap[p.id] || 0) > 0)
        .map((p) => `${p.name} (${qtyMap[p.id]}×)`);
      const rem = item.qty - assignedQtySum;
      assignedLabel = `${t(lang, 'assignedTo')} ${parts.join(', ')} — ${
        rem === 0 ? 'compleet' : rem > 0 ? `nog ${rem} van ${item.qty} open` : `${Math.abs(rem)} te veel!`
      }`;
    } else {
      const assignedNames = assigned
        .map((id) => session.participants.find((p) => p.id === id)?.name)
        .filter(Boolean);
      assignedLabel = assignedNames.length > 0 ? `${t(lang, 'assignedTo')} ${assignedNames.join(', ')}` : t(lang, 'nobodyYet');
    }

    const isUnassigned = !usingQtyMode && assigned.length === 0;
    const isQtyMismatch = usingQtyMode && assignedQtySum !== item.qty;
    const isAll = !usingQtyMode && allIds.length > 0 && allIds.every((id) => assigned.includes(id));

    // v22 (verzoek Henk): per regel namen aantikken i.p.v. per persoon de hele
    // lijst doorlopen. Tik op een naam = aan/uit; bij een aantallen-regel (3×)
    // telt een tik als 1 stuk en verdeel je met − n + verder. "Hele tafel"
    // verdeelt de regel gelijk over iedereen. Geen actieve persoon meer.
    const card = el('div', {
      className: `split-card ${isUnassigned || isQtyMismatch ? 'unassigned' : ''}`,
      'data-item-id': item.id
    });
    // onthoud welke kaart je aanraakt (en waar die op het scherm stond), vóór de knop zelf reageert
    card.addEventListener(
      'click',
      () => {
        lastEditedSplitId = item.id;
        splitScrollAnchor = { id: item.id, top: card.getBoundingClientRect().top };
      },
      true
    );

    if (isComplete(item) && lastEditedSplitId !== item.id) {
      const namen = usingQtyMode
        ? session.participants.filter((p) => (qtyMap[p.id] || 0) > 0).map((p) => `${korteNamen.get(p.id) || p.name}${item.qty > 1 ? ` ${qtyMap[p.id]}×` : ''}`)
        : isAll
          ? [t(lang, 'wholeTable')]
          : session.participants.filter((p) => assigned.includes(p.id)).map((p) => korteNamen.get(p.id) || p.name);
      card.classList.add('is-collapsed');
      card.appendChild(
        el('button', {
          type: 'button',
          className: 'split-collapsed',
          'aria-label': `${labelText}: ${namen.join(', ')}. ${t(lang, 'editLine')}`,
          onClick: () => render()
        }, [
          el('span', { className: 'split-collapsed-main' }, [
            el('span', { className: 'split-desc', text: `${item.qty > 1 ? `${item.qty}× ` : ''}${labelText || '—'}` }),
            el('span', { className: 'split-collapsed-names', text: `✓ ${namen.join(', ')}` })
          ]),
          el('strong', { className: 'split-price', text: formatCentsNL(item.lineTotalCents) })
        ])
      );
      list.appendChild(card);
      return;
    }

    card.appendChild(
      el('div', { className: 'split-card-top' }, [
        el('span', { className: 'split-desc', text: `${item.qty > 1 ? `${item.qty}× ` : ''}${labelText || '—'}` }),
        el('strong', { className: 'split-price', text: formatCentsNL(item.lineTotalCents) })
      ])
    );
    card.appendChild(el('div', { className: 'split-assigned-names', text: assignedLabel }));

    const quick = el('div', { className: 'assign-quick' });
    quick.appendChild(
      el('button', {
        type: 'button',
        className: `btn btn-sm ${isAll ? 'btn-primary' : 'btn-secondary'}`,
        'aria-pressed': String(isAll),
        text: t(lang, 'wholeTable'),
        onClick: () =>
          mutate(() => {
            item.assignedQuantities = {};
            item.assignedTo = isAll ? [] : [...allIds];
          })
      })
    );
    // v27: geen aparte "Niemand"-knop meer: een naam nog eens aantikken haalt hem weg,
    // en "Hele tafel" nog eens aantikken maakt de regel leeg.
    card.appendChild(quick);

    const chips = el('div', { className: 'chip-wrap' });
    session.participants.forEach((p) => {
      const on = item.qty > 1 ? (qtyMap[p.id] || 0) > 0 : assigned.includes(p.id);
      chips.appendChild(
        el('button', {
          type: 'button',
          className: `chip-btn chip-assign ${on ? 'active' : ''}`,
          'aria-pressed': String(on),
          'aria-label': p.name,
          title: p.name,
          text: `${on ? '✓ ' : ''}${korteNamen.get(p.id) || p.name}`,
          onClick: () =>
            mutate(() => {
              if (item.qty > 1) {
                if (!item.assignedQuantities) item.assignedQuantities = {};
                if ((item.assignedQuantities[p.id] || 0) > 0) {
                  delete item.assignedQuantities[p.id];
                } else {
                  // van gelijk-verdeeld ("Hele tafel") naar stuksmodus: begin bij deze persoon
                  if (assigned.length > 0) item.assignedTo = [];
                  item.assignedQuantities[p.id] = 1;
                }
              } else {
                item.assignedQuantities = {};
                item.assignedTo = assigned.includes(p.id)
                  ? assigned.filter((x) => x !== p.id)
                  : [...assigned, p.id];
              }
            })
        })
      );
    });
    card.appendChild(chips);

    if (item.qty > 1 && usingQtyMode) {
      const remaining = item.qty - assignedQtySum;
      const qtyRow = el('div', { className: 'assign-qty-row' });
      session.participants
        .filter((p) => (qtyMap[p.id] || 0) > 0)
        .forEach((p) => {
          const myQty = qtyMap[p.id];
          qtyRow.appendChild(el('span', { className: 'qty-label', text: `${p.name}:` }));
          qtyRow.appendChild(
            el('button', {
              type: 'button',
              className: 'btn btn-sm btn-secondary',
              'aria-label': `1 stuk minder voor ${p.name}`,
              text: '−',
              onClick: () =>
                mutate(() => {
                  const next = Math.max(0, (item.assignedQuantities[p.id] || 0) - 1);
                  if (next === 0) delete item.assignedQuantities[p.id];
                  else item.assignedQuantities[p.id] = next;
                })
            })
          );
          qtyRow.appendChild(el('strong', { className: 'qty-val', text: String(myQty) }));
          qtyRow.appendChild(
            el('button', {
              type: 'button',
              className: 'btn btn-sm btn-secondary',
              disabled: remaining <= 0,
              'aria-label': `1 stuk meer voor ${p.name}`,
              text: '+',
              onClick: () =>
                mutate(() => {
                  item.assignedQuantities[p.id] = (item.assignedQuantities[p.id] || 0) + 1;
                })
            })
          );
        });
      card.appendChild(qtyRow);
    }

    list.appendChild(card);
  });
  container.appendChild(list);

  // Inklappen van een kaart boven de aangetikte kaart mag de pagina niet onder je vinger
  // laten verspringen: zet de aangetikte kaart terug op dezelfde plek in beeld.
  if (splitScrollAnchor) {
    const anchor = splitScrollAnchor;
    splitScrollAnchor = null;
    requestAnimationFrame(() => {
      const now = document.querySelector(`.split-card[data-item-id="${CSS.escape(anchor.id)}"]`);
      if (now) window.scrollBy(0, now.getBoundingClientRect().top - anchor.top);
    });
  }

  container.appendChild(
    el('div', { className: 'nav-row' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: `← ${t(lang, 'back')}`,
        onClick: () => mutate(() => { session.step = 2; })
      }),
      el('button', {
        type: 'button',
        className: 'btn btn-primary btn-next',
        text: `${t(lang, 'next')} →`,
        onClick: () => mutate(() => { session.step = 4; })
      })
    ])
  );
}

// ============================================================
// STAP 4: OVERZICHT, FOOI, CONTANT & DELEN
// ============================================================
function buildShareMessage(personRow) {
  const lang = settings.lang;
  // v13: gast krijgt een eigen bericht (niets te betalen, deel is overgenomen)
  if (personRow.hosted) {
    return t(lang, 'shareMessageHostedGuest', {
      name: personRow.name,
      amount: formatCentsNL(personRow.hostedAmountCents)
    });
  }
  const tipPart =
    personRow.tipCents > 0
      ? t(lang, 'shareTipPart', { tip: formatCentsNL(personRow.tipCents) })
      : '';
  const receiptExtraPart =
    personRow.receiptExtraCents > 0
      ? t(lang, 'shareReceiptExtraPart', { extra: formatCentsNL(personRow.receiptExtraCents) })
      : '';
  // v13: wie voor een gast bijbetaalt, ziet dat in zijn eigen bericht
  let carriedPart = '';
  if (Array.isArray(personRow.carries) && personRow.carries.length > 0) {
    const carriedSum = personRow.carries.reduce((sum, c) => sum + c.cents, 0);
    const names = personRow.carries.map((c) => c.guestName).join(' & ');
    carriedPart = t(lang, 'shareCarriedPart', { amount: formatCentsNL(carriedSum), names });
  }
  const base = t(lang, 'shareMessageTemplate', {
    name: personRow.name,
    total: formatCentsNL(personRow.totalCents),
    subtotal: formatCentsNL(personRow.subtotalCents),
    tipPart: tipPart + receiptExtraPart + carriedPart
  });
  // v25: bij "Betaald door" hoort in de deeltekst aan wie er betaald wordt
  if (session.paidById && personRow.id !== session.paidById) {
    const payerObj = session.participants.find((p) => p.id === session.paidById);
    if (payerObj) return `${base} ${t(lang, 'sharePayLine', { name: payerObj.name })}`;
  }
  return base;
}

// v13: instelkaart per gast in stap 4 (dragers + aandeel per drager)
function renderHostedCard(container, guest, result) {
  const lang = settings.lang;
  const rule = getHostedRule(guest.id);
  const summary = (result.hostedSummaries || []).find((h) => h.guestId === guest.id);
  // Bij een fout (bijv. vast bedrag klopt niet) is er geen overname-samenvatting;
  // toon dan het echte deel van de gast, niet 0,00.
  const guestRow = (result.perPerson || []).find((r) => r.id === guest.id);
  const amountCents = summary ? summary.amountCents : guestRow ? guestRow.totalCents : 0;
  const carriers = effectiveCarrierIds(rule, guest.id);

  const card = el('section', { className: 'card hosted-card' });
  card.appendChild(el('h3', { text: t(lang, 'hostedCardTitle', { name: guest.name }) }));
  card.appendChild(
    el('p', { className: 'help-text', text: t(lang, 'hostedShareOf', { name: guest.name, amount: formatCentsNL(amountCents) }) })
  );

  card.appendChild(el('p', { className: 'section-label', text: t(lang, 'hostedCarriersLabel') }));
  const carrierWrap = el('div', { className: 'chip-wrap' });
  for (const q of session.participants) {
    if (q.id === guest.id) continue;
    const alsoHosted = Boolean(session.hosted && session.hosted[q.id] && session.hosted[q.id].enabled);
    const active = carriers.includes(q.id);
    carrierWrap.appendChild(
      el('button', {
        type: 'button',
        className: `chip-btn ${active ? 'active' : ''}`,
        disabled: alsoHosted,
        text: q.name,
        onClick: () =>
          mutate(() => {
            const r = getHostedRule(guest.id);
            const current = effectiveCarrierIds(r, guest.id);
            r.carrierIds = current.includes(q.id)
              ? current.filter((id) => id !== q.id)
              : [...current, q.id];
          })
      })
    );
  }
  card.appendChild(carrierWrap);

  const modeWrap = el('div', { className: 'chip-wrap', role: 'radiogroup' });
  [
    ['equal', t(lang, 'hostedModeEqual')],
    ['percent', t(lang, 'hostedModePercent')],
    ['fixed', t(lang, 'hostedModeFixed')]
  ].forEach(([mode, label]) => {
    const active = (rule.mode || 'equal') === mode;
    modeWrap.appendChild(
      el('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': String(active),
        className: `chip-btn ${active ? 'active' : ''}`,
        text: label,
        onClick: () => mutate(() => { getHostedRule(guest.id).mode = mode; })
      })
    );
  });
  card.appendChild(modeWrap);

  if ((rule.mode || 'equal') === 'percent') {
    for (const cid of carriers) {
      const person = session.participants.find((q) => q.id === cid);
      if (!person) continue;
      const pctInput = el('input', {
        type: 'text',
        inputmode: 'decimal',
        placeholder: 'bijv. 50',
        value: Number.isFinite(Number(rule.percent[cid])) && rule.percent[cid] !== undefined && rule.percent[cid] !== null
          ? String(rule.percent[cid]).replace('.', ',')
          : ''
      });
      pctInput.addEventListener('change', (e) => {
        const raw = e.target.value.trim();
        const v = raw === '' ? NaN : Number(raw.replace(',', '.'));
        mutate(() => {
          const r = getHostedRule(guest.id);
          if (Number.isFinite(v) && v >= 0) r.percent[cid] = v;
          else delete r.percent[cid];
        });
      });
      card.appendChild(
        el('label', { className: 'field-wrap inline-field' }, [
          el('span', { text: `${person.name}: ${t(lang, 'hostedPercentLabel')}` }),
          pctInput
        ])
      );
    }
  } else if ((rule.mode || 'equal') === 'fixed') {
    for (const cid of carriers) {
      const person = session.participants.find((q) => q.id === cid);
      if (!person) continue;
      const fixedInput = el('input', {
        type: 'text',
        inputmode: 'decimal',
        placeholder: '0,00',
        value: Number.isInteger(rule.fixedCents[cid])
          ? (rule.fixedCents[cid] / 100).toFixed(2).replace('.', ',')
          : ''
      });
      fixedInput.addEventListener('change', (e) => {
        const raw = e.target.value.trim();
        const c = raw === '' ? null : parseEuroToCents(raw);
        mutate(() => {
          const r = getHostedRule(guest.id);
          if (Number.isInteger(c) && c >= 0) r.fixedCents[cid] = c;
          else delete r.fixedCents[cid];
        });
      });
      card.appendChild(
        el('label', { className: 'field-wrap inline-field' }, [
          el('span', { text: `${person.name}: ${t(lang, 'hostedFixedLabel')}` }),
          fixedInput
        ])
      );
    }
  }

  for (const err of (result.hostedErrors || []).filter((e) => e.guestId === guest.id)) {
    let msg;
    if (err.code === 'no_carriers') msg = t(lang, 'hostedErrorNoCarriers', { name: err.guestName });
    else if (err.code === 'percent_invalid') msg = t(lang, 'hostedErrorPercentInvalid');
    else if (err.code === 'percent_sum') msg = t(lang, 'hostedErrorPercentSum', { name: err.guestName, sum: String(err.percentSum).replace('.', ',') });
    else if (err.code === 'fixed_invalid') msg = t(lang, 'hostedErrorFixedInvalid');
    else if (err.code === 'fixed_sum') {
      msg = t(lang, 'hostedErrorFixedSum', {
        name: err.guestName,
        expected: formatCentsNL(err.expectedCents),
        actual: formatCentsNL(err.actualCents)
      });
    }
    if (msg) card.appendChild(el('div', { className: 'status-box error', role: 'alert', text: msg }));
  }

  container.appendChild(card);
}

// Open/dicht van het blok "Fooi, gast of één betaalt" zoals de gebruiker het koos (null = automatisch).
let step4SettingsOpenPref = null;

// Welke personen in stap 4 opengeklapt staan (alleen weergave; geen undo-stap, niet bewaard).
const openPersonDetails = new Set();

function renderStep4(container) {
  const lang = settings.lang;
  const result = calculateSettlement(session);

  container.appendChild(el('h2', { text: t(lang, 'step4Title') }));

  if (!result.canFinalize) {
    container.appendChild(
      el('div', { className: 'status-box error', role: 'alert', text: t(lang, 'cannotFinalizeBanner') })
    );
  }
  if (result.unassignedItems.length > 0) {
    container.appendChild(
      el('div', {
        className: 'status-box warn',
        role: 'alert',
        text: t(lang, 'unassignedWarning', { count: result.unassignedItems.length })
      })
    );
  }
  if (result.quantityMismatchItems.length > 0) {
    container.appendChild(
      el('div', {
        className: 'status-box warn',
        role: 'alert',
        text: `Bij ${result.quantityMismatchItems.length} regel(s) zijn nog niet alle aantallen exact toegewezen.`
      })
    );
  }

  // v27: fooi, "wie betaalt" en gasten zitten samen in één uitklapblok ONDER de uitslag.
  // Meestal is het "geen fooi, iedereen zelf"; dan zie je meteen de bedragen. Is er iets
  // ingesteld, dan staat het blok open (tenzij de gebruiker het zelf dichtklapte).
  const isGastVoorBlok = (pid) => Boolean(session.hosted && session.hosted[pid] && session.hosted[pid].enabled);
  const heeftGast = session.participants.some((p) => isGastVoorBlok(p.id));
  const heeftBetaler = Boolean(session.paidById && session.participants.some((p) => p.id === session.paidById && !isGastVoorBlok(p.id)));
  const ietsIngesteld = session.tipMode !== 'none' || heeftBetaler || heeftGast;
  const settingsWrap = el('details', { className: 'step4-settings' });
  settingsWrap.open = step4SettingsOpenPref ?? ietsIngesteld;
  settingsWrap.addEventListener('toggle', () => { step4SettingsOpenPref = settingsWrap.open; });
  const samenvatting = [
    session.tipMode === 'none' ? t(lang, 'tipNone') : session.tipMode === 'per_person' ? t(lang, 'tipPerPerson') : t(lang, 'tipTargetShort'),
    heeftBetaler ? t(lang, 'paidByOneShort') : t(lang, 'paidBySelf'),
    ...(heeftGast ? [t(lang, 'guestShort')] : [])
  ].join(' · ');
  settingsWrap.appendChild(
    el('summary', {}, [
      el('span', { className: 'step4-settings-title', text: t(lang, 'step4SettingsTitle') }),
      el('span', { className: 'step4-settings-sum', text: samenvatting })
    ])
  );

  const tipCard = el('section', { className: 'card' });
  tipCard.appendChild(el('h3', { text: t(lang, 'tipSectionTitle') }));

  const modeGroup = el('div', { className: 'radio-row', role: 'radiogroup', 'aria-label': t(lang, 'tipSectionTitle') });
  [
    ['none', t(lang, 'tipNone')],
    ['per_person', t(lang, 'tipPerPerson')],
    ['target_total', t(lang, 'tipTargetTotal')]
  ].forEach(([mode, label]) => {
    const active = session.tipMode === mode;
    modeGroup.appendChild(
      el('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': String(active),
        className: `chip-btn ${active ? 'active' : ''}`,
        text: label,
        onClick: () => mutate(() => { session.tipMode = mode; })
      })
    );
  });
  tipCard.appendChild(modeGroup);

  if (session.tipMode === 'target_total') {
    const targetInput = el('input', {
      type: 'text',
      inputmode: 'decimal',
      id: 'target-total-input',
      placeholder: t(lang, 'targetTotalPlaceholder'),
      value:
        Number.isInteger(session.targetTotalCents)
          ? (session.targetTotalCents / 100).toFixed(2).replace('.', ',')
          : ''
    });
    targetInput.addEventListener('change', (e) => {
      const raw = e.target.value.trim();
      mutate(() => {
        session.targetTotalCents = raw === '' ? null : parseEuroToCents(raw);
      });
    });
    tipCard.appendChild(
      el('label', { for: 'target-total-input', className: 'field-wrap' }, [
        el('span', { text: t(lang, 'targetTotalLabel') }),
        targetInput
      ])
    );

    const zeroCheckbox = el('input', {
      type: 'checkbox',
      id: 'tip-include-zero',
      checked: Boolean(session.includeZeroConsumersInSharedTip)
    });
    zeroCheckbox.addEventListener('change', (e) => {
      mutate(() => { session.includeZeroConsumersInSharedTip = e.target.checked; });
    });
    tipCard.appendChild(
      el('label', { for: 'tip-include-zero', className: 'checkbox-row' }, [
        zeroCheckbox,
        el('span', { text: t(lang, 'tipIncludeZeroLabel') })
      ])
    );

    if (result.tipError === 'target_below_bill') {
      tipCard.appendChild(
        el('div', {
          className: 'status-box error',
          role: 'alert',
          text: t(lang, 'targetBelowBillError', {
            target: formatCentsNL(session.targetTotalCents),
            bill: formatCentsNL(result.billTotalCents)
          })
        })
      );
    } else if (result.totalTipCents > 0) {
      const tippedCount = result.perPerson.filter((p) => p.tipCents > 0).length;
      const heeftExtraFooi = result.perPerson.some((p) => p.excessTipCents > 0);
      tipCard.appendChild(
        el('p', {
          className: 'tip-note',
          // v24/v25 (review): komt er bij iemand nog een meerdere-fooi bovenop,
          // dan is "eerlijk verdeeld" niet meer accuraat -> neutrale tekst
          text: heeftExtraFooi
            ? t(lang, 'tipSummaryTargetNeutral', { tip: formatCentsNL(result.totalTipCents) })
            : t(lang, 'tipSummaryTarget', {
                tip: formatCentsNL(result.totalTipCents),
                count: tippedCount
              })
        })
      );
    }
  } else if (session.tipMode === 'per_person') {
    tipCard.appendChild(
      el('p', {
        className: 'tip-note',
        text: t(lang, 'tipSummaryPerPerson', { tip: formatCentsNL(result.totalTipCents) })
      })
    );
  }
  settingsWrap.appendChild(tipCard);

  // v25 (verzoek Henk): "Betaald door" — één deelnemer heeft de hele bon
  // voorgeschoten; de rest rekent met hem/haar af. Presentatielaag: de
  // verdeling (kern) verandert niet. Een gast kan geen voorschietter zijn.
  const isGast = (pid) => Boolean(session.hosted && session.hosted[pid] && session.hosted[pid].enabled);
  const payer = session.paidById
    ? session.participants.find((p) => p.id === session.paidById && !isGast(p.id)) || null
    : null;
  const payerCard = el('section', { className: 'card' });
  payerCard.appendChild(el('h3', { text: t(lang, 'paidByLabel') }));
  const payerGroup = el('div', { className: 'radio-row', role: 'radiogroup', 'aria-label': t(lang, 'paidByLabel') });
  [[null, t(lang, 'paidBySelf')], ...session.participants.filter((p) => !isGast(p.id)).map((p) => [p.id, p.name])].forEach(([pid, label]) => {
    const active = pid === null ? !payer : Boolean(payer && pid === payer.id);
    payerGroup.appendChild(
      el('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': String(active),
        className: `chip-btn paidby-toggle ${active ? 'active' : ''}`,
        text: `${active ? '✓ ' : ''}${label}`,
        onClick: () => mutate(() => {
          session.paidById = pid;
          // v25 (review): een eerder ingevuld contant bedrag of Fooi-keuze (v24)
          // mag niet onzichtbaar meetellen zodra iemand de bon voorschiet — de
          // velden verdwijnen uit beeld, dus de waarden moeten ook echt weg.
          // Terug naar "Iedereen zelf" begint daarom leeg.
          if (pid !== null) {
            for (const pp of session.participants) {
              pp.paidCashCents = null;
              pp.excessAsTip = false;
            }
          }
        })
      })
    );
  });
  payerCard.appendChild(payerGroup);
  settingsWrap.appendChild(payerCard);

  // v13: per gast een instelkaart (wie neemt over, welk aandeel)
  session.participants
    .filter((p) => session.hosted && session.hosted[p.id] && session.hosted[p.id].enabled)
    .forEach((guest) => renderHostedCard(settingsWrap, guest, result));

  // v27: zonder fooi alleen "Totaal"; met fooi bon, fooi en totaal
  container.appendChild(
    el('div', { className: 'summary-kv total-check-card' },
      result.totalTipCents > 0
        ? [
            el('div', {}, [el('span', { text: t(lang, 'billTotalLabel') }), el('strong', { text: formatCentsNL(result.billTotalCents) })]),
            el('div', {}, [el('span', { text: t(lang, 'totalTipLabel') }), el('strong', { text: formatCentsNL(result.totalTipCents) })]),
            el('div', { className: 'grand-row' }, [
              el('span', { text: t(lang, 'totalWithTipLabel') }),
              el('strong', { text: formatCentsNL(result.grandTotalCents) })
            ])
          ]
        : [
            el('div', { className: 'grand-row only' }, [
              el('span', { text: t(lang, 'totalLabelShort') }),
              el('strong', { text: formatCentsNL(result.grandTotalCents) })
            ])
          ]
    )
  );

  // Deelknoppen (punt 6, v8): de uitslag als korte tekst via het deelmenu van het toestel,
  // en een aparte knop voor de bonfoto. Geen waarschuwingen, geen contactenkoppeling.
  const settlementText = buildSettlementShareText(result, t(lang, 'totalWord'));
  const resultShareRow = el('div', { className: 'share-row' });
  const resultShareFeedback = el('span', { className: 'muted', 'aria-live': 'polite' });
  resultShareRow.appendChild(
    el('button', {
      type: 'button',
      className: 'btn btn-primary btn-share-all',
      disabled: !result.canFinalize || !settlementText,
      text: t(lang, 'shareResult'),
      onClick: async () => {
        if (navigator.share) {
          try { await navigator.share({ title: t(lang, 'emailSubject'), text: settlementText }); } catch {}
        } else {
          const copied = await copyTextReliable(settlementText);
          // Punt 7 (v9): bij mislukken ALTIJD een zichtbare melding, nooit stil falen
          resultShareFeedback.textContent = copied ? t(lang, 'shareResultCopied') : t(lang, 'clipboardFailed');
          announce(resultShareFeedback.textContent);
        }
      }
    })
  );
  if (
    lastReceiptFile &&
    typeof lastReceiptFile.type === 'string' &&
    lastReceiptFile.type.startsWith('image/') &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [lastReceiptFile] })
  ) {
    resultShareRow.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        text: `\ud83d\udcf7 ${t(lang, 'shareReceiptPhoto')}`,
        onClick: async () => {
          try { await navigator.share({ files: [lastReceiptFile] }); } catch {}
        }
      })
    );
  }

  // Voortgang bovenaan de lijst: wie heeft al betaald en hoeveel staat nog open.
  {
    const payers = result.perPerson.filter((r) => r.totalCents > 0);
    const paidCount = payers.filter((r) => r.settled).length;
    const openCents = payers.filter((r) => !r.settled).reduce((sum, r) => sum + r.totalCents, 0);
    const pct = payers.length ? Math.round((100 * paidCount) / payers.length) : 0;
    const bar = el('div', { className: 'pay-progress-bar' }, [el('span', { style: `width:${pct}%` })]);
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(payers.length));
    bar.setAttribute('aria-valuenow', String(paidCount));
    bar.setAttribute('aria-label', t(lang, 'paidProgress', { paid: paidCount, total: payers.length }));
    container.appendChild(
      el('div', { className: `pay-progress ${payers.length && paidCount === payers.length ? 'all-paid' : ''}` }, [
        el('div', { className: 'pay-progress-text' }, [
          el('strong', { text: t(lang, 'paidProgress', { paid: paidCount, total: payers.length }) }),
          el('span', { text: openCents > 0 ? t(lang, 'openAmount', { amount: formatCentsNL(openCents) }) : t(lang, 'allPaid') })
        ]),
        bar
      ])
    );
  }

  // v27: een gast betaalt niets; geen regel met vinkje in de betaallijst, maar één zin onder de lijst
  const gastRegels = [];
  result.perPerson.forEach((row) => {
    if (row.hosted) {
      const summary = (result.hostedSummaries || []).find((h) => h.guestId === row.id);
      const namen = summary && summary.shares.length > 0 ? summary.shares.map((sh) => sh.name) : [];
      const lijst = namen.length > 1 ? `${namen.slice(0, -1).join(', ')} ${t(lang, 'andWord')} ${namen[namen.length - 1]}` : namen[0] || '';
      gastRegels.push(
        namen.length > 0
          ? t(lang, 'guestCoveredLine', { name: row.name, amount: formatCentsNL(row.hostedAmountCents), names: lijst })
          : t(lang, 'guestOpenLine', { name: row.name })
      );
      return;
    }
    const participantObj = session.participants.find((p) => p.id === row.id);
    // Compacte regel (altijd zichtbaar): vinkje betaald, naam, bedrag, status en een knop
    // die de betaaldetails en deelknoppen opent. De details zelf zijn ongewijzigd.
    const card = el('article', { className: `person-summary-card ${row.settled ? 'is-settled' : ''}` });
    const detailsId = `person-details-${row.id}`;
    const isOpen = openPersonDetails.has(row.id);
    const details = el('div', { className: 'person-details', id: detailsId });
    details.hidden = !isOpen;
    const statusEl = el('span', { className: 'person-status' });

    details.appendChild(
      el('div', { className: 'person-breakdown' }, [
        el('span', { text: `${t(lang, 'subtotalLabel')}: ${formatCentsNL(row.subtotalCents)}` }),
        el('span', { text: `${t(lang, 'tipLabel')}: ${formatCentsNL(row.tipCents)}` }),
        ...(row.receiptExtraCents > 0
          ? [el('span', { text: `${t(lang, 'receiptExtraLabel')}: ${formatCentsNL(row.receiptExtraCents)}` })]
          : [])
      ])
    );

    // v13: gast ziet wie zijn/haar deel overneemt (incl. zichtbare restcenten)
    if (row.hosted) {
      const summary = (result.hostedSummaries || []).find((h) => h.guestId === row.id);
      const covered = el('div', { className: 'hosted-info' });
      covered.appendChild(
        el('p', { text: t(lang, 'hostedGuestLine', { amount: formatCentsNL(row.hostedAmountCents) }) })
      );
      if (summary && summary.shares.length > 0) {
        covered.appendChild(
          el('p', {
            className: 'muted',
            text: summary.shares
              .map(
                (sh) =>
                  `${sh.name} ${formatCentsNL(sh.cents)}` +
                  (sh.remainderCents > 0
                    ? t(lang, 'hostedRemainderPart', { cents: formatCentsNL(sh.remainderCents) })
                    : '')
              )
              .join(' \u00b7 ')
          })
        );
      }
      details.appendChild(covered);
    }

    // v13: drager ziet wat hij/zij voor gasten heeft overgenomen (incl. restcenten)
    if (Array.isArray(row.carries) && row.carries.length > 0) {
      const carried = el('div', { className: 'hosted-info' });
      for (const c of row.carries) {
        carried.appendChild(
          el('p', {
            text:
              t(lang, 'hostedCarrierLine', { name: c.guestName, amount: formatCentsNL(c.cents) }) +
              (c.remainderCents > 0 ? t(lang, 'hostedRemainderPart', { cents: formatCentsNL(c.remainderCents) }) : '')
          })
        );
      }
      details.appendChild(carried);
    }

    if (session.tipMode === 'per_person') {
      const tipInput = el('input', {
        type: 'text',
        inputmode: 'decimal',
        placeholder: '0,00',
        value:
          Number.isInteger(session.tipPerPersonCents[row.id])
            ? (session.tipPerPersonCents[row.id] / 100).toFixed(2).replace('.', ',')
            : ''
      });
      tipInput.addEventListener('change', (e) => {
        const raw = e.target.value.trim();
        const c = raw === '' ? 0 : parseEuroToCents(raw);
        if (c !== null && c >= 0) {
          mutate(() => { session.tipPerPersonCents[row.id] = c; });
        }
      });
      details.appendChild(
        el('label', { className: 'field-wrap inline-field' }, [
          el('span', { text: `${t(lang, 'tipLabel')} (€)` }),
          tipInput
        ])
      );
    }

    // v25: in de betaald-door-stand is er geen contante afrekening in de app —
    // de rest rekent af met de voorschietter. Contantveld en fooi/retour-keuze
    // vallen weg; in de plaats komt één duidelijke regel.
    if (payer && row.id !== payer.id && !row.hosted) {
      details.appendChild(
        el('div', {
          className: 'change-info ok pay-to-info',
          text: t(lang, 'payToLine', { name: payer.name, amount: formatCentsNL(row.totalCents) })
        })
      );
    }
    if (payer && row.id === payer.id) {
      details.appendChild(
        el('div', {
          className: 'change-info ok pay-to-info',
          text: t(lang, 'payerOwed', { amount: formatCentsNL(payerOutstandingCents(result.perPerson, session.participants, payer.id)) })
        })
      );
    }
    const cashInput = el('input', {
      type: 'text',
      inputmode: 'decimal',
      placeholder: t(lang, 'cashPaidPlaceholder'),
      value:
        Number.isInteger(participantObj.paidCashCents)
          ? (participantObj.paidCashCents / 100).toFixed(2).replace('.', ',')
          : ''
    });
    cashInput.addEventListener('change', (e) => {
      const raw = e.target.value.trim();
      mutate(() => {
        participantObj.paidCashCents = raw === '' ? null : parseEuroToCents(raw);
        // v24 (review): de Fooi-keuze mag niet stiekem blijven hangen. Zakt het
        // bedrag tot onder zijn deel (of wordt het gewist), dan gaat de vlag uit;
        // stijgt het daarna weer, dan verschijnt de keuze opnieuw met Retour aan.
        const deelZonderFooi = row.totalCents - (row.excessTipCents || 0);
        if (
          participantObj.excessAsTip &&
          (!Number.isInteger(participantObj.paidCashCents) || participantObj.paidCashCents <= deelZonderFooi)
        ) {
          participantObj.excessAsTip = false;
        }
      });
    });
    if (!payer) {
      details.appendChild(
        el('label', { className: 'field-wrap inline-field' }, [
          el('span', { text: t(lang, 'cashPaidLabel') }),
          cashInput
        ])
      );
    }

    // v24 (verzoek Henk): is het contante bedrag hoger dan zijn deel, dan één
    // keuze met twee opties: Retour (standaard, huidig gedrag) of Fooi (het
    // meerdere wordt fooi, wisselgeld 0). Geen afrondknoppen.
    const meerdere = row.changeCents !== null && row.changeCents > 0 ? row.changeCents : (row.excessTipCents || 0);
    if (!payer && !row.hosted && meerdere > 0) {
      const alsFooi = Boolean(participantObj.excessAsTip);
      details.appendChild(
        el('div', { className: 'excess-choice' }, [
          el('span', { className: 'qty-label', text: t(lang, 'excessQuestion', { amount: formatCentsNL(meerdere) }) }),
          el('button', {
            type: 'button',
            className: `chip-btn excess-toggle ${!alsFooi ? 'active' : ''}`,
            'aria-pressed': String(!alsFooi),
            text: `${!alsFooi ? '✓ ' : ''}${t(lang, 'excessRetour')}`,
            onClick: () => mutate(() => { participantObj.excessAsTip = false; })
          }),
          el('button', {
            type: 'button',
            className: `chip-btn excess-toggle ${alsFooi ? 'active' : ''}`,
            'aria-pressed': String(alsFooi),
            text: `${alsFooi ? '✓ ' : ''}${t(lang, 'excessFooi')}`,
            onClick: () => mutate(() => { participantObj.excessAsTip = true; })
          })
        ])
      );
    }

    if (!payer && row.changeCents !== null) {
      let changeText, changeCls;
      if (row.excessTipCents > 0) {
        changeText = `${t(lang, 'excessBookedAsTip')} ${formatCentsNL(row.excessTipCents)}`;
        changeCls = 'change-info ok';
      } else if (row.changeCents > 0) {
        changeText = `${t(lang, 'changeReturn')} ${formatCentsNL(row.changeCents)}`;
        changeCls = 'change-info ok';
      } else if (row.changeCents < 0) {
        changeText = `${t(lang, 'changeShort')} ${formatCentsNL(Math.abs(row.changeCents))}`;
        changeCls = 'change-info short';
      } else {
        changeText = t(lang, 'changeExact');
        changeCls = 'change-info ok';
      }
      details.appendChild(el('div', { className: changeCls, text: changeText }));
    }


    const msg = buildShareMessage(row);
    details.appendChild(el('p', { className: 'share-preview', text: `Voorbeeldbericht: "${msg}"` }));

    const shareRow = el('div', { className: 'share-row' });
    const waLink = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    shareRow.appendChild(
      el('a', {
        href: result.canFinalize ? waLink : null,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: `btn btn-sm btn-whatsapp ${!result.canFinalize ? 'disabled-link' : ''}`,
        'aria-disabled': !result.canFinalize ? 'true' : null,
        text: `💬 ${t(lang, 'shareWhatsApp')}`,
        onClick: (e) => { if (!result.canFinalize) e.preventDefault(); }
      })
    );

    const mailLink = `mailto:?subject=${encodeURIComponent(t(lang, 'emailSubject'))}&body=${encodeURIComponent(msg)}`;
    shareRow.appendChild(
      el('a', {
        href: result.canFinalize ? mailLink : null,
        className: `btn btn-sm btn-secondary ${!result.canFinalize ? 'disabled-link' : ''}`,
        'aria-disabled': !result.canFinalize ? 'true' : null,
        text: `✉ ${t(lang, 'shareEmail')}`,
        onClick: (e) => { if (!result.canFinalize) e.preventDefault(); }
      })
    );

    const shareFeedback = el('span', { className: 'muted', 'aria-live': 'polite' });
    shareRow.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        disabled: !result.canFinalize,
        text: `📤 ${t(lang, 'shareOther')}`,
        onClick: async () => {
          if (navigator.share) {
            try { await navigator.share({ title: t(lang, 'emailSubject'), text: msg }); } catch {}
          } else {
            const copied = await copyTextReliable(msg);
            // Punt 7 (v9): zichtbare melding, ook als kopieren mislukt
            shareFeedback.textContent = copied
              ? 'Systeemdelen niet ondersteund in deze browser; tekst is gekopieerd.'
              : `Systeemdelen niet ondersteund in deze browser. ${t(lang, 'clipboardFailed')}`;
            announce(shareFeedback.textContent);
          }
        }
      })
    );

    shareRow.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        disabled: !result.canFinalize,
        text: `📋 ${t(lang, 'copyMessage')}`,
        onClick: async () => {
          const ok = await copyTextReliable(msg);
          shareFeedback.textContent = ok ? t(lang, 'copied') : t(lang, 'clipboardFailed');
          announce(shareFeedback.textContent);
        }
      })
    );

    details.appendChild(shareRow);
    details.appendChild(shareFeedback);

    // Statusregel onder de naam: dezelfde gegevens als in de details, kort samengevat.
    let statusText;
    if (row.hosted) statusText = t(lang, 'statusGuest');
    else if (payer && row.id === payer.id) statusText = t(lang, 'statusPayer');
    else if (payer) statusText = t(lang, 'settledWith', { name: payer.name });
    else if (row.changeCents !== null) {
      const cash = `${t(lang, 'statusCash')} ${formatCentsNL(participantObj.paidCashCents)}`;
      if (row.excessTipCents > 0) statusText = `${cash} · ${t(lang, 'statusTip')} ${formatCentsNL(row.excessTipCents)}`;
      else if (row.changeCents > 0) statusText = `${cash} · ${t(lang, 'statusChange')} ${formatCentsNL(row.changeCents)}`;
      else if (row.changeCents < 0) statusText = `${cash} · ${t(lang, 'statusShort')} ${formatCentsNL(Math.abs(row.changeCents))}`;
      else statusText = `${cash} · ${t(lang, 'statusExact')}`;
    } else statusText = row.settled ? t(lang, 'paidToggle') : t(lang, 'statusOpen');
    statusEl.textContent = statusText.replace(/€ /g, '€\u00A0'); // bedrag nooit over twee regels
    if (row.changeCents !== null && row.changeCents < 0 && !payer) statusEl.classList.add('is-short');

    const paidBox = el('input', {
      type: 'checkbox',
      id: `paid-${row.id}`,
      checked: Boolean(participantObj.settled),
      'aria-label': `${row.name}: ${payer && row.id !== payer.id && !row.hosted ? t(lang, 'settledWith', { name: payer.name }) : t(lang, 'paidToggle')}`
    });
    paidBox.addEventListener('change', (e) => {
      mutate(() => { participantObj.settled = e.target.checked; });
    });

    const toggleBtn = el('button', {
      type: 'button',
      className: 'person-toggle',
      'aria-expanded': String(isOpen),
      'aria-controls': detailsId,
      'aria-label': `${row.name}: ${t(lang, 'detailsToggle')}`,
      onClick: () => {
        const open = details.hidden;
        details.hidden = !open;
        toggleBtn.setAttribute('aria-expanded', String(open));
        if (open) openPersonDetails.add(row.id);
        else openPersonDetails.delete(row.id);
      }
    }, [el('span', { className: 'chevron', 'aria-hidden': 'true' })]);

    card.appendChild(
      el('div', { className: 'person-row' }, [
        el('label', { className: 'person-check', for: `paid-${row.id}` }, [paidBox]),
        el('div', { className: 'person-main' }, [
          el('label', { className: 'person-name', for: `paid-${row.id}`, text: row.name }),
          statusEl
        ]),
        el('strong', { className: 'person-total', text: formatCentsNL(row.totalCents) }),
        toggleBtn
      ])
    );
    card.appendChild(details);
    container.appendChild(card);
  });

  for (const zin of gastRegels) container.appendChild(el('p', { className: 'guest-line', text: zin }));
  container.appendChild(resultShareRow);
  container.appendChild(resultShareFeedback);
  container.appendChild(settingsWrap);

  container.appendChild(
    el('div', { className: 'nav-row' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: `← ${t(lang, 'back')}`,
        onClick: () => mutate(() => { session.step = 3; })
      })
    ])
  );
  // v27: "Nieuwe bon" los van de navigatie, zodat je hem niet raakt als je terug wilt
  container.appendChild(
    el('div', { className: 'new-receipt-row' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-danger-outline',
        text: t(lang, 'newReceiptBtn'),
        onClick: () => {
          if (window.confirm(t(lang, 'newReceiptConfirm'))) {
            if (currentPhotoObjectUrl) {
              URL.revokeObjectURL(currentPhotoObjectUrl);
              currentPhotoObjectUrl = null;
            }
            clearReceiptPhoto();
            mutate(() => { session = createEmptySession(); });
          }
        }
      })
    ])
  );
}

// ============================================================
// INSTELLINGEN & PRIVACY MODAL
// ============================================================
function openSettingsModal() {
  const dialog = $('#settings-dialog');
  const body = $('#settings-body');
  const lang = settings.lang;
  body.innerHTML = '';

  $('#settings-title').textContent = t(lang, 'settingsTitle');
  $('#btn-close-settings').textContent = t(lang, 'close');

  // Online AI-route (v14): via Firebase AI Logic, zonder eigen sleutel
  body.appendChild(el('h3', { text: 'Online AI-scan (Gemini)' }));

  // v17: schakelaar 'Online AI-scan (Google)', standaard aan, per toestel onthouden.
  // Uit = GEEN online aanroep: alleen lokaal lezen, ook geen online vertaling.
  const onlineAiCb = el('input', {
    type: 'checkbox',
    id: 'setting-online-ai',
    checked: settings.onlineAiEnabled !== false
  });
  onlineAiCb.addEventListener('change', (e) => {
    settings.onlineAiEnabled = e.target.checked;
    saveSettings(settings);
    render();
    openSettingsModal();
  });
  body.appendChild(
    el('label', { for: 'setting-online-ai', className: 'checkbox-row' }, [
      onlineAiCb,
      el('span', { text: t(lang, 'onlineAiToggle') })
    ])
  );
  body.appendChild(el('p', { className: 'help-text', text: t(lang, 'onlineAiHint') }));

  body.appendChild(
    el('p', {
      className: 'help-text',
      text: 'De bonscan en vertaling lopen via Firebase AI Logic naar de Agent Platform Gemini API van Google. Je hoeft zelf geen sleutel meer in te stellen en de app bevat ook geen sleutel van de maker. Misbruik wordt geblokkeerd met App Check (reCAPTCHA Enterprise). De kosten lopen via de app-eigenaar met een vast maandmaximum (spend cap); wordt dat bereikt, dan valt de app automatisch terug op de lokale backup.'
    })
  );
  body.appendChild(
    el('p', {
      className: 'muted',
      text: settings.onlineAiEnabled === false ? t(lang, 'aiOffStatus') : aiStatusText()
    })
  );

  const quota = getDailyGeminiCallCount();
  body.appendChild(
    el('p', {
      className: 'muted',
      text: `Aanroepen vandaag op dit toestel: ${quota.count} (${quota.date}).`
    })
  );

  // Taal & thema & grote tekst
  body.appendChild(el('h3', { text: t(lang, 'languageLabel') }));
  const langRow = el('div', { className: 'chip-wrap' });
  [['nl', 'Nederlands'], ['en', 'English']].forEach(([code, label]) => {
    langRow.appendChild(
      el('button', {
        type: 'button',
        className: `chip-btn ${settings.lang === code ? 'active' : ''}`,
        text: label,
        onClick: () => {
          settings.lang = code;
          saveSettings(settings);
          applyThemeAndPrefs();
          render();
          openSettingsModal();
        }
      })
    );
  });
  body.appendChild(langRow);

  body.appendChild(el('h3', { text: t(lang, 'themeLabel') }));
  const themeRow = el('div', { className: 'chip-wrap' });
  [
    ['system', t(lang, 'themeSystem')],
    ['light', t(lang, 'themeLight')],
    ['dark', t(lang, 'themeDark')]
  ].forEach(([mode, label]) => {
    themeRow.appendChild(
      el('button', {
        type: 'button',
        className: `chip-btn ${settings.theme === mode ? 'active' : ''}`,
        text: label,
        onClick: () => {
          settings.theme = mode;
          saveSettings(settings);
          applyThemeAndPrefs();
          openSettingsModal();
        }
      })
    );
  });
  body.appendChild(themeRow);

  // v26: stijlkeuze (alleen vormgeving; bedragen en schermen blijven gelijk)
  body.appendChild(el('h3', { text: t(lang, 'stijlLabel') }));
  const stijlRow = el('div', { className: 'chip-wrap', role: 'radiogroup', 'aria-label': t(lang, 'stijlLabel') });
  const huidigeStijl = STIJLEN.includes(settings.stijl) ? settings.stijl : 'standaard';
  [
    ['standaard', t(lang, 'stijlStandaard')],
    ['delft', t(lang, 'stijlDelft')],
    ['cartoon', t(lang, 'stijlCartoon')],
    ['vangogh', t(lang, 'stijlVanGogh')],
    ['rembrandt', t(lang, 'stijlRembrandt')],
    ['straat', t(lang, 'stijlStraat')],
    ['mondriaan', t(lang, 'stijlMondriaan')]
  ].forEach(([stijl, label]) => {
    stijlRow.appendChild(
      el('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': String(huidigeStijl === stijl),
        className: `chip-btn ${huidigeStijl === stijl ? 'active' : ''}`,
        onClick: () => {
          settings.stijl = stijl;
          saveSettings(settings);
          applyThemeAndPrefs();
          openSettingsModal();
        }
      }, [el('span', { className: `stijl-swatch ${stijl}`, 'aria-hidden': 'true' }), label])
    );
  });
  body.appendChild(stijlRow);

  const bigTextCb = el('input', {
    type: 'checkbox',
    id: 'setting-large-text',
    checked: Boolean(settings.largeText)
  });
  bigTextCb.addEventListener('change', (e) => {
    settings.largeText = e.target.checked;
    saveSettings(settings);
    applyThemeAndPrefs();
  });
  body.appendChild(
    el('label', { for: 'setting-large-text', className: 'checkbox-row mt' }, [
      bigTextCb,
      el('span', { text: t(lang, 'largeTextLabel') })
    ])
  );

  // Privacytekst (actueel voor v14: Firebase AI Logic, vertalen, PDF.js en zelf-gehoste lokale backup)
  body.appendChild(el('h3', { text: t(lang, 'privacyTitle') }));
  for (const para of STRINGS[lang].privacyBody) {
    body.appendChild(el('p', { className: 'help-text', text: para }));
  }
  body.appendChild(
    el('a', {
      href: AI_TERMS_URL,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'Bekijk de Firebase AI Logic-documentatie van Google'
    })
  );

  body.appendChild(
    el('div', { className: 'mt' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-danger',
        text: `🗑 ${t(lang, 'wipeAllBtn')}`,
        onClick: () => {
          if (window.confirm(t(lang, 'wipeConfirm'))) {
            wipeAllLocalData();
            if (currentPhotoObjectUrl) {
              URL.revokeObjectURL(currentPhotoObjectUrl);
              currentPhotoObjectUrl = null;
            }
            clearReceiptPhoto();
            undoManager.clear();
            session = createEmptySession();
            savedNames = [];
            customDict = {};
            settings = loadSettings();
            applyThemeAndPrefs();
            dialog.close();
            render();
            announce(t(settings.lang, 'wipedDone'));
          }
        }
      })
    ])
  );


  // v20: korte uitleg over bewaarde namen (blijven op dit toestel)
  body.appendChild(el('p', { className: 'help-text', text: t(lang, 'namesPrivacyLine') }));

  // v19: zichtbaar versienummer, zodat duidelijk is welke versie er draait
  body.appendChild(
    el('p', { className: 'help-text app-version', text: `${t(lang, 'versionLabel')} ${APP_VERSION}` })
  );

  if (!dialog.open) dialog.showModal();
}

// ============================================================
// HOOFD RENDER
// ============================================================
// v18: ongedaan maken als rustige rij met kromme pijltje OP DE PLEK van de verwijderde
// regel (verzoek Henk 14:46: het fixed pilletje onderin verscheen niet op zijn iPhone).
// De rij staat in de lijst zelf, scrollt dus gewoon mee en kan niet onder de Safari-
// toolbar of buiten beeld vallen. Hij verdwijnt vanzelf na enkele seconden en bij een
// stapwissel. Niets gaat definitief kwijt (Stap terug blijft ook werken).
let undoBarTimer = null;

function hideUndoBarLater() {
  if (undoBarTimer) clearTimeout(undoBarTimer);
  undoBarTimer = setTimeout(() => {
    lastDeletedLine = null;
    undoBarTimer = null;
    render();
  }, 8000);
}

function clearUndoRow() {
  lastDeletedLine = null;
  if (undoBarTimer) {
    clearTimeout(undoBarTimer);
    undoBarTimer = null;
  }
}

/** Rustige lijstrij met kromme pijltje + "Ongedaan maken" voor op de plek van de verwijderde regel. */
function buildUndoRow(lang) {
  const name = lastDeletedLine.item.geminiTranslation || lastDeletedLine.item.description || '';
  return el('div', { className: 'item-undo-row', role: 'status' }, [
    el('button', {
      type: 'button',
      className: 'undo-pill-btn',
      'aria-label': `${t(lang, 'undoBarAction')}: ${name}`,
      onClick: () => {
        const deleted = lastDeletedLine;
        clearUndoRow();
        mutate(() => {
          session.items = restoreDeletedItem(session.items, deleted);
        }, t(lang, 'lineRestored'));
      }
    }, [
      el('span', { className: 'undo-pill-icon', text: '↩' }),
      el('span', { className: 'undo-pill-text', text: t(lang, 'undoBarAction') })
    ])
  ]);
}

function render() {
  applyThemeAndPrefs();
  renderHeader();
  renderConnectionBanner();

  const main = $('#main-content');
  main.innerHTML = '';

  if (session.step !== 1 && lastDeletedLine) clearUndoRow();

  if (session.step === 1) renderStep1(main);
  else if (session.step === 2) renderStep2(main);
  else if (session.step === 3) renderStep3(main);
  else renderStep4(main);
}

$('#btn-undo').addEventListener('click', () => {
  const prev = undoManager.pop();
  if (prev) {
    session = prev;
    saveSession(session);
    render();
    announce(t(settings.lang, 'undoDone'));
  }
});

$('#btn-settings').addEventListener('click', openSettingsModal);
$('#btn-close-settings').addEventListener('click', () => $('#settings-dialog').close());

render();
initServiceWorker();

// v22: bewaarde bonfoto (IndexedDB) na een herlaad weer tonen in stap 1
loadReceiptPhoto().then((blob) => {
  if (blob && !currentPhotoObjectUrl) {
    currentPhotoObjectUrl = URL.createObjectURL(blob);
    render();
  }
});
