// Bonnetje - Automatische tests (v12: rekenkern, PDF, Live Text, nagebootste Gemini-antwoorden,
// adres/postcode-bescherming, PIN-betaalwoord, btw-dedupe, NL-foutmeldingen, 500-terugval)

// Node heeft geen localStorage; shim alleen voor de tests (dagteller Gemini, V10.7).
if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear()
  };
}

// Node heeft geen FileReader; shim alleen voor de tests zodat de echte Gemini-codepaden draaien.
if (typeof globalThis.FileReader === 'undefined' && typeof Buffer !== 'undefined') {
  globalThis.FileReader = class FileReaderShim {
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buf).toString('base64')}`;
        if (typeof this.onload === 'function') this.onload();
      });
    }
  };
}
import {
  parseEuroToCents,
  formatCentsNL,
  splitCentsEqually,
  validateLineItem,
  classifyReceiptLine,
  validateReceiptTotal,
  calculateSettlement,
  buildSettlementShareText
} from '../js/calculator.js';
import { LOCAL_OCR_MODELS, CACHE_NAME, APP_VERSION } from '../js/assets-manifest.js';
import {
  isItemExpanded,
  toggleItemExpanded,
  deleteItemAt,
  restoreDeletedItem,
  computedUnitPriceCents,
  compactRowModel
} from '../js/item-rows.js';
import {
  splitPdfTextItemToWords,
  normalizePunctuation,
  parsePlainTextReceipt,
  isVatAnchorLine,
  detectReceiptNumberFormat,
  parseAmountWithFormat,
  reconcileBottomUp,
  classifyNonDishKeyword,
  mergeOcrLinesToSingleRow,
  isAddressOrPostalNumber,
  isDecimalRestoreException
} from '../js/parser.js';
import { parseLocalOcrOutput, runLocalBackupOcr } from '../js/local-ocr.js';
import {
  parseGeminiReceiptJson,
  parseGeminiTranslationJson,
  scanReceiptWithGemini,
  buildReceiptScanPrompt,
  estimateTextTokens,
  estimateReceiptImageTokens,
  getLastGeminiCallInfo
} from '../js/gemini.js';
import { mapFirebaseAiError, isOnlineAiUsable } from '../js/firebase-ai.js';
import { downscalePlan, ONLINE_SCAN_MAX_LONG_SIDE, ONLINE_SCAN_JPEG_QUALITY } from '../js/image-downscale.js';
import { STRINGS } from '../js/i18n.js';
import * as dictionaryModule from '../js/dictionary.js';
import {
  getDailyGeminiCallCount, loadSettings, saveSettings, DEFAULT_SETTINGS,
  loadSavedNames, saveNameToHistory, removeSavedName, createEmptySession, saveSession,
  normalizeSavedName
} from '../js/storage.js';
import { extractPdfTextAllPages } from '../js/parser.js';
import {
  pdfReaderLoadFailedMessage,
  isImageDecodeError,
  friendlyScanError,
  unreadableFileMessage,
  emptyFileMessage,
  wrongFileTypeMessage,
  scannedPdfWithoutGeminiMessage,
  localModelsOfflineMessage
} from '../js/errors.js';

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Verwacht: ${JSON.stringify(expected)}, kreeg: ${JSON.stringify(actual)}`);
  }
}
function assertTrue(cond, msg = '') {
  if (!cond) throw new Error(msg || 'Voorwaarde is false');
}
function assertThrows(fn, msg = '') {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new Error(msg || 'Verwachtte een foutmelding, maar er werd geen fout gegooid');
}

export function runAllTests() {
  const results = [];
  function test(name, fn) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  // === 12 BESTAANDE REKENTESTS (ONGEWIJZIGD) ===
  test('a) Fles wijn € 10,00 gedeeld door 3 personen = exact € 10,00 in hele centen', () => {
    const shares = splitCentsEqually(1000, ['p1', 'p2', 'p3']);
    assertEqual(shares.p1, 334);
    assertEqual(shares.p2, 333);
    assertEqual(shares.p3, 333);
    assertEqual(shares.p1 + shares.p2 + shares.p3, 1000);
    assertEqual(formatCentsNL(shares.p1), '€ 3,34');
    assertEqual(formatCentsNL(shares.p2), '€ 3,33');
  });

  test('b) Doelbedrag € 110,00 bij bon € 103,40 over 4 deelnemers -> fooi € 6,60 exact verdeeld', () => {
    const res = calculateSettlement({
      items: [{ id: '1', description: 'Diner', qty: 1, unitPriceCents: 10340, lineTotalCents: 10340, assignedTo: ['a', 'b', 'c', 'd'] }],
      receiptTotalCents: 10340,
      participants: [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bram' }, { id: 'c', name: 'Cees' }, { id: 'd', name: 'Daan' }],
      tipMode: 'target_total',
      targetTotalCents: 11000,
      includeZeroConsumersInSharedTip: false
    });
    assertEqual(res.totalTipCents, 660);
    assertEqual(res.grandTotalCents, 11000);
    assertTrue(res.invariantExact);
    assertTrue(res.canFinalize);
    for (const p of res.perPerson) assertEqual(p.tipCents, 165);
  });

  test('c) Contant € 50,00 op deel van € 32,50 -> wisselgeld € 17,50 (en tekort bij te weinig)', () => {
    const state = {
      items: [{ id: '1', description: 'Menu', qty: 1, unitPriceCents: 3250, lineTotalCents: 3250, assignedTo: ['a'] }],
      receiptTotalCents: 3250,
      participants: [{ id: 'a', name: 'Henk', paidCashCents: 5000 }],
      tipMode: 'none'
    };
    assertEqual(calculateSettlement(state).perPerson[0].changeCents, 1750);
    state.participants[0].paidCashCents = 2000;
    assertEqual(calculateSettlement(state).perPerson[0].changeCents, -1250);
  });

  test('d) Deelnemer zonder items betaalt niets en geen fooi (tenzij expliciet gekozen)', () => {
    const baseState = {
      items: [{ id: '1', description: 'Tapas', qty: 1, unitPriceCents: 4000, lineTotalCents: 4000, assignedTo: ['a', 'b'] }],
      receiptTotalCents: 4000,
      participants: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }],
      tipMode: 'target_total',
      targetTotalCents: 4600,
      includeZeroConsumersInSharedTip: false
    };
    const res1 = calculateSettlement(baseState);
    assertEqual(res1.perPerson.find((p) => p.id === 'c').tipCents, 0);
    const res2 = calculateSettlement({ ...baseState, includeZeroConsumersInSharedTip: true });
    assertEqual(res2.perPerson.find((p) => p.id === 'c').tipCents, 200);
  });

  test('e) Niet-toegewezen bonregel geeft waarschuwing en blokkeert afronden', () => {
    const res = calculateSettlement({
      items: [
        { id: '1', description: 'Paella', qty: 1, unitPriceCents: 2400, lineTotalCents: 2400, assignedTo: ['a'] },
        { id: '2', description: 'Agua con gas', qty: 1, unitPriceCents: 300, lineTotalCents: 300, assignedTo: [] }
      ],
      receiptTotalCents: 2700,
      participants: [{ id: 'a', name: 'A' }],
      tipMode: 'none'
    });
    assertEqual(res.unassignedItems.length, 1);
    assertEqual(res.canFinalize, false);
  });

  test('f) Doelbedrag € 100,00 bij bontotaal € 103,40 wordt geweigerd (geen negatieve fooi)', () => {
    const res = calculateSettlement({
      items: [{ id: '1', description: 'Diner', qty: 1, unitPriceCents: 10340, lineTotalCents: 10340, assignedTo: ['a'] }],
      receiptTotalCents: 10340,
      participants: [{ id: 'a', name: 'A' }],
      tipMode: 'target_total',
      targetTotalCents: 10000
    });
    assertEqual(res.tipError, 'target_below_bill');
    assertEqual(res.canFinalize, false);
  });

  test('g) BTW-overzicht onderaan de bon telt nooit mee als te verdelen regel', () => {
    assertEqual(classifyReceiptLine('IVA 10% (Base 94,00)', 940).kind, 'vat_summary');
    const items = [
      { id: '1', description: 'Menu del dia', qty: 2, unitPriceCents: 1800, lineTotalCents: 3600, assignedTo: ['a', 'b'], isVatSummary: false },
      { id: '2', description: 'BTW 9% incl.', qty: 1, unitPriceCents: 297, lineTotalCents: 297, assignedTo: [], isVatSummary: true }
    ];
    assertTrue(validateReceiptTotal(items, 3600).matches);
  });

  test('Extra: Korting verlaagt het bedrag en aantal×stukprijs mismatch wordt gemarkeerd', () => {
    assertTrue(validateLineItem({ qty: 2, unitPriceCents: 450, lineTotalCents: 800 }).mismatch);
    const res = calculateSettlement({
      items: [
        { id: '1', description: 'Hoofdgerecht', qty: 1, unitPriceCents: 2000, lineTotalCents: 2000, assignedTo: ['a', 'b'] },
        { id: '2', description: 'Korting', qty: 1, unitPriceCents: -500, lineTotalCents: -500, assignedTo: ['a', 'b'] }
      ],
      receiptTotalCents: 1500,
      participants: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      tipMode: 'none'
    });
    assertEqual(res.grandTotalCents, 1500);
    assertTrue(res.canFinalize);
  });

  test('Extra: parseEuroToCents weigert halve centen en formatCentsNL toont Nederlandse komma', () => {
    assertEqual(parseEuroToCents('€ 12,50'), 1250);
    assertEqual(parseEuroToCents('12,505'), null);
    assertEqual(formatCentsNL(1250), '€ 12,50');
  });

  test('Regressie 4: Ontbrekend bontotaal of lowConfidence blokkeert canFinalize', () => {
    const r1 = calculateSettlement({
      items: [{ id: '1', description: 'Bier', qty: 1, unitPriceCents: 300, lineTotalCents: 300, assignedTo: ['a'] }],
      receiptTotalCents: null,
      participants: [{ id: 'a', name: 'Jan' }],
      tipMode: 'none'
    });
    assertEqual(r1.canFinalize, false);
    const r2 = calculateSettlement({
      items: [{ id: '1', description: 'Bier', qty: 1, unitPriceCents: 300, lineTotalCents: 300, assignedTo: ['a'], lowConfidence: true }],
      receiptTotalCents: 300,
      participants: [{ id: 'a', name: 'Jan' }],
      tipMode: 'none'
    });
    assertEqual(r2.canFinalize, false);
  });

  test('Regressie 5: IVA10% incl, VAT 20% extra, Discount 5,00', () => {
    assertEqual(classifyReceiptLine('IVA10% incl 2,36', 236).kind, 'vat_summary');
    assertEqual(classifyReceiptLine('VAT 20% extra', 400).kind, 'surcharge_uncertain');
    assertEqual(classifyReceiptLine('Discount 5,00', 500).normalizedCents, -500);
    assertEqual(classifyReceiptLine('Discount -5,00', -500).normalizedCents, -500);
  });

  test('Regressie 6: 3 bieren à €3,00 (€9,00) -> Jan 2 (€6,00), Petra 1 (€3,00)', () => {
    const res = calculateSettlement({
      items: [{ id: '1', description: 'Bier', qty: 3, unitPriceCents: 300, lineTotalCents: 900, assignedQuantities: { jan: 2, petra: 1 } }],
      receiptTotalCents: 900,
      participants: [{ id: 'jan', name: 'Jan' }, { id: 'petra', name: 'Petra' }],
      tipMode: 'none'
    });
    assertTrue(res.canFinalize);
    assertEqual(res.perPerson.find((p) => p.id === 'jan').totalCents, 600);
    assertEqual(res.perPerson.find((p) => p.id === 'petra').totalCents, 300);
  });

  // === PDF & LIVE TEXT ===
  test('PDF: hele regel in één tekstitem over 2 pagina\'s', () => {
    const w1 = splitPdfTextItemToWords({ str: '2 x Bier 6,00', transform: [1, 0, 0, 1, 20, 700], width: 200, height: 12 }, 800);
    assertEqual(w1.length, 4, 'PDF-item gesplitst in 4 woorden');
    const parsed = parsePlainTextReceipt('2 x Bier 6,00\n1 x Koffie 3,50\nTOTAL 9,50');
    assertEqual(parsed.items.length, 2);
    assertEqual(parsed.items[0].lineTotalCents, 600);
    assertEqual(parsed.items[1].lineTotalCents, 350);
    assertEqual(parsed.receiptTotalCents, 950);
  });

  test('Live Text: losse prijsregels worden samengevoegd', () => {
    const parsed = parsePlainTextReceipt('2 Cana\n5,00\n1 Paella\n18,50\nTOTAL\n23,50');
    assertEqual(parsed.items.length, 2);
    assertEqual(parsed.receiptTotalCents, 2350);
  });

  // === PUNT 9: NAGEBOOTSTE GEMINI-ANTWOORDEN ===
  test('Gemini Mock 1: Correct antwoord met inbegrepen IVA sluit exact', () => {
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: '2 Cana', qty: 2, unitPrice: 2.50, lineTotal: 5.00, uncertain: false },
        { name: 'Agua con gas', qty: 1, unitPrice: 2.50, lineTotal: 2.50, uncertain: false },
        { name: 'IVA 10% incl.', qty: 1, unitPrice: 0.68, lineTotal: 0.68, uncertain: false }
      ],
      receiptTotal: 7.50,
      currency: 'EUR',
      language: 'es'
    }));
    assertEqual(res.receiptTotalCents, 750);
    assertEqual(res.totalMismatch, false);
    assertEqual(res.language, 'es');
    assertTrue(validateReceiptTotal(res.items, res.receiptTotalCents).canProceed);
  });

  test('Gemini Mock 2: Afwijkende leestekens (Chinese volle-breedte-komma) & korting', () => {
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Patatas bravas', qty: 1, unitPrice: '6，50', lineTotal: '6，50', uncertain: false },
        { name: 'Descuento', qty: 1, unitPrice: '1，50', lineTotal: '1，50', uncertain: false }
      ],
      receiptTotal: '5，00',
      currency: 'EUR',
      language: 'es'
    }));
    assertEqual(res.items[0].lineTotalCents, 650);
    assertEqual(res.items[1].lineTotalCents, -150);
    assertEqual(res.receiptTotalCents, 500);
    assertEqual(res.totalMismatch, false);
  });

  test('Gemini Mock 3: Kapotte/ongeldige JSON geeft begrijpelijke foutmelding', () => {
    assertThrows(() => parseGeminiReceiptJson('{"items": [{"name": "Bier"'), 'Kapotte JSON moet fout geven');
    assertThrows(() => parseGeminiReceiptJson('{"geenItems": true}'), 'Ontbrekende items-array moet fout geven');
  });

  test('Gemini Mock 4: Ontbrekend bontotaal blokkeert canProceed', () => {
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [{ name: 'Koffie', qty: 2, unitPrice: 3.20, lineTotal: 6.40, uncertain: false }],
      receiptTotal: null,
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(res.receiptTotalCents, null);
    assertEqual(validateReceiptTotal(res.items, res.receiptTotalCents).canProceed, false);
  });

  test('Gemini Mock 5: Regelsom != bontotaal markeert regels als onzeker en blokkeert', () => {
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Bier', qty: 2, unitPrice: 3.00, lineTotal: 6.00, uncertain: false },
        { name: 'Bitterballen', qty: 1, unitPrice: 8.50, lineTotal: 8.50, uncertain: false }
      ],
      receiptTotal: 16.00,
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(res.totalMismatch, true);
    assertTrue(res.items.every((i) => i.lowConfidence === true), 'Regels gemarkeerd als onzeker');
    assertEqual(validateReceiptTotal(res.items, res.receiptTotalCents).canProceed, false);
  });

  test('Gemini Mock 6: Leeg of deels ingevuld antwoord & foutmeldingen (429/503/403/0)', () => {
    const resEmpty = parseGeminiReceiptJson(JSON.stringify({ items: [], receiptTotal: null }));
    assertEqual(resEmpty.emptyResult, true);

    const resPartial = parseGeminiReceiptJson(JSON.stringify({
      items: [{ name: '', qty: 1, unitPrice: null, lineTotal: null, uncertain: true }],
      receiptTotal: null
    }));
    assertEqual(resPartial.items[0].needsPriceConfirmation, true);
    assertEqual(resPartial.items[0].lowConfidence, true);

    // v14: foutmapping van de Firebase AI Logic-route (geen sleutel-fouten meer)
    assertEqual(mapFirebaseAiError({ code: 'ai/resource-exhausted', message: '429 Quota exceeded' }).fallbackCode, 'http_429');
    assertTrue(mapFirebaseAiError({ code: 'ai/resource-exhausted', message: '429 Quota exceeded' }).message.includes('spend cap'));
    assertEqual(mapFirebaseAiError({ code: 'ai/unavailable', message: '503 model overloaded' }).fallbackCode, 'http_5xx');
    const acErr = mapFirebaseAiError({ code: 'ai/permission-denied', message: '403 PERMISSION_DENIED: To access this model, you must enforce Firebase App Check' });
    assertEqual(acErr.fallbackCode, 'config');
    assertTrue(acErr.message.includes('App Check'));
    assertEqual(mapFirebaseAiError(new TypeError('Failed to fetch')).fallbackCode, 'network');
    assertTrue(mapFirebaseAiError(new TypeError('Failed to fetch')).message.includes('internet'));

    const tMap = parseGeminiTranslationJson('{"translations":[{"id":"1","nl":"Tapbier"}]}');
    assertEqual(tMap['1'], 'Tapbier');
  });


  // === PUNT 11: SUBTOTAAL, SOMCONTROLE VAN ONDERAF, BTW-ANKER, KOMMA-NOTATIE & LOKALE BACKUP ===

  test('P11.1 Subtotaal: zonder woordlabel (onder gerechten) & boven gerechten & losse btw/fooi/korting', () => {
    // Subtotaal zonder woordlabel onder de gerechten
    const rBelow = parsePlainTextReceipt('1 Bier 3,50\n1 Bitterballen 8,50\n12,00\nTOTAL 12,00');
    const activeBelow = rBelow.items.filter((i) => !i.excluded);
    assertEqual(activeBelow.length, 2, 'Onbenoemd subtotaal (12,00) uit gerechtenlijst gehaald');
    assertEqual(rBelow.activeSumCents, 1200);

    // Subtotaal zonder woordlabel BOVEN de gerechten
    const rAbove = parsePlainTextReceipt('12,00\n1 Bier 3,50\n1 Bitterballen 8,50\nTOTAL 12,00');
    const activeAbove = rAbove.items.filter((i) => !i.excluded);
    assertEqual(activeAbove.length, 2, 'Subtotaal boven de gerechten uit gerechtenlijst gehaald');
    assertEqual(rAbove.activeSumCents, 1200);

    // Btw, fooi, korting en Zwischensumme/Sous-total op losse regels
    const rNonDish = parsePlainTextReceipt(
      '1 Schnitzel 18,00\nZwischensumme 18,00\n19% MwSt 2,87\nTrinkgeld 2,00\nRabatt 3,00\nSumme 17,00'
    );
    const activeNonDish = rNonDish.items.filter((i) => !i.excluded);
    assertEqual(activeNonDish.length, 2, 'Alleen Schnitzel (18,00) en Rabatt (-3,00) in lijst; geen subtotaal/btw/fooi');
    assertEqual(activeNonDish[1].lineTotalCents, -300, 'Rabatt is negatief');
  });

  test('P11.2 Lokale backup (ppu-paddle-ocr): losse naam/prijs regels én samengevoegde regels', () => {
    const resSplit = parseLocalOcrOutput(['2 Cana', '5,00', '1 Calamares', '12,00', 'Subtotal', '17,00', 'TOTAL', '17,00']);
    assertEqual(resSplit.engine, 'ppu-paddle-ocr');
    assertEqual(resSplit.items.filter((i) => !i.excluded).length, 2);
    assertEqual(resSplit.receiptTotalCents, 1700);
    assertEqual(resSplit.totalMismatch, false);

    const resMerged = parseLocalOcrOutput(['2 Cana 5,00', '1 Calamares 12,00', 'TOTAL 17,00']);
    assertEqual(resMerged.items.filter((i) => !i.excluded).length, 2);
    assertEqual(resMerged.receiptTotalCents, 1700);
  });

  test('P11.3 Somcontrole van onderaf: btw inbegrepen, VS-belasting erbovenop, en dubbele kandidaat', () => {
    // 1. Btw inbegrepen (NL/ES/DE)
    const rIncl = reconcileBottomUp({
      items: [
        { id: '1', description: 'Pizza', qty: 1, unitPriceCents: 1200, lineTotalCents: 1200 },
        { id: '2', description: 'Cola', qty: 1, unitPriceCents: 300, lineTotalCents: 300 }
      ],
      vatCents: 124,
      receiptTotalCents: 1500
    });
    assertEqual(rIncl.taxMode, 'vat_included');
    assertEqual(rIncl.matchesTotal, true);

    // 2. Belasting erbovenop (VS: subtotaal 20,00 + tax 2,00 + tip 3,00 = totaal 25,00)
    const rUs = reconcileBottomUp({
      items: [
        { id: '1', description: 'Burger', qty: 1, unitPriceCents: 1500, lineTotalCents: 1500 },
        { id: '2', description: 'Fries', qty: 1, unitPriceCents: 500, lineTotalCents: 500 }
      ],
      subtotalCents: 2000,
      vatCents: 200,
      tipCents: 300,
      receiptTotalCents: 2500
    });
    assertEqual(rUs.taxMode, 'vat_added');
    assertEqual(rUs.matchesTotal, true);

    // 3. Dubbele kandidaat (twee geldige combinaties -> toont beide, kiest niet zelf)
    const rAmb = reconcileBottomUp({
      items: [
        { id: '1', description: 'Gerecht A', qty: 1, unitPriceCents: 1000, lineTotalCents: 1000 },
        { id: '2', description: 'Gerecht B', qty: 1, unitPriceCents: 1000, lineTotalCents: 1000 }
      ],
      receiptTotalCents: 1000
    });
    assertEqual(rAmb.taxMode, 'ambiguous');
    assertTrue(rAmb.ambiguousCandidates.length >= 2, 'Toont beide kandidaten zonder stil te kiezen');
  });

  test('P11.4 Btw-anker: btw, IVA, MwSt, TVA, VAT en tax naast percentage', () => {
    for (const line of ['BTW 9% 1,20', 'IVA 10% 2,36', '19% MwSt 3,10', 'TVA 20% 4,00', 'VAT 20% 5,50', 'Sales tax 8.5% 1.70']) {
      assertTrue(isVatAnchorLine(line), `Moet btw-anker zijn: ${line}`);
    }
  });

  test('P11.5 Komma-notatie: 1450 -> 14,50, 1.250,00, 1,250.00, uitzonderingen & onbenoemd subtotaal', () => {
    // 1450 -> 14,50 met herstel-markering + onbenoemd subtotaal
    const rRest = parsePlainTextReceipt('1 Steak 1450\n1 Water 2,50\n1700\nTOTAL 17,00');
    const act = rRest.items.filter((i) => !i.excluded);
    assertEqual(act.length, 2, 'Onbenoemd subtotaal (1700 -> 17,00) herkend en verwijderd');
    assertEqual(act[0].lineTotalCents, 1450);
    assertEqual(act[0].restoredDecimal, true, 'Herstelde komma gemarkeerd');

    // Duizendtallen NL/DE/ES (1.250,00) vs EN/US (1,250.00)
    const fmtEu = detectReceiptNumberFormat(['1 Diner 1.250,00', 'TOTAL 1.250,00'], 'EUR');
    assertEqual(parseAmountWithFormat('1.250,00', fmtEu, '1 Diner 1.250,00', 'EUR').cents, 125000);
    const fmtUs = detectReceiptNumberFormat(['1 Dinner 1,250.00', 'TOTAL 1,250.00'], 'USD');
    assertEqual(parseAmountWithFormat('1,250.00', fmtUs, '1 Dinner 1,250.00', 'USD').cents, 125000);

    // Uitzonderingen: gewicht, percentage, datum, JPY onaangeroerd
    assertEqual(parseAmountWithFormat('1,250', fmtEu, '1,250 kg kaas 12,50', 'EUR'), null, 'Gewicht genegeerd');
    assertEqual(parseAmountWithFormat('21%', fmtEu, '21% BTW', 'EUR'), null, 'Percentage genegeerd');
    assertEqual(parseAmountWithFormat('19-11-2026', fmtEu, 'Datum 19-11-2026', 'EUR'), null, 'Datum genegeerd');
    const fmtJpy = detectReceiptNumberFormat(['1 Ramen 1450'], 'JPY');
    assertEqual(parseAmountWithFormat('1450', fmtJpy, '1 Ramen 1450', 'JPY'), null, 'JPY niet naar 14,50');
  });


  // === V7 TESTS (PUNT 1 T/M 5) ===

  test('V7.1 Komma-herstel op Gemini-route: "1450" in items én vaste velden + herstelmarkering', () => {
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Steak', qty: 1, price: '1450', uncertain: false },
        { name: 'Water', qty: 1, price: '2,50', uncertain: false }
      ],
      subtotal: '1700',
      vat: '1,55',
      tip: '200',
      total: '19,00',
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(res.items[0].lineTotalCents, 1450, '1450 in Gemini item hersteld naar € 14,50');
    assertEqual(res.items[0].restoredDecimal, true, 'Herstelde komma gemarkeerd op item');
    assertEqual(res.items[0].lowConfidence, true, 'Herstelde komma vereist controle');
    assertEqual(res.subtotalCents, 1700, '1700 in subtotal hersteld naar € 17,00');
    assertEqual(res.tipCents, 200, '200 in tip hersteld naar € 2,00');
    assertEqual(res.restoredFields.subtotal, true, 'Hersteld subtotaal gemarkeerd');
    assertEqual(res.restoredFields.tip, true, 'Herstelde fooi gemarkeerd');
    assertEqual(res.totalMismatch, false, 'Somcontrole klopt: 14,50 + 2,50 + 2,00 fooi = 19,00');
  });

  test('V7.2 Tweede btw-regel op Gemini-route: beide tarieven (9% en 21%) opgeteld', () => {
    // Variant A: meerdere btw-regels als lijst in vat[]
    const rArr = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Burger', qty: 1, price: 15.00 },
        { name: 'Bier', qty: 1, price: 5.00 }
      ],
      subtotal: 20.00,
      vat: [1.35, 1.05],
      total: 22.40,
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(rArr.vatCents, 240, 'Beide btw-bedragen (1,35 + 1,05) opgeteld tot 240 cent');
    assertEqual(rArr.taxMode, 'vat_added', 'Somcontrole van onderaf sluit met opgetelde btw');
    assertEqual(rArr.totalMismatch, false);

    // Variant B: twee btw-regels die het model toch in items[] zette
    const rItems = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Burger', qty: 1, price: 15.00 },
        { name: 'Bier', qty: 1, price: 5.00 },
        { name: 'BTW 9%', qty: 1, price: 1.35 },
        { name: 'BTW 21%', qty: 1, price: 1.05 }
      ],
      subtotal: 20.00,
      total: 22.40,
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(rItems.items.length, 2, 'Beide btw-regels uit items[] gefilterd');
    assertEqual(rItems.vatCents, 240, 'Beide btw-regels opgeteld tot 240 cent');
    assertEqual(rItems.totalMismatch, false);
  });

  test('V7.3 Betaalwoorden BAR, KARTE en CARTE (met woordgrenzen)', () => {
    assertEqual(classifyNonDishKeyword('BAR 25,00'), 'payment');
    assertEqual(classifyNonDishKeyword('KARTE 25,00'), 'payment');
    assertEqual(classifyNonDishKeyword('CARTE 40,10'), 'payment');
    // Woordgrenzen: "Barbecue" of "Carbonara" mag GEEN betaalwoord zijn
    assertEqual(classifyNonDishKeyword('Barbecue kip 14,50'), null);
    assertEqual(classifyNonDishKeyword('Pasta Carbonara 13,50'), null);

    const parsed = parsePlainTextReceipt(`1 Schnitzel 18,00
1 Bier 7,00
TOTAL 25,00
BAR 25,00
KARTE 25,00
CARTE 25,00`);
    assertEqual(parsed.items.length, 2, 'BAR/KARTE/CARTE worden nooit gerechten');
    assertEqual(parsed.totalMismatch, false);
  });

  test('V7.4 Geen naam is geen gerecht: huisnummer "480" wordt geen gerecht en blokkeert niet', () => {
    const parsed = parsePlainTextReceipt(`Hoofdstraat
480
1 Koffie 3,50
1 Taart 4,50
TOTAL 8,00`);
    assertEqual(parsed.items.length, 2, 'Alleen Koffie en Taart zijn gerechten; huisnummer 480 niet');
    assertEqual(parsed.activeSumCents, 800);
    assertEqual(parsed.totalMismatch, false);
    assertTrue(validateReceiptTotal(parsed.items, parsed.receiptTotalCents).canProceed, 'Afronden niet geblokkeerd door huisnummer');
  });

  test('V7.5 Spaties in bedragen: "€2, 49" wordt genormaliseerd tot € 2,49', () => {
    assertEqual(normalizePunctuation('1 Koffie €2, 49'), '1 Koffie €2,49');
    const parsed = parsePlainTextReceipt(`1 Koffie €2, 49
1 Thee €2, 51
TOTAL €5, 00`);
    assertEqual(parsed.items.length, 2);
    assertEqual(parsed.items[0].lineTotalCents, 249);
    assertEqual(parsed.items[1].lineTotalCents, 251);
    assertEqual(parsed.receiptTotalCents, 500);
    assertEqual(parsed.totalMismatch, false);
  });

  test('V7.6 Lokale backup kolomkoppeling op bounding boxes in wisselende volgorde', () => {
    // Gesimuleerde scheve bon: OCR geeft eerst alle prijzen of door elkaar terug, maar met echte box-coördinaten
    const boxes = [
      { text: '8,50', box: { x: 420, y: 142, width: 60, height: 18 } },
      { text: '2 Tapbier', box: { x: 20, y: 100, width: 120, height: 18 } },
      { text: '1 Bitterballen', box: { x: 20, y: 140, width: 150, height: 18 } },
      { text: '7,00', box: { x: 420, y: 102, width: 60, height: 18 } },
      { text: '15,50', box: { x: 420, y: 202, width: 70, height: 18 } },
      { text: 'TOTAL', box: { x: 20, y: 200, width: 80, height: 18 } }
    ];
    const merged = mergeOcrLinesToSingleRow(boxes);
    assertEqual(merged[0], '2 Tapbier 7,00');
    assertEqual(merged[1], '1 Bitterballen 8,50');
    assertEqual(merged[2], 'TOTAL 15,50');

    const res = parseLocalOcrOutput(boxes);
    assertEqual(res.items.length, 2);
    assertEqual(res.items[0].description, 'Tapbier');
    assertEqual(res.items[0].lineTotalCents, 700);
    assertEqual(res.items[1].description, 'Bitterballen');
    assertEqual(res.items[1].lineTotalCents, 850);
    assertEqual(res.receiptTotalCents, 1550);
    assertEqual(res.totalMismatch, false);
  });

  // === V8 TESTS (PUNT 2, 3a, 3c, 3d, 6) ===

  test('V8.1 Kale cijferregels: boven een naam, onder een naam en onderaan de bon (nooit gerecht, nooit geplakt)', () => {
    // Kale regel BOVEN de naamregel
    const rAbove = parsePlainTextReceipt(`480
Hoofdstraat
1 Koffie 3,50
1 Taart 4,50
TOTAL 8,00`);
    assertEqual(rAbove.items.length, 2, '480 boven Hoofdstraat wordt geen gerecht');
    assertEqual(rAbove.activeSumCents, 800);
    assertEqual(rAbove.totalMismatch, false);

    // Kale regel ONDER de naamregel (merge-route, het V7.4-geval)
    const rBelow = parsePlainTextReceipt(`Hoofdstraat
480
1 Koffie 3,50
1 Taart 4,50
TOTAL 8,00`);
    assertEqual(rBelow.items.length, 2, '480 onder Hoofdstraat wordt niet geplakt');
    assertTrue(!rBelow.items.some((i) => i.description.includes('Hoofdstraat')), 'Hoofdstraat is geen gerecht');

    // Kale regel ONDERAAN de bon
    const rBottom = parsePlainTextReceipt(`1 Koffie 3,50
1 Taart 4,50
TOTAL 8,00
Kassanummer
1082`);
    assertEqual(rBottom.items.length, 2, '1082 onderaan wordt geen gerecht');
    assertEqual(rBottom.totalMismatch, false);

    // Prijzen met decimaalteken mogen WEL nog samengevoegd worden (Live Text-gedrag bewaren)
    const rLive = parsePlainTextReceipt(`2 Cana
5,00
TOTAL
5,00`);
    assertEqual(rLive.items.length, 1, 'Decimale prijsregel plakt nog op de naamregel');
    assertEqual(rLive.items[0].lineTotalCents, 500);
  });

  test('V8.2 Zelf-hosting manifest: juiste woordenboeknaam en geen enkele externe URL in de backup-route', () => {
    assertTrue(LOCAL_OCR_MODELS.dictFile.endsWith('ppocrv6_tiny_dict.txt'), 'PP-OCRv6_tiny hoort bij ppocrv6_tiny_dict.txt');
    for (const [key, val] of Object.entries(LOCAL_OCR_MODELS)) {
      assertTrue(!/^https?:\/\//i.test(val), `${key} moet een lokaal pad zijn, geen externe URL: ${val}`);
    }
    assertTrue(LOCAL_OCR_MODELS.wasmBase.endsWith('/js/vendor/ort-wasm/'), 'wasmBase wijst naar de eigen ort-wasm map');
  });

  test('V8.3 Deeltekst van de uitslag: "Jan € 14,50 · Els € 22,00 · totaal € 36,50"', () => {
    const res = calculateSettlement({
      items: [
        { id: '1', description: 'Pizza', qty: 1, unitPriceCents: 1450, lineTotalCents: 1450, assignedTo: ['jan'] },
        { id: '2', description: 'Pasta', qty: 1, unitPriceCents: 2200, lineTotalCents: 2200, assignedTo: ['els'] }
      ],
      receiptTotalCents: 3650,
      participants: [{ id: 'jan', name: 'Jan' }, { id: 'els', name: 'Els' }],
      tipMode: 'none'
    });
    const text = buildSettlementShareText(res, 'totaal');
    assertEqual(text, 'Jan € 14,50 · Els € 22,00 · totaal € 36,50');
    assertEqual(buildSettlementShareText({ perPerson: [] }), '', 'Lege afrekening geeft lege tekst');
  });

  test('V8.4 Schuinte-correctie: naam en prijs op een scheve regel worden toch gekoppeld', () => {
    // Zelfde bon als V7.6 maar dan sterk gescheef: elke regel loopt schuin op,
    // dus de prijzenkolom (rechts) staat per regel hoger dan de naam (links).
    const slope = -0.18;
    const mk = (text, x, yBase) => ({
      text,
      box: { x, y: Math.round(yBase + slope * x), width: 60, height: 18 }
    });
    const boxes = [
      mk('8,50', 420, 140),
      mk('2 Tapbier', 20, 100),
      mk('1 Bitterballen', 20, 140),
      mk('7,00', 420, 100),
      mk('15,50', 420, 200),
      mk('TOTAL', 20, 200)
    ];
    const merged = mergeOcrLinesToSingleRow(boxes);
    assertEqual(merged[0], '2 Tapbier 7,00', 'Scheve regel 1 gekoppeld');
    assertEqual(merged[1], '1 Bitterballen 8,50', 'Scheve regel 2 gekoppeld');
    assertEqual(merged[2], 'TOTAL 15,50', 'Scheve totaalregel gekoppeld');

    const res = parseLocalOcrOutput(boxes);
    assertEqual(res.items.length, 2);
    assertEqual(res.receiptTotalCents, 1550);
    assertEqual(res.totalMismatch, false);
  });


  // === V9 TESTS (PUNT 1 T/M 7) ===

  test('V9.1a Komma-herstel slaat NOOIT aan op NL-adres/postcode (plakvak-route)', () => {
    const parsed = parsePlainTextReceipt(`Cafe De Kerk
Kerkstraat 480
1011 AB Amsterdam
1 Koffie 3,50
1 Appeltaart 4,50
TOTAAL 8,00
PIN 8,00`);
    assertEqual(parsed.items.length, 2, 'Alleen Koffie en Appeltaart zijn gerechten');
    assertTrue(!parsed.items.some((i) => /kerkstraat|amsterdam/i.test(i.description)), 'Adresregels zijn geen gerecht');
    assertTrue(!parsed.items.some((i) => i.lineTotalCents === 480 || i.lineTotalCents === 1011), 'Huisnummer/postcode geen bedrag');
    assertEqual(parsed.activeSumCents, 800);
    assertEqual(parsed.receiptTotalCents, 800);
    assertEqual(parsed.totalMismatch, false);
    assertTrue(validateReceiptTotal(parsed.items, parsed.receiptTotalCents).canProceed, 'Afronden niet geblokkeerd');
  });

  test('V9.1b Komma-herstel slaat NOOIT aan op US-adres/ZIP (plakvak-route, $-notatie)', () => {
    const parsed = parsePlainTextReceipt(`JOE'S DINER
123 Main Street
AUSTIN TX 78701
1 Burger 15.00
1 Fries 5.00
TOTAL 20.00`, 'USD');
    assertEqual(parsed.items.length, 2, 'Alleen Burger en Fries zijn gerechten');
    assertTrue(!parsed.items.some((i) => /austin|main street/i.test(i.description)), 'Adresregels zijn geen gerecht');
    assertTrue(!parsed.items.some((i) => i.lineTotalCents === 78701), 'ZIP 78701 is geen bedrag van $ 787,01');
    assertEqual(parsed.receiptTotalCents, 2000);
    assertEqual(parsed.totalMismatch, false);
  });

  test('V9.1c Adres- en postcoderegels in DE/FR/ES/IT (plakvak-route)', () => {
    const rDe = parsePlainTextReceipt(`Gasthaus Adler
Hauptstraße 48
10115 Berlin
1 Schnitzel 18,50
1 Bier 4,50
SUMME 23,00
KARTE 23,00`);
    assertEqual(rDe.items.length, 2, 'DE: alleen Schnitzel en Bier');
    assertEqual(rDe.totalMismatch, false);

    const rFr = parsePlainTextReceipt(`Bistrot du Coin
12 rue de la Paix
75002 Paris
1 Croque 9,50
1 Verre de vin 6,00
CARTE 15,50
TOTAL 15,50`);
    assertEqual(rFr.items.length, 2, 'FR: alleen Croque en Verre de vin');
    assertEqual(rFr.totalMismatch, false);

    const rEs = parsePlainTextReceipt(`Bar Manolo
Calle Mayor 25
28013 Madrid
2 Cana 5,00
1 Racion pulpo 14,00
TARJETA 19,00
TOTAL 19,00`);
    assertEqual(rEs.items.length, 2, 'ES: alleen Cana en Racion pulpo');
    assertEqual(rEs.totalMismatch, false);

    const rIt = parsePlainTextReceipt(`Trattoria da Luigi
Via Roma 10
20121 Milano
1 Pinsa romana 12,00
1 Vino della casa 7,00
TOTALE 19,00`);
    assertEqual(rIt.items.length, 2, 'IT: alleen Pinsa en Vino');
    assertEqual(rIt.totalMismatch, false);
  });

  test('V9.1d Adresregels op de OCR-route (bounding boxes) worden geen gerechten', () => {
    const mk = (text, x, y) => ({ text, box: { x, y, width: 90, height: 16 } });
    const res = parseLocalOcrOutput([
      [mk('Cafe De Kerk', 20, 20), ],
      [mk('Kerkstraat 480', 20, 60)],
      [mk('1 Koffie', 20, 100), mk('3,50', 400, 100)],
      [mk('1 Appeltaart', 20, 140), mk('4,50', 400, 140)],
      [mk('TOTAAL', 20, 180), mk('8,00', 400, 180)],
      [mk('PIN', 20, 220), mk('8,00', 400, 220)]
    ]);
    assertEqual(res.items.length, 2, 'OCR: alleen Koffie en Appeltaart');
    assertTrue(!res.items.some((i) => /kerkstraat|pin/i.test(i.description)), 'Adres en PIN geen gerecht via OCR');
    assertEqual(res.receiptTotalCents, 800);
    assertEqual(res.totalMismatch, false);
  });

  test('V9.1e Adresregels op de Gemini-verificatieroute worden overgeslagen, komma-herstel werkt daar nog wel', () => {
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: '1 Steak', qty: 1, price: '1450', uncertain: false },
        { name: 'Kerkstraat', qty: 1, price: '480', uncertain: false },
        { name: 'AUSTIN TX', qty: 1, price: '78701', uncertain: false }
      ],
      total: '14,50',
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(res.items.length, 1, 'Adresregels uit Gemini items[] overgeslagen');
    assertEqual(res.items[0].lineTotalCents, 1450, 'Komma-herstel 1450 -> 14,50 werkt nog');
    assertEqual(res.items[0].restoredDecimal, true);
    assertEqual(res.totalMismatch, false);
  });

  test('V9.1f Kaaie getallen van 3+ cijfers zonder decimale context worden geen hele euro\'s meer (Gemini-route)', () => {
    // Een kaal getal als 480 mag NOOIT stil € 480,00 worden; hooguit gemarkeerd onbekend.
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Steak', qty: 1, price: 1450, uncertain: false },
        { name: 'Water', qty: 1, price: '2,50', uncertain: false }
      ],
      total: '17,00',
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(res.items[0].lineTotalCents, 1450, '1450 met decimale bonnotatie hersteld naar 14,50');
    const res2 = parseGeminiReceiptJson(JSON.stringify({
      items: [{ name: 'Steak', qty: 1, price: 480, uncertain: false }],
      total: '4,80',
      currency: 'EUR',
      language: 'nl'
    }));
    assertTrue(res2.items[0].lineTotalCents === null || res2.items[0].lineTotalCents === 480,
      '480 wordt nooit € 480,00 (hooguit herstelde € 4,80 of gemarkeerd onbekend)');
    assertTrue(res2.items[0].lineTotalCents !== 48000, 'Geen € 480,00');
  });

  test('V9.1g isAddressOrPostalNumber dekt NL/EN/DE/FR/ES/IT/US en laat echte bedragen met rust', () => {
    assertTrue(isAddressOrPostalNumber('480', 'Kerkstraat 480'), 'NL huisnummer na straatnaam');
    assertTrue(isAddressOrPostalNumber('10', 'Via Roma 10'), 'IT huisnummer');
    assertTrue(isAddressOrPostalNumber('123', 'Main Street 123'), 'US huisnummer');
    assertTrue(isAddressOrPostalNumber('78701', 'AUSTIN TX 78701'), 'US ZIP na staatcode');
    assertTrue(isAddressOrPostalNumber('17000', 'LA ROCHELLE 17000'), 'FR postcode aan einde');
    assertTrue(isAddressOrPostalNumber('10115', '10115 Berlin'), 'DE postcode voor plaats');
    assertTrue(isAddressOrPostalNumber('1011', '1011 AB Amsterdam'), 'NL postcode');
    assertTrue(isAddressOrPostalNumber('75002', '75002 Paris'), 'FR postcode voor plaats');
    assertTrue(isAddressOrPostalNumber('20121', '20121 Milano'), 'IT postcode');
    assertTrue(isAddressOrPostalNumber('78701-1234', 'AUSTIN TX 78701-1234'), 'US ZIP+4');
    // Echte bedragen blijven onaangeroerd
    assertTrue(!isAddressOrPostalNumber('1450', '1 Steak 1450'), '1450 bij gerecht blijft herstelbaar');
    assertTrue(!isAddressOrPostalNumber('1450', ''), 'Kaal 1450 zonder context blijft herstelbaar');
    assertTrue(!isAddressOrPostalNumber('850', '1 Nachos 850'), '850 bij gerecht blijft herstelbaar');
  });

  test('V9.2a Betaalwoord PIN en varianten zijn betaalregels, Pinot/Pinsa/Pint niet', () => {
    for (const line of ['PIN 43,00', 'PINNEN 43,00', 'PINBETALING 43,00', 'PINPAS 43,00', 'EC 43,00', 'V PAY 43,00', 'MASTERCARD 43,00', 'AMEX 43,00', 'CONTACTLESS 43,00']) {
      assertEqual(classifyNonDishKeyword(line), 'payment', `Betaalregel: ${line}`);
    }
    for (const line of ['Pinot Grigio 6,50', 'Pinsa Romana 12,00', 'Pint 5,00', 'Pinto bonen 4,00', 'Spinazie 8,00', 'Pincho moruno 3,50']) {
      assertEqual(classifyNonDishKeyword(line), null, `GEEN betaalregel: ${line}`);
    }
  });

  test('V9.2b "PIN 43,00" op alle drie de routes (plakvak, OCR, Gemini)', () => {
    const rPaste = parsePlainTextReceipt(`1 Biefstuk 22,50
1 Wijn 6,50
1 Wite wijn 6,50
1 Nachos 7,50
TOTAAL 43,00
PIN 43,00`);
    assertEqual(rPaste.items.length, 4, 'PIN is geen gerecht (plakvak)');
    assertEqual(rPaste.totalMismatch, false);

    const mk = (text, x, y) => ({ text, box: { x, y, width: 90, height: 16 } });
    const rOcr = parseLocalOcrOutput([
      [mk('1 Biefstuk', 20, 100), mk('22,50', 400, 100)],
      [mk('1 Wijn', 20, 140), mk('6,50', 400, 140)],
      [mk('1 Wite wijn', 20, 180), mk('6,50', 400, 180)],
      [mk('1 Nachos', 20, 220), mk('7,50', 400, 220)],
      [mk('TOTAAL', 20, 260), mk('43,00', 400, 260)],
      [mk('PIN', 20, 300), mk('43,00', 400, 300)]
    ]);
    assertEqual(rOcr.items.length, 4, 'PIN is geen gerecht (OCR)');
    assertEqual(rOcr.totalMismatch, false);

    const rGem = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Biefstuk', qty: 1, price: '22,50' },
        { name: 'Wijn', qty: 1, price: '6,50' },
        { name: 'Wite wijn', qty: 1, price: '6,50' },
        { name: 'Nachos', qty: 1, price: '7,50' },
        { name: 'PIN', qty: 1, price: '43,00' }
      ],
      total: '43,00',
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(rGem.items.length, 4, 'PIN-regel uit Gemini items[] gefilterd');
    assertEqual(rGem.totalMismatch, false);
  });

  test('V9.3 Privacytekst en woordenboek: 24 MB rekenmotor, geen MyMemory, geen dode online-functie', () => {
    const privNl = STRINGS.nl.privacyBody.join(' ');
    const privEn = STRINGS.en.privacyBody.join(' ');
    assertTrue(privNl.includes('~24 MB'), 'NL privacytekst noemt ~24 MB rekenmotor');
    assertTrue(privEn.includes('~24 MB'), 'EN privacytekst noemt ~24 MB');
    assertTrue(!privNl.includes('~12 MB') && !privEn.includes('~12 MB'), 'Nergens meer ~12 MB');
    assertTrue(!privNl.toLowerCase().includes('mymemory') && !privEn.toLowerCase().includes('mymemory'), 'Geen MyMemory-vermelding');
    assertTrue(!('lookupSinglePhraseOnline' in dictionaryModule), 'Dode functie lookupSinglePhraseOnline is verwijderd');
    assertTrue(typeof STRINGS.nl.clipboardFailed === 'string' && STRINGS.nl.clipboardFailed.length > 0, 'NL klembord-foutmelding aanwezig');
    assertTrue(typeof STRINGS.en.clipboardFailed === 'string' && STRINGS.en.clipboardFailed.length > 0, 'EN klembord-foutmelding aanwezig');
  });

  test('V9.4 Btw in vat[] én in items[] wordt niet dubbel geteld (dedupe)', () => {
    const res = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Burger', qty: 1, price: 15.00 },
        { name: 'Bier', qty: 1, price: 5.00 },
        { name: 'BTW 9%', qty: 1, price: 1.35 },
        { name: 'BTW 21%', qty: 1, price: 1.05 }
      ],
      subtotal: 20.00,
      vat: [1.35, 1.05],
      total: 22.40,
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(res.items.length, 2, 'Btw-regels uit items[] gefilterd');
    assertEqual(res.vatCents, 240, 'Btw eenmalig geteld: 1,35 + 1,05 = 2,40 (niet 4,80)');
    assertEqual(res.totalMismatch, false, 'Somcontrole sluit met eenmalige btw');

    // Enkel in items[] blijft werken (geen vals verlies van de tweede btw-regel)
    const resItemsOnly = parseGeminiReceiptJson(JSON.stringify({
      items: [
        { name: 'Burger', qty: 1, price: 15.00 },
        { name: 'Bier', qty: 1, price: 5.00 },
        { name: 'BTW 9%', qty: 1, price: 1.35 },
        { name: 'BTW 21%', qty: 1, price: 1.05 }
      ],
      subtotal: 20.00,
      total: 22.40,
      currency: 'EUR',
      language: 'nl'
    }));
    assertEqual(resItemsOnly.vatCents, 240, 'Alleen in items[]: beide btw-regels nog steeds opgeteld');
    assertEqual(resItemsOnly.totalMismatch, false);
  });

  test('V9.5 Vriendelijke NL-foutmeldingen voor kapot, leeg of verkeerd bestand', () => {
    assertTrue(isImageDecodeError(new Error('The source image could not be decoded')), 'Decode-fout herkend');
    assertTrue(isImageDecodeError(new Error('Invalid PDF structure')), 'PDF-fout herkend');
    assertTrue(!isImageDecodeError(new Error('HTTP 500')), 'Gewone HTTP-fout is geen decode-fout');

    const friendly = friendlyScanError(new Error('The source image could not be decoded'), { isPdf: false });
    assertTrue(/foto|bestand/i.test(friendly) && !/could not be decoded/i.test(friendly), 'NL-melding i.p.v. Engelse decode-fout');
    const friendlyPdf = friendlyScanError(new Error('The source image could not be decoded'), { isPdf: true });
    assertTrue(/pdf/i.test(friendlyPdf), 'PDF-variant van de melding');

    assertTrue(/leeg/i.test(emptyFileMessage()), 'Melding voor leeg bestand');
    assertTrue(/geen foto of pdf/i.test(wrongFileTypeMessage()), 'Melding voor verkeerd bestandstype');
    assertTrue(/tekstlaag/i.test(scannedPdfWithoutGeminiMessage()), 'Melding voor gescande pdf zonder sleutel');
    assertTrue(/offline/i.test(localModelsOfflineMessage()) && !/ontbreken op deze server/i.test(localModelsOfflineMessage()),
      'Offline-modellen-melding is niet misleidend');
  });

  // === v13: DEELNEMER BETAALT NIET MEE (te gast, jarig, andere reden) ===
  const mkHostedState = (overrides = {}) => ({
    items: [
      { id: '1', description: 'Pizza', qty: 1, unitPriceCents: 2000, lineTotalCents: 2000, assignedTo: ['a'] },
      { id: '2', description: 'Pasta', qty: 1, unitPriceCents: 1500, lineTotalCents: 1500, assignedTo: ['b'] },
      { id: '3', description: 'Verjaardagstaart', qty: 1, unitPriceCents: 1001, lineTotalCents: 1001, assignedTo: ['c'] }
    ],
    receiptTotalCents: 4501,
    participants: [
      { id: 'a', name: 'Anna' },
      { id: 'b', name: 'Bram' },
      { id: 'c', name: 'Cees' }
    ],
    tipMode: 'none',
    hosted: { c: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} } },
    ...overrides
  });

  test('v13a) Gast (standaard: alle anderen gelijk) - restcent naar grootste eigen aandeel', () => {
    const res = calculateSettlement(mkHostedState());
    const a = res.perPerson.find((p) => p.id === 'a');
    const b = res.perPerson.find((p) => p.id === 'b');
    const c = res.perPerson.find((p) => p.id === 'c');
    // Cees' € 10,01 over Anna en Bram: 500+501; Anna heeft het grootste eigen aandeel -> zij krijgt de restcent
    assertEqual(a.totalCents, 2000 + 501);
    assertEqual(b.totalCents, 1500 + 500);
    assertEqual(c.totalCents, 0);
    assertEqual(c.hosted, true);
    assertEqual(c.hostedAmountCents, 1001);
    assertEqual(a.carries.length, 1);
    assertEqual(a.carries[0].guestId, 'c');
    assertEqual(a.carries[0].cents, 501);
    assertEqual(a.carries[0].remainderCents, 1, 'restcent zichtbaar bij Anna');
    assertEqual(b.carries[0].remainderCents, 0);
    assertEqual(res.grandTotalCents, 4501);
    assertEqual(res.hostedErrors.length, 0);
    assertTrue(res.invariantExact);
    assertTrue(res.canFinalize);
    const summary = res.hostedSummaries.find((h) => h.guestId === 'c');
    assertEqual(summary.amountCents, 1001);
    assertEqual(summary.shares.reduce((sum, sh) => sum + sh.cents, 0), 1001, 'som van overname exact');
  });

  test('v13b) Eén gekozen drager neemt alles over', () => {
    const res = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: ['b'], mode: 'equal', percent: {}, fixedCents: {} } }
    }));
    assertEqual(res.perPerson.find((p) => p.id === 'a').totalCents, 2000);
    assertEqual(res.perPerson.find((p) => p.id === 'b').totalCents, 1500 + 1001);
    assertEqual(res.perPerson.find((p) => p.id === 'c').totalCents, 0);
    assertEqual(res.grandTotalCents, 4501);
    assertTrue(res.canFinalize);
  });

  test('v13c) Twee gasten, één drager draagt beide delen', () => {
    const res = calculateSettlement(mkHostedState({
      hosted: {
        a: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} },
        c: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} }
      }
    }));
    assertEqual(res.perPerson.find((p) => p.id === 'a').totalCents, 0);
    assertEqual(res.perPerson.find((p) => p.id === 'c').totalCents, 0);
    assertEqual(res.perPerson.find((p) => p.id === 'b').totalCents, 1500 + 2000 + 1001);
    assertEqual(res.perPerson.find((p) => p.id === 'b').carries.length, 2);
    assertEqual(res.grandTotalCents, 4501);
    assertTrue(res.canFinalize);
  });

  test('v13d) Percentage 75/25 met restcent naar het grootste aandeel', () => {
    const res = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'percent', percent: { a: 75, b: 25 }, fixedCents: {} } }
    }));
    // 75% van 1001 = 750 (floor), 25% = 250, restcent 1 naar grootste aandeel (Anna)
    assertEqual(res.perPerson.find((p) => p.id === 'a').carries[0].cents, 751);
    assertEqual(res.perPerson.find((p) => p.id === 'b').carries[0].cents, 250);
    assertEqual(res.perPerson.find((p) => p.id === 'a').carries[0].remainderCents, 1);
    assertEqual(res.grandTotalCents, 4501);
    assertTrue(res.canFinalize);
  });

  test('v13e) Percentage dat geen 100% is blokkeert de afronding', () => {
    const res = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'percent', percent: { a: 33, b: 33 }, fixedCents: {} } }
    }));
    assertEqual(res.hostedErrors.length, 1);
    assertEqual(res.hostedErrors[0].code, 'percent_sum');
    assertEqual(res.canFinalize, false);
    // niets stilletjes aangepast: Cees houdt zijn deel, totaal blijft kloppen
    assertEqual(res.perPerson.find((p) => p.id === 'c').totalCents, 1001);
    assertEqual(res.grandTotalCents, 4501);
  });

  test('v13f) Vast bedrag exact verdeeld werkt; som die niet klopt blokkeert zonder aanpassen', () => {
    const ok = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'fixed', percent: {}, fixedCents: { a: 1000, b: 1 } } }
    }));
    assertEqual(ok.perPerson.find((p) => p.id === 'a').totalCents, 3000);
    assertEqual(ok.perPerson.find((p) => p.id === 'b').totalCents, 1501);
    assertEqual(ok.perPerson.find((p) => p.id === 'c').totalCents, 0);
    assertTrue(ok.canFinalize);

    const fout = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'fixed', percent: {}, fixedCents: { a: 600, b: 600 } } }
    }));
    assertEqual(fout.hostedErrors[0].code, 'fixed_sum');
    assertEqual(fout.hostedErrors[0].expectedCents, 1001);
    assertEqual(fout.hostedErrors[0].actualCents, 1200);
    assertEqual(fout.canFinalize, false);
    assertEqual(fout.perPerson.find((p) => p.id === 'a').totalCents, 2000, 'geen stille aanpassing');
    assertEqual(fout.perPerson.find((p) => p.id === 'c').totalCents, 1001);

    const ongeldig = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'fixed', percent: {}, fixedCents: { a: 1000 } } }
    }));
    assertEqual(ongeldig.hostedErrors[0].code, 'fixed_invalid');
    assertEqual(ongeldig.canFinalize, false);
  });

  test('v13g) Geen geldige dragers (alleen niet-betalers of onbekenden gekozen) blokkeert', () => {
    const res = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: ['x', 'c'], mode: 'equal', percent: {}, fixedCents: {} } }
    }));
    assertEqual(res.hostedErrors[0].code, 'no_carriers');
    assertEqual(res.canFinalize, false);

    const allen = calculateSettlement(mkHostedState({
      hosted: {
        a: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} },
        b: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} },
        c: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} }
      }
    }));
    assertEqual(allen.hostedErrors.length, 3);
    assertEqual(allen.canFinalize, false);
  });

  test('v13h) Fooi volgt het overgenomen bedrag (doelbedrag-modus)', () => {
    const res = calculateSettlement(mkHostedState({
      tipMode: 'target_total',
      targetTotalCents: 4901
    }));
    // fooi 400 over a,b,c: 134+133+133; Cees draagt 1001+133=1134 over aan Anna en Bram (567+567)
    const a = res.perPerson.find((p) => p.id === 'a');
    const b = res.perPerson.find((p) => p.id === 'b');
    const c = res.perPerson.find((p) => p.id === 'c');
    assertEqual(c.hostedAmountCents, 1134);
    assertEqual(c.totalCents, 0);
    assertEqual(a.totalCents, 2134 + 567);
    assertEqual(b.totalCents, 1633 + 567);
    assertEqual(res.grandTotalCents, 4901);
    assertTrue(res.invariantExact);
    assertTrue(res.canFinalize);
  });

  test('v13i) Gast met deel van € 0,00 hoeft niets over te nemen', () => {
    const res = calculateSettlement({
      items: [{ id: '1', description: 'Koffie', qty: 1, unitPriceCents: 500, lineTotalCents: 500, assignedTo: ['a'] }],
      receiptTotalCents: 500,
      participants: [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bram' }],
      tipMode: 'none',
      hosted: { b: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} } }
    });
    assertEqual(res.perPerson.find((p) => p.id === 'b').totalCents, 0);
    assertEqual(res.hostedErrors.length, 0);
    const summary = res.hostedSummaries.find((h) => h.guestId === 'b');
    assertEqual(summary.amountCents, 0);
    assertTrue(res.canFinalize);
  });

  test('v13j) Deeltekst blijft kloppen: gast op € 0,00 en totaal ongewijzigd', () => {
    const res = calculateSettlement(mkHostedState());
    const text = buildSettlementShareText(res, 'totaal');
    assertTrue(text.includes('Cees € 0,00'), 'gast staat op nul in de deeltekst');
    assertTrue(text.includes('totaal € 45,01'), 'totaal ongewijzigd');
    const som = res.perPerson.reduce((sum, p) => sum + p.totalCents, 0);
    assertEqual(som, res.grandTotalCents);
  });

  test('v13l) Wisselgeld van een overnemer wordt ná de overname herberekend', () => {
    // Scenario uit de onafhankelijke controle: bon 10,00 (Aob) + 10,01 (Bob, Cob, Dob),
    // Aob betaalt niet mee en Bob neemt alles over. Bob moet 13,34 betalen; bij 20,00
    // contant is het wisselgeld 6,66 (niet 16,66, het bedrag vóór de overname).
    const mkCashState = (cash) => ({
      items: [
        { id: '1', description: 'Koffie', qty: 1, unitPriceCents: 1000, lineTotalCents: 1000, assignedTo: ['a'] },
        { id: '2', description: 'Lunch', qty: 1, unitPriceCents: 1001, lineTotalCents: 1001, assignedTo: ['b', 'c', 'd'] }
      ],
      receiptTotalCents: 2001,
      participants: [
        { id: 'a', name: 'Aob' },
        { id: 'b', name: 'Bob', paidCashCents: cash },
        { id: 'c', name: 'Cob' },
        { id: 'd', name: 'Dob' }
      ],
      tipMode: 'none',
      hosted: { a: { enabled: true, carrierIds: ['b'], mode: 'equal', percent: {}, fixedCents: {} } }
    });
    const res = calculateSettlement(mkCashState(2000));
    const bob = res.perPerson.find((p) => p.id === 'b');
    assertEqual(bob.totalCents, 334 + 1000, 'Bob draagt eigen deel plus overname');
    assertEqual(bob.changeCents, 666, 'wisselgeld na overname');
    assertEqual(res.grandTotalCents, 2001);
    assertTrue(res.invariantExact);

    const teWeinig = calculateSettlement(mkCashState(1000));
    assertEqual(teWeinig.perPerson.find((p) => p.id === 'b').changeCents, -334, 'tekort na overname zichtbaar');

    // Gast met een contant bedrag: eindbedrag is 0, dus alles komt terug.
    const gastCash = calculateSettlement({
      ...mkCashState(null),
      participants: [
        { id: 'a', name: 'Aob', paidCashCents: 500 },
        { id: 'b', name: 'Bob' },
        { id: 'c', name: 'Cob' },
        { id: 'd', name: 'Dob' }
      ]
    });
    const aob = gastCash.perPerson.find((p) => p.id === 'a');
    assertEqual(aob.totalCents, 0);
    assertEqual(aob.changeCents, 500, 'gast krijgt contant bedrag volledig terug');

    // Zonder hosted-regel blijft het oude gedrag exact hetzelfde.
    const gewoon = calculateSettlement({
      items: [{ id: '1', description: 'Diner', qty: 1, unitPriceCents: 3250, lineTotalCents: 3250, assignedTo: ['a'] }],
      receiptTotalCents: 3250,
      participants: [{ id: 'a', name: 'Anna', paidCashCents: 5000 }],
      tipMode: 'none'
    });
    assertEqual(gewoon.perPerson[0].changeCents, 1750, 'wisselgeld zonder overname ongewijzigd');
  });

  test('v13m) Percentages moeten precies 100,00 zijn (99,99 en 100,01 blokkeren)', () => {
    const on99 = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'percent', percent: { a: 49.99, b: 50 }, fixedCents: {} } }
    }));
    assertEqual(on99.hostedErrors[0].code, 'percent_sum');
    assertEqual(on99.canFinalize, false);
    assertEqual(on99.perPerson.find((p) => p.id === 'c').totalCents, 1001, 'niets stilletjes aangepast');
    assertEqual(on99.grandTotalCents, 4501, 'totaal op het scherm blijft kloppen');

    // 3 x 33,33 bij drie dragers (99,99%): blokkeren, ook bij een groot deel.
    const drie = calculateSettlement({
      items: [{ id: '1', description: 'Groepsbon', qty: 1, unitPriceCents: 99999, lineTotalCents: 99999, assignedTo: ['d'] }],
      receiptTotalCents: 99999,
      participants: [
        { id: 'a', name: 'Anna' }, { id: 'b', name: 'Bram' }, { id: 'c', name: 'Cees' }, { id: 'd', name: 'Daan' }
      ],
      tipMode: 'none',
      hosted: { d: { enabled: true, carrierIds: null, mode: 'percent', percent: { a: 33.33, b: 33.33, c: 33.33 }, fixedCents: {} } }
    });
    assertEqual(drie.hostedErrors[0].code, 'percent_sum');
    assertEqual(drie.canFinalize, false);
    assertEqual(drie.perPerson.find((p) => p.id === 'd').totalCents, 99999, 'ontbrekende centen gaan nergens heen');

    const over100 = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'percent', percent: { a: 50.01, b: 50 }, fixedCents: {} } }
    }));
    assertEqual(over100.hostedErrors[0].code, 'percent_sum');
    assertEqual(over100.canFinalize, false);

    // Een decimaal exacte som van 100 (ook met meer decimalen) werkt gewoon.
    const exact = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'percent', percent: { a: 50.005, b: 49.995 }, fixedCents: {} } }
    }));
    assertEqual(exact.hostedErrors.length, 0);
    assertTrue(exact.canFinalize);
    assertEqual(exact.grandTotalCents, 4501);
  });

  test('v13n) Bij een fout blijft het echte deel van de gast zichtbaar (geen 0,00)', () => {
    const res = calculateSettlement(mkHostedState({
      hosted: { c: { enabled: true, carrierIds: null, mode: 'fixed', percent: {}, fixedCents: { a: 600, b: 600 } } }
    }));
    assertEqual(res.hostedErrors[0].code, 'fixed_sum');
    // De gastkaart valt terug op deze rij: het echte deel van Cees is 10,01.
    assertEqual(res.hostedSummaries.find((h) => h.guestId === 'c'), undefined);
    const c = res.perPerson.find((p) => p.id === 'c');
    assertEqual(c.totalCents, 1001, 'echte deel van de gast beschikbaar voor de kaart');
    assertEqual(res.grandTotalCents, 4501);
  });

  test('v13o) Gastbericht is neutraal geformuleerd (NL en EN)', () => {
    const nl = STRINGS.nl.shareMessageHostedGuest;
    assertTrue(nl.includes('je hoeft deze keer niets te betalen'), 'NL: neutrale formulering');
    assertTrue(!nl.includes('te gast'), 'NL: geen verplichte reden in het bericht');
    assertTrue(nl.includes('{name}') && nl.includes('{amount}'), 'NL: plaatsaanduidingen behouden');
    const en = STRINGS.en.shareMessageHostedGuest;
    assertTrue(en.includes('do not have to pay anything this time'), 'EN: neutrale formulering');
    assertTrue(!en.includes('our guest'), 'EN: geen verplichte reden in het bericht');
    assertTrue(en.includes('{name}') && en.includes('{amount}'), 'EN: plaatsaanduidingen behouden');
  });

  test('v13k) Zonder hosted-regel verandert er niets (achterwaarts compatibel)', () => {
    const res = calculateSettlement(mkHostedState({ hosted: {} }));
    assertEqual(res.perPerson.find((p) => p.id === 'a').totalCents, 2000);
    assertEqual(res.perPerson.find((p) => p.id === 'c').totalCents, 1001);
    assertEqual(res.hostedErrors.length, 0);
    assertEqual(res.hostedSummaries.length, 0);
    assertTrue(res.canFinalize);
    for (const row of res.perPerson) {
      assertEqual(row.hosted, false);
      assertEqual(row.carries.length, 0);
    }
  });

  // ---- v17: compacte bonregel (kruisje, ongedaan maken, uitklappen) ----

  test('V17.1 compactRowModel: naam, aantal, regeltotaal; vertaling gaat voor', () => {
    const m = compactRowModel({ id: 'a', description: 'Bier', geminiTranslation: 'Biertje', qty: 2, unitPriceCents: 250, lineTotalCents: 500 });
    assertEqual(m.name, 'Biertje', 'Vertaling als naam');
    assertEqual(m.qty, 2);
    assertEqual(m.lineTotalCents, 500);
    assertEqual(m.unitPriceCents, 250, 'Prijs p.s. = regeltotaal / aantal');
    const zonderVertaling = compactRowModel({ id: 'b', description: 'Wijn', qty: 1, lineTotalCents: 450 });
    assertEqual(zonderVertaling.name, 'Wijn', 'Zonder vertaling de originele naam');
    const vreemdeQty = compactRowModel({ id: 'c', description: 'X', qty: 0, lineTotalCents: 100 });
    assertEqual(vreemdeQty.qty, 1, 'Ongeldig aantal wordt 1');
  });

  test('V17.2 computedUnitPriceCents: afronding en null zonder totaal', () => {
    assertEqual(computedUnitPriceCents({ qty: 3, lineTotalCents: 100 }), 33, '100/3 -> 33');
    assertEqual(computedUnitPriceCents({ qty: 1, lineTotalCents: -250 }), -250, 'Korting blijft negatief');
    assertEqual(computedUnitPriceCents({ qty: 2 }), null, 'Geen regeltotaal -> null');
  });

  test('V17.3 kruisje: deleteItemAt muteert niet en restoreDeletedItem zet terug op plek', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    for (const idx of [0, 1, 2]) {
      const { items: rest, deleted } = deleteItemAt(items, idx);
      assertEqual(rest.length, 2, 'Eén regel minder');
      assertEqual(items.length, 3, 'Invoer ongemoeid');
      assertEqual(deleted.item.id, items[idx].id, 'Juiste regel verwijderd');
      const terug = restoreDeletedItem(rest, deleted);
      assertEqual(terug.map((i) => i.id).join(','), 'a,b,c', `Volgorde hersteld na idx ${idx}`);
    }
    const noop = deleteItemAt(items, 9);
    assertEqual(noop.deleted, null, 'Ongeldige idx verwijdert niets');
    assertEqual(noop.items.length, 3);
    const clamp = restoreDeletedItem([{ id: 'x' }], { item: { id: 'y' }, idx: 99 });
    assertEqual(clamp.map((i) => i.id).join(','), 'x,y', 'Herstel clampt op het einde');
  });

  test('V17.4 uitklappen: twijfelregels standaard open, normale regels dicht', () => {
    const expandedIds = new Set();
    const collapsedIds = new Set();
    assertTrue(isItemExpanded('onzeker', { needsReview: true, expandedIds, collapsedIds }), 'Twijfelregel open');
    assertTrue(!isItemExpanded('ok', { needsReview: false, expandedIds, collapsedIds }), 'Normale regel dicht');
  });

  test('V17.5 uitklappen: tik wisselt de toestand, ook voor twijfelregels', () => {
    const expandedIds = new Set();
    const collapsedIds = new Set();
    assertTrue(toggleItemExpanded('ok', { needsReview: false, expandedIds, collapsedIds }), 'Normale regel gaat open');
    assertTrue(isItemExpanded('ok', { needsReview: false, expandedIds, collapsedIds }));
    assertTrue(!toggleItemExpanded('ok', { needsReview: false, expandedIds, collapsedIds }), 'En weer dicht');
    assertTrue(!toggleItemExpanded('onzeker', { needsReview: true, expandedIds, collapsedIds }), 'Twijfelregel kan dicht');
    assertTrue(!isItemExpanded('onzeker', { needsReview: true, expandedIds, collapsedIds }), 'Blijft dicht');
    assertTrue(toggleItemExpanded('onzeker', { needsReview: true, expandedIds, collapsedIds }), 'En weer open');
  });

  function clearSavedNames() {
    localStorage.removeItem('bonnetje_saved_names_v1');
  }

  test('V21.1 waarschuwingen alleen op stap 4, niet meer tijdens verdelen', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    const hits = app.split("unassignedWarning', {").length - 1;
    assertEqual(hits, 1, 'onverdeeld-waarschuwing komt nog maar op één plek voor (stap 4)');
    assertTrue(app.indexOf('function renderStep4') < app.indexOf("unassignedWarning', {"), 'die ene plek is stap 4');
  });

  test('V22.1 stap 3: namen per regel aantikken, geen persoonstabblad meer', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    const i18n = fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
    assertTrue(!app.includes('personTabs'), 'geen persoonstabblad meer in stap 3');
    assertTrue(!i18n.includes('selectPersonPrompt'), 'hulptekst "kies eerst een persoon" is weg');
    assertTrue(app.includes('assign-quick'), 'snelrij met Hele tafel / Niemand aanwezig');
    assertTrue(app.includes("className: `chip-btn chip-assign ${on ? 'active' : ''}`"), 'aan/uit-chips per regel');
    assertTrue(app.includes('assign-qty-row'), 'stappenrij − n + bij aantallen-regels');
    assertTrue(i18n.includes("nobody: 'Niemand'") && i18n.includes("nobody: 'Nobody'"), 'i18n "Niemand" in nl en en');
  });

  test('V22.2 stap 3 tik-gedrag: tik wijst toe, Hele tafel gelijk, Niemand leeg', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    assertTrue(app.includes('item.assignedTo = isAll ? [] : [...allIds];'), 'Hele tafel verdeelt gelijk over iedereen');
    assertTrue(app.includes('item.assignedQuantities[p.id] = 1;'), 'tik op aantallen-regel telt als 1 stuk');
    assertTrue(app.includes("delete item.assignedQuantities[p.id];"), 'tik op toegewezen naam haalt die weer weg');
    assertTrue(app.includes('disabled: remaining <= 0'), 'plus-knop stopt bij het aantal op de bon (geen oververdeling)');
  });

  test('V22.3 korte chip-namen: altijd eenduidig, zo kort mogelijk', async () => {
    const { shortDisplayNames } = await import('../js/names.js');
    const mk = (names) => shortDisplayNames(names.map((n, i) => ({ id: 'p' + i, name: n })));
    const labels = (m) => [...m.values()];

    const m1 = mk(['Jolanda', 'Henk', 'Richard', 'Rebecca', 'John']);
    assertEqual(labels(m1).join('|'), 'Jolanda|Henk|Richard|Rebecca|John', 'losse voornamen blijven heel');

    const m2 = mk(['Jan de Vries', 'Jan Smit', 'Jana', 'Johan', 'John']);
    const l2 = labels(m2);
    assertEqual(l2[0], 'Jan V', 'gelijke voornaam: eerste letter van de achternaam erbij');
    assertEqual(l2[1], 'Jan S', 'idem met eigen hoofdletter');
    assertEqual(l2[2], 'Jana', 'Jana was al uniek');
    assertEqual(new Set(l2.map((x) => x.toLowerCase())).size, 5, 'alles eenduidig');

    const m3 = mk(['Alexandra', 'Alexander']);
    const l3 = labels(m3);
    assertEqual(new Set(l3.map((x) => x.toLowerCase())).size, 2, 'afgekapte lange voornamen worden toch onderscheiden');

    const m4 = mk(['Jan de Vries', 'Jan de Vries']);
    assertEqual(new Set(labels(m4)).size, 2, 'zelfs identieke volledige namen krijgen een eigen label');

    const pool = ['Jan', 'Jana', 'Johan', 'John', 'Jan de Vries', 'Jan Smit', 'Jan Dijk', 'Alexandra', 'Alexander', 'Bram', 'Cees de Vries'];
    for (let r = 0; r < 50; r++) {
      const pick = Array.from({ length: 2 + (r % 19) }, (_, i) => pool[(r * 7 + i * 3) % pool.length]);
      const labs = labels(mk(pick)).map((x) => x.toLowerCase());
      assertEqual(new Set(labs).size, pick.length, `fuzz ${r}: labels altijd uniek`);
    }
  });

  test('V22.4 chips tonen kort label, bewaren volledige naam in aria-label', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    const css = fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
    assertTrue(app.includes('shortDisplayNames(session.participants)'), 'stap 3 rekent korte labels uit');
    assertTrue(app.includes("'aria-label': p.name"), 'volledige naam blijft als aria-label op de chip');
    assertTrue(/\.chip-assign[^}]*font-size:\s*0\.82rem/.test(css), 'chip-letters kleiner (~13 px)');
    assertTrue(/\.chip-assign[^}]*min-height:\s*var\(--tap-min\)/.test(css), 'tikhoogte blijft 44 px');
  });

  test('V22.5 bonfoto blijft zichtbaar, overleeft herlaad (IndexedDB), verdwijnt bij reset', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    const store = fs.readFileSync(new URL('../js/photo-store.js', import.meta.url), 'utf8');
    assertTrue(app.includes("from './photo-store.js'"), 'foto-opslag module gekoppeld');
    assertTrue(app.includes('saveReceiptPhoto'), 'foto wordt bewaard bij intake');
    const clears = app.split('clearReceiptPhoto()').length - 1;
    assertTrue(clears >= 3, `foto verdwijnt bij Nieuwe bon, Alles wissen én Foto wissen (${clears} opruimplekken)`);
    assertTrue(store.includes('indexedDB.open'), 'opslag via IndexedDB (overleeft herlaad)');
    assertTrue(!store.includes('localStorage'), 'foto nooit in localStorage');
    assertTrue(store.includes("typeof indexedDB === 'undefined'"), 'fail-soft zonder IndexedDB (jsdom/privemodus)');
    assertTrue(app.includes('photo-lightbox'), 'tik op voorbeeld opent vergrote weergave');
    assertTrue(app.includes('loadReceiptPhoto()'), 'bij laden wordt een bewaarde foto weer getoond');
  });

  test('V23.1 stap 2: één kleine Gast-schakelaar per deelnemer, uitleg één keer', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    const i18n = fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
    assertTrue(!app.includes('hostedToggleLabel') && !i18n.includes('hostedToggleLabel'), 'lange herhaalde tekst per rij is weg');
    assertTrue(app.includes('guest-toggle'), 'kleine Gast-schakelaar per rij');
    assertEqual(app.split("t(lang, 'guestHelp')").length - 1, 1, 'uitleg staat maar op één plek (boven de lijst)');
    assertTrue(i18n.includes('wordt verdeeld over de rest'), 'uitleg beschrijft wat de rekenkern doet: deel wordt verdeeld over de rest');
    assertTrue(i18n.includes('kies je in stap 4'), 'uitleg wijst op de drager-keuze in stap 4');
    assertTrue(app.includes("getHostedRule(p.id).enabled = !isGast"), 'schakelaar zet dezelfde hosted-regel als voorheen (rekenkern ongewijzigd)');
    assertTrue(app.includes("'aria-pressed': String(isGast)"), 'stand is afleesbaar voor schermlezers');
  });

  test('V23.2 × wist direct zonder regels, vraagt één keer bij toewijzingen (review)', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    assertTrue(app.includes('heeftRegels'), '× controleert eerst op toewijzingen');
    assertTrue(app.includes('removeParticipantWithItems'), 'korte bevestiging bij deelnemer met regels');
    assertTrue(app.includes('(it.assignedTo || []).includes(p.id)') && app.includes("(it.assignedQuantities || {})[p.id]"), 'controle dekt gelijk verdeeld én stuks');
    assertEqual(app.split('window.confirm(t(lang, \'removeParticipantWithItems\'').length - 1, 1, 'maar één bevestigvraag, alleen op deze plek');
    const i18n = fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
    assertTrue(i18n.includes('heeft regels. Toch verwijderen?'), 'NL-tekst kort en duidelijk');
  });

  test('V24.1 meerdere als fooi: wisselgeld 0, cent-invariant houdt', () => {
    const basis = (extra) => ({
      items: [
        { id: '1', description: 'Soep', qty: 1, unitPriceCents: 820, lineTotalCents: 820, assignedTo: ['a'] },
        { id: '2', description: 'Burger', qty: 1, unitPriceCents: 1250, lineTotalCents: 1250, assignedTo: ['b'] }
      ],
      receiptTotalCents: 2070,
      participants: [
        { id: 'a', name: 'Anna', paidCashCents: 1000, ...extra },
        { id: 'b', name: 'Bram' }
      ],
      tipMode: 'none'
    });
    // retour (standaard): geen fooi, 1,80 wisselgeld
    let res = calculateSettlement(basis({}));
    assertEqual(res.perPerson[0].tipCents, 0, 'zonder keuze geen fooi');
    assertEqual(res.perPerson[0].changeCents, 180, 'retour is het meerdere');
    assertEqual(res.perPerson[0].excessTipCents, 0);
    assertTrue(res.invariantExact && res.canFinalize, 'invariant houdt bij retour');
    // fooi: meerdere wordt fooi, wisselgeld 0, totaal klopt nog steeds exact
    res = calculateSettlement(basis({ excessAsTip: true }));
    assertEqual(res.perPerson[0].excessTipCents, 180, 'meerdere als fooi geboekt');
    assertEqual(res.perPerson[0].tipCents, 180);
    assertEqual(res.perPerson[0].totalCents, 1000, 'hij betaalt precies zijn contante bedrag');
    assertEqual(res.perPerson[0].changeCents, 0, 'geen wisselgeld meer');
    assertEqual(res.grandTotalCents, 2250, 'eindsom = bon + fooi');
    assertEqual(res.totalTipCents, 180);
    assertTrue(res.invariantExact && res.canFinalize, 'cent-invariant houdt met fooi');
    // bedrag later verlagen onder het deel: fooi verdwijnt vanzelf, geen rare rest
    const lager = basis({ excessAsTip: true });
    lager.participants[0].paidCashCents = 800;
    res = calculateSettlement(lager);
    assertEqual(res.perPerson[0].tipCents, 0, 'geen fooi als contant lager is dan het deel');
    assertEqual(res.perPerson[0].changeCents, -20, 'gewoon tekort');
    assertTrue(res.invariantExact, 'invariant houdt bij verlaagd bedrag');
    // bedrag wissen: helemaal geen fooi, geen wisselgeldregel
    const gewist = basis({ excessAsTip: true });
    gewist.participants[0].paidCashCents = null;
    res = calculateSettlement(gewist);
    assertEqual(res.perPerson[0].tipCents, 0, 'gewist bedrag boekt geen fooi');
    assertEqual(res.perPerson[0].changeCents, null);
    assertTrue(res.invariantExact, 'invariant houdt bij gewist bedrag');
  });

  test('V24.1b reviewer-voorbeeld: drager met gast, fooi pas na overname', () => {
    const maak = (extra) => ({
      items: [
        { id: '1', description: 'A', qty: 1, unitPriceCents: 2000, lineTotalCents: 2000, assignedTo: ['anna'] },
        { id: '2', description: 'B', qty: 1, unitPriceCents: 2000, lineTotalCents: 2000, assignedTo: ['bram'] }
      ],
      receiptTotalCents: 4000,
      participants: [
        { id: 'anna', name: 'Anna' },
        { id: 'bram', name: 'Bram', ...extra }
      ],
      tipMode: 'none',
      hosted: { anna: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} } }
    });
    // Bram: eigen 20 + overgenomen 20 = 40. Contant 50, Retour: wisselgeld 10.
    let res = calculateSettlement(maak({ paidCashCents: 5000 }));
    let bram = res.perPerson.find((r) => r.id === 'bram');
    assertEqual(bram.totalCents, 4000, 'drager eindbedrag 40 incl. overname');
    assertEqual(bram.changeCents, 1000, 'retour: wisselgeld 10');
    // Fooi: fooi 10 (50 - 40), niet 30 (50 - 20). Totaal 50, wisselgeld 0.
    res = calculateSettlement(maak({ paidCashCents: 5000, excessAsTip: true }));
    bram = res.perPerson.find((r) => r.id === 'bram');
    assertEqual(bram.excessTipCents, 1000, 'fooi = meerdere boven het eindbedrag');
    assertEqual(bram.totalCents, 5000, 'totaal = contant');
    assertEqual(bram.changeCents, 0);
    assertTrue(res.invariantExact && res.canFinalize, 'invariant houdt met gast + fooi');
    // Contant precies 40 + Fooi: geen fooi, geen "nog bijbetalen".
    res = calculateSettlement(maak({ paidCashCents: 4000, excessAsTip: true }));
    bram = res.perPerson.find((r) => r.id === 'bram');
    assertEqual(bram.excessTipCents, 0, 'geen fooi als contant exact het eindbedrag is');
    assertEqual(bram.changeCents, 0, 'precies gepast, geen tekort');
    // Gast met contant + Fooi: vlag genegeerd, contant volledig terug.
    res = calculateSettlement(maak({}));
    res = calculateSettlement({
      ...maak({}),
      participants: [
        { id: 'anna', name: 'Anna', paidCashCents: 3000, excessAsTip: true },
        { id: 'bram', name: 'Bram' }
      ]
    });
    const anna = res.perPerson.find((r) => r.id === 'anna');
    assertEqual(anna.excessTipCents, 0, 'gast boekt nooit fooi');
    assertEqual(anna.totalCents, 0);
    assertEqual(anna.changeCents, 3000, 'gast krijgt contant volledig terug');
    assertEqual(res.totalTipCents, 0, 'geen fooi ontstaan uit gastcontant');
  });

  test('V24.3 rekenproef: duizenden willekeurige bonnen met gasten, fooimodi en Retour/Fooi', () => {
    // Vaste seed: een falende run is exact te reproduceren.
    let seed = 20261120;
    const rnd = () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
    const randInt = (min, max) => min + Math.floor(rnd() * (max - min + 1));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

    for (let iter = 0; iter < 3000; iter++) {
      const nPers = randInt(2, 5);
      const participants = [];
      for (let i = 0; i < nPers; i++) participants.push({ id: `p${i}`, name: `P${i}` });
      // 1-6 regels, elk volledig toegewezen aan een willekeurige niet-lege deelverzameling
      const items = [];
      let bill = 0;
      const nItems = randInt(1, 6);
      for (let i = 0; i < nItems; i++) {
        const price = randInt(150, 3000);
        const shuffled = [...participants].sort(() => rnd() - 0.5);
        const k = randInt(1, nPers);
        items.push({ id: `i${i}`, description: `Regel ${i}`, qty: 1, unitPriceCents: price, lineTotalCents: price, assignedTo: shuffled.slice(0, k).map((p) => p.id) });
        bill += price;
      }
      // 0-2 gasten (nooit iedereen: er moet een drager overblijven)
      const hosted = {};
      const nGasten = randInt(0, Math.min(2, nPers - 1));
      const gastIds = [...participants].sort(() => rnd() - 0.5).slice(0, nGasten).map((p) => p.id);
      for (const gid of gastIds) hosted[gid] = { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} };
      // fooimodus: geen / per persoon / rond totaalbedrag
      const tipMode = pick(['none', 'per_person', 'target_total']);
      const state = {
        items,
        receiptTotalCents: bill,
        participants: participants.map((p) => ({ ...p })),
        tipMode,
        tipPerPersonCents: {},
        hosted
      };
      if (tipMode === 'per_person') {
        for (const p of state.participants) state.tipPerPersonCents[p.id] = rnd() < 0.5 ? randInt(0, 500) : 0;
      } else if (tipMode === 'target_total') {
        state.targetTotalCents = bill + randInt(0, 1000);
        state.includeZeroConsumersInSharedTip = rnd() < 0.5;
      }

      // Fase 1: basisrun zonder contant/keuzes geeft het definitieve deel per persoon
      const basis = calculateSettlement(state);
      assertTrue(basis.invariantExact && basis.canFinalize, `iter ${iter}: basis invariant`);
      const basisTotaal = {};
      for (const r of basis.perPerson) basisTotaal[r.id] = r.totalCents;

      // Fase 2: contant = deel + willekeurige delta, per deelnemer Retour of Fooi
      const keuze = {};
      for (const p of state.participants) {
        const delta = randInt(-300, 1500);
        p.paidCashCents = Math.max(0, basisTotaal[p.id] + delta);
        p.excessAsTip = rnd() < 0.5;
        keuze[p.id] = p.excessAsTip;
      }
      const res = calculateSettlement(state);
      assertTrue(res.invariantExact && res.canFinalize, `iter ${iter}: invariant met fooi/retour`);
      const som = res.perPerson.reduce((s, r) => s + r.totalCents, 0);
      assertEqual(som, res.grandTotalCents, `iter ${iter}: som per persoon = eindsom`);
      assertEqual(res.grandTotalCents, bill + res.totalTipCents, `iter ${iter}: eindsom = bon + fooi`);
      for (const r of res.perPerson) {
        assertTrue(r.totalCents >= 0 && r.tipCents >= 0, `iter ${iter}: nooit negatief`);
        const cash = r.paidCashCents;
        const deel = basisTotaal[r.id];
        if (r.hosted) {
          // een gast heeft geen contante afrekening: Fooi doet niets, contant komt terug
          assertEqual(r.totalCents, 0, `iter ${iter}: gast betaalt 0`);
          assertEqual(r.excessTipCents, 0, `iter ${iter}: gast boekt nooit fooi`);
          assertEqual(r.changeCents, cash, `iter ${iter}: gast krijgt contant volledig terug`);
        } else if (keuze[r.id] && cash > deel) {
          // Fooi: meerdere wordt fooi, wisselgeld exact 0, totaal = contant
          assertEqual(r.excessTipCents, cash - deel, `iter ${iter}: fooi = meerdere (ook met overgenomen gastdeel)`);
          assertEqual(r.totalCents, cash, `iter ${iter}: bij Fooi totaal = contant`);
          assertEqual(r.changeCents, 0, `iter ${iter}: bij Fooi wisselgeld 0`);
        } else {
          // Retour (of Fooi zonder meerdere): geen extra fooi, wisselgeld = contant - deel
          assertEqual(r.excessTipCents, 0, `iter ${iter}: retour boekt geen fooi`);
          assertEqual(r.totalCents, deel, `iter ${iter}: retour totaal = deel`);
          assertEqual(r.changeCents, cash - deel, `iter ${iter}: wisselgeld = contant - deel`);
        }
      }
    }
  });

  test('V24.2 keuze fooi/retour alleen bij een meerdere, schakelbaar', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    const i18n = fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
    assertTrue(app.includes('excess-choice'), 'keuzerij in de persoonskaart');
    assertTrue(app.includes('excessTipCents'), 'keuze blijft zichtbaar als fooi actief is (terugschakelen kan)');
    assertTrue(app.includes('!row.hosted && meerdere > 0'), 'geen keuze bij een gast (geen contante afrekening)');
    assertTrue(app.includes('participantObj.excessAsTip = false;'), 'vlag reset zodra het bedrag niet meer boven het deel ligt');
    const kern = fs.readFileSync(new URL('../js/calculator.js', import.meta.url), 'utf8');
    assertTrue(kern.indexOf('row.hosted) continue') > kern.indexOf('hostedSummaries.push'), 'meerdere pas ná de hosted-overname berekend');
    assertEqual(app.split('excess-toggle').length - 1, 2, 'precies twee opties: retour en fooi');
    assertTrue(i18n.includes("excessRetour: 'Retour'") && i18n.includes("excessFooi: 'Fooi'"), 'NL-labels aanwezig');
    assertTrue(i18n.includes("excessRetour: 'Change back'"), 'EN-labels aanwezig');
  });

  test('V25.1 Betaald door: kern ongewijzigd, tegoed-helper klopt (ook met gast en fooi)', async () => {
    const { payerOutstandingCents } = await import('../js/calculator.js');
    const basis = () => ({
      items: [
        { id: '1', description: 'A', qty: 1, unitPriceCents: 2000, lineTotalCents: 2000, assignedTo: ['anna'] },
        { id: '2', description: 'B', qty: 1, unitPriceCents: 2000, lineTotalCents: 2000, assignedTo: ['bram'] },
        { id: '3', description: 'C', qty: 1, unitPriceCents: 1000, lineTotalCents: 1000, assignedTo: ['cara'] }
      ],
      receiptTotalCents: 5000,
      participants: [
        { id: 'anna', name: 'Anna' },
        { id: 'bram', name: 'Bram', paidCashCents: 3000, excessAsTip: true },
        { id: 'cara', name: 'Cara' }
      ],
      tipMode: 'none',
      hosted: { anna: { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} } }
    });
    // paidById is een presentatieveld: de uitslag moet er volledig door ongemoeid blijven
    const zonder = calculateSettlement(basis());
    const state = { ...basis(), paidById: 'bram' };
    const met = calculateSettlement(state);
    assertEqual(met.grandTotalCents, zonder.grandTotalCents, 'eindsom ongewijzigd door paidById');
    assertEqual(met.totalTipCents, zonder.totalTipCents, 'fooi ongewijzigd');
    assertEqual(met.perPerson.map((r) => `${r.id}:${r.totalCents}:${r.changeCents}`).join('|'),
                zonder.perPerson.map((r) => `${r.id}:${r.totalCents}:${r.changeCents}`).join('|'), 'per persoon identiek');
    assertTrue(met.invariantExact && met.canFinalize, 'cent-invariant houdt met gast + fooi + paidById');
    // tegoed: Bram schoot voor; Anna is gast (0), Cara nog niet afgerekend (10)
    assertEqual(payerOutstandingCents(met.perPerson, state.participants, 'bram'), 2000, 'tegoed = alleen open delen van niet-gasten (Cara: eigen 10 + helft gastdeel 10)');
    state.participants.find((p) => p.id === 'cara').settled = true;
    assertEqual(payerOutstandingCents(met.perPerson, state.participants, 'bram'), 0, 'afgerekend deelnemer valt uit het tegoed');
  });


  test('V25.3 review: eerdere Fooi/contant telt niet onzichtbaar mee na keuze van een betaler', async () => {
    const { payerOutstandingCents } = await import('../js/calculator.js');
    // Reviewer-scenario: Bram deel 18,00, contant 50, Fooi (fooi 32,00)
    const state = {
      items: [
        { id: '1', description: 'A', qty: 1, unitPriceCents: 1301, lineTotalCents: 1301, assignedTo: ['anna'] },
        { id: '2', description: 'B', qty: 1, unitPriceCents: 1800, lineTotalCents: 1800, assignedTo: ['bram'] }
      ],
      receiptTotalCents: 3101,
      participants: [
        { id: 'anna', name: 'Anna' },
        { id: 'bram', name: 'Bram', paidCashCents: 5000, excessAsTip: true }
      ],
      tipMode: 'none'
    };
    // Zo ziet de sessie eruit NADAT de UI bij het kiezen van betaler Anna heeft
    // opgeruimd (app.js: paidCashCents=null, excessAsTip=false voor iedereen)
    for (const p of state.participants) { p.paidCashCents = null; p.excessAsTip = false; }
    state.paidById = 'anna';
    const res = calculateSettlement(state);
    const bram = res.perPerson.find((r) => r.id === 'bram');
    assertEqual(bram.totalCents, 1800, 'Bram "Aan Anna betalen" is zijn deel, niet zijn oude contant');
    assertEqual(bram.excessTipCents, 0, 'geen fooi meer uit de oude keuze');
    assertEqual(res.totalTipCents, 0, 'totale fooi 0 na het kiezen van een betaler');
    assertEqual(payerOutstandingCents(res.perPerson, state.participants, 'anna'), 1800, 'Anna heeft alleen Brams echte deel tegoed');
    assertTrue(res.invariantExact && res.canFinalize, 'invariant houdt');
  });

  test('V25.4 rekenproef: betaler kiezen na willekeurige Fooi/contant = schone basisuitslag', async () => {
    const { payerOutstandingCents } = await import('../js/calculator.js');
    let seed = 20261120;
    const rnd = () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
    const randInt = (min, max) => min + Math.floor(rnd() * (max - min + 1));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    for (let iter = 0; iter < 3000; iter++) {
      const nPers = randInt(2, 5);
      const participants = [];
      for (let i = 0; i < nPers; i++) participants.push({ id: `p${i}`, name: `P${i}` });
      const items = [];
      let bill = 0;
      for (let i = 0, n = randInt(1, 6); i < n; i++) {
        const price = randInt(150, 3000);
        const shuffled = [...participants].sort(() => rnd() - 0.5);
        items.push({ id: `i${i}`, description: `R${i}`, qty: 1, unitPriceCents: price, lineTotalCents: price, assignedTo: shuffled.slice(0, randInt(1, nPers)).map((p) => p.id) });
        bill += price;
      }
      const hosted = {};
      const gastIds = [...participants].sort(() => rnd() - 0.5).slice(0, randInt(0, Math.min(2, nPers - 1))).map((p) => p.id);
      for (const gid of gastIds) hosted[gid] = { enabled: true, carrierIds: null, mode: 'equal', percent: {}, fixedCents: {} };
      const tipMode = pick(['none', 'per_person', 'target_total']);
      const state = {
        items, receiptTotalCents: bill, participants: participants.map((p) => ({ ...p })),
        tipMode, tipPerPersonCents: {}, hosted
      };
      if (tipMode === 'per_person') {
        for (const p of state.participants) state.tipPerPersonCents[p.id] = rnd() < 0.5 ? randInt(0, 500) : 0;
      } else if (tipMode === 'target_total') {
        state.targetTotalCents = bill + randInt(0, 1000);
      }
      // eerst rommel: willekeurige contantbedragen en Fooi-keuzes (v24)
      for (const p of state.participants) {
        p.paidCashCents = randInt(0, 9000);
        p.excessAsTip = rnd() < 0.5;
        p.settled = rnd() < 0.3;
      }
      // UI kiest een betaler: opruimen zoals app.js dat doet
      const nietGasten = state.participants.filter((p) => !hosted[p.id]);
      const betaler = pick(nietGasten);
      for (const p of state.participants) { p.paidCashCents = null; p.excessAsTip = false; }
      state.paidById = betaler.id;
      // vergelijk met de schone basis (nooit contant gehad)
      const basis = calculateSettlement({
        ...state,
        participants: state.participants.map((p) => ({ ...p, settled: p.settled }))
      });
      const res = calculateSettlement(state);
      assertTrue(res.invariantExact && res.canFinalize, `iter ${iter}: invariant met betaler`);
      assertEqual(res.totalTipCents, basis.totalTipCents, `iter ${iter}: geen fooi uit oude keuzes`);
      assertEqual(res.perPerson.map((r) => r.totalCents).join('|'), basis.perPerson.map((r) => r.totalCents).join('|'), `iter ${iter}: bedragen als zonder oude rommel`);
      for (const r of res.perPerson) {
        assertEqual(r.excessTipCents, 0, `iter ${iter}: geen meerdere-fooi meer`);
        assertEqual(r.changeCents, null, `iter ${iter}: geen contant meer`);
      }
      const verwachtTegoed = res.perPerson
        .filter((r) => r.id !== betaler.id && !r.hosted && !state.participants.find((p) => p.id === r.id).settled)
        .reduce((s, r) => s + r.totalCents, 0);
      assertEqual(payerOutstandingCents(res.perPerson, state.participants, betaler.id), verwachtTegoed, `iter ${iter}: tegoed klopt`);
    }
  });

  test('V25.2 Betaald door in de UI: keuze, regels, deeltekst en resets (bron)', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    const i18n = fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
    const storage = fs.readFileSync(new URL('../js/storage.js', import.meta.url), 'utf8');
    assertTrue(app.includes('paidby-toggle'), 'keuzerij "Wie betaalt de bon?" in stap 4');
    assertTrue(app.includes('pay-to-info'), 'regel "Aan X betalen" / "Nog tegoed" in de kaart');
    assertTrue(app.includes("session.paidById === p.id) session.paidById = null"), 'verwijderen van de betaler zet de keuze terug');
    assertTrue(app.includes('pp.paidCashCents = null;') && app.includes('pp.excessAsTip = false;'), 'kiezen van een betaler ruimt oude contant/Fooi op');
    assertTrue(app.includes('payerOutstandingCents'), 'tegoed via pure helper');
    assertTrue(storage.includes('paidById: null'), 'Nieuwe bon begint op "Iedereen zelf"');
    assertTrue(i18n.includes("paidBySelf: 'Iedereen zelf'") && i18n.includes("sharePayLine: 'Betalen aan {name}.'"), 'NL-teksten aanwezig');
    assertTrue(i18n.includes("paidBySelf: 'Each their own'") && i18n.includes("sharePayLine: 'Pay {name}.'"), 'EN-teksten aanwezig');
  });

  test('V20.1 bewaarde namen: genormaliseerd, ontdubbeld, nieuwste vooraan', () => {
    clearSavedNames();
    saveNameToHistory('  Anna   de  Vries ');
    assertEqual(loadSavedNames().join('|'), 'Anna de Vries', 'spaties genormaliseerd');
    saveNameToHistory('anna de vries');
    assertEqual(loadSavedNames().length, 1, 'hoofdlettervariant is geen dubbel');
    assertEqual(loadSavedNames()[0], 'anna de vries', 'nieuwste schrijfwijze bewaard');
    saveNameToHistory('Bram');
    saveNameToHistory('Anna de Vries');
    assertEqual(loadSavedNames().join('|'), 'Anna de Vries|Bram', 'meest recente vooraan');
    saveNameToHistory('   ');
    assertEqual(loadSavedNames().length, 2, 'lege naam wordt niet bewaard');
    clearSavedNames();
  });

  test('V20.2 bewaarde namen overleven een nieuwe bon (aparte sleutel)', () => {
    clearSavedNames();
    saveNameToHistory('Bram');
    const fresh = createEmptySession();
    saveSession(fresh);
    assertEqual(loadSavedNames().join('|'), 'Bram', 'naam blijft bewaard na bon-reset');
    clearSavedNames();
  });

  test('V20.3 oude lijsten (strings of met tellingen) migreren vanzelf', () => {
    clearSavedNames();
    localStorage.setItem('bonnetje_saved_names_v1', JSON.stringify(['Piet', { name: 'Klaas', uses: 9, lastUsed: 1 }, 'piet']));
    assertEqual(loadSavedNames().join('|'), 'Piet|Klaas', 'gemigreerd en ontdubbeld');
    clearSavedNames();
  });

  test('V20.4 bewaarde naam verwijderen (hoofdletterongevoelig, rest blijft)', () => {
    clearSavedNames();
    saveNameToHistory('Anna');
    saveNameToHistory('Bram');
    removeSavedName('ANNA');
    assertEqual(loadSavedNames().join('|'), 'Bram', 'alleen Anna weg, Bram blijft');
    removeSavedName('onbekend');
    assertEqual(loadSavedNames().join('|'), 'Bram', 'onbekende naam verwijderen is onschadelijk');
    clearSavedNames();
  });

  test('V26.1 stijlen: standaard is de huidige stijl, keuze wordt onthouden', () => {
    assertEqual(DEFAULT_SETTINGS.stijl, 'standaard', 'standaardstijl');
    const s = loadSettings();
    s.stijl = 'delft';
    saveSettings(s);
    assertEqual(loadSettings().stijl, 'delft', 'Delfts blauw wordt onthouden');
    const s2 = loadSettings();
    s2.stijl = 'standaard';
    saveSettings(s2);
    assertEqual(loadSettings().stijl, 'standaard', 'terug naar standaard');
    for (const lang of ['nl', 'en']) {
      for (const k of ['stijlLabel', 'stijlStandaard', 'stijlDelft', 'stijlCartoon', 'stijlVanGogh', 'stijlRembrandt', 'stijlStraat', 'stijlMondriaan']) {
        assertTrue(typeof STRINGS[lang][k] === 'string' && STRINGS[lang][k].length > 0, `tekst ${lang}.${k}`);
      }
    }
  });

  test('V26.2 stijlen: licht én donker per stijl, letters zelf meegeleverd, offline gecachet', async () => {
    const fs = await import('node:fs');
    const css = fs.readFileSync(new URL('../css/stijlen.css', import.meta.url), 'utf8');
    for (const stijl of ['delft', 'cartoon', 'vangogh', 'rembrandt', 'straat', 'mondriaan']) {
      assertTrue(css.includes(`html[data-stijl="${stijl}"] {`), `${stijl}: lichte kleuren`);
      assertTrue(css.includes(`html[data-stijl="${stijl}"]:not([data-theme="light"])`), `${stijl}: donker via systeem`);
      assertTrue(css.includes(`html[data-stijl="${stijl}"][data-theme="dark"]`), `${stijl}: donker via keuze`);
    }
    assertTrue(!/googleapis|gstatic/.test(css), 'geen Google Fonts-verbinding');
    const fonts = [...css.matchAll(/url\('\.\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
    assertEqual(fonts.length, 11, 'elf lettertypebestanden');
    for (const f of fonts) {
      assertTrue(fs.existsSync(new URL(`../css/fonts/${f}`, import.meta.url)), `lettertype ${f} staat in de repo`);
    }
    const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assertTrue(sw.includes("'./css/stijlen.css'"), 'sw cachet stijlen.css');
    assertTrue(html.includes('href="./css/stijlen.css"'), 'index laadt stijlen.css');
  });

  test('V20.6/V26 stappenbalk: één regel die kan krimpen (geen horizontale scroll bij grote tekst)', async () => {
    const fs = await import('node:fs');
    const css = fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
    const stepper = css.match(/\.stepper\s*\{[^}]*\}/)[0];
    // v26: vier kolommen die tot 0 mogen krimpen (minmax(0, 1fr)); het woord kapt af met ellipsis.
    // Een star grid (1fr zonder minmax, of nowrap-tekst die niet kan krimpen) liep in v19 over de rand.
    assertTrue(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/.test(stepper), 'kolommen mogen krimpen');
    const label = css.match(/\.step-label\s*\{[^}]*\}/)[0];
    assertTrue(label.includes('text-overflow: ellipsis') && label.includes('overflow: hidden'), 'stapwoord kapt af in plaats van te verbreden');
  });

  test('V20.5 normalisatie dekt tab en niet-brekende spatie (review-bevinding)', () => {
    assertEqual(normalizeSavedName('Cees   de  Vries'), 'Cees de Vries', 'meerdere spaties');
    assertEqual(normalizeSavedName('Cees\tde\u00A0Vries'), 'Cees de Vries', 'tab en nbsp');
    clearSavedNames();
    saveNameToHistory('Cees   de  Vries');
    saveNameToHistory('Cees de\u00A0Vries');
    assertEqual(loadSavedNames().length, 1, 'varianten met tab/nbsp zijn geen dubbels');
    clearSavedNames();
  });

  test('V19.1 service worker: v19 kan oude clients nooit vasthouden', async () => {
    const fs = await import('node:fs');
    const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
    assertEqual(CACHE_NAME, 'bonnetje-v26', 'manifest-cache is actueel (v26)');
    assertTrue(sw.includes(`const CACHE_NAME = '${CACHE_NAME}';`), 'sw-cache volgt de manifest-cache');
    assertTrue(sw.includes("req.mode === 'navigate'"), 'navigaties gaan network-first');
    assertTrue(sw.indexOf('fetch(req)') < sw.indexOf('caches.match(req'), 'network komt vóór cache in de navigatie-route');
    assertTrue(sw.includes('w.navigate(w.url)'), 'sw navigeert oude clients geforceerd bij activate');
    assertTrue(sw.includes('wins.forEach'), 'navigaties worden afgevuurd zonder te awaiten (anders deadlock in activate)');
    assertTrue(!sw.includes('await Promise.all(wins.map'), 'geen ge-awaite navigatie binnen waitUntil (deadlock)');
    assertTrue(sw.includes('hadOldVersion'), 'geforceerde navigatie alleen bij echte versiewissel (niet bij eerste installatie)');
    assertTrue(sw.includes('skipWaiting'), 'nieuwe sw wacht niet op sluiten');
  });

  test('V19.2 zichtbaar versienummer + sw.js altijd vers opgehaald', async () => {
    assertEqual(APP_VERSION, '26', 'versienummer afgeleid van cache-naam');
    assertTrue(/^\d+$/.test(APP_VERSION), 'versienummer is een nummer');
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
    assertTrue(app.includes("updateViaCache: 'none'"), 'sw.js wordt altijd vers opgehaald bij update-check');
    assertTrue(app.includes('versionLabel') && app.includes('APP_VERSION'), 'instellingenmodal toont het versienummer');
    assertEqual(STRINGS.nl.versionLabel, 'Versie', 'NL-label');
    assertEqual(STRINGS.en.versionLabel, 'Version', 'EN-label');
  });

  test('V18.1 foto verkleinen vóór online scan: alleen verkleinend, verhouding behouden', () => {
    // iPhone-formaat (3024x4032) -> lange zijde 1800
    const iphone = downscalePlan(3024, 4032);
    assertTrue(iphone.needsResize === true, 'grote iPhone-foto moet verkleind worden');
    assertEqual(iphone.height, ONLINE_SCAN_MAX_LONG_SIDE, 'lange zijde = max');
    assertEqual(iphone.width, 1350, 'verhouding behouden (3024 * 1800/4032)');
    // Liggend
    const land = downscalePlan(4032, 3024);
    assertEqual(land.width, ONLINE_SCAN_MAX_LONG_SIDE, 'liggend: breedte is lange zijde');
    assertEqual(land.height, 1350, 'liggend: hoogte geschaald');
    // Klein genoeg -> ongemoeid
    const klein = downscalePlan(800, 600);
    assertTrue(klein.needsResize === false && klein.width === 800 && klein.height === 600, 'kleine foto blijft ongemoeid');
    // Precies op de grens
    assertTrue(downscalePlan(1800, 1200).needsResize === false, 'op de grens niet verkleinen');
    // Ongeldige invoer -> veilig ongemoeid
    assertTrue(downscalePlan(0, 0).needsResize === false, 'nul is veilig');
    assertTrue(downscalePlan(NaN, 100).needsResize === false, 'NaN is veilig');
    // Kwaliteit/max binnen redelijke grenzen (leesbaarheidseis)
    assertTrue(ONLINE_SCAN_MAX_LONG_SIDE >= 1400 && ONLINE_SCAN_MAX_LONG_SIDE <= 2200, 'max lange zijde binnen leesbare band');
    assertTrue(ONLINE_SCAN_JPEG_QUALITY >= 0.75 && ONLINE_SCAN_JPEG_QUALITY <= 0.95, 'jpeg-kwaliteit binnen leesbare band');
  });

  test('V18.2 terugval is niet blind: echte foutcode blijft zichtbaar', () => {
    const appCheck = mapFirebaseAiError({ code: 'app-check/fetch-stored-token', message: 'App Check: fetch stored token failed' });
    assertEqual(appCheck.rawCode, 'app-check/fetch-stored-token', 'App Check-code zichtbaar');
    assertTrue(appCheck.fallbackCode === 'config', 'App Check -> config-terugval');
    const quota = mapFirebaseAiError({ code: 'resource-exhausted', message: 'Quota exceeded' });
    assertEqual(quota.rawCode, 'resource-exhausted', 'quotumcode zichtbaar');
    assertTrue(quota.fallbackCode === 'http_429', 'quotum -> http_429-terugval');
    const net = mapFirebaseAiError(new TypeError('Failed to fetch'));
    assertTrue(net.fallbackCode === 'network', 'netwerk -> network-terugval');
    assertTrue(typeof net.rawCode === 'string' && net.rawCode.length > 0, 'altijd een rawCode');
    const onbekend = mapFirebaseAiError({ message: 'iets raars' });
    assertTrue(onbekend.rawCode === 'unknown' || onbekend.rawCode.length > 0, 'onbekende fout krijgt rawCode');
  });

  test('V17.7 schakelaar Online AI-scan: standaard aan en per toestel onthouden', () => {
    assertTrue(DEFAULT_SETTINGS.onlineAiEnabled === true, 'Standaard AAN');
    localStorage.removeItem('bonnetje_settings_v1');
    assertTrue(loadSettings().onlineAiEnabled === true, 'Zonder opgeslagen instelling: aan');
    const s = loadSettings();
    s.onlineAiEnabled = false;
    saveSettings(s);
    assertTrue(loadSettings().onlineAiEnabled === false, 'Uit wordt onthouden');
    const s2 = loadSettings();
    s2.onlineAiEnabled = true;
    saveSettings(s2);
    assertTrue(loadSettings().onlineAiEnabled === true, 'Aan wordt onthouden');
    localStorage.removeItem('bonnetje_settings_v1');
  });

  test('V17.8 schakelaar uit = geen online aanroep (poort isOnlineAiUsable)', () => {
    assertTrue(isOnlineAiUsable({ onlineAiEnabled: true }), 'Aan -> online route mag');
    assertTrue(isOnlineAiUsable({}), 'Ontbrekende instelling -> aan (standaard)');
    assertTrue(isOnlineAiUsable(undefined), 'Geen instellingen -> aan (standaard)');
    assertTrue(!isOnlineAiUsable({ onlineAiEnabled: false }), 'Uit -> GEEN online aanroep');
  });

  test('V17.6 kruisje + ongedaan maken: niets definitief kwijt, inhoud gelijk', () => {
    const items = [
      { id: 'a', description: 'Soep', qty: 1, lineTotalCents: 650 },
      { id: 'b', description: 'Brood', qty: 2, lineTotalCents: 300 }
    ];
    const { items: rest, deleted } = deleteItemAt(items, 0);
    const terug = restoreDeletedItem(rest, deleted);
    assertEqual(terug.length, 2, 'Weer twee regels');
    assertEqual(terug[0].description, 'Soep', 'Zelfde regel terug op plek 0');
    assertEqual(terug[0].lineTotalCents, 650, 'Bedrag intact');
    assertEqual(restoreDeletedItem(rest, null).length, 1, 'Zonder deleted-record geen herstel');
  });

  return results;
}


export async function runAsyncTests() {
  const results = [];
  async function testAsync(name, fn) {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  await testAsync('V7.7 Netwerkvrije proef lokale backup: geen enkel extern verzoek, werkt met echte ppu-paddle-ocr interface', async () => {
    const requestedUrls = [];
    const localOnlyFetch = async (url) => {
      requestedUrls.push(String(url));
      if (/^https?:\/\//i.test(String(url))) {
        throw new Error(`Extern netwerkverzoek geblokkeerd: ${url}`);
      }
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(8),
        text: async () => '0\n1\n2\n'
      };
    };

    let initModelOpts = null;
    class MockPaddleOcrService {
      constructor(opts) { initModelOpts = opts?.model || null; }
      async initialize() {}
      async recognize() {
        return {
          text: '1 Bier 3,50\nTOTAL 3,50',
          lines: [[
            { text: '3,50', box: { x: 400, y: 100, width: 50, height: 16 } },
            { text: '1 Bier', box: { x: 20, y: 100, width: 90, height: 16 } }
          ], [
            { text: 'TOTAL', box: { x: 20, y: 140, width: 80, height: 16 } },
            { text: '3,50', box: { x: 400, y: 140, width: 50, height: 16 } }
          ]],
          confidence: 0.96
        };
      }
    }

    const fakeFile = { arrayBuffer: async () => new ArrayBuffer(16) };
    const res = await runLocalBackupOcr(fakeFile, {
      fetchImpl: localOnlyFetch,
      moduleLoader: async () => ({ PaddleOcrService: MockPaddleOcrService })
    });

    if (!initModelOpts || !initModelOpts.detection || !initModelOpts.recognition || !initModelOpts.charactersDictionary) {
      throw new Error('PaddleOcrService niet aangeroepen met echte { model: { detection, recognition, charactersDictionary } } interface');
    }
    if (requestedUrls.some((u) => /^https?:\/\//i.test(u))) {
      throw new Error('Lokale route deed toch een extern netwerkverzoek');
    }
    if (res.items.length !== 1 || res.items[0].lineTotalCents !== 350 || res.receiptTotalCents !== 350) {
      throw new Error('Onverwacht resultaat uit netwerkvrije lokale OCR-proef');
    }
  });

  await testAsync('V9.5b Lokale backup: offline met nog-gecachete modellen geeft eerlijke NL-melding, echte 404 blijft "ontbreken op server"', async () => {
    const offlineFetch = async () => { throw new TypeError('fetch failed'); };
    let offlineErr = null;
    try {
      await runLocalBackupOcr({ arrayBuffer: async () => new ArrayBuffer(4) }, { fetchImpl: offlineFetch });
    } catch (e) { offlineErr = e; }
    if (!offlineErr) throw new Error('Offline backup zonder cache moet een fout geven');
    if (!/offline/i.test(offlineErr.message)) throw new Error(`Offline-melding verwacht, kreeg: ${offlineErr.message}`);
    if (/ontbreken op deze server/i.test(offlineErr.message)) throw new Error('Misleidende "ontbreken op server" bij offline');

    const notFoundFetch = async () => ({ ok: false, status: 404 });
    let nfErr = null;
    try {
      await runLocalBackupOcr({ arrayBuffer: async () => new ArrayBuffer(4) }, { fetchImpl: notFoundFetch });
    } catch (e) { nfErr = e; }
    if (!nfErr || !/ontbreken op deze server/i.test(nfErr.message)) {
      throw new Error(`Echte 404 moet "ontbreken op deze server" melden, kreeg: ${nfErr && nfErr.message}`);
    }
  });

  await testAsync('V9.6 v14: elke mislukte online AI-aanroep valt terug op de lokale backup (altijd fallbackCode)', async () => {
    const fakeFile = new Blob([new Uint8Array(32)], { type: 'image/png' });
    const mkFail = (err) => async () => { throw mapFirebaseAiError(err); };

    // 5xx / overbelasting -> http_5xx
    for (const raw of [
      { code: 'ai/internal', message: '500 Internal error' },
      { code: 'ai/unavailable', message: '503 The model is overloaded' },
      { code: 'ai/deadline-exceeded', message: '504 deadline' }
    ]) {
      let err = null;
      try {
        await scanReceiptWithGemini(fakeFile, { callModel: mkFail(raw), countQuota: false });
      } catch (e) { err = e; }
      if (!err) throw new Error(`${raw.message} moet een fout geven`);
      if (err.fallbackCode !== 'http_5xx') throw new Error(`${raw.message} moet fallbackCode http_5xx geven, kreeg: ${err.fallbackCode}`);
      if (/could not be decoded|undefined/i.test(err.message)) throw new Error('Geen kale Engelse/technische fout');
    }

    // quotum / spend cap -> http_429
    let err429 = null;
    try {
      await scanReceiptWithGemini(fakeFile, { callModel: mkFail({ code: 'ai/resource-exhausted', message: '429 Quota exceeded' }), countQuota: false });
    } catch (e) { err429 = e; }
    if (!err429 || err429.fallbackCode !== 'http_429') throw new Error(`429 moet http_429 zijn, kreeg: ${err429 && err429.fallbackCode}`);
    if (!err429.message.includes('spend cap')) throw new Error('429-melding moet de spend cap noemen');

    // App Check geweigerd/afgedwongen -> v14 valt óók hierop terug (fallbackCode config), met NL-melding
    let err403 = null;
    try {
      await scanReceiptWithGemini(fakeFile, { callModel: mkFail({ code: 'ai/permission-denied', message: '403 PERMISSION_DENIED: enforce Firebase App Check' }), countQuota: false });
    } catch (e) { err403 = e; }
    if (!err403 || err403.fallbackCode !== 'config') throw new Error(`403/App Check moet fallbackCode config geven, kreeg: ${err403 && err403.fallbackCode}`);
    if (!err403.message.includes('App Check')) throw new Error('403-melding moet over App Check gaan');

    // geen transport meegegeven -> not_configured
    let errNone = null;
    try {
      await scanReceiptWithGemini(fakeFile, { countQuota: false });
    } catch (e) { errNone = e; }
    if (!errNone || errNone.fallbackCode !== 'not_configured') throw new Error('Zonder callModel moet fallbackCode not_configured komen');
  });

  // ---------- V10: bevindingen onafhankelijke v9-review ----------

  await testAsync('V10.1a Gewicht/volume-uitzondering werkt echt: "750 ml" wordt geen stukprijs (B1)', async () => {
    const res = parsePlainTextReceipt([
      'Bistro Proef',
      '1 Huiswijn rood 750 ml 18,50',
      'TOTAAL 18,50'
    ].join('\n'));
    assertEqual(res.items.length, 1, 'een gerecht, geen spookgerecht van 750 ml');
    assertEqual(res.items[0].lineTotalCents, 1850, 'huiswijn 18,50');
    assertEqual(res.receiptTotalCents, 1850, 'totaal gevonden');
    assertEqual(res.matchesTotal, true, 'bon sluit');
  });

  await testAsync('V10.1b Eenheden g/cl/kg/l/ml/stuks en aantallen zijn uitzonderingen (B1)', async () => {
    const cases = [
      ['500', 'Soep 500 g 4,50'],
      ['250', 'Kip 250 gram 8,50'],
      ['750', 'Wijn 750 ml 18,50'],
      ['33', 'Bier 33 cl 3,50'],
      ['1', 'Water 1 l 2,50'],
      ['200', 'Borrelnoten 200 g 3,25'],
      ['250', 'Kaasblokjes 250 stuks 6,00'],
      ['2', '2 x Koffie 2,80']
    ];
    for (const [token, line] of cases) {
      assertTrue(isDecimalRestoreException(token, line), `uitzondering herkent: ${line}`);
    }
    // en een echt bedrag zonder komma wordt nog steeds hersteld
    assertTrue(!isDecimalRestoreException('1450', 'Huiswijn 1450'), 'herstel van echte prijs blijft mogelijk');
  });

  await testAsync('V10.2 Telefoon/bon/tafel/rekeningnummers worden geen spookgerecht (B2)', async () => {
    const res = parsePlainTextReceipt([
      'Bistro De Leuk',
      'Tel: 020 555 0134',
      'Kerkstraat 480',
      '1011 AB Amsterdam',
      'Bon: 1042',
      'Tafel 123',
      'Kassabon nr 2026',
      'Huiswijn 4,50',
      'Burger 12,50',
      'TOTAAL 17,00',
      'PIN 17,00'
    ].join('\n'));
    assertEqual(res.items.length, 2, 'alleen huiswijn en burger zijn gerechten');
    const names = res.items.map((i) => i.description.toLowerCase()).join(' ');
    assertTrue(!/tel|bon|tafel|kassabon|kerkstraat|amsterdam/.test(names), 'geen adres/telefoon/bonnummer als gerecht');
    assertEqual(res.receiptTotalCents, 1700, 'totaal 17,00');
    assertEqual(res.matchesTotal, true, 'bon sluit');
    const res2 = parsePlainTextReceipt(['Cafe UK', 'Tel 01904 555022', 'Rekening 450', 'Check 2211', 'Tea 2,50', 'Scone 3,00', 'TOTAL 5.50'].join('\n'));
    const names2 = res2.items.map((i) => i.description.toLowerCase()).join(' ');
    assertTrue(!/tel|rekening|check/.test(names2), 'ook EN labels geven geen spookgerecht');
  });

  await testAsync('V10.3 CONTANTI/CONTANTE betaalwoord + straat met tussenvoegsel (B3)', async () => {
    assertEqual(classifyNonDishKeyword('CONTANTI 25,50'), 'payment', 'CONTANTI is betaling');
    assertEqual(classifyNonDishKeyword('PAGAMENTO CONTANTE 25,50'), 'payment', 'CONTANTE is betaling');
    assertEqual(classifyNonDishKeyword('Pinot grigio 6,50'), null, 'Pinot blijft gerecht');
    assertTrue(isAddressOrPostalNumber('112', 'Carrer de Balmes 112'), 'Carrer de Balmes 112');
    assertTrue(isAddressOrPostalNumber('12', 'Rue de la Paix 12'), 'Rue de la Paix 12');
    assertTrue(isAddressOrPostalNumber('1', 'Via dei Fori Imperiali 1'), 'Via dei Fori Imperiali 1');
    assertTrue(isAddressOrPostalNumber('800', 'Avenida de Mayo 800'), 'Avenida de Mayo 800');
    assertTrue(isAddressOrPostalNumber('4', 'Plaza de la Villa 4'), 'Plaza de la Villa 4');
    assertTrue(isAddressOrPostalNumber('10', 'Hauptstrasse 10'), 'Hauptstrasse 10');
    assertTrue(!isAddressOrPostalNumber('1250', 'Huiswijn 12,50 1250'), 'geen vals-positief op gewone bonregel');
  });

  await testAsync('V10.4 Fuzzy totaal-/betaal-/btw-woorden bij OCR-verwarring + "4,60-" (B4)', async () => {
    const res = parsePlainTextReceipt([
      'Lunchroom Ruis',
      'Koffie 4,60-',
      'T0TAAL 4,60'
    ].join('\n'));
    assertEqual(res.items.length, 1, 'T0TAAL is geen gerecht');
    assertEqual(res.items[0].lineTotalCents, 460, '"4,60-" met ruis blijft 4,60');
    assertEqual(res.receiptTotalCents, 460, 'T0TAAL als totaal herkend');
    assertEqual(res.matchesTotal, true, 'bon sluit');
    assertEqual(classifyNonDishKeyword('P1N 43,00'), 'payment', 'P1N is PIN');
    assertEqual(classifyNonDishKeyword('1VA 9% 3,64'), 'vat', '1VA is IVA');
    assertEqual(classifyNonDishKeyword('5UMME 12,00'), 'total', '5UMME is SUMME');
    assertEqual(classifyNonDishKeyword('GE5AMT 12,00'), 'total', 'GE5AMT is GESAMT');
    assertEqual(classifyNonDishKeyword('AM0UNT DUE 12,00'), 'total', 'AMOUNT DUE');
    assertEqual(classifyNonDishKeyword('T0TALE C0MPLESS1V0 12,00'), 'total', 'TOTALE COMPLESSIVO');
    assertEqual(classifyNonDishKeyword('T0TAL A PAYER 12,00'), 'total', 'TOTAL A PAYER');
    assertEqual(classifyNonDishKeyword('Tosti 4,50'), null, 'tosti blijft gerecht');
    // cijfer-letterverwarring IN een bedrag: "4,8O" moet 4,80 worden
    const resO = parsePlainTextReceipt(['Bar Centrale', '1 Spremuta 4,8O', '1 Cornetto 2,20', 'TOTALE 7,00'].join('\n'));
    assertTrue(resO.items.some((i) => i.lineTotalCents === 480), '"4,8O" wordt 4,80');
    assertEqual(resO.receiptTotalCents, 700, 'totaal 7,00');
    assertEqual(resO.matchesTotal, true, 'bon met 4,8O sluit');
    // een naamtoken mag nooit als bedrag lezen
    const resN = parsePlainTextReceipt(['Cafe OSLO', '1 Koffie 3,50', 'TOTAAL 3,50'].join('\n'));
    assertEqual(resN.items.length, 1, 'OSLO is geen bedrag');
    assertEqual(classifyNonDishKeyword('B0ckwurst 4,50'), null, 'bockwurst blijft gerecht');
  });

  await testAsync('V10.5 Plakvakroute levert ambiguousCandidates voor de keuze-UI (B5)', async () => {
    // bon die twee kloppende combinaties heeft -> parser moet kandidaten teruggeven
    const res = parsePlainTextReceipt(['A 5,00', 'B 5,00', 'Subtotaal 10,00', 'TOTAAL 10,00'].join('\n'));
    assertTrue(Array.isArray(res.ambiguousCandidates), 'plakvak-resultaat heeft altijd ambiguousCandidates-veld');
    const res2 = parsePlainTextReceipt(['A 4,00', 'B 6,00', 'Subtotaal 10,00', 'BTW 1,00', 'TOTAAL 11,00'].join('\n'));
    assertTrue(Array.isArray(res2.ambiguousCandidates), 'ambiguousCandidates ook bij btw-variant');
    // app.js zet deze nu in session.ambiguousCandidates (browser-UI-test dekt de keuze-UI)
  });

  await testAsync('V10.6 PDF.js-laadfout geeft eigen eerlijke melding (B6)', async () => {
    const msg = pdfReaderLoadFailedMessage();
    assertTrue(msg.includes('pdf-lezer'), 'melding benoemt de pdf-lezer');
    assertTrue(!msg.includes('scan zonder leesbare tekstlaag'), 'geen misleidende "scan zonder tekstlaag"');
    // in Node kan import(https-url) nooit slagen -> de echte code moet code pdfjs_load_failed geven
    const fakePdf = new Blob([new Uint8Array([37, 80, 68, 70])], { type: 'application/pdf' });
    let err = null;
    try {
      await extractPdfTextAllPages(fakePdf);
    } catch (e) { err = e; }
    assertTrue(err && err.code === 'pdfjs_load_failed', `laadfout draagt code pdfjs_load_failed, kreeg: ${err && (err.code || err.message)}`);
  });

  await testAsync('V10.7 AI-dagteller telt alleen geslaagde calls (B7)', async () => {
    const fakeFile = new Blob([new Uint8Array(32)], { type: 'image/png' });
    const start = getDailyGeminiCallCount().count;
    const failCall = async () => { throw mapFirebaseAiError({ code: 'ai/internal', message: '500 kapot' }); };
    try { await scanReceiptWithGemini(fakeFile, { callModel: failCall, countQuota: true }); } catch {}
    assertEqual(getDailyGeminiCallCount().count, start, 'mislukte call (500) telt niet mee');
    const okCall = async () => ({
      rawText: JSON.stringify({
        items: [{ name: 'Koffie', qty: 1, price: '4,60', uncertain: false }],
        total: '4,60', currency: 'EUR', language: 'nl'
      }),
      model: 'gemini-3.8-flash',
      usageMetadata: null
    });
    await scanReceiptWithGemini(fakeFile, { callModel: okCall, countQuota: true });
    assertEqual(getDailyGeminiCallCount().count, start + 1, 'geslaagde call telt eenmalig');
  });

  await testAsync('V10.8 Service worker cachet PDF.js al bij installatie, best-effort (B7)', async () => {
    let sw;
    if (typeof process !== 'undefined' && process.versions?.node) {
      const fs = await import('node:fs');
      sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
    } else {
      sw = await (await fetch('../sw.js')).text();
    }
    assertTrue(sw.includes('PDFJS_URLS'), 'sw kent PDFJS_URLS');
    assertTrue(/cache\.add\(u\)\.catch/.test(sw), 'pdf.js-cache is best-effort (breekt installatie niet)');
    assertTrue(sw.includes('pdf.min.mjs') && sw.includes('pdf.worker.min.mjs'), 'beide pdf.js-bestanden worden gecachet');
  });

  await testAsync('V12.1 PayPal-koffielink in de footer, exact zoals online, eerlijk in de privacytekst', async () => {
    const readSrc = async (p) => {
      if (typeof process !== 'undefined' && process.versions?.node) {
        const fs = await import('node:fs');
        return fs.readFileSync(new URL(p, import.meta.url), 'utf8');
      }
      return await (await fetch(p)).text();
    };
    const idx = await readSrc('../index.html');
    const appSrc = await readSrc('../js/app.js');
    assertTrue(idx.includes('<footer id="app-footer"'), 'index.html heeft een footer-element');
    assertTrue(appSrc.includes("const SUPPORT_URL = 'https://www.paypal.me/Inzane007';"), 'SUPPORT_URL exact overgenomen');
    assertTrue(appSrc.includes("t(lang, 'support')"), 'footerlink gebruikt t(support)');
    assertTrue(/rel: 'noopener noreferrer'/.test(appSrc) && appSrc.includes("target: '_blank'"), 'externe link opent veilig in nieuw tabblad');
    assertEqual(STRINGS.nl.support, 'Handig? Trakteer op een kop koffie \u2615', 'NL-koffietekst exact');
    assertEqual(STRINGS.en.support, 'Find it useful? Buy me a coffee \u2615', 'EN-koffietekst exact');
    const nl = STRINGS.nl.privacyBody.join(' ');
    assertTrue(/PayPal/.test(nl) && /alleen een link/.test(nl) && /geen enkele gegeven/.test(nl), 'NL-privacytekst: externe PayPal-link, geen app-data');
    const en = STRINGS.en.privacyBody.join(' ');
    assertTrue(/PayPal/.test(en) && /only a link/.test(en) && /No app data/.test(en), 'EN-privacytekst: externe PayPal-link, geen app-data');
  });

  // ---------- V11: bevindingen onafhankelijke v10-review ----------

  await testAsync('V11.1a Amerikaanse bon met tax: fooi/btw meegeteld en pro rata verdeeld (N1)', async () => {
    const parsed = parsePlainTextReceipt([
      "JOE'S DINER", '1 Burger 15.00', '1 Fries 5.00', 'Subtotal 20.00', 'Sales tax 8.25% 1.65', 'TOTAL 21.65'
    ].join('\n'));
    assertEqual(parsed.taxMode, 'vat_added', 'US-bon is btw-erbovenop');
    assertEqual(parsed.vatCents, 165, 'tax 1,65 apart herkend');
    const check = validateReceiptTotal(parsed.items, parsed.receiptTotalCents, {
      tipCents: parsed.tipCents || 0,
      vatAddedCents: parsed.taxMode === 'vat_added' ? parsed.vatCents || 0 : 0
    });
    assertTrue(check.matches, 'som gerechten + tax == bontotaal');
    const res = calculateSettlement({
      items: parsed.items.map((it, i) => ({ ...it, id: String(i), assignedTo: i === 0 ? ['a'] : ['b'] })),
      receiptTotalCents: parsed.receiptTotalCents,
      receiptTipCents: parsed.tipCents || 0,
      receiptVatAddedCents: parsed.vatCents || 0,
      participants: [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bram' }]
    });
    assertTrue(res.invariantExact, 'US-bon met tax is exact afrondbaar');
    assertEqual(res.grandTotalCents, 2165, 'eindtotaal is het bontotaal');
    assertEqual(res.perPerson.reduce((s, p) => s + p.receiptExtraCents, 0), 165, 'tax volledig verdeeld');
  });

  await testAsync('V11.1b NL-bon met fooiregel: fooi meegeteld en verdeeld (N1)', async () => {
    const parsed = parsePlainTextReceipt(['Cafe Fooi', '1 Koffie 3,50', '1 Lunch 13,50', 'Fooi 2,00', 'TOTAAL 19,00'].join('\n'));
    assertEqual(parsed.tipCents, 200, 'fooi 2,00 apart herkend');
    const check = validateReceiptTotal(parsed.items, parsed.receiptTotalCents, {
      tipCents: parsed.tipCents || 0,
      vatAddedCents: 0
    });
    assertTrue(check.matches, 'som gerechten + fooi == bontotaal');
    const res = calculateSettlement({
      items: parsed.items.map((it, i) => ({ ...it, id: String(i), assignedTo: ['a', 'b'] })),
      receiptTotalCents: parsed.receiptTotalCents,
      receiptTipCents: parsed.tipCents || 0,
      receiptVatAddedCents: 0,
      participants: [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bram' }]
    });
    assertTrue(res.invariantExact, 'NL-bon met fooiregel is exact afrondbaar');
    assertEqual(res.grandTotalCents, 1900, 'eindtotaal is het bontotaal');
    assertEqual(res.perPerson.reduce((s, p) => s + p.receiptExtraCents, 0), 200, 'fooi volledig verdeeld');
  });

  await testAsync('V11.2 Geen verzonnen bedragen uit "Est. 1998", busletter, "Rekening 45,60" (N2)', async () => {
    assertTrue(isDecimalRestoreException('1998', 'Est. 1998'), 'Est. 1998 is geen prijs');
    assertTrue(isDecimalRestoreException('1998', 'Since 1998'), 'Since 1998 is geen prijs');
    assertTrue(isDecimalRestoreException('1998', 'Seit 1998'), 'Seit 1998 is geen prijs');
    assertTrue(isAddressOrPostalNumber('221', 'Avenue Louise 221 B'), 'busletter B bij huisnummer');
    assertTrue(isAddressOrPostalNumber('480', 'Kerkstraat 480 A'), 'busletter A bij huisnummer');
    assertEqual(classifyNonDishKeyword('Rekening 45,60'), 'total', 'Rekening met bedrag is het bontotaal');
    const res = parsePlainTextReceipt(['Resto', 'Est. 1998', 'Avenue Louise 221 B', '1 Plat du jour 14,50', 'Rekening 14,50'].join('\n'));
    assertEqual(res.items.length, 1, 'alleen het gerecht blijft over');
    assertEqual(res.receiptTotalCents, 1450, 'Rekening 14,50 is het totaal');
    assertEqual(res.matchesTotal, true, 'bon sluit');
  });

  await testAsync('V11.3 Los "bar"-woord mag geen gerecht droppen (N3)', async () => {
    assertEqual(classifyNonDishKeyword('Chocolade bar 3,50'), null, 'Chocolade bar is een gerecht');
    assertEqual(classifyNonDishKeyword('Bar Tapas 12,00'), null, 'Bar Tapas is een zaaknaam/gerecht');
    assertEqual(classifyNonDishKeyword('BAR 34,00'), 'payment', 'losse BAR met bedrag is betaling');
    assertEqual(classifyNonDishKeyword('KARTE 34,00'), 'payment', 'losse KARTE is betaling');
    assertEqual(classifyNonDishKeyword('CARTE 25,00'), 'payment', 'losse CARTE is betaling');
  });

  await testAsync('V11.4 NL-vormen "6,-" en "2,5", en volume "0,33" is geen prijs (N4)', async () => {
    const res = parsePlainTextReceipt(['Cafe Vorm', '1 Koffie 2,5', '1 Pils 6,-', 'TOTAAL 8,50'].join('\n'));
    assertEqual(res.items.length, 2, 'beide gerechten herkend');
    const prijzen = res.items.map((i) => i.lineTotalCents).sort((a, b) => a - b);
    assertEqual(prijzen[0], 250, '"2,5" wordt 2,50');
    assertEqual(prijzen[1], 600, '"6,-" wordt 6,00');
    assertTrue(res.matchesTotal, 'bon sluit');
    const res2 = parsePlainTextReceipt(['Cafe Cola', '2 Cola 0,33 6,60', 'TOTAAL 6,60'].join('\n'));
    assertEqual(res2.items.length, 1, 'een cola-regel');
    assertEqual(res2.items[0].unitPriceCents, 330, 'eenheidsprijs 3,30, niet 0,33');
    assertEqual(res2.items[0].lineTotalCents, 660, 'regeltotaal 6,60');
    const res3 = parsePlainTextReceipt(['Cafe Cola', 'Cola 0,33', 'TOTAAL 3,30'].join('\n'));
    assertEqual(res3.items.length, 0, 'los volume is geen gerecht met prijs');
  });

  await testAsync('V11.5 Tikkie, MULTIBANCO en Rua (N5)', async () => {
    assertEqual(classifyNonDishKeyword('Tikkie 12,50'), 'payment', 'Tikkie is betaling');
    assertEqual(classifyNonDishKeyword('MULTIBANCO 8,90'), 'payment', 'MULTIBANCO is betaling');
    assertTrue(isAddressOrPostalNumber('15', 'Rua Augusta 15'), 'Rua Augusta 15 is adres');
  });

  await testAsync('V11.7 Privacytekst zegt eerlijk dat PDF.js bij eerste bezoek wordt geprefetcht (N7)', async () => {
    const nl = STRINGS.nl.privacyBody.join(' ');
    assertTrue(/eerste bezoek/.test(nl) && /prefetch/i.test(nl), 'NL-tekst noemt prefetch bij eerste bezoek');
    assertTrue(!/jsDelivr \(alleen bij PDF/.test(nl), 'NL-tekst beweert niet meer "alleen bij PDFs"');
    const en = STRINGS.en.privacyBody.join(' ');
    assertTrue(/first visit/i.test(en) && /prefetch/i.test(en), 'EN-tekst noemt prefetch bij first visit');
  });

  await testAsync('V11.8a N6-meting: model + echte usageMetadata uit de respons worden vastgelegd', async () => {
    const fakeFile = new Blob([new Uint8Array(64)], { type: 'image/png' });
    const okCall = async () => ({
      rawText: JSON.stringify({
        items: [{ name: 'Bier', qty: 1, price: '3,50' }],
        total: '3,50', currency: 'EUR', language: 'nl'
      }),
      model: 'gemini-3.8-flash',
      usageMetadata: { promptTokenCount: 1450, candidatesTokenCount: 40, totalTokenCount: 1490 }
    });
    const res = await scanReceiptWithGemini(fakeFile, { callModel: okCall, countQuota: false });
    assertTrue(res.geminiMeta && res.geminiMeta.model === 'gemini-3.8-flash', 'Meta bevat het gebruikte standaardmodel');
    assertEqual(res.geminiMeta.source, 'firebase-ai (usageMetadata)', 'Bron is echte usageMetadata');
    assertEqual(res.geminiMeta.promptTokenCount, 1450, 'Prompt-tokens uit respons');
    assertEqual(res.geminiMeta.totalTokenCount, 1490, 'Totaal-tokens uit respons');
    const last = getLastGeminiCallInfo();
    assertTrue(last && last.kind === 'scan' && last.model === 'gemini-3.8-flash', 'getLastGeminiCallInfo legt de aanroep vast');
  });

  await testAsync('V11.8b N6-meting: zonder usageMetadata komt er een duidelijk gelabelde schatting', async () => {
    const fakeFile = new Blob([new Uint8Array(64)], { type: 'image/png' }); // ongeldig plaatje: createImageBitmap faalt -> afmetingen onbekend (node: geen createImageBitmap)
    const okCall = async () => ({
      rawText: JSON.stringify({
        items: [{ name: 'Koffie', qty: 1, price: '2,50' }],
        total: '2,50', currency: 'EUR', language: 'nl'
      }),
      model: 'gemini-3.8-flash',
      usageMetadata: null
    });
    const res = await scanReceiptWithGemini(fakeFile, { callModel: okCall, countQuota: false });
    assertTrue(res.geminiMeta && res.geminiMeta.source === 'schatting (geen usageMetadata beschikbaar)', 'Schatting is expliciet gelabeld');
    assertTrue(res.geminiMeta.estimate.textTokens > 100, 'Tekstschatting van de vaste scan-prompt aanwezig');
    assertEqual(res.geminiMeta.estimate.textTokens, estimateTextTokens(buildReceiptScanPrompt()), 'Schatting volgt de echte prompt');
    assertEqual(res.geminiMeta.estimate.imageTokens, null, 'Afbeelding onbekend -> null, geen verzonnen getal');
    // Tegelregel zelf: 1536x2048 -> 2x3 tegels x 258; klein plaatje -> 258
    assertEqual(estimateReceiptImageTokens(1536, 2048), 6 * 258, 'Tegelschatting 1536x2048');
    assertEqual(estimateReceiptImageTokens(300, 300), 258, 'Klein plaatje = 258 tokens');
    assertEqual(estimateReceiptImageTokens(0, 0), null, 'Ongeldige afmeting = null');
  });


  return results;
}

if (typeof process !== 'undefined' && process.versions?.node) {
  (async () => {
  const results = [...runAllTests(), ...(await runAsyncTests())];
  let failed = 0;
  for (const r of results) {
    if (r.passed) console.log(`PASS: ${r.name}`);
    else {
      failed++;
      console.error(`FAIL: ${r.name}\n  -> ${r.error}`);
    }
  }
  console.log(`\nResultaat: ${results.length - failed}/${results.length} geslaagd.`);
  if (failed > 0) process.exit(1);
  })();
}
