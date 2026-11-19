// Bonnetje - Gemini API integratie (v7: eerste route voor bonherkenning en vertalen)
// Vaste velden: items[], subtotal, vat (enkel of lijst), tip, discount, total, currency, language.
// Past exact hetzelfde komma-herstel toe als het plakvak (detectReceiptNumberFormat + parseAmountWithFormat).
// Bevat NOOIT een API-sleutel. Doet NOOIT automatische herhalingen.

import { parseEuroToCents, classifyReceiptLine } from './calculator.js';
import {
  normalizePunctuation,
  classifyNonDishKeyword,
  detectReceiptNumberFormat,
  parseAmountWithFormat,
  isAddressOrPostalNumber,
  reconcileBottomUp
} from './parser.js';
import { DEFAULT_GEMINI_MODEL, incrementDailyGeminiCallCount } from './storage.js';

export const GEMINI_TERMS_URL = 'https://aistudio.google.com/docs/terms';
const GEMINI_TIMEOUT_MS = 30000;

/**
 * Vast JSON-schema voor bonherkenning (paragraaf 1 & 2).
 * Subtotaal, btw, fooi, korting en totaal zijn aparte vaste velden en horen nooit in items[].
 */
export const RECEIPT_SCHEMA_DESCRIPTION = {
  items: [
    {
      name: 'string (originele gerecht- of dranknaam op de bon; NOOIT subtotaal, btw, fooi, korting of totaal)',
      qty: 'integer >= 1',
      price: 'number | string | null (regeltotaal in euro, bijv. 7.00 of "7,00")',
      unitPrice: 'number | string | null (optioneel: prijs per stuk)',
      uncertain: 'boolean (true als tekst of bedrag onduidelijk is)'
    }
  ],
  subtotal: 'number | string | null (subtotaal op de bon, indien aanwezig)',
  vat: 'number | string | array | null (btw/IVA/MwSt/TVA/VAT/tax bedrag of lijst van bedragen bij meerdere btw-tarieven)',
  tip: 'number | string | null (fooi/tip/service op de bon, indien aanwezig)',
  discount: 'number | string | null (korting op de bon, indien aanwezig)',
  total: 'number | string | null (eindtotaal op de bon)',
  currency: 'string (bijv. "EUR", "USD", "JPY")',
  language: 'string (ISO-taalcode van de bon, bijv. "nl", "es", "en", "de", "fr")'
};

function withTimeout(promise, ms, msg) {
  let timer;
  const tp = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(msg)), ms);
  });
  return Promise.race([promise, tp]).finally(() => clearTimeout(timer));
}

function stripJsonFence(text) {
  const s = String(text || '').trim();
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : s;
}

/**
 * Zet een ruwe Gemini-waarde om naar een string-token voor formaatdetectie.
 */
function rawValueToSampleString(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return null;
    if (!Number.isInteger(val)) return val.toFixed(2);
    return String(val);
  }
  if (typeof val === 'string') {
    const s = normalizePunctuation(val).trim();
    return s || null;
  }
  return null;
}

/**
 * Parset een Gemini-bedrag met exact dezelfde decimale herstelstap en uitzonderingen als het plakvak.
 * Retourneert { cents, restoredDecimal } of null.
 */
export function parseGeminiAmountWithFormat(val, fmt, fullLineText = '', currency = 'EUR') {
  if (val === null || val === undefined || val === '') return null;

  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return null;
    // Geheel getal van 3-6 cijfers op een bon met expliciete 2-decimaalnotatie (bijv. 1450 -> 14,50)
    if (Number.isInteger(val)) {
      const str = String(val);
      const restored = parseAmountWithFormat(str, fmt, fullLineText || str, currency);
      if (restored !== null) return restored;
      // Gewone gehele euro's alleen bij kleine bedragen (bijv. 5 of 16). Een kaal getal van
      // 3+ cijfers zonder decimale context (huisnummer 480, postcode 10115) is NOOIT een
      // heel-euro-bedrag (punt 1, v9): dan is het bedrag onbekend en wordt de regel gemarkeerd.
      if (Math.abs(val) < 100) {
        const cents = parseEuroToCents(val.toFixed(2));
        return cents !== null ? { cents, restoredDecimal: false } : null;
      }
      return null;
    }
    const cents = parseEuroToCents(val.toFixed(2));
    return cents !== null ? { cents, restoredDecimal: false } : null;
  }

  if (typeof val === 'string') {
    const cleaned = normalizePunctuation(val).trim();
    if (!cleaned) return null;
    const withFmt = parseAmountWithFormat(cleaned, fmt, fullLineText || cleaned, currency);
    if (withFmt !== null) return withFmt;
    // Fallback voor enkele gehele euro's als string ("5", "16") zonder dat het een uitzondering is
    if (/^-?[€$£]?\d{1,2}[€$£]?$/.test(cleaned)) {
      const cents = parseEuroToCents(cleaned);
      return cents !== null ? { cents, restoredDecimal: false } : null;
    }
    return null;
  }

  return null;
}

/**
 * Behouden voor backwards compatibility.
 */
export function parseGeminiAmountToCents(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return null;
    return parseEuroToCents(val.toFixed(2));
  }
  if (typeof val === 'string') {
    const cleaned = normalizePunctuation(val).trim();
    if (!cleaned) return null;
    return parseEuroToCents(cleaned);
  }
  return null;
}

export function mapGeminiError(status, detail = '') {
  if (status === 0) {
    return 'Geen internetverbinding of de aanvraag duurde te lang. De lokale backup (ppu-paddle-ocr), het plakvak en handmatig invoeren blijven beschikbaar.';
  }
  if (status === 429) {
    return 'Het gratis daglimiet van je Gemini-sleutel is waarschijnlijk op (HTTP 429). Morgen werkt het weer; je kunt nu verder met de lokale backup, het plakvak of handmatig invoeren.';
  }
  if (status === 503) {
    return 'Google Gemini heeft het tijdelijk te druk (HTTP 503). Probeer het later opnieuw, of gebruik nu de lokale backup, het plakvak of handmatig invoeren.';
  }
  if (status === 400 || status === 401 || status === 403) {
    return `De Gemini-sleutel is geweigerd, ongeldig of geblokkeerd door websitebeperking (HTTP ${status}). Controleer je sleutel bij Instellingen, of gebruik de lokale backup / plakvak.`;
  }
  if (status >= 500) {
    return `Google Gemini heeft een technische storing (HTTP ${status}). De lokale backup start nu automatisch; je kunt ook het plakvak of handmatig invoeren gebruiken.`;
  }
  return `Aanroep naar Gemini is mislukt (HTTP ${status}${detail ? `: ${detail}` : ''}). Gebruik de lokale backup, het plakvak of handmatig invoeren.`;
}


/**
 * Exacte scan-prompt (ook gebruikt door tests en de kostenmeting).
 */
export function buildReceiptScanPrompt() {
  return (
    'Lees deze restaurantbon (alle pagina\'s als het een PDF is) exact uit. ' +
    'Zet subtotaal, btw, fooi, korting en totaal NOOIT in items[], maar uitsluitend in de eigen vaste velden. ' +
    'Als er meerdere btw-tarieven op de bon staan, geef ze allemaal terug als lijst in vat[]. ' +
    'Verzin nooit bedragen of regels. Geef uitsluitend geldige JSON terug volgens dit schema:\n' +
    JSON.stringify(RECEIPT_SCHEMA_DESCRIPTION)
  );
}

/**
 * Grove tekenschatting naar tokens (~4 tekens per token, zoals Google zelf aangeeft).
 * Dit is een SCHATTING, expliciet zo gelabeld waar hij getoond wordt.
 */
export function estimateTextTokens(text) {
  const chars = String(text || '').length;
  return Math.max(1, Math.ceil(chars / 4));
}

/**
 * Afbeeldingstokens volgens de gedocumenteerde tegelregel van de 2.5-modellen:
 * tegels van 768x768, elke tegel 258 tokens; beide zijden <= 384 px = 258 tokens.
 * Geeft null als de afmetingen onbekend zijn (schatting dan alleen over tekst).
 */
export function estimateReceiptImageTokens(width, height) {
  const w = Number(width), h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  if (w <= 384 && h <= 384) return 258;
  return Math.ceil(w / 768) * Math.ceil(h / 768) * 258;
}

// Laatste Gemini-aanroep (scan of vertaling): model + tokeninformatie, voor meting/rapportage.
let lastGeminiCallInfo = null;
export function getLastGeminiCallInfo() {
  return lastGeminiCallInfo ? { ...lastGeminiCallInfo } : null;
}

/**
 * Bouw de kosteninfo bij een aanroep: echte usageMetadata als die er is,
 * anders een duidelijk gelabelde schatting.
 */
export function buildGeminiCostInfo(kind, model, usageMetadata, estimateParts) {
  const info = { kind, model, at: new Date().toISOString() };
  if (usageMetadata && typeof usageMetadata === 'object') {
    info.source = 'gemini-api (usageMetadata)';
    info.promptTokenCount = usageMetadata.promptTokenCount ?? null;
    info.candidatesTokenCount = usageMetadata.candidatesTokenCount ?? null;
    info.totalTokenCount = usageMetadata.totalTokenCount ?? null;
    info.estimate = null;
  } else {
    info.source = 'schatting (geen usageMetadata beschikbaar)';
    info.promptTokenCount = null;
    info.candidatesTokenCount = null;
    info.totalTokenCount = null;
    info.estimate = estimateParts || null;
  }
  lastGeminiCallInfo = info;
  return info;
}

async function callGeminiApi(apiKey, contents, { model = DEFAULT_GEMINI_MODEL, fetchImpl = fetch, countQuota = true } = {}) {
  if (!apiKey || !String(apiKey).trim()) {
    const err = new Error('Geen Gemini API-sleutel ingesteld.');
    err.fallbackCode = 'no_key';
    throw err;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const err = new Error(mapGeminiError(0));
    err.fallbackCode = 'offline';
    throw err;
  }

  const cleanModel = String(model || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  let res;
  try {
    res = await withTimeout(
      fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }),
      GEMINI_TIMEOUT_MS,
      'De aanvraag naar Gemini duurde te lang (time-out).'
    );
  } catch (err) {
    const e = new Error(err?.message && err.message.includes('time-out') ? err.message : mapGeminiError(0));
    e.fallbackCode = 'network';
    throw e;
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || '';
    } catch {}
    const e = new Error(mapGeminiError(res.status, detail));
    e.httpStatus = res.status;
    if (res.status === 429) e.fallbackCode = 'http_429';
    else if (res.status >= 500) e.fallbackCode = 'http_5xx';
    throw e;
  }

  // Punt B7 (v10): pas tellen als de call is gelukt; mislukte calls (netwerk, 4xx/5xx)
  // mogen het daglimiet niet aanzien.
  if (countQuota) {
    incrementDailyGeminiCallCount();
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini gaf een leeg of onleesbaar antwoord terug.');
  }
  return { rawText, model: cleanModel, usageMetadata: data?.usageMetadata || null };
}

/**
 * Parset en valideert het JSON-antwoord van Gemini strikt.
 * Past één decimale notatie + komma-herstel per bon, meerdere btw-regels,
 * subtotaalfilters en somcontrole van onderaf toe.
 */
export function parseGeminiReceiptJson(rawText) {
  let obj;
  try {
    obj = JSON.parse(stripJsonFence(rawText));
  } catch {
    throw new Error('Het antwoord van Gemini was geen geldige JSON.');
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Onverwacht antwoordformaat van Gemini (geen JSON-object).');
  }
  if (!Array.isArray(obj.items)) {
    throw new Error('Het antwoord van Gemini mist een geldige lijst met gerechten ("items").');
  }

  const currency = typeof obj.currency === 'string' && obj.currency.trim() ? obj.currency.trim().toUpperCase() : 'EUR';
  const language = typeof obj.language === 'string' && obj.language.trim() ? obj.language.trim().toLowerCase() : null;

  // Verzamel alle bedrag-samples van de hele bon voor één consistente decimale notatie (Punt 1)
  const formatSamples = [];
  const pushSample = (v) => {
    const s = rawValueToSampleString(v);
    if (s) formatSamples.push(s);
  };
  pushSample(obj.subtotal);
  if (Array.isArray(obj.vat)) {
    for (const v of obj.vat) pushSample(typeof v === 'object' && v !== null ? (v.amount ?? v.price ?? v.value) : v);
  } else {
    pushSample(obj.vat);
  }
  pushSample(obj.tip);
  pushSample(obj.discount);
  pushSample(obj.total !== undefined ? obj.total : obj.receiptTotal);
  for (const raw of obj.items) {
    if (!raw || typeof raw !== 'object') continue;
    pushSample(raw.price !== undefined ? raw.price : raw.lineTotal);
    pushSample(raw.unitPrice);
  }

  const fmt = detectReceiptNumberFormat(formatSamples, currency);
  const restoredFields = {};

  const parsedSub = parseGeminiAmountWithFormat(obj.subtotal, fmt, '', currency);
  let subtotalCents = parsedSub ? parsedSub.cents : null;
  if (parsedSub?.restoredDecimal) restoredFields.subtotal = true;

  // Punt 3: meerdere btw-regels ondersteunen (zowel enkel getal/string als array).
  // Punt 4 (v9): onthoud welke btw-bedragen al via het vat-veld geteld zijn, zodat dezelfde
  // btw-regel die het model óók in items[] zette niet dubbel meetelt.
  let vatCents = null;
  const vatLines = [];
  const vatCountedFromField = new Map(); // cents -> aantal keer via vat-veld geteld
  const noteVatFromField = (c) => vatCountedFromField.set(c, (vatCountedFromField.get(c) || 0) + 1);
  if (Array.isArray(obj.vat)) {
    for (const entry of obj.vat) {
      const rawVal = typeof entry === 'object' && entry !== null ? (entry.amount ?? entry.price ?? entry.value) : entry;
      const pv = parseGeminiAmountWithFormat(rawVal, fmt, '', currency);
      if (pv !== null) {
        vatCents = (vatCents || 0) + pv.cents;
        noteVatFromField(pv.cents);
        vatLines.push({ cents: pv.cents, restoredDecimal: pv.restoredDecimal });
        if (pv.restoredDecimal) restoredFields.vat = true;
      }
    }
  } else {
    const parsedVat = parseGeminiAmountWithFormat(obj.vat, fmt, '', currency);
    if (parsedVat !== null) {
      vatCents = parsedVat.cents;
      noteVatFromField(parsedVat.cents);
      vatLines.push({ cents: parsedVat.cents, restoredDecimal: parsedVat.restoredDecimal });
      if (parsedVat.restoredDecimal) restoredFields.vat = true;
    }
  }

  const parsedTip = parseGeminiAmountWithFormat(obj.tip, fmt, '', currency);
  let tipCents = parsedTip ? parsedTip.cents : null;
  if (parsedTip?.restoredDecimal) restoredFields.tip = true;

  const parsedDisc = parseGeminiAmountWithFormat(obj.discount, fmt, '', currency);
  let discountCents = parsedDisc ? parsedDisc.cents : null;
  const discountRestored = Boolean(parsedDisc?.restoredDecimal);
  if (discountRestored) restoredFields.discount = true;

  const parsedTotal = parseGeminiAmountWithFormat(
    obj.total !== undefined ? obj.total : obj.receiptTotal,
    fmt,
    '',
    currency
  );
  const receiptTotalCents = parsedTotal ? parsedTotal.cents : null;
  if (parsedTotal?.restoredDecimal) restoredFields.total = true;

  const items = [];
  let idx = 1;
  for (const raw of obj.items) {
    if (!raw || typeof raw !== 'object') continue;
    const rawName = raw.name ?? raw.description ?? '';
    const desc = normalizePunctuation(rawName).trim();
    const rawQty = raw.qty ?? raw.quantity ?? 1;
    const qty = Number.isInteger(rawQty) && rawQty > 0 ? rawQty : 1;

    const rawPrice = raw.price !== undefined ? raw.price : raw.lineTotal;
    const parsedLine = parseGeminiAmountWithFormat(rawPrice, fmt, `${desc} ${rawPrice ?? ''}`, currency);
    const parsedUnitObj = parseGeminiAmountWithFormat(raw.unitPrice, fmt, `${desc} ${raw.unitPrice ?? ''}`, currency);

    const lineTotalCents = parsedLine ? parsedLine.cents : null;
    const parsedUnit = parsedUnitObj ? parsedUnitObj.cents : null;
    const restoredDecimal = Boolean(parsedLine?.restoredDecimal || parsedUnitObj?.restoredDecimal);

    // Vangrail: als het model toch een subtotaal/btw/fooi/totaal/betaalregel in items[] zette, filter die eruit!
    const nonDishKind = classifyNonDishKeyword(desc);
    if (nonDishKind === 'subtotal') {
      if (subtotalCents === null && lineTotalCents !== null) {
        subtotalCents = lineTotalCents;
        if (restoredDecimal) restoredFields.subtotal = true;
      }
      continue;
    }
    if (nonDishKind === 'total' || nonDishKind === 'payment') {
      continue;
    }
    if (nonDishKind === 'vat') {
      // Punt 3: tel alle btw-regels op (verlies nooit de tweede btw-regel)
      // Punt 4 (v9): staat exact dit btw-bedrag al in vat[], dan is dit dezelfde regel: niet dubbel tellen
      if (lineTotalCents !== null) {
        const already = vatCountedFromField.get(lineTotalCents) || 0;
        if (already > 0) {
          vatCountedFromField.set(lineTotalCents, already - 1);
          continue;
        }
        vatCents = (vatCents || 0) + lineTotalCents;
        vatLines.push({ label: desc, cents: lineTotalCents, restoredDecimal });
        if (restoredDecimal) restoredFields.vat = true;
      }
      continue;
    }
    if (nonDishKind === 'tip') {
      if (lineTotalCents !== null) {
        tipCents = (tipCents || 0) + lineTotalCents;
        if (restoredDecimal) restoredFields.tip = true;
      }
      continue;
    }

    // Punt 1 (v9): een regel zonder echt decimaal bedrag is geen gerecht. Leverde het model
    // een adres- of postcoderegel als "item" met een kaal getal als prijs (bijv. naam
    // "Kerkstraat" met prijs 480), dan is dat een adresregel en geen gerecht met missend bedrag.
    if (lineTotalCents === null && parsedUnit === null) {
      const rawSample = rawValueToSampleString(rawPrice) || rawValueToSampleString(raw.unitPrice) || '';
      if (/^-?[€$£]?\d{3,6}$/.test(rawSample.replace(/\s/g, '')) && isAddressOrPostalNumber(rawSample, `${desc} ${rawSample}`)) {
        continue;
      }
    }

    let unitPriceCents = parsedUnit;
    if (unitPriceCents === null && lineTotalCents !== null) {
      if (qty === 1) unitPriceCents = lineTotalCents;
      else if (lineTotalCents % qty === 0) unitPriceCents = lineTotalCents / qty;
    }

    const cls = classifyReceiptLine(desc, lineTotalCents);
    const finalLineCents = cls.normalizedCents;
    const finalUnitCents =
      cls.kind === 'discount' && Number.isInteger(unitPriceCents)
        ? -Math.abs(unitPriceCents)
        : unitPriceCents;

    const isIncomplete = !desc || finalLineCents === null;

    items.push({
      id: `gem_${Date.now()}_${idx++}`,
      description: desc || 'Onbekende regel',
      originalDescription: desc || 'Onbekende regel',
      qty,
      unitPriceCents: finalUnitCents,
      lineTotalCents: finalLineCents,
      assignedTo: [],
      assignedQuantities: {},
      lineType:
        cls.kind === 'vat_summary'
          ? 'vat_summary'
          : cls.kind === 'discount'
            ? 'discount'
            : cls.kind === 'surcharge_uncertain'
              ? 'surcharge'
              : 'item',
      isVatSummary: cls.kind === 'vat_summary',
      needsVatDecision: cls.kind === 'surcharge_uncertain',
      needsDiscountConfirmation: cls.kind === 'discount_uncertain',
      needsPriceConfirmation: finalLineCents === null,
      excluded: false,
      restoredDecimal,
      lowConfidence: Boolean(raw.uncertain) || isIncomplete || restoredDecimal,
      sourceEngine: 'gemini'
    });
  }

  // Als discount als apart top-level veld is meegegeven (en nog niet in items), voeg als negatieve kortingsregel toe
  if (Number.isInteger(discountCents) && discountCents !== 0 && !items.some((i) => i.lineType === 'discount')) {
    const neg = -Math.abs(discountCents);
    items.push({
      id: `gem_disc_${Date.now()}`,
      description: 'Korting',
      originalDescription: 'Korting',
      qty: 1,
      unitPriceCents: neg,
      lineTotalCents: neg,
      assignedTo: [],
      assignedQuantities: {},
      lineType: 'discount',
      isVatSummary: false,
      excluded: false,
      restoredDecimal: discountRestored,
      lowConfidence: discountRestored,
      sourceEngine: 'gemini'
    });
    discountCents = null;
  }

  // Somcontrole van onderaf (probeert btw-inbegrepen én btw-erbovenop, plus onbenoemd subtotaal)
  const reconciled = reconcileBottomUp({
    items,
    receiptTotalCents,
    subtotalCents,
    vatCents,
    tipCents,
    discountCents
  });

  return {
    ...reconciled,
    vatLines,
    restoredFields,
    numberFormat: fmt,
    currency,
    language,
    emptyResult: reconciled.items.length === 0
  };
}

export async function scanReceiptWithGemini(file, apiKey, options = {}) {
  if (!file) throw new Error('Geen bonfoto of PDF gekozen.');

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      const comma = res.indexOf(',');
      resolve(comma !== -1 ? res.slice(comma + 1) : res);
    };
    reader.onerror = () => reject(new Error('Kon het bestand niet inlezen.'));
    reader.readAsDataURL(file);
  });

  const mimeType =
    file.type || (file.name && file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  const prompt = buildReceiptScanPrompt();

  const { rawText, model, usageMetadata } = await callGeminiApi(
    apiKey,
    [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64 } }
        ]
      }
    ],
    options
  );
  // N6-meting (v11): model + tokenkosten vastleggen. Afmetingen van de afbeelding zijn in de
  // browser te bepalen; lukte dat niet, dan blijft de afbeeldingscomponent null (duidelijk gelabeld).
  let imageTokens = null;
  let imageNote = 'afmetingen afbeelding onbekend; alleen tekst geschat';
  try {
    if (typeof createImageBitmap === 'function' && typeof Blob !== 'undefined' && file instanceof Blob) {
      const bmp = await createImageBitmap(file);
      imageTokens = estimateReceiptImageTokens(bmp.width, bmp.height);
      imageNote = `${bmp.width}x${bmp.height}px, tegels van 768px a 258 tokens (geschat)`;
      bmp.close();
    }
  } catch { /* schatting zonder afbeelding */ }
  const estimateParts = {
    textTokens: estimateTextTokens(prompt),
    imageTokens,
    imageNote,
    totalInputTokens: (imageTokens === null ? null : estimateTextTokens(prompt) + imageTokens)
  };
  const geminiMeta = buildGeminiCostInfo('scan', model, usageMetadata, estimateParts);
  // Punt B7 (v10): ruwe modeltekst meegeven zodat de sessie hem kan bewaren (zoals de OCR-route)
  return { ...parseGeminiReceiptJson(rawText), rawText, geminiMeta };
}

export function parseGeminiTranslationJson(rawText) {
  let obj;
  try {
    obj = JSON.parse(stripJsonFence(rawText));
  } catch {
    throw new Error('Het vertaalantwoord van Gemini was geen geldige JSON.');
  }
  if (!obj || !Array.isArray(obj.translations)) {
    throw new Error('Het vertaalantwoord van Gemini mist de lijst met vertalingen.');
  }
  const map = {};
  for (const entry of obj.translations) {
    if (entry && typeof entry.id === 'string' && typeof entry.nl === 'string' && entry.nl.trim()) {
      map[entry.id] = entry.nl.trim();
    }
  }
  return map;
}

export async function translateItemsWithGemini(items, apiKey, options = {}) {
  const payload = (items || [])
    .filter((it) => it && it.description && !it.isVatSummary && !it.excluded)
    .map((it) => ({
      id: it.id,
      text: String(it.originalDescription || it.description)
        .replace(/[€$£]?\s*-?\d+([.,]\d+)?/g, '')
        .trim()
    }))
    .filter((x) => x.text.length > 0);

  if (payload.length === 0) return {};

  const prompt =
    'Vertaal de volgende horeca-omschrijvingen op een restaurantbon consequent en natuurlijk naar het Nederlands. ' +
    'Geef uitsluitend geldige JSON terug in exact dit formaat: {"translations":[{"id":"...","nl":"..."}]}. ' +
    'Verzin geen nieuwe items.\n\n' +
    JSON.stringify(payload);

  const { rawText, model, usageMetadata } = await callGeminiApi(
    apiKey,
    [{ role: 'user', parts: [{ text: prompt }] }],
    options
  );
  buildGeminiCostInfo('vertaling', model, usageMetadata, {
    textTokens: estimateTextTokens(prompt),
    imageTokens: 0,
    imageNote: 'tekst-only aanroep',
    totalInputTokens: estimateTextTokens(prompt)
  });
  return parseGeminiTranslationJson(rawText);
}
