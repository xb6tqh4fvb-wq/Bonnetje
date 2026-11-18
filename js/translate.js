// Vertalen van bonregels (Spaans/Engels/Nederlands) met een ingebouwd horecawoordenboek.
// Werkt offline. Uitbreiden met een nieuwe taal = een kolom toevoegen aan de tabel.
// Optioneel: online vertalen van wat het woordenboek niet kent (MyMemory, gratis, zonder sleutel).

export const RECEIPT_LANGS = ['nl', 'es', 'en'];

// nl | en | es  — alternatieven met ';' gescheiden; de eerste is de vertaling die getoond wordt.
// '*' = bijvoeglijk naamwoord (komt in het Spaans achter het zelfstandig naamwoord);
// 'gegrild>gegrilde' = Nederlandse vorm vóór een zelfstandig naamwoord.
// Een lege kolom betekent: woord weglaten (lidwoorden e.d.).
const TABLE = `
water|water|agua
bruisend water;spa rood|sparkling water;soda water|agua con gas;agua c/gas;agua gas
plat water;spa blauw|still water|agua sin gas;agua s/gas;agua mineral
frisdrank|soft drink;soda|refresco;refrescos
cola|coke;cola|coca cola;coca-cola;cocacola;cola
cola zero|coke zero;diet coke|coca cola zero;coca cola light;cola zero
sinaasappelsap|orange juice|zumo de naranja;zumo naranja;jugo de naranja
verse jus d'orange|fresh orange juice|zumo de naranja natural;naranja natural
sap|juice|zumo;jugo
limonade|lemonade|limonada
ijsthee|iced tea|te frio;nestea
bier|beer|cerveza;cervezas
klein tapbiertje|small draught beer|cana;canas
grote pul bier;pul bier|pint;pint of beer|jarra de cerveza;pinta
pils|lager|cerveza rubia;rubia
pul pils|pint of lager|jarra de rubia
alcoholvrij bier|alcohol-free beer;non-alcoholic beer|cerveza sin alcohol;cerveza 0,0
wijn|wine|vino;vinos
rode wijn|red wine|vino tinto;tinto
witte wijn|white wine|vino blanco
rosé|rose wine;rosé|vino rosado;rosado
huiswijn|house wine|vino de la casa
fles wijn|bottle of wine|botella de vino
fles rode wijn|bottle of red wine|botella vino tinto;botella de vino tinto
fles witte wijn|bottle of white wine|botella vino blanco;botella de vino blanco
fles|bottle|botella
glas|glass|copa;vaso
karaf|carafe;jug|jarra
mousserende wijn|sparkling wine|espumoso;vino espumoso
cava|cava|cava
sangria|sangria|sangria
rode wijn met limonade|red wine with lemonade|tinto de verano
koffie|coffee|cafe
espresso|espresso|cafe solo;solo
espresso met wat melk|cortado|cortado
koffie verkeerd|latte;caffe latte;cafe latte|cafe con leche
cappuccino|cappuccino|capuchino;cappuccino
thee|tea|te;infusion
melk|milk|leche
gin-tonic|gin and tonic;gin tonic;g&t|gin tonic;gintonic
cocktail|cocktail|coctel;cocktail
likeur|liqueur|licor;chupito
whisky|whisky;whiskey|whisky
rum|rum|ron
tonic|tonic|tonica
brood|bread|pan
stokbrood|baguette|barra de pan
broodje|sandwich;roll|bocadillo;bocata;montadito
tosti|toastie;grilled cheese|sandwich mixto;mixto
voorgerecht|starter;appetizer|entrante;entrantes;primero
hoofdgerecht|main course;main|segundo;plato principal
bijgerecht|side;side dish|acompanamiento;guarnicion
dessert;nagerecht|dessert|postre;postres
menu van de dag|menu of the day;set menu|menu del dia
kindermenu|kids menu;children's menu|menu infantil
menu|menu|menu
portie|portion|racion;raciones
halve portie|half portion|media racion
tapa|tapa|tapa;tapas
gerecht|dish|plato
salade|salad|ensalada
gemengde salade|mixed salad|ensalada mixta
soep|soup|sopa
koude tomatensoep (gazpacho)|cold tomato soup (gazpacho)|gazpacho
paella|paella|paella
zeevruchtenpaella|seafood paella|paella de marisco;paella marinera
rijst|rice|arroz
pasta|pasta|pasta
friet;patat|fries;chips|patatas fritas
aardappelen|potatoes|patatas;papas
aardappel met pikante saus (bravas)|potatoes in spicy sauce (bravas)|patatas bravas;bravas
aardappelomelet (tortilla)|spanish omelette (tortilla)|tortilla;tortilla espanola;tortilla de patatas
omelet|omelette|tortilla francesa
ei|egg|huevo
eieren|eggs|huevos
gebakken eieren|fried eggs|huevos fritos
kaas|cheese|queso
kaasplank|cheese board|tabla de quesos
ham|ham|jamon
serranoham|serrano ham|jamon serrano
ibérico-ham|iberian ham|jamon iberico
chorizo|chorizo|chorizo
vleeswaren|cold cuts|embutidos;embutido
worst|sausage|salchicha;salchichas
kroketten|croquettes|croquetas
hamkroketten|ham croquettes|croquetas de jamon
kipkroketten|chicken croquettes|croquetas de pollo
olijven|olives|aceitunas;olivas
vlees|meat|carne
rundvlees|beef|ternera;vaca;buey
biefstuk|steak|filete;bistec
entrecote|ribeye;rib eye;entrecote|entrecot
côte de boeuf|rib steak|chuleton
varkensvlees|pork|cerdo
ibérico-varkenshaas|iberian pork tenderloin|solomillo iberico;secreto iberico
varkenshaas|pork tenderloin|solomillo de cerdo
ossenhaas|beef tenderloin;fillet steak|solomillo de ternera;solomillo
lam|lamb|cordero
kip|chicken|pollo
kipfilet|chicken breast|pechuga de pollo;pechuga
gehaktballen|meatballs|albondigas
hamburger|burger;hamburger|hamburguesa
spareribs|ribs;spare ribs|costillas
vis|fish|pescado
vis met friet|fish and chips|pescado con patatas
zalm|salmon|salmon
tonijn|tuna|atun
kabeljauw|cod|bacalao
zeebaars|sea bass|lubina
dorade|sea bream|dorada
inktvis|squid|calamar;calamares
gefrituurde inktvisringen|fried calamari|calamares a la romana;calamares fritos
octopus|octopus|pulpo
octopus op Galicische wijze|galician octopus|pulpo a la gallega
garnalen|prawns;shrimp|gambas;langostinos
knoflookgarnalen|garlic prawns|gambas al ajillo
mosselen|mussels|mejillones
zeevruchten|seafood|marisco;mariscos
ansjovis|anchovies|anchoas;boquerones
groenten|vegetables|verduras
aubergine|aubergine;eggplant|berenjena;berenjenas
courgette|courgette;zucchini|calabacin
spinazie|spinach|espinacas
honing|honey|miel
met honing|with honey|con miel;a la miel
boter|butter|mantequilla
olijfolie|olive oil|aceite de oliva;aceite
*gevuld>gevulde|stuffed|relleno;rellena;rellenos;rellenas
gegrilde groenten|grilled vegetables|verduras a la plancha;parrillada de verduras
champignons|mushrooms|champinones;setas
tomaat|tomato|tomate;tomates
paprika|peppers|pimientos;pimiento
padrónpepers|padron peppers|pimientos de padron
ui|onion|cebolla
knoflook|garlic|ajo
sla|lettuce|lechuga
avocado|avocado|aguacate
citroen|lemon|limon
fruit|fruit|fruta
ijs|ice cream|helado;helados
chocolade|chocolate|chocolate
cheesecake|cheesecake|tarta de queso
taart|cake;pie|tarta;pastel
karamelpudding (flan)|creme caramel;flan|flan
crème brûlée (crema catalana)|crema catalana|crema catalana
churros|churros|churros
saus|sauce|salsa
knoflookmayonaise (aioli)|garlic mayonnaise (aioli);aioli|alioli;allioli
mayonaise|mayonnaise;mayo|mayonesa
*gegrild>gegrilde|grilled|a la plancha;plancha;a la parrilla;parrilla;a la brasa
*geroosterd>geroosterde|roasted|asado;asada;al horno
*gebakken|fried|frito;frita;fritos;fritas
*gestoofd>gestoofde|stewed|guisado;estofado
*huisgemaakt>huisgemaakte|homemade|casero;casera
van het huis|house|de la casa
*pikant>pikante|spicy|picante
*klein>kleine|small|pequeno;pequena
*groot>grote|large|grande
half|half|medio;media
met|with|con
zonder|without|sin
en|and|y
couvert|cover charge|cubierto;servicio de pan
bediening|service;service charge|servicio
fooi|tip;gratuity|propina
korting|discount|descuento
||de;del;la;el;los;las;al;a
|of;the;a;an|
van;de;het;een||
`;

const LANGS = ['nl', 'en', 'es'];
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9&'/,. -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// index per brontaal: genormaliseerde frase -> concept
const CONCEPTS = TABLE.trim()
  .split('\n')
  .map((line) => {
    const adj = line.startsWith('*');
    const cols = (adj ? line.slice(1) : line).split('|');
    const c = Object.fromEntries(LANGS.map((l, i) => [l, (cols[i] || '').split(';').map((x) => x.trim()).filter(Boolean)]));
    c.stop = LANGS.some((l) => !c[l].length); // lidwoorden e.d.: weglaten, telt niet mee
    c.adj = adj;
    c.attr = {};
    for (const l of LANGS)
      c[l] = c[l].map((v) => {
        const [base, attr] = v.split('>');
        if (attr && !c.attr[l]) c.attr[l] = attr;
        return base;
      });
    return c;
  });
const INDEX = Object.fromEntries(LANGS.map((l) => [l, new Map()]));
for (const c of CONCEPTS) {
  for (const l of LANGS) for (const v of c[l]) if (!INDEX[l].has(norm(v))) INDEX[l].set(norm(v), c);
}
const MAX_PHRASE = 5;

/**
 * Vertaalt een omschrijving woord-voor-woord, waarbij de langste bekende frase voorgaat.
 * Geeft { text, coverage } terug; coverage = deel van de woorden dat bekend was (0..1).
 */
export function translateName(name, from, to) {
  if (!name || from === to || !INDEX[from] || !INDEX[to]) return { text: name, coverage: 1 };
  const tokens = norm(name).split(' ').filter(Boolean);
  const out = []; // segmenten { text, adj, attr }
  let known = 0;
  let counted = 0;
  for (let i = 0; i < tokens.length; ) {
    let hit = null;
    let len = 0;
    for (let n = Math.min(MAX_PHRASE, tokens.length - i); n >= 1; n--) {
      const c = INDEX[from].get(tokens.slice(i, i + n).join(' '));
      if (c) {
        hit = c;
        len = n;
        break;
      }
    }
    if (hit) {
      const target = hit[to][0];
      if (target) out.push({ text: target, adj: hit.adj, attr: hit.attr[to] || target, known: true });
      if (!hit.stop) {
        known += len;
        counted += len;
      }
      i += len;
    } else {
      const tok = tokens[i];
      out.push({ text: tok, adj: false, known: false });
      if (!/^[\d.,/%x]+$/.test(tok)) counted += 1;
      i += 1;
    }
  }
  // Spaans: "pollo asado" -> bijvoeglijk naamwoord vóór het zelfstandig naamwoord ("gegrilde kip").
  if (from === 'es' && to !== 'es') {
    for (let k = 1; k < out.length; k++) {
      if (out[k].adj && out[k - 1].known && !out[k - 1].adj) {
        const adj = out.splice(k, 1)[0];
        let j = k - 1;
        while (j > 0 && out[j - 1].adj) j--;
        out.splice(j, 0, { ...adj, text: adj.attr, moved: true });
      }
    }
  }
  let text = out.map((x) => x.text).join(' ').replace(/\s+/g, ' ').trim();
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return { text: text || name, coverage: counted ? known / counted : 1 };
}

const HINTS = {
  es: /\b(iva|propina|total a pagar|gracias|efectivo|tarjeta|mesa|camarero|cambio|factura|base imponible|cif|nif|ticket|importe)\b/g,
  en: /\b(tax|tip|gratuity|thank|cash|card|server|table|change|subtotal|balance|due|guests?)\b/g,
  nl: /\b(btw|totaal|bedankt|pin|fooi|tafel|contant|wisselgeld|subtotaal|bonnummer|kvk)\b/g,
};

/** Raadt de taal van een bon aan de hand van bonwoorden en bekende gerechten/dranken. */
export function detectLanguage(text, names = []) {
  const n = norm(text);
  const score = { nl: 0, en: 0, es: 0 };
  for (const l of LANGS) score[l] += (n.match(HINTS[l]) || []).length * 2;
  for (const name of names) {
    const toks = norm(name).split(' ');
    for (const tok of toks) {
      const langs = LANGS.filter((l) => INDEX[l].has(tok));
      if (langs.length === 1 && tok.length > 2) score[langs[0]] += 1;
    }
  }
  const best = LANGS.reduce((a, b) => (score[b] > score[a] ? b : a), 'nl');
  return score[best] > 0 ? best : null;
}

const MM = { nl: 'nl', en: 'en', es: 'es' };

/** Online vertalen via MyMemory (gratis, zonder sleutel). Gooit een fout bij mislukken. */
export async function translateOnline(text, from, to, fetchFn = fetch) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${MM[from]}|${MM[to]}`;
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || Number(data.responseStatus) !== 200 || /MYMEMORY WARNING|QUERY LENGTH/i.test(out)) throw new Error('no translation');
  return out.charAt(0).toUpperCase() + out.slice(1);
}
