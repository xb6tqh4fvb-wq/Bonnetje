// Bonnetje - Bonparser (v12): subtotaalfilter, somcontrole van onderaf, btw-anker, komma-notatie per bon,
// schuinte-correctie bij bounding-box kolomkoppeling, spatie-herstel in bedragen, betaalwoorden BAR/KARTE/CARTE,
// naam-eis voor gerechten en nooit samenvoegen van kale cijferregels (huisnummer "480" is geen gerecht).
// Gebruikt door Gemini-verificatie, lokale backup (ppu-paddle-ocr), PDF-tekst en iPhone Live Text.

import { parseEuroToCents, classifyReceiptLine, isLineActive } from './calculator.js';
import { LIB_URLS } from './assets-manifest.js';

/**
 * Normaliseert afwijkende leestekens, cijfers (zoals Chinese volle-breedte-komma)
 * en losse spaties in bedragen zoals "€2, 49" -> "€2,49".
 */
export function normalizePunctuation(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/[\uFF0C\u3001]/g, ',')
    .replace(/[\uFF0E\u3002]/g, '.')
    .replace(/[\uFF0D\u2212\u2013\u2014]/g, '-')
    .replace(/\uFF1A/g, ':')
    .replace(/\uFF05/g, '%')
    .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u00A0/g, ' ')
    // Herstel spaties in bedragen: "€2, 49" -> "€2,49" en "€ 2, 49" -> "€2,49"
    .replace(/([€$£])\s+(-?\d)/g, '$1$2')
    .replace(/(\d)([.,])\s+(\d{2})(?!\d)/g, '$1$2$3');
}

/**
 * Btw-anker (paragraaf 2B): percentage + belastingwoord (btw, IVA, MwSt, TVA, VAT, tax).
 * Zo'n regel wordt nooit een gerecht en nooit een subtotaal.
 */
export function isVatAnchorLine(text) {
  const s = normalizePunctuation(text).toLowerCase();
  const hasTaxWord = /(?:^|\b)(btw|b\.t\.w\.|iva|i\.v\.a\.|mwst\.?|mehrwertsteuer|ust\.?|tva|t\.v\.a\.|vat|tax|impuesto|steuer)(?=\b|\d|%)/.test(s);
  const hasPercent = /\d{1,2}(?:[.,]\d{1,2})?\s*%/.test(s);
  return hasTaxWord && hasPercent;
}

/**
 * Herkent niet-gerecht-regels in NL, EN, DE, FR, ES (paragraaf 2).
 * Retourneert: 'subtotal' | 'total' | 'vat' | 'tip' | 'service' | 'discount' | 'payment' | null
 */
// Punt B4 (v10): OCR verwisselt vaak O/0, I/l/1, S/5 en B/8 ("T0TAAL", "P1N", "1VA", "GES4MT"
// blijft bewust buiten scope). Voor sleutelwoord-herkenning (totaal/betaal/btw e.d.) toetsen we
// daarom naast de originele regel ook aan een versie met die verwarringen teruggezet naar letters.
// Alleen 0->o, 1->i, 5->s, 8->b: de bewezen tiny-modelverwarringen. Letters blijven ongemoeid.
function ocrConfusableToLetters(text) {
  return String(text || '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/5/g, 's')
    .replace(/8/g, 'b');
}

const SUBTOTAL_RE = /\b(subtotaal|sub-totaal|subtotal|sub-total|zwischensumme|sous-total|sous\s*total|netto\s*totaal)\b/;
// Punt B4 (v10): totaalwoorden aangevuld met TOTAL A PAYER, AMOUNT DUE en TOTALE COMPLESSIVO.
const TOTAL_RE = /\b(totaal|total|totale|importe\s*total|a\s*pagar|te\s*betalen|grand\s*total|total\s*eur|summe|gesamt|gesamtsumme|zu\s*zahlen|montant\s*total|net\s*a\s*payer|total\s*a\s*payer|amount\s*due|totale\s*complessivo|saldo|balance\s*due|rekening)\b/;
const VAT_RE = /(?:^|\b)(btw|b\.t\.w\.|iva|i\.v\.a\.|mwst\.?|tva|vat|sales\s*tax|tax|base\s*imponible|cuota\s*iva)(?=\b|\d)/;
const TIP_RE = /\b(fooi|tip|trinkgeld|pourboire|propina|gratuity)\b/;
const SERVICE_RE = /\b(servicekosten|service\s*charge|bediening|servicio|service\s*fee|cubierto|couvert)\b/;
const DISCOUNT_RE = /\b(korting|discount|rabatt|descuento|dto\.?|remise|réduction|reduction|sconto)\b/;
// Betaalwijze (pin, contant, kaart, wisselgeld, incl. Duitse/Franse/Italiaanse betaalwoorden).
// Punt 2 (v9): het losse woord "pin" is een betaalregel ("PIN 43,00"); woordgrenzen voorkomen
// dat "Pinot", "Pinsa", "Pint" of "Pincho" fout gaan. Ook EC, V PAY, CONTACTLESS e.d.
// Punt B3 (v10): CONTANTI en CONTANTE (Italiaans contant) toegevoegd.
// Punt N5 (v11): Tikkie en MULTIBANCO (PT) toegevoegd.
// Punt N3 (v11): de zwakke woorden bar/karte/carte staan hier bewust NIET meer in; een gerecht als
// "Chocolade bar" of een zaaknaam als "Bar Tapas" mag nooit als betaalregel verdwijnen. Alleen als
// zo'n woord het ENIGE woord op de regel is (plus bedrag/leestekens) is het een betaalregel.
const PAYMENT_RE = /\b(pin|pinbetaling|pinnen|pinpas|ec|ec-karte|v\s*pay|vpay|contactloos|contactless|contant|contanti|contante|wisselgeld|cash|card|visa|mastercard|maestro|amex|efectivo|cambio|tarjeta|barzahlung|espèces|especes|carte\s*bancaire|rendu|change|pagamento|bezahlt|paid|pagato|pagada|payé|payee|tikkie|multibanco|mb\s*way)\b/;
const WEAK_PAYMENT_WORD_RE = /^(bar|karte|carte)$/;

export function classifyNonDishKeyword(text) {
  const s = normalizePunctuation(text).toLowerCase().trim();
  if (!s) return null;

  if (isVatAnchorLine(s)) return 'vat';

  // Punt B4 (v10): toets elke sleutelwoordreeks ook aan de OCR-deconfuse-variant, zodat
  // "T0TAAL 46,00" als totaal herkend wordt in plaats van als gerecht.
  const variants = [s];
  const deconf = ocrConfusableToLetters(s);
  if (deconf !== s) variants.push(deconf);
  const anyMatch = (re) => variants.some((v) => re.test(v));

  // Subtotaal (NL, EN, DE, FR, ES)
  if (anyMatch(SUBTOTAL_RE)) {
    return 'subtotal';
  }
  // Totaal (NL, EN, DE, FR, ES, IT)
  if (anyMatch(TOTAL_RE)) {
    return 'total';
  }
  // Btw / belasting zonder percentage
  if (anyMatch(VAT_RE)) {
    return 'vat';
  }
  // Fooi / tip (NL, EN, DE, FR, ES)
  if (anyMatch(TIP_RE)) {
    return 'tip';
  }
  // Servicekosten
  if (anyMatch(SERVICE_RE)) {
    return 'service';
  }
  // Korting (NL, EN, DE, FR, ES)
  if (anyMatch(DISCOUNT_RE)) {
    return 'discount';
  }
  // Betaalwijze
  if (anyMatch(PAYMENT_RE)) {
    return 'payment';
  }
  // Punt N3 (v11): zwakke betaalwoorden (bar/karte/carte) alleen als het enige woord op de regel
  const weakOnly = (v) => {
    const rest = v
      .replace(/[€$£]/g, ' ')
      .replace(/-?\d+[.,]?\d*/g, ' ')
      .replace(/[.\-–—:%]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return WEAK_PAYMENT_WORD_RE.test(rest);
  };
  if (variants.some(weakOnly)) {
    return 'payment';
  }
  return null;
}

/**
 * Controleert of een tekst een echt naamdeel bevat (minstens één letter).
 * Een regel met alleen cijfers en tekens (zoals een huisnummer "480" of kassanummer) heeft geen naam.
 */
export function hasDishNameLetters(text) {
  const s = normalizePunctuation(text).trim();
  if (!s) return false;
  return /[a-zA-Z\u00C0-\u024F]/.test(s);
}

// Losse straatindicator-woorden (NL/BE/DE/FR/ES/IT/EN/US) die een huisnummer aankondigen.
const STREET_KEYWORDS = new Set([
  'straat', 'steeg', 'weg', 'laan', 'plein', 'gracht', 'singel', 'kade', 'hof', 'baan',
  'dreef', 'dam', 'pad', 'boulevard', 'blvd', 'dijk', 'kade', 'ring', 'poort', 'markt',
  'avenue', 'ave', 'street', 'st', 'road', 'rd', 'lane', 'ln', 'drive', 'dr', 'court',
  'ct', 'way', 'terrace', 'ter', 'square', 'sq', 'highway', 'hwy', 'parkway', 'pkwy',
  'rue', 'chemin', 'impasse', 'allée', 'allee', 'quai', 'place', 'chaussée', 'chaussee',
  'route', 'cours',
  'via', 'viale', 'corso', 'piazza', 'largo', 'vicolo', 'strada', 'borgo',
  'calle', 'carrer', 'camino', 'camí', 'avenida', 'avda', 'av', 'plaza', 'paseo', 'ronda',
  'gasse', 'platz', 'allee', 'ring', 'chaussee', 'ufer', 'berg', 'strasse', 'straße',
  'rua', 'largo', 'travessa', 'praceta'
]);

// Woord-einden die op een straatnaam wijzen (Kerkstraat, Hauptstraße, Hoofdweg, Damrak).
const STREET_SUFFIXES = [
  'straat', 'steeg', 'weg', 'laan', 'plein', 'gracht', 'singel', 'kade', 'baan', 'dreef',
  'gasse', 'strasse', 'straße', 'str.', 'str', 'st.', 'damrak'
];

// Amerikaanse staat- en districtcodes (voor ZIP aan het regeleinde, "AUSTIN TX 78701").
const US_STATE_CODES = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia',
  'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt',
  'va', 'wa', 'wv', 'wi', 'wy', 'dc'
]);

function isStreetIndicator(word) {
  const w = String(word || '').toLowerCase().replace(/[.,;:]+$/, '');
  if (!w) return false;
  if (STREET_KEYWORDS.has(w)) return true;
  if (w.length < 5) return false;
  return STREET_SUFFIXES.some((suf) => w.endsWith(suf) && w.length > suf.length + 2);
}

/**
 * Herkent huisnummers en postcodes (NL/BE/DE/FR/ES/IT/UK/US) zodat het komma-herstel er
 * NOOIT op toeslaat (punt 1, v9). Een regel zonder echte prijsnotatie (decimaal) is geen
 * gerecht: "Kerkstraat 480", "AUSTIN TX 78701", "1011 AB Amsterdam", "10115 Berlin".
 */
export function isAddressOrPostalNumber(token, fullLineText = '') {
  const t = normalizePunctuation(token).trim().toLowerCase().replace(/[€$£\s]/g, '');
  // ZIP+4 (VS): 12345-6789 is nooit een bedrag
  if (/^\d{5}-\d{4}$/.test(t)) return true;

  const lineTokens = normalizePunctuation(fullLineText).toLowerCase().split(/\s+/).filter(Boolean);
  const idx = lineTokens.lastIndexOf(t);
  if (idx === -1) return false;
  const prev = idx > 0 ? lineTokens[idx - 1] : null;
  const next = idx < lineTokens.length - 1 ? lineTokens[idx + 1] : null;
  const lettersOnly = (w) => /^[a-z\u00C0-\u024F-]+$/.test(w || '');

  // Huisnummer aan het regeleinde na een straatindicator, ook 1-2 cijfers ("Via Roma 10")
  if (/^\d{1,6}$/.test(t) && next === null && prev && isStreetIndicator(prev)) return true;
  // Huisnummer aan het regeleinde na "<straatvoorvoegsel> <straatnaam>" ("Via Roma 10", "Calle Mayor 25", "Rue de la Paix 12")
  const prev2 = idx > 1 ? lineTokens[idx - 2] : null;
  if (/^\d{1,6}$/.test(t) && next === null && prev && lettersOnly(prev) && prev2 && STREET_KEYWORDS.has(prev2)) return true;
  // Huisnummer met busletter aan het regeleinde (punt N2, v11): "Avenue Louise 221 B",
  // "Kerkstraat 480 A". Het getal staat dan niet zelf aan het einde maar wordt gevolgd door
  // één losse letter; zoek daarvóór (tot 4 woorden terug) naar een straatindicator.
  if (/^\d{1,6}$/.test(t) && next && /^[a-z]$/.test(next) && idx === lineTokens.length - 2) {
    for (let k = 1; k <= 4 && idx - k >= 0; k++) {
      if (isStreetIndicator(lineTokens[idx - k])) return true;
    }
  }
  // Straatnaam met tussenvoegsel (punt B3, v10): "Carrer de Balmes 112", "Rue de la Paix 12",
  // "Via dei Fori Imperiali 1", "Avenida de Mayo 800", "Plaza de la Villa 4". Zoek tot 4 woorden
  // terug naar een straatindicator; de tussenvoegsels (de/del/dei/la/van/der/am/zur...) hoeven niet benoemd.
  if (/^\d{1,6}$/.test(t) && next === null) {
    for (let k = 1; k <= 4 && idx - k >= 0; k++) {
      if (isStreetIndicator(lineTokens[idx - k])) return true;
    }
  }
  if (!/^\d{3,6}$/.test(t)) return false;

  // NL postcode: 4 cijfers gevolgd door 2 letters ("1011 AB Amsterdam")
  if (/^\d{4}$/.test(t) && next && /^[a-z]{2}$/.test(next)) return true;
  // Postcode (5 cijfers, DE/FR/IT/VS) direct gevolgd door een plaatsnaam ("10115 Berlin")
  if (/^\d{5}$/.test(t) && next && lettersOnly(next)) return true;
  // Postcode aan het regeleinde na een plaatsnaam of staatcode ("AUSTIN TX 78701", "Rochelle 17000")
  if (/^\d{5}$/.test(t) && next === null && prev && lettersOnly(prev)) return true;
  // VS: staatcode + ZIP aan het regeleinde
  if (/^\d{5}$/.test(t) && next === null && prev && US_STATE_CODES.has(prev)) return true;
  return false;
}

// Administratieve labels (NL/EN/DE/FR/ES/IT) die een cijfergroep als telefoon-, bon-, tafel-,
// rekening- of ordernummer markeren. Met zo'n label op de regel is een kale cijfergroep nooit een prijs.
const ADMIN_LABEL_RE =
  /\b(tel|telefoon|telephone|telefon|téléphone|phone|fax|gsm|mob|mobile|bon|bonnetje|bonnummer|bonnr|kassabon|kassabonnummer|receipt|reçu|recu|recibo|scontrino|quittung|beleg|check|rekening|rekeningnummer|rechnung|factuur|factura|facture|invoice|fattura|addition|cuenta|nota|note|tafel|tafelnummer|table|mesa|tisch|nr|nº|no|num|nummer|numero|número|numéro|kvk|btw-nr|btw-nummer|vat\s*(nr|no|number)|iban|bic|order|ordernummer|bestelling|bestelnummer|commande|pedido|ordine|comanda|ticket|kassa|kasse|caja|caisse|caixa|serveerster|server|cashier|caissier|camarero|gast|guest|cover|est|established|since|sinds|seit|depuis|desde|dal|anno|opgericht|founded)s?\b/i;

/**
 * Punt B2 (v10): een kale cijfergroep van 3-6 cijfers op een bon mét decimaalnotatie is bijna nooit
 * een prijs zonder komma; het is een telefoonnummer ("020 555 0134"), bonnummer ("Bon: 1042"),
 * tafelnummer ("Tafel 123") of rekeningnummer. Robuuste regel, niet alleen een labellijst:
 * 1. administratief label op de regel -> geen herstel;
 * 2. twee of meer kale cijfergroepen van 3+ cijfers op één regel (telefoonachtig) -> geen herstel;
 * 3. voorloopnul ("0134") -> geen herstel;
 * 4. geïmpliceerd bedrag boven 250,00 -> geen herstel.
 */
function isAdministrativeDigitGroup(token, line) {
  if (!/^-?\d{3,6}$/.test(token)) return false;
  if (ADMIN_LABEL_RE.test(line)) return true;
  if (/^0\d/.test(token)) return true;
  if (parseInt(token, 10) > 25000) return true;
  const bareGroups = line.match(/(?<![\d.,])\d{3,}(?![\d.,])/g) || [];
  if (bareGroups.length >= 2) return true;
  return false;
}

/**
 * Controleert of een token een uitzondering is op de komma-herstelregel (paragraaf 2B):
 * gewichten, aantallen, percentages, datums, huisnummers/postcodes, administratieve nummers
 * of valuta zonder centen (JPY/yen).
 */
export function isDecimalRestoreException(token, fullLineText = '', currency = 'EUR') {
  const cur = String(currency || 'EUR').toUpperCase();
  if (['JPY', 'KRW', 'ISK', 'HUF'].includes(cur)) return true;

  const t = normalizePunctuation(token).trim();
  const line = normalizePunctuation(fullLineText).toLowerCase();

  // Datum (bijv. 19-11-2026, 2026/11/19, 19.11.2026)
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(t)) return true;
  // Percentage (21%, 9%)
  if (/%$/.test(t)) return true;
  // Huisnummer of postcode (punt 1, v9): nooit komma-herstel op adres- en postcoderegels
  if (isAddressOrPostalNumber(t, line)) return true;
  // Administratief nummer (punt B2, v10): telefoon/bon/tafel/rekening/ordernummer is geen prijs
  if (isAdministrativeDigitGroup(t, line)) return true;
  // Gewicht of volume direct na het getal in de regel (1,250 kg, 500 g, 750 ml, 0,5 l, 250 stuks)
  // Punt B1 (v10): String.raw — in een gewone template literal worden \s en \b letterlijke
  // "s" en backspace, waardoor deze uitzondering nooit werkte ("750 ml" werd stukprijs 7,50).
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(String.raw`${escaped}\s*(kg|g|gr|gram|ml|cl|dl|l|liter|litre|oz|lb|stuks?|pcs|pièces|piezas|pezzi)\b`, 'i').test(line)) {
    return true;
  }
  // Aantal (2 x, 3x)
  if (new RegExp(String.raw`^\s*${escaped}\s*[xX*]\b`).test(line)) return true;
  // Yen-teken in regel
  if (/[¥]|yen\b|jpy\b/i.test(line)) return true;

  return false;
}

/**
 * Bepaalt één komma-/duizendtallen-notatie voor de hele bon (paragraaf 2B).
 * Kijkt naar alle geldbedragen op de bon:
 * - "1.250,00" of "12,50" -> decimalSep: ',', thousandSep: '.'
 * - "1,250.00" of "12.50" -> decimalSep: '.', thousandSep: ','
 */
export function detectReceiptNumberFormat(lines, currency = 'EUR') {
  const cur = String(currency || 'EUR').toUpperCase();
  const zeroDecimal = ['JPY', 'KRW', 'ISK', 'HUF'].includes(cur);
  let commaDecimalVotes = 0;
  let dotDecimalVotes = 0;

  for (const line of lines || []) {
    const clean = normalizePunctuation(line);
    // Zoek expliciete 2-decimaal bedragen
    const commaMatches = clean.match(/(?:^|\s)-?€?\$?£?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?=\s|€|\$|£|$)/g);
    const dotMatches = clean.match(/(?:^|\s)-?€?\$?£?(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?=\s|€|\$|£|$)/g);
    if (commaMatches) commaDecimalVotes += commaMatches.length;
    if (dotMatches) dotDecimalVotes += dotMatches.length;
  }

  const hasExplicitDecimals = commaDecimalVotes > 0 || dotDecimalVotes > 0;
  const decimalSep = dotDecimalVotes > commaDecimalVotes ? '.' : ',';
  const thousandSep = decimalSep === ',' ? '.' : ',';

  return {
    decimalSep,
    thousandSep,
    hasExplicitDecimals,
    zeroDecimal
  };
}

/**
 * Parset een prijstoken met de gedetecteerde bonnotatie (1.250,00 vs 1,250.00).
 * Herstelt een bedrag zonder decimaal ("1450" -> 1450 cent = € 14,50) ALLEEN als de bon
 * expliciete 2-decimaal notatie gebruikt en het token geen uitzondering is.
 * Retourneert: { cents, restoredDecimal } of null.
 */
export function parseAmountWithFormat(token, fmt, fullLineText = '', currency = 'EUR') {
  if (token === null || token === undefined) return null;
  let raw = normalizePunctuation(token).trim();
  if (!raw) return null;

  if (isDecimalRestoreException(raw, fullLineText, currency)) {
    return null;
  }

  // Strip valutatekens
  const cleaned = raw.replace(/[€$£¥\s]/g, '');
  if (!cleaned) return null;

  // Punt B4 (v10): OCR-ruis als een streepje achter het bedrag ("4,60-") mag het bedrag niet
  // stil laten verdwijnen; strip losse streepjes aan het einde (ook Duits "4,60-" = 4,60 euro).
  const core = cleaned.replace(/[-\u2013\u2014]+$/, '') || cleaned;

  // 1. Expliciet bedrag met 2 decimalen volgens bonnotatie (incl. duizendtallen)
  const euRx = /^-?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}$/;
  const usRx = /^-?(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}$/;

  // Punt B4 (v10): OCR verwisselt cijfers en letters ook IN bedragen ("4,8O" voor 4,80).
  // Alleen als het token verder volledig uit cijfers en scheidingstekens bestaat, proberen we
  // naast het origineel ook de teruggezette variant (O->0, l/I/|->1, S->5, B->8).
  const deconfusedCore = core
    .replace(/[Oo]/g, '0')
    .replace(/[lI|]/g, '1')
    .replace(/S/g, '5')
    .replace(/B/g, '8');
  const coreVariants =
    deconfusedCore !== core && /^-?[\d.,]+$/.test(deconfusedCore) ? [core, deconfusedCore] : [core];

  for (const variant of coreVariants) {
    if (euRx.test(variant)) {
      const cents = parseEuroToCents(variant);
      return cents !== null ? { cents, restoredDecimal: false } : null;
    }
    if (usRx.test(variant)) {
      const cents = parseEuroToCents(variant);
      return cents !== null ? { cents, restoredDecimal: false } : null;
    }
  }

  // Punt N4 (v11): Nederlandse schrijfwijzen "6,-" en "6," (hele euro's) en "2,5" (een decimaal).
  // Alleen volgens de decimaalnotatie van de bon, zodat Amerikaanse duizendtallen ongemoeid blijven.
  const decSep = fmt && fmt.decimalSep ? fmt.decimalSep : ',';
  for (const variant of coreVariants) {
    if (decSep === ',' && /^-?\d+,$/.test(variant)) {
      const n = parseInt(variant, 10);
      return { cents: n * 100, restoredDecimal: false };
    }
    if (decSep === ',' && /^-?\d+,\d$/.test(variant)) {
      const cents = parseEuroToCents(variant + '0');
      return cents !== null ? { cents, restoredDecimal: false } : null;
    }
    if (decSep === '.' && /^-?\d+\.\d$/.test(variant)) {
      const cents = parseEuroToCents(variant + '0');
      return cents !== null ? { cents, restoredDecimal: false } : null;
    }
  }

  // 2. Valuta zonder centen (bijv. JPY): gehele getallen rechtstreeks
  if (fmt && fmt.zeroDecimal && /^-?\d+$/.test(core)) {
    return { cents: parseInt(core, 10) * 100, restoredDecimal: false };
  }

  // 3. Ontbrekend decimaalteken herstellen ("1450" -> 14,50) als bon 2-decimaal notatie gebruikt
  if (fmt && fmt.hasExplicitDecimals && !fmt.zeroDecimal && /^-?\d{3,6}$/.test(core)) {
    const n = parseInt(core, 10);
    return { cents: n, restoredDecimal: true };
  }

  return null;
}

/**
 * Extraheert een uniforme bounding box { x, y, width, height } uit een OCR-item.
 * Ondersteunt ppu-paddle-ocr ({ box: { x, y, width, height } }) en { bbox: { x0, y0, x1, y1 } }.
 */
function extractBox(item) {
  if (!item || typeof item !== 'object') return null;
  const b = item.box || item.bbox;
  if (!b || typeof b !== 'object') return null;
  if (typeof b.x === 'number' && typeof b.y === 'number') {
    return {
      x: b.x,
      y: b.y,
      width: typeof b.width === 'number' ? b.width : 10,
      height: typeof b.height === 'number' ? Math.max(4, b.height) : 14
    };
  }
  if (typeof b.x0 === 'number' && typeof b.y0 === 'number') {
    return {
      x: b.x0,
      y: b.y0,
      width: Math.max(1, (b.x1 ?? b.x0 + 10) - b.x0),
      height: Math.max(4, (b.y1 ?? b.y0 + 14) - b.y0)
    };
  }
  return null;
}

/**
 * Voegt losse OCR-regels samen tot artikel + prijs op één regel.
 * - Als OCR-items bounding boxes bevatten (ppu-paddle-ocr): koppelt op positie op de bon
 *   (zelfde regelhoogte op basis van y-midden, naam links, prijs rechts), ongeacht de volgorde waarin OCR ze teruggeeft.
 * - Zonder bounding boxes (platte tekst / plakvak): voegt losse prijsregels samen met de voorafgaande naamregel.
 */
export function mergeOcrLinesToSingleRow(rawLines) {
  const flat = [];
  for (const entry of rawLines || []) {
    if (Array.isArray(entry)) {
      for (const sub of entry) flat.push(sub);
    } else {
      flat.push(entry);
    }
  }

  // Controleer of er bruikbare bounding boxes aanwezig zijn
  const boxedItems = [];
  for (const item of flat) {
    if (item && typeof item === 'object') {
      const text = normalizePunctuation(item.text || '').trim();
      const box = extractBox(item);
      if (text && box) {
        boxedItems.push({
          text,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          cy: box.y + box.height / 2
        });
      }
    }
  }

  if (boxedItems.length > 0) {
    const heights = boxedItems.map((b) => b.height).sort((a, b) => a - b);
    const medianH = heights[Math.floor(heights.length / 2)] || 16;
    const yTolerance = Math.max(8, medianH * 0.65);

    // Sorteer op verticale positie (y-midden), daarna van links naar rechts
    boxedItems.sort((a, b) => a.cy - b.cy || a.x - b.x);

    // Schuinte-correctie (v8): op een scheef gefotografeerde bon loopt een en dezelfde
    // regel schuin op, dus naam (links) en prijs (rechts) verschillen in y. Bepaal de
    // helling door kandidaat-hellingen (uit horizontaal ver uit elkaar liggende paren) te
    // scoren: bij de juiste helling vallen regels strak samen (kleinste restafwijking).
    const n = boxedItems.length;
    const xRef = boxedItems.reduce((s, it) => s + it.x, 0) / n;
    const candidates = new Set([0]);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        // Normeer elk paar naar links -> rechts, onafhankelijk van de sorteervolgorde.
        let dx = boxedItems[j].x - boxedItems[i].x;
        let dy = boxedItems[j].cy - boxedItems[i].cy;
        if (dx < 0) { dx = -dx; dy = -dy; }
        if (dx < medianH * 3) continue;
        candidates.add(dy / dx);
      }
    }
    let skewSlope = 0;
    let bestScore = Infinity;
    for (const raw of candidates) {
      const s = Math.max(-0.7, Math.min(0.7, raw)); // begrensd tot ~35 graden
      const adj = boxedItems
        .map((it) => it.cy - s * (it.x - xRef))
        .sort((a, b) => a - b);
      // Scoreer: restafwijking binnen regels + straf voor eenlingregels. Bij de juiste
      // helling vallen naam en prijs per regel samen (weinig eenlingen, strakke regels);
      // bij een verkeerde helling versplintert alles tot losse regels.
      let residual = 0;
      let singletons = 0;
      let rowSum = 0;
      let rowCount = 0;
      let rowMean = 0;
      const flushRow = () => {
        if (rowCount === 1) singletons++;
        rowSum = 0;
        rowCount = 0;
      };
      for (const v of adj) {
        if (rowCount > 0 && Math.abs(v - rowMean) > yTolerance) {
          flushRow();
        }
        if (rowCount === 0) {
          rowMean = v;
          rowSum = v;
          rowCount = 1;
          continue;
        }
        residual += Math.abs(v - rowMean);
        rowSum += v;
        rowCount++;
        rowMean = rowSum / rowCount;
      }
      flushRow();
      const score = residual + singletons * yTolerance * 0.75;
      if (score < bestScore - 1e-9) {
        bestScore = score;
        skewSlope = s;
      }
    }
    for (const it of boxedItems) {
      it.cyAdj = it.cy - skewSlope * (it.x - xRef);
    }

    const rows = [];
    for (const item of boxedItems) {
      let bestRow = null;
      let bestDist = Infinity;
      for (const row of rows) {
        const dist = Math.abs(item.cyAdj - row.meanY);
        if (dist <= yTolerance && dist < bestDist) {
          bestDist = dist;
          bestRow = row;
        }
      }
      if (bestRow) {
        bestRow.items.push(item);
        bestRow.meanY =
          bestRow.items.reduce((s, it) => s + it.cyAdj, 0) / bestRow.items.length;
      } else {
        rows.push({ meanY: item.cyAdj, items: [item] });
      }
    }

    rows.sort((a, b) => a.meanY - b.meanY);
    return rows.map((row) => {
      row.items.sort((a, b) => a.x - b.x);
      return row.items.map((it) => it.text).join(' ');
    });
  }

  // Fallback zonder bounding boxes (platte tekst / iPhone Live Text)
  const cleaned = flat
    .map((l) => normalizePunctuation(typeof l === 'string' ? l : l?.text || '').trim())
    .filter(Boolean);

  // Alleen regels die er echt als prijs uitzien (met decimaalteken of valutateken) mogen
  // aan de vorige naamregel geplakt worden. Een kale cijferregel zonder decimaalteken en
  // zonder valutateken (huisnummer "480", tafelnummer, kassanummer) wordt NOOIT samengevoegd
  // en nooit een gerecht (punt 2 van de v8-verbeterprompt).
  const priceOnlyRx = /^-?[€$£]\s*(?:\d{1,3}(?:[.,]\d{3})+|\d+)[.,]\d{2}\s*[€$£]?$|^-?(?:\d{1,3}(?:[.,]\d{3})+|\d+)[.,]\d{2}\s*[€$£]?$/;
  const hasPriceAtEndRx = /-?[€$£]?(?:\d{1,3}(?:[.,]\d{3})+|\d+)[.,]\d{2}[€$£]?$/;

  const merged = [];
  for (let i = 0; i < cleaned.length; i++) {
    const line = cleaned[i];
    if (
      priceOnlyRx.test(line) &&
      !isDecimalRestoreException(line, line) &&
      merged.length > 0 &&
      !hasPriceAtEndRx.test(merged[merged.length - 1])
    ) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${line.replace(/\s+/g, '')}`;
    } else {
      merged.push(line);
    }
  }
  return merged;
}

/**
 * Somcontrole van onderaf (paragraaf 2 & 2B):
 * 1. Begint bij totaal, dan fooi, dan btw, dan subtotaal, dan gerechten.
 * 2. Detecteert een onbenoemd subtotaal (zowel als regel in items als in unlabeledAmounts).
 * 3. Probeert beide rekenwijzen:
 *    - inclusief btw (NL/ES/DE): som(gerechten) + fooi + korting == totaal
 *    - exclusief btw (VS): subtotaal + btw + fooi + korting == totaal
 * 4. Als twee combinaties kloppen, retourneert ambiguousCandidates zodat de gebruiker kiest.
 */
export function reconcileBottomUp({
  items = [],
  receiptTotalCents = null,
  subtotalCents = null,
  vatCents = null,
  tipCents = null,
  discountCents = null,
  unlabeledAmounts = []
}) {
  const workItems = items.map((it) => ({ ...it }));
  const active = workItems.filter(isLineActive);
  const sumAllActive = active.reduce(
    (s, it) => s + (Number.isInteger(it.lineTotalCents) ? it.lineTotalCents : 0),
    0
  );

  const tipVal = Number.isInteger(tipCents) ? tipCents : 0;
  const vatVal = Number.isInteger(vatCents) ? vatCents : 0;
  const discVal = Number.isInteger(discountCents) ? -Math.abs(discountCents) : 0;

  // Als er nog geen subtotaal of totaal is, mogen losse bedragen zonder naam (unlabeledAmounts)
  // hooguit meewegen als kandidaat-subtotaal of -totaal, maar worden ze NOOIT een gerecht.
  let resolvedSubtotalCents = subtotalCents;
  let resolvedTotalCents = receiptTotalCents;

  if (unlabeledAmounts && unlabeledAmounts.length > 0) {
    if (resolvedSubtotalCents === null) {
      const subMatch = unlabeledAmounts.find((u) => u.cents === sumAllActive);
      if (subMatch) resolvedSubtotalCents = subMatch.cents;
    }
    if (resolvedTotalCents === null) {
      const totMatchIncl = unlabeledAmounts.find((u) => u.cents === sumAllActive + tipVal + discVal);
      const totMatchExcl = vatVal > 0 ? unlabeledAmounts.find((u) => u.cents === sumAllActive + vatVal + tipVal + discVal) : null;
      if (totMatchIncl && !totMatchExcl) resolvedTotalCents = totMatchIncl.cents;
      else if (totMatchExcl && !totMatchIncl) resolvedTotalCents = totMatchExcl.cents;
    }
  }

  const candidates = [];

  // Rekenwijze A: BTW inbegrepen (NL/ES/DE)
  const expectedIncl = sumAllActive + tipVal + discVal;
  if (resolvedTotalCents !== null && expectedIncl === resolvedTotalCents) {
    candidates.push({
      mode: 'vat_included',
      label: 'Btw inbegrepen in prijzen (totaal = som van gerechten)',
      excludedSubtotalItemId: null,
      itemsSumCents: sumAllActive,
      matchesTotal: true
    });
  }

  // Rekenwijze B: Belasting erbovenop (VS: subtotaal + belasting + fooi == totaal)
  const baseForExcl = Number.isInteger(resolvedSubtotalCents) ? resolvedSubtotalCents : sumAllActive;
  const expectedExcl = baseForExcl + vatVal + tipVal + discVal;
  if (
    resolvedTotalCents !== null &&
    vatVal > 0 &&
    expectedExcl === resolvedTotalCents &&
    sumAllActive === baseForExcl
  ) {
    candidates.push({
      mode: 'vat_added',
      label: 'Belasting erbovenop (totaal = subtotaal + btw + fooi)',
      excludedSubtotalItemId: null,
      itemsSumCents: sumAllActive,
      vatAddedCents: vatVal,
      matchesTotal: true
    });
  }

  // Detecteer onbenoemd subtotaal binnen actieve items (regel gelijk aan som van andere regels)
  if (active.length >= 2) {
    for (let i = 0; i < active.length; i++) {
      const cand = active[i];
      if (!Number.isInteger(cand.lineTotalCents) || cand.lineTotalCents <= 0) continue;
      const sumOthers = sumAllActive - cand.lineTotalCents;

      if (cand.lineTotalCents === sumOthers) {
        const isLastOrBelow = i === active.length - 1;
        const isFirstOrAbove = i === 0;
        const posHint = isFirstOrAbove ? 'boven de gerechten' : isLastOrBelow ? 'onder de gerechten' : 'tussen de gerechten';

        const matchesIncl = resolvedTotalCents === null || sumOthers + tipVal + discVal === resolvedTotalCents;
        const matchesExcl = resolvedTotalCents !== null && vatVal > 0 && sumOthers + vatVal + tipVal + discVal === resolvedTotalCents;

        if (matchesIncl || matchesExcl) {
          candidates.push({
            mode: matchesExcl ? 'vat_added_unlabeled_subtotal' : 'vat_included_unlabeled_subtotal',
            label: `Regel "${cand.description}" (${(cand.lineTotalCents / 100).toFixed(2).replace('.', ',')}) is waarschijnlijk een onbenoemd subtotaal (${posHint})`,
            excludedSubtotalItemId: cand.id,
            itemsSumCents: sumOthers,
            matchesTotal: true
          });
        }
      }
    }
  }

  let taxMode = 'unknown';
  let ambiguousCandidates = [];
  let matchesTotal = false;

  if (candidates.length === 1) {
    const win = candidates[0];
    taxMode = win.mode.startsWith('vat_added') ? 'vat_added' : 'vat_included';
    matchesTotal = win.matchesTotal;
    if (win.excludedSubtotalItemId) {
      const target = workItems.find((x) => x.id === win.excludedSubtotalItemId);
      if (target) {
        target.lineType = 'subtotal_auto';
        target.excluded = true;
        target.probableSubtotal = true;
        target.lowConfidence = false;
      }
    }
  } else if (candidates.length > 1) {
    ambiguousCandidates = candidates;
    taxMode = 'ambiguous';
    matchesTotal = false;
    for (const it of workItems.filter(isLineActive)) {
      it.lowConfidence = true;
    }
  } else {
    matchesTotal = resolvedTotalCents !== null && sumAllActive === resolvedTotalCents;
    if (resolvedTotalCents !== null && !matchesTotal) {
      for (const it of workItems.filter(isLineActive)) {
        it.lowConfidence = true;
      }
    }
  }

  const finalActiveSum = workItems
    .filter(isLineActive)
    .reduce((s, it) => s + (Number.isInteger(it.lineTotalCents) ? it.lineTotalCents : 0), 0);

  return {
    items: workItems,
    activeSumCents: finalActiveSum,
    receiptTotalCents: resolvedTotalCents,
    subtotalCents: resolvedSubtotalCents,
    vatCents,
    tipCents,
    discountCents,
    taxMode,
    matchesTotal,
    totalMismatch: resolvedTotalCents !== null && !matchesTotal,
    ambiguousCandidates
  };
}

/**
 * Verwerkt platte tekst (iPhone Live Text of lokale OCR-regels) met alle regels uit paragraaf 2 & 2B.
 */
export function parsePlainTextReceipt(plainText, currency = 'EUR') {
  const mergedLines = mergeOcrLinesToSingleRow(String(plainText || '').split(/\r?\n/));
  if (mergedLines.length === 0) {
    return {
      items: [],
      unparsedLines: [],
      receiptTotalCents: null,
      subtotalCents: null,
      vatCents: null,
      tipCents: null,
      discountCents: null,
      taxMode: 'unknown',
      ambiguousCandidates: [],
      totalMismatch: false
    };
  }

  const fmt = detectReceiptNumberFormat(mergedLines, currency);
  const items = [];
  const unparsedLines = [];
  const unlabeledAmounts = [];
  let receiptTotalCents = null;
  let subtotalCents = null;
  let vatCents = null;
  let tipCents = null;
  let discountCents = null;
  let idCounter = 1;

  for (const line of mergedLines) {
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    // Zoek prijstokens vanaf rechts met bonnotatie
    let priceTokens = [];
    for (let i = tokens.length - 1; i >= 0; i--) {
      const parsed = parseAmountWithFormat(tokens[i], fmt, line, currency);
      if (parsed !== null) {
        priceTokens.push({ index: i, ...parsed, raw: tokens[i] });
      }
    }

    const nonDishKind = classifyNonDishKeyword(line);

    // Punt N4 (v11): een expliciet bedrag onder 0,50 op een gerechtregel is vrijwel altijd een
    // volume ("Cola 0,33") en nooit een (eenheids)prijs. Laat het in de naam staan en gebruik
    // het niet als prijs. Niet-gerechtregels (btw e.d.) blijven ongemoeid.
    if (!nonDishKind) {
      priceTokens = priceTokens.filter(
        (pt) => !(pt.restoredDecimal === false && pt.cents > 0 && pt.cents < 50)
      );
    }

    if (priceTokens.length === 0) {
      unparsedLines.push({ id: `raw_${Date.now()}_${idCounter++}`, text: line, pageNumber: 1 });
      continue;
    }

    const rightMost = priceTokens[0];
    const leftText = tokens.slice(0, rightMost.index).join(' ').trim();

    // Niet-gerecht-regels (paragraaf 2 & 2B) komen NOOIT als gerecht in de lijst
    if (nonDishKind === 'total') {
      receiptTotalCents = rightMost.cents;
      continue;
    }
    if (nonDishKind === 'subtotal') {
      subtotalCents = rightMost.cents;
      continue;
    }
    if (nonDishKind === 'vat') {
      vatCents = (vatCents || 0) + rightMost.cents;
      continue;
    }
    if (nonDishKind === 'tip') {
      tipCents = (tipCents || 0) + rightMost.cents;
      continue;
    }
    if (nonDishKind === 'payment') {
      unparsedLines.push({ id: `raw_${Date.now()}_${idCounter++}`, text: line, pageNumber: 1, ignoredHint: true });
      continue;
    }

    // Korting
    if (nonDishKind === 'discount' || rightMost.cents < 0) {
      const negCents = -Math.abs(rightMost.cents);
      items.push({
        id: `txt_${Date.now()}_${idCounter++}`,
        description: leftText || 'Korting',
        originalDescription: leftText || 'Korting',
        qty: 1,
        unitPriceCents: negCents,
        lineTotalCents: negCents,
        assignedTo: [],
        assignedQuantities: {},
        lineType: 'discount',
        isVatSummary: false,
        excluded: false,
        restoredDecimal: rightMost.restoredDecimal,
        lowConfidence: rightMost.restoredDecimal,
        pageNumber: 1
      });
      continue;
    }

    // Gewone regel
    let qty = 1;
    let descText = leftText;
    const qtyMatch = descText.match(/^(\d{1,2})\s*[xX*]?\s+(.+)$/);
    if (qtyMatch) {
      const pq = parseInt(qtyMatch[1], 10);
      if (pq >= 1 && pq <= 99) {
        qty = pq;
        descText = qtyMatch[2].trim();
      }
    }

    let unitPriceCents = qty === 1 ? rightMost.cents : null;
    if (priceTokens.length >= 2) {
      unitPriceCents = priceTokens[1].cents;
      descText = tokens
        .slice(0, priceTokens[1].index)
        .join(' ')
        .replace(/^(\d{1,2})\s*[xX*]?\s+/, '')
        .trim();
    } else if (qty > 1 && rightMost.cents % qty === 0) {
      unitPriceCents = rightMost.cents / qty;
    } else if (qty > 1) {
      unitPriceCents = Math.floor(rightMost.cents / qty);
    }

    // PUNT 5: Geen naam is geen gerecht.
    // Een regel zonder naamdeel (alleen cijfers/tekens, zoals huisnummer "480" of los subtotaal "12,00")
    // wordt NOOIT een gerecht en blokkeert het afronden niet; het mag hooguit meewegen als kandidaat-subtotaal/-totaal.
    if (!hasDishNameLetters(descText)) {
      unlabeledAmounts.push({
        cents: rightMost.cents,
        restoredDecimal: rightMost.restoredDecimal,
        rawText: line
      });
      unparsedLines.push({ id: `raw_${Date.now()}_${idCounter++}`, text: line, pageNumber: 1, ignoredHint: true });
      continue;
    }

    items.push({
      id: `txt_${Date.now()}_${idCounter++}`,
      description: descText,
      originalDescription: descText,
      qty,
      unitPriceCents,
      lineTotalCents: rightMost.cents,
      assignedTo: [],
      assignedQuantities: {},
      lineType: nonDishKind === 'service' ? 'surcharge' : 'item',
      isVatSummary: false,
      needsVatDecision: nonDishKind === 'service',
      excluded: false,
      restoredDecimal: rightMost.restoredDecimal,
      lowConfidence: rightMost.restoredDecimal,
      pageNumber: 1
    });
  }

  const reconciled = reconcileBottomUp({
    items,
    receiptTotalCents,
    subtotalCents,
    vatCents,
    tipCents,
    discountCents,
    unlabeledAmounts
  });

  return {
    ...reconciled,
    unparsedLines,
    numberFormat: fmt
  };
}

function withTimeout(promise, ms, timeoutMessage) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export function splitPdfTextItemToWords(item, viewportHeight) {
  const rawStr = normalizePunctuation(item?.str || '').trim();
  if (!rawStr) return [];
  const tx = item.transform || [1, 0, 0, 1, 0, 0];
  const baseX = tx[4] || 0;
  const baseY = viewportHeight - (tx[5] || 0);
  const totalWidth = item.width || rawStr.length * 6;
  const height = item.height || 12;
  const parts = rawStr.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return [{ text: rawStr, bbox: { x0: baseX, y0: baseY, x1: baseX + totalWidth, y1: baseY + height } }];
  }
  const totalChars = Math.max(1, rawStr.length);
  const words = [];
  let cursor = 0;
  for (const part of parts) {
    const idx = Math.max(cursor, rawStr.indexOf(part, cursor));
    words.push({
      text: part,
      bbox: {
        x0: baseX + (idx / totalChars) * totalWidth,
        y0: baseY,
        x1: baseX + ((idx + part.length) / totalChars) * totalWidth,
        y1: baseY + height
      }
    });
    cursor = idx + part.length;
  }
  return words;
}

/**
 * Leest ALLE pagina's van een PDF uit op zoek naar een echte tekstlaag (PDF.js).
 */
export async function extractPdfTextAllPages(file, onProgress = () => {}) {
  // Punt B6 (v10): een laadfout van PDF.js zelf (jsDelivr geblokkeerd / offline) is iets anders
  // dan een scan zonder tekstlaag; geef dat expliciet door via err.code.
  let pdfjsLib;
  try {
    pdfjsLib = await withTimeout(
      import(LIB_URLS.pdfjsScript),
      15000,
      'PDF-lezer kon niet op tijd worden geladen.'
    );
  } catch (loadErr) {
    const e = new Error('De pdf-lezer (PDF.js) kon niet geladen worden.');
    e.code = 'pdfjs_load_failed';
    e.cause = loadErr;
    throw e;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = LIB_URLS.pdfjsWorker;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;

  const allLines = [];
  let scannedPages = 0;

  for (let p = 1; p <= totalPages; p++) {
    onProgress({ page: p, totalPages, progress: p / totalPages });
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const words = [];
    let pageChars = 0;
    for (const item of textContent.items) {
      const str = String(item.str || '').trim();
      if (!str) continue;
      pageChars += str.length;
      words.push(...splitPdfTextItemToWords(item, viewport.height));
    }

    if (pageChars < 20) {
      scannedPages++;
      continue;
    }

    // Groepeer op y-hoogte naar regels
    words.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
    const rows = [];
    for (const w of words) {
      const row = rows.find((r) => Math.abs(r.y - w.bbox.y0) <= 8);
      if (row) row.words.push(w);
      else rows.push({ y: w.bbox.y0, words: [w] });
    }
    for (const r of rows) {
      r.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      allLines.push(r.words.map((w) => w.text).join(' '));
    }
  }

  const joined = allLines.join('\n');
  const parsed = parsePlainTextReceipt(joined);

  return {
    totalPages,
    scannedPages,
    hasScannedPages: scannedPages > 0,
    rawText: joined,
    parsed
  };
}
