// Bonnetje - Hoofdapplicatie (v12: Gemini eerst, ppu-paddle-ocr PP-OCRv6_tiny als enige lokale backup,
// volledig zelf-gehost incl. onnxruntime-WASM, deelknop voor de uitslag)
import {
  parseEuroToCents,
  formatCentsNL,
  validateLineItem,
  isLineActive,
  validateReceiptTotal,
  calculateSettlement,
  buildSettlementShareText
} from './calculator.js';
import { t, STRINGS } from './i18n.js';
import { translateOffline } from './dictionary.js';
import { extractPdfTextAllPages, parsePlainTextReceipt } from './parser.js';
import {
  friendlyScanError,
  emptyFileMessage,
  wrongFileTypeMessage,
  pdfReaderLoadFailedMessage,
  scannedPdfWithoutGeminiMessage
} from './errors.js';
import { runLocalBackupOcr } from './local-ocr.js';
import {
  scanReceiptWithGemini,
  translateItemsWithGemini,
  GEMINI_TERMS_URL
} from './gemini.js';
import {
  DEFAULT_GEMINI_MODEL,
  createEmptySession,
  loadSession,
  saveSession,
  loadSavedNames,
  saveNameToHistory,
  loadSettings,
  saveSettings,
  loadGeminiApiKey,
  saveGeminiApiKey,
  getDailyGeminiCallCount,
  loadCustomDict,
  saveCustomDictEntry,
  wipeAllLocalData,
  UndoManager
} from './storage.js';

// Externe koffielink (zelfde als de online versie); er gaat geen app-data mee.
const SUPPORT_URL = 'https://www.paypal.me/Inzane007';
let session = loadSession();
let settings = loadSettings();
let geminiApiKey = loadGeminiApiKey();
let savedNames = loadSavedNames();
let customDict = loadCustomDict();
const undoManager = new UndoManager(50);

// Foto wordt NIET in localStorage bewaard, alleen tijdelijk in het werkgeheugen
let currentPhotoObjectUrl = null;
let lastReceiptFile = null;

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

function applyThemeAndPrefs() {
  const html = document.documentElement;
  html.lang = settings.lang;
  html.dataset.theme = settings.theme;
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

/**
 * Expliciete toestemming vóór elke Gemini-aanroep + eerste-keer EU/EER privacymelding.
 */
function confirmGeminiConsent(purpose, isPdf = false) {
  const firstTimeNote = !settings.geminiPrivacyAccepted
    ? `\n\nPrivacy (eerste aanroep): Volgens de eigen voorwaarden van Google voor gebruikers in de EU en EER (${GEMINI_TERMS_URL}) traint Google ook op de gratis laag niet met deze gegevens.`
    : '';

  const whatIsSent =
    purpose === 'translate'
      ? 'Alleen de tekstregels van de bon (geen bonfoto, geen bedragen en geen namen) gaan nu naar Google Gemini om ze naar het Nederlands te vertalen.'
      : isPdf
        ? 'De volledige PDF-bon (alle pagina\'s) gaat nu naar Google Gemini om de regels en bedragen uit te lezen.'
        : 'De bonfoto gaat nu naar Google Gemini om de regels en bedragen uit te lezen.';

  const ok = window.confirm(
    `${whatIsSent}${firstTimeNote}\n\nGeef je toestemming voor deze online aanroep? (Bij weigeren kun je het plakvak of handmatig invoeren gebruiken.)`
  );
  if (ok && !settings.geminiPrivacyAccepted) {
    settings.geminiPrivacyAccepted = true;
    saveSettings(settings);
  }
  return ok;
}

// ============================================================
// SERVICE WORKER (alleen app-shell, geen lokale OCR-modellen)
// ============================================================
async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
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

  const undoBtn = $('#btn-undo');
  undoBtn.textContent = `↩ ${t(lang, 'undo')}`;
  undoBtn.disabled = !undoManager.canUndo();
  undoBtn.setAttribute('aria-label', t(lang, 'undo'));

  const settingsBtn = $('#btn-settings');
  settingsBtn.textContent = `⚙ ${t(lang, 'settings')}`;
  settingsBtn.setAttribute('aria-label', t(lang, 'settings'));

  const stepper = $('#stepper');
  stepper.innerHTML = '';
  const stepNames = STRINGS[lang].steps;
  stepNames.forEach((label, idx) => {
    const stepNum = idx + 1;
    const isCurrent = session.step === stepNum;
    const allowed = canNavigateToStep(stepNum);
    const btn = el('button', {
      type: 'button',
      className: `step-pill ${isCurrent ? 'active' : ''}`,
      disabled: !allowed,
      'aria-current': isCurrent ? 'step' : null,
      text: label,
      onClick: () => {
        if (session.step !== stepNum && canNavigateToStep(stepNum)) {
          mutate(() => {
            session.step = stepNum;
          });
        }
      }
    });
    stepper.appendChild(btn);
  });
}

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

function showScanError(message, { isPdf = false } = {}) {
  render();
  const errStatus = $('#scan-status');
  errStatus.hidden = false;
  errStatus.className = 'status-box error';
  errStatus.innerHTML = '';
  errStatus.appendChild(el('p', { text: message }));
  if (lastReceiptFile && geminiApiKey) {
    errStatus.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        text: '↻ Opnieuw proberen',
        onClick: () => handleReceiptFile(lastReceiptFile)
      })
    );
  }
  // Punt 6 (v9): geen doodlopende route — bied altijd de lokale backup aan bij foto's
  if (lastReceiptFile && !isPdf) {
    errStatus.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-primary',
        text: '⚡ Lokale backup starten (niets gaat naar buiten)',
        onClick: () => runLocalBackupFlow(lastReceiptFile)
      })
    );
  }
  announce(message);
}

/**
 * Past een scanresultaat (Gemini of lokale backup) toe op de sessie en toont de status.
 */
function applyScanResult(scanRes, usedLocalBackup) {
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
    postStatus.textContent =
      'Lokaal gelezen met backup (ppu-paddle-ocr, PP-OCRv6_tiny — niets verstuurd naar buiten). Let op: de lokale backup vertaalt niet; bij een buitenlandse bon kun je later met internet alsnog vertalen.';
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
  statusBox.textContent = 'Lokale backup (ppu-paddle-ocr, PP-OCRv6_tiny) wordt gestart…';
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
      render();
    }

    // 2. Foto of gescande PDF -> Gemini eerst, lokale backup (ppu-paddle-ocr PP-OCRv6_tiny) als Gemini niet kan
    const statusBox = $('#scan-status');
    statusBox.hidden = false;

    let fallbackReason = null;
    if (!geminiApiKey) {
      fallbackReason = 'geen Gemini API-sleutel ingesteld';
    } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      fallbackReason = 'geen internetverbinding';
    } else if (!confirmGeminiConsent('scan', isPdf)) {
      fallbackReason = 'online scannen via Gemini geweigerd';
    }

    let scanRes = null;
    let usedLocalBackup = false;

    if (!fallbackReason) {
      statusBox.className = 'status-box info';
      statusBox.textContent = `Bon wordt gelezen via Gemini (${settings.geminiModel || DEFAULT_GEMINI_MODEL})…`;
      announce(statusBox.textContent);
      try {
        scanRes = await scanReceiptWithGemini(file, geminiApiKey, {
          model: settings.geminiModel || DEFAULT_GEMINI_MODEL
        });
      } catch (gemErr) {
        // Punt 6 (v9): ook HTTP 500 en andere serverfouten vallen terug op de lokale backup
        if (gemErr.fallbackCode === 'http_429' || gemErr.fallbackCode === 'http_5xx' || gemErr.fallbackCode === 'offline' || gemErr.fallbackCode === 'network') {
          fallbackReason = gemErr.message;
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
      statusBox.textContent = `Gemini niet beschikbaar (${fallbackReason}). Lokale backup (ppu-paddle-ocr, PP-OCRv6_tiny) wordt gestart…`;
      announce(statusBox.textContent);
      scanRes = await runLocalBackupOcr(file, {
        onProgress: (p) => {
          if (p.message) statusBox.textContent = p.message;
        }
      });
    }

    applyScanResult(scanRes, usedLocalBackup);
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
      text: 'Maak een foto van de bon, kies een foto of PDF, plak tekst via iPhone Live Text, of typ de regels handmatig in. Controleer herkende bedragen altijd zelf.'
    })
  );

  // Dagteller & sleutelstatus
  const quota = getDailyGeminiCallCount();
  const modelUsed = settings.geminiModel || DEFAULT_GEMINI_MODEL;
  const quotaInfo = el('div', { className: 'status-box info' }, [
    el('span', {
      text: geminiApiKey
        ? `Gemini-aanroepen vandaag op dit toestel: ${quota.count} (model: ${modelUsed}). Het gratis daglimiet verschilt per project en model en is zichtbaar in Google AI Studio.`
        : 'Geen Gemini API-sleutel ingesteld: scannen en vertalen zijn uitgeschakeld. Het plakvak (iPhone Live Text) en handmatig invoeren werken altijd. Stel je eigen gratis sleutel in bij Instellingen & privacy.'
    })
  ]);
  container.appendChild(quotaInfo);

  // Camera & bestand kiezen
  const fileActions = el('div', { className: 'action-row' });

  const cameraInput = el('input', {
    type: 'file',
    accept: 'image/*',
    capture: 'environment',
    className: 'sr-only',
    id: 'input-camera'
  });
  cameraInput.addEventListener('change', (e) => {
    if (e.target.files?.[0]) handleReceiptFile(e.target.files[0]);
    e.target.value = '';
  });

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
    el('label', { for: 'input-camera', className: 'btn btn-primary', text: `📷 ${t(lang, 'takePhoto')}` })
  );
  fileActions.appendChild(
    el('label', { for: 'input-file', className: 'btn btn-secondary', text: `📄 ${t(lang, 'chooseFile')}` })
  );
  fileActions.appendChild(cameraInput);
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
          render();
          announce(t(lang, 'photoCleared'));
        }
      })
    );
  }
  container.appendChild(fileActions);

  if (currentPhotoObjectUrl) {
    container.appendChild(
      el('div', { className: 'photo-preview' }, [
        el('img', { src: currentPhotoObjectUrl, alt: 'Bonvoorbeeld (alleen in geheugen)' })
      ])
    );
  }

  // Groot plakvak voor iPhone Live Text / Tekst van camera
  const pasteDetails = el('details', { className: 'card mt' });
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
        disabled: !geminiApiKey,
        text: '🌐 Vertaal regels naar Nederlands (alleen tekst via Gemini)',
        onClick: async () => {
          if (!confirmGeminiConsent('translate')) return;
          transFeedback.hidden = false;
          transFeedback.className = 'status-box info';
          transFeedback.textContent = 'Regels worden naar het Nederlands vertaald…';
          try {
            const map = await translateItemsWithGemini(session.items, geminiApiKey, {
              model: settings.geminiModel || DEFAULT_GEMINI_MODEL
            });
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

    // Badges
    const badges = el('div', { className: 'badge-row' });
    if (item.pageNumber && item.pageNumber > 1) {
      badges.appendChild(el('span', { className: 'badge badge-muted', text: `Pagina ${item.pageNumber}` }));
    }
    if (item.sourceEngine === 'ppu-paddle-ocr') {
      badges.appendChild(el('span', { className: 'badge badge-muted', text: 'Lokaal gelezen (PP-OCRv6_tiny)' }));
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
    if (badges.childNodes.length > 0) card.appendChild(badges);

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
    card.appendChild(grid);

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

    rowBtns.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-danger-outline',
        text: `✕ ${t(lang, 'deleteLine')}`,
        onClick: () =>
          mutate(() => {
            session.items.splice(idx, 1);
          })
      })
    );

    card.appendChild(rowBtns);
    listWrap.appendChild(card);
  });
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
function addParticipantByName(name) {
  const clean = String(name || '').trim();
  if (!clean) return;
  if (session.participants.some((p) => p.name.toLowerCase() === clean.toLowerCase())) return;
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
    session.participants.forEach((p, idx) => {
      chipList.appendChild(
        el('div', { className: 'participant-row' }, [
          el('strong', { text: p.name }),
          el('button', {
            type: 'button',
            className: 'btn btn-sm btn-danger-outline',
            'aria-label': `${t(lang, 'removeParticipant')} ${p.name}`,
            text: '✕',
            onClick: () =>
              mutate(() => {
                session.participants.splice(idx, 1);
                session.items.forEach((it) => {
                  it.assignedTo = (it.assignedTo || []).filter((id) => id !== p.id);
                  if (it.assignedQuantities && p.id in it.assignedQuantities) {
                    delete it.assignedQuantities[p.id];
                  }
                });
                if (session.activeParticipantId === p.id) {
                  session.activeParticipantId = session.participants[0]?.id || null;
                }
              })
          })
        ])
      );
    });
  }
  container.appendChild(chipList);

  const unusedSaved = savedNames.filter(
    (n) => !session.participants.some((p) => p.name.toLowerCase() === n.toLowerCase())
  );
  if (unusedSaved.length > 0) {
    container.appendChild(el('h3', { text: t(lang, 'savedNamesTitle') }));
    const savedWrap = el('div', { className: 'chip-wrap' });
    unusedSaved.forEach((n) => {
      savedWrap.appendChild(
        el('button', {
          type: 'button',
          className: 'chip-btn',
          text: `+ ${n}`,
          onClick: () => addParticipantByName(n)
        })
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
function renderStep3(container) {
  const lang = settings.lang;
  container.appendChild(el('h2', { text: t(lang, 'step3Title') }));
  container.appendChild(el('p', { className: 'help-text', text: t(lang, 'step3Help') }));

  if (session.participants.length === 0) {
    container.appendChild(el('div', { className: 'status-box warn', text: t(lang, 'noParticipants') }));
    return;
  }

  if (!session.activeParticipantId || !session.participants.some((p) => p.id === session.activeParticipantId)) {
    session.activeParticipantId = session.participants[0].id;
  }

  container.appendChild(el('p', { className: 'section-label', text: t(lang, 'selectPersonPrompt') }));
  const personTabs = el('div', { className: 'chip-wrap', role: 'tablist' });
  session.participants.forEach((p) => {
    const active = p.id === session.activeParticipantId;
    personTabs.appendChild(
      el('button', {
        type: 'button',
        role: 'tab',
        'aria-selected': String(active),
        className: `chip-btn person-tab ${active ? 'active' : ''}`,
        text: p.name,
        onClick: () => {
          session.activeParticipantId = p.id;
          saveSession(session);
          render();
        }
      })
    );
  });
  container.appendChild(personTabs);

  const settlement = calculateSettlement(session);
  if (settlement.unassignedItems.length > 0) {
    container.appendChild(
      el('div', {
        className: 'status-box warn',
        role: 'alert',
        text: t(lang, 'unassignedWarning', { count: settlement.unassignedItems.length })
      })
    );
  }
  if (settlement.quantityMismatchItems.length > 0) {
    container.appendChild(
      el('div', {
        className: 'status-box warn',
        role: 'alert',
        text: `Let op: bij ${settlement.quantityMismatchItems.length} regel(s) klopt het totaal aantal toegewezen stuks nog niet met het aantal op de bon.`
      })
    );
  }

  const activeItems = session.items.filter(isLineActive);
  const activePersonId = session.activeParticipantId;
  const activePerson = session.participants.find((p) => p.id === activePersonId);
  const allIds = session.participants.map((p) => p.id);

  const list = el('div', { className: 'split-list' });
  activeItems.forEach((item) => {
    const assigned = item.assignedTo || [];
    const qtyMap = item.assignedQuantities || {};
    const assignedQtySum = Object.values(qtyMap).reduce((s, q) => s + (Number.isInteger(q) ? q : 0), 0);
    const usingQtyMode = assignedQtySum > 0;

    const hasActive = usingQtyMode ? (qtyMap[activePersonId] || 0) > 0 : assigned.includes(activePersonId);
    const isAll = !usingQtyMode && allIds.length > 0 && allIds.every((id) => assigned.includes(id));

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

    const card = el('div', {
      className: `split-card ${hasActive ? 'selected' : ''} ${isUnassigned || isQtyMismatch ? 'unassigned' : ''}`
    });

    const mainBtn = el(
      'button',
      {
        type: 'button',
        className: 'split-toggle-btn',
        'aria-pressed': String(hasActive),
        onClick: () =>
          mutate(() => {
            item.assignedQuantities = {};
            const cur = item.assignedTo || [];
            if (cur.includes(activePersonId)) {
              item.assignedTo = cur.filter((id) => id !== activePersonId);
            } else {
              item.assignedTo = [...cur, activePersonId];
            }
          })
      },
      [
        el('div', { className: 'split-card-top' }, [
          el('span', { className: 'split-check', text: hasActive ? '☑' : '☐' }),
          el('span', { className: 'split-desc', text: `${item.qty > 1 ? `${item.qty}× ` : ''}${labelText || '—'}` }),
          el('strong', { className: 'split-price', text: formatCentsNL(item.lineTotalCents) })
        ]),
        el('div', { className: 'split-assigned-names', text: assignedLabel })
      ]
    );

    const actionsRow = el('div', { className: 'item-row-actions' });
    if (item.qty > 1) {
      const myQty = qtyMap[activePersonId] || 0;
      const remaining = item.qty - assignedQtySum;
      actionsRow.appendChild(el('span', { className: 'qty-label', text: `Stuks voor ${activePerson?.name}:` }));
      actionsRow.appendChild(
        el('button', {
          type: 'button',
          className: 'btn btn-sm btn-secondary',
          disabled: myQty <= 0,
          'aria-label': `1 stuk minder voor ${activePerson?.name}`,
          text: '−',
          onClick: () =>
            mutate(() => {
              item.assignedTo = [];
              if (!item.assignedQuantities) item.assignedQuantities = {};
              const next = Math.max(0, (item.assignedQuantities[activePersonId] || 0) - 1);
              if (next === 0) delete item.assignedQuantities[activePersonId];
              else item.assignedQuantities[activePersonId] = next;
            })
        })
      );
      actionsRow.appendChild(el('strong', { className: 'qty-val', text: String(myQty) }));
      actionsRow.appendChild(
        el('button', {
          type: 'button',
          className: 'btn btn-sm btn-secondary',
          disabled: remaining <= 0,
          'aria-label': `1 stuk meer voor ${activePerson?.name}`,
          text: '+',
          onClick: () =>
            mutate(() => {
              item.assignedTo = [];
              if (!item.assignedQuantities) item.assignedQuantities = {};
              item.assignedQuantities[activePersonId] = (item.assignedQuantities[activePersonId] || 0) + 1;
            })
        })
      );
    }

    actionsRow.appendChild(
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

    card.appendChild(mainBtn);
    card.appendChild(actionsRow);
    list.appendChild(card);
  });
  container.appendChild(list);

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
  const tipPart =
    personRow.tipCents > 0
      ? t(lang, 'shareTipPart', { tip: formatCentsNL(personRow.tipCents) })
      : '';
  const receiptExtraPart =
    personRow.receiptExtraCents > 0
      ? t(lang, 'shareReceiptExtraPart', { extra: formatCentsNL(personRow.receiptExtraCents) })
      : '';
  return t(lang, 'shareMessageTemplate', {
    name: personRow.name,
    total: formatCentsNL(personRow.totalCents),
    subtotal: formatCentsNL(personRow.subtotalCents),
    tipPart: tipPart + receiptExtraPart
  });
}

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
      tipCard.appendChild(
        el('p', {
          className: 'tip-note',
          text: t(lang, 'tipSummaryTarget', {
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
  container.appendChild(tipCard);

  container.appendChild(
    el('div', { className: 'summary-kv total-check-card' }, [
      el('div', {}, [el('span', { text: t(lang, 'billTotalLabel') }), el('strong', { text: formatCentsNL(result.billTotalCents) })]),
      el('div', {}, [el('span', { text: t(lang, 'totalTipLabel') }), el('strong', { text: formatCentsNL(result.totalTipCents) })]),
      el('div', { className: 'grand-row' }, [
        el('span', { text: t(lang, 'grandTotalLabel') }),
        el('strong', { text: formatCentsNL(result.grandTotalCents) })
      ])
    ])
  );

  // Deelknoppen (punt 6, v8): de uitslag als korte tekst via het deelmenu van het toestel,
  // en een aparte knop voor de bonfoto. Geen waarschuwingen, geen contactenkoppeling.
  const settlementText = buildSettlementShareText(result, t(lang, 'totalWord'));
  const resultShareRow = el('div', { className: 'share-row' });
  const resultShareFeedback = el('span', { className: 'muted', 'aria-live': 'polite' });
  resultShareRow.appendChild(
    el('button', {
      type: 'button',
      className: 'btn btn-sm btn-secondary',
      disabled: !result.canFinalize || !settlementText,
      text: `\ud83d\udce4 ${t(lang, 'shareResult')}`,
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
  container.appendChild(resultShareRow);
  container.appendChild(resultShareFeedback);

  result.perPerson.forEach((row) => {
    const participantObj = session.participants.find((p) => p.id === row.id);
    const card = el('article', { className: `person-summary-card ${row.settled ? 'is-settled' : ''}` });

    card.appendChild(
      el('div', { className: 'person-head' }, [
        el('h3', { text: row.name }),
        el('strong', { className: 'person-total', text: formatCentsNL(row.totalCents) })
      ])
    );

    card.appendChild(
      el('div', { className: 'person-breakdown' }, [
        el('span', { text: `${t(lang, 'subtotalLabel')}: ${formatCentsNL(row.subtotalCents)}` }),
        el('span', { text: `${t(lang, 'tipLabel')}: ${formatCentsNL(row.tipCents)}` }),
        ...(row.receiptExtraCents > 0
          ? [el('span', { text: `${t(lang, 'receiptExtraLabel')}: ${formatCentsNL(row.receiptExtraCents)}` })]
          : [])
      ])
    );

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
      card.appendChild(
        el('label', { className: 'field-wrap inline-field' }, [
          el('span', { text: `${t(lang, 'tipLabel')} (€)` }),
          tipInput
        ])
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
      });
    });
    card.appendChild(
      el('label', { className: 'field-wrap inline-field' }, [
        el('span', { text: t(lang, 'cashPaidLabel') }),
        cashInput
      ])
    );

    if (row.changeCents !== null) {
      let changeText, changeCls;
      if (row.changeCents > 0) {
        changeText = `${t(lang, 'changeReturn')} ${formatCentsNL(row.changeCents)}`;
        changeCls = 'change-info ok';
      } else if (row.changeCents < 0) {
        changeText = `${t(lang, 'changeShort')} ${formatCentsNL(Math.abs(row.changeCents))}`;
        changeCls = 'change-info short';
      } else {
        changeText = t(lang, 'changeExact');
        changeCls = 'change-info ok';
      }
      card.appendChild(el('div', { className: changeCls, text: changeText }));
    }

    const paidBox = el('input', {
      type: 'checkbox',
      id: `paid-${row.id}`,
      checked: Boolean(participantObj.settled)
    });
    paidBox.addEventListener('change', (e) => {
      mutate(() => { participantObj.settled = e.target.checked; });
    });
    card.appendChild(
      el('label', { for: `paid-${row.id}`, className: 'checkbox-row' }, [
        paidBox,
        el('span', { text: t(lang, 'paidToggle') })
      ])
    );

    const msg = buildShareMessage(row);
    card.appendChild(el('p', { className: 'share-preview', text: `Voorbeeldbericht: "${msg}"` }));

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

    card.appendChild(shareRow);
    card.appendChild(shareFeedback);
    container.appendChild(card);
  });

  container.appendChild(
    el('div', { className: 'nav-row' }, [
      el('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: `← ${t(lang, 'back')}`,
        onClick: () => mutate(() => { session.step = 3; })
      }),
      el('button', {
        type: 'button',
        className: 'btn btn-danger-outline',
        text: t(lang, 'newReceiptBtn'),
        onClick: () => {
          if (window.confirm(t(lang, 'newReceiptConfirm'))) {
            if (currentPhotoObjectUrl) {
              URL.revokeObjectURL(currentPhotoObjectUrl);
              currentPhotoObjectUrl = null;
            }
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

  // Eigen gratis Gemini API-sleutel + instelbaar model + dagteller
  body.appendChild(el('h3', { text: 'Eigen gratis Gemini API-sleutel' }));
  body.appendChild(
    el('p', {
      className: 'help-text',
      text: 'Maak een gratis sleutel aan in Google AI Studio (aistudio.google.com). Een nieuwe sleutel werkt daar standaard alleen voor de Gemini API. Koppel nooit een betaalaccount aan dat project. Je kunt optioneel een websitebeperking (HTTP-referrer) op je GitHub Pages-domein instellen als remmer tegen kopiëren (let op: dat is geen waterdichte koppeling).'
    })
  );
  const keyForm = el('form', { className: 'inline-form' });
  const keyInput = el('input', {
    type: 'password',
    value: geminiApiKey,
    placeholder: 'Plak hier je eigen Gemini API-sleutel',
    'aria-label': 'Gemini API-sleutel'
  });
  keyForm.appendChild(keyInput);
  keyForm.appendChild(el('button', { type: 'submit', className: 'btn btn-sm btn-primary', text: 'Opslaan' }));
  if (geminiApiKey) {
    keyForm.appendChild(
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-danger-outline',
        text: 'Verwijder',
        onClick: () => {
          geminiApiKey = saveGeminiApiKey('');
          render();
          openSettingsModal();
        }
      })
    );
  }
  keyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    geminiApiKey = saveGeminiApiKey(keyInput.value);
    render();
    openSettingsModal();
  });
  body.appendChild(keyForm);

  const quota = getDailyGeminiCallCount();
  body.appendChild(
    el('p', {
      className: 'muted',
      text: `Aanroepen vandaag op dit toestel: ${quota.count} (${quota.date}). Gratis daglimieten verschillen per project en model en zijn zichtbaar in Google AI Studio.`
    })
  );

  // Instelbare modelnaam
  const modelInput = el('input', {
    type: 'text',
    id: 'setting-gemini-model',
    value: settings.geminiModel || DEFAULT_GEMINI_MODEL,
    placeholder: DEFAULT_GEMINI_MODEL
  });
  modelInput.addEventListener('change', (e) => {
    settings.geminiModel = e.target.value.trim() || DEFAULT_GEMINI_MODEL;
    saveSettings(settings);
    render();
  });
  body.appendChild(
    el('label', { for: 'setting-gemini-model', className: 'field-wrap mt' }, [
      el('span', { text: 'Gemini modelnaam (standaard: gemini-2.5-flash)' }),
      modelInput
    ])
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

  // Privacytekst (actueel voor v7: Gemini, vertalen, PDF.js en zelf-gehoste lokale backup)
  body.appendChild(el('h3', { text: t(lang, 'privacyTitle') }));
  for (const para of STRINGS[lang].privacyBody) {
    body.appendChild(el('p', { className: 'help-text', text: para }));
  }
  body.appendChild(
    el('a', {
      href: GEMINI_TERMS_URL,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'Bekijk Google Gemini API-voorwaarden'
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
            undoManager.clear();
            session = createEmptySession();
            savedNames = [];
            customDict = {};
            geminiApiKey = '';
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

  if (!dialog.open) dialog.showModal();
}

// ============================================================
// HOOFD RENDER
// ============================================================
function render() {
  applyThemeAndPrefs();
  renderHeader();
  renderConnectionBanner();

  const main = $('#main-content');
  main.innerHTML = '';

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
