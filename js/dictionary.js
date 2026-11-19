// Bonnetje - Offline horecawoordenboek (Spaans & Engels -> Nederlands)
// Eenvoudig uit te breiden via BUILTIN_DICTIONARY of via lokale gebruikersinvoer.

export const BUILTIN_DICTIONARY = {
  // Spaans - Dranken
  'agua': 'Water',
  'agua con gas': 'Bruisend water',
  'agua sin gas': 'Plat water',
  'agua mineral': 'Mineraalwater',
  'cana': 'Klein tapbiertje',
  'caña': 'Klein tapbiertje',
  'doble': 'Groot tapbier',
  'jarra': 'Pul bier',
  'cerveza': 'Bier',
  'clara': 'Bier met limonade (radler)',
  'tinto de verano': 'Rode wijn met limonade',
  'vino tinto': 'Rode wijn',
  'vino blanco': 'Witte wijn',
  'vino rosado': 'Roséwijn',
  'copa': 'Glas (wijn/drank)',
  'copa de vino': 'Glas wijn',
  'botella': 'Fles',
  'botella de vino': 'Fles wijn',
  'cava': 'Cava (mousserende wijn)',
  'sangria': 'Sangria',
  'sangría': 'Sangria',
  'vermut': 'Vermout',
  'refresco': 'Frisdrank',
  'zumo': 'Vruchtensap',
  'zumo de naranja': 'Sinaasappelsap',
  'cafe': 'Koffie',
  'café': 'Koffie',
  'cafe solo': 'Espresso',
  'café solo': 'Espresso',
  'cafe con leche': 'Koffie met melk',
  'café con leche': 'Koffie met melk',
  'cortado': 'Espresso met scheutje melk',
  'carajillo': 'Koffie met likeur/brandy',
  'descafeinado': 'Cafeïnevrije koffie',
  'te': 'Thee',
  'té': 'Thee',
  'infusion': 'Kruidenthee',
  'infusión': 'Kruidenthee',
  'chupito': 'Shotje',
  'hierbas': 'Kruidenlikeur',
  'gin tonic': 'Gin-tonic',

  // Spaans - Gerechten & tapas
  'menu del dia': 'Dagmenu',
  'menú del día': 'Dagmenu',
  'menu': 'Menu',
  'menú': 'Menu',
  'racion': 'Portie (om te delen)',
  'ración': 'Portie (om te delen)',
  'media racion': 'Halve portie',
  'media ración': 'Halve portie',
  'tapa': 'Tapa',
  'pincho': 'Pincho (hapje)',
  'pintxo': 'Pintxo (hapje)',
  'pan': 'Brood',
  'pan y alioli': 'Brood met alioli',
  'pan con tomate': 'Brood met tomaat',
  'aceitunas': 'Olijven',
  'patatas bravas': 'Patatas bravas',
  'patatas fritas': 'Friet',
  'croquetas': 'Kroketjes',
  'calamares': 'Inktvisringen',
  'chipirones': 'Kleine inktvisjes',
  'pulpo': 'Octopus',
  'pulpo a la gallega': 'Octopus op Galicische wijze',
  'gambas': 'Garnalen',
  'gambas al ajillo': 'Garnalen in knoflookolie',
  'boquerones': 'Ansjovis',
  'mejillones': 'Mosselen',
  'almejas': 'Venusschelpen',
  'pescado': 'Vis',
  'dorada': 'Dorade',
  'lubina': 'Zeebaars',
  'salmon': 'Zalm',
  'salmón': 'Zalm',
  'atun': 'Tonijn',
  'atún': 'Tonijn',
  'bacalao': 'Kabeljauw',
  'paella': 'Paella',
  'arroz': 'Rijstgerecht',
  'fideua': 'Fideuà (noedelpaella)',
  'fideuà': 'Fideuà (noedelpaella)',
  'ensalada': 'Salade',
  'ensalada mixta': 'Gemengde salade',
  'gazpacho': 'Gazpacho (koude tomatensoep)',
  'sopa': 'Soep',
  'verduras': 'Groenten',
  'pimientos de padron': 'Groene paprikaatjes',
  'pimientos de padrón': 'Groene paprikaatjes',
  'tortilla': 'Spaanse omelet',
  'tortilla de patatas': 'Aardappelomelet',
  'jamon': 'Ham',
  'jamón': 'Ham',
  'jamon iberico': 'Ibericoham',
  'jamón ibérico': 'Ibericoham',
  'queso': 'Kaas',
  'queso manchego': 'Manchegokaas',
  'tabla de quesos': 'Kaasplank',
  'carne': 'Vlees',
  'pollo': 'Kip',
  'cerdo': 'Varkensvlees',
  'ternera': 'Rundvlees',
  'cordero': 'Lamsvlees',
  'solomillo': 'Ossenhaas / varkenshaas',
  'entrecot': 'Entrecote',
  'chuletas': 'Koteletten',
  'albondigas': 'Gehaktballetjes',
  'albóndigas': 'Gehaktballetjes',
  'hamburguesa': 'Hamburger',
  'bocadillo': 'Belegd stokbrood',
  'tostada': 'Geroosterd brood',
  'postre': 'Nagerecht',
  'helado': 'IJs',
  'tarta': 'Taart',
  'tarta de queso': 'Cheesecake',
  'flan': 'Flan (karamelpudding)',
  'fruta': 'Fruit',
  'cubierto': 'Couvert / brood- en tafeltoeslag',
  'servicio': 'Bedieningstoeslag',
  'suplemento': 'Toeslag',
  'terraza': 'Terrastoeslag',
  'descuento': 'Korting',

  // Engels - Dranken & gerechten
  'sparkling water': 'Bruisend water',
  'still water': 'Plat water',
  'tap water': 'Kraanwater',
  'draft beer': 'Tapbier',
  'draught beer': 'Tapbier',
  'pint': 'Groot glas bier',
  'red wine': 'Rode wijn',
  'white wine': 'Witte wijn',
  'rose wine': 'Roséwijn',
  'glass of wine': 'Glas wijn',
  'bottle of wine': 'Fles wijn',
  'soft drink': 'Frisdrank',
  'orange juice': 'Sinaasappelsap',
  'coffee': 'Koffie',
  'tea': 'Thee',
  'starter': 'Voorgerecht',
  'main course': 'Hoofdgerecht',
  'dessert': 'Nagerecht',
  'side salad': 'Bijgerecht salade',
  'french fries': 'Friet',
  'fries': 'Friet',
  'chips': 'Friet',
  'garlic bread': 'Knoflookbrood',
  'bread': 'Brood',
  'soup': 'Soep',
  'chicken': 'Kip',
  'beef': 'Rundvlees',
  'pork': 'Varkensvlees',
  'lamb': 'Lamsvlees',
  'steak': 'Biefstuk',
  'salmon': 'Zalm',
  'shrimp': 'Garnalen',
  'prawns': 'Garnalen',
  'mussels': 'Mosselen',
  'squid': 'Inktvis',
  'cheese': 'Kaas',
  'ice cream': 'IJs',
  'cake': 'Taart',
  'service charge': 'Bedieningstoeslag',
  'discount': 'Korting'
};

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Zoekt een bonomschrijving op in het offline woordenboek (ingebouwd + eigen aanvullingen).
 * Verzint nooit een vertaling: bij onbekende tekst blijft translated=false.
 */
export function translateOffline(description, customDict = {}) {
  const original = String(description || '').trim();
  if (!original) {
    return { translated: false, text: original, matchedKey: null };
  }

  const combined = { ...BUILTIN_DICTIONARY, ...customDict };
  const norm = normalizeKey(original);
  const normNoAcc = stripAccents(norm);

  // 1. Exacte match (met of zonder accenten)
  for (const [key, val] of Object.entries(combined)) {
    const kNorm = normalizeKey(key);
    if (kNorm === norm || stripAccents(kNorm) === normNoAcc) {
      return { translated: true, text: val, matchedKey: key };
    }
  }

  // 2. Langste woordgroep-match binnen de regel (bijv. "2x caña" of "vino tinto rioja")
  const sortedKeys = Object.keys(combined).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const kNorm = stripAccents(normalizeKey(key));
    if (kNorm.length < 3) continue;
    const rx = new RegExp(`(^|\\b)${kNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|$)`, 'i');
    if (rx.test(normNoAcc)) {
      return { translated: true, text: `${combined[key]} (${original})`, matchedKey: key };
    }
  }

  return { translated: false, text: original, matchedKey: null };
}

// v9: de dode functie lookupSinglePhraseOnline (met een MyMemory-endpoint) is verwijderd.
// Vertalen gebeurt alleen via het offline woordenboek hierboven of via Gemini (online);
// de app benadert geen andere vertaaldienst en de privacytekst hoeft die dus ook niet te noemen.
