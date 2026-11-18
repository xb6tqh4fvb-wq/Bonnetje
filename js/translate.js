// Vertalen van bonregels (Spaans/Engels/Nederlands) met een ingebouwd horecawoordenboek.
// Werkt offline. Uitbreiden met een nieuwe taal = een kolom toevoegen aan de tabel.
// Optioneel: online vertalen van wat het woordenboek niet kent (MyMemory, gratis, zonder sleutel).

export const RECEIPT_LANGS = ['nl', 'es', 'en'];

// nl | en | es  — alternatieven met ';' gescheiden; de eerste is de vertaling die getoond wordt.
// '*' = bijvoeglijk naamwoord (komt in het Spaans achter het zelfstandig naamwoord);
// '^' = verpakking/maat (fles, glas, portie): "botella de vino" -> "fles wijn";
// 'gegrild>gegrilde' = Nederlandse vorm vóór een zelfstandig naamwoord.
// Een lege kolom betekent: woord weglaten (lidwoorden e.d.).
const TABLE = `
water|water|agua
bruisend water;spa rood|sparkling water;soda water|agua con gas;agua c/gas;agua gas
plat water;spa blauw|still water|agua sin gas;agua s/gas;agua s/g;agua sin gas 1l
mineraalwater|mineral water|agua mineral;agua min.;agua min;agua mineral natural
kraanwater|tap water|agua del grifo
frisdrank|soft drink;soda|refresco;refrescos
cola|coke;cola|coca cola;coca-cola;cocacola;cola
cola zero|coke zero;diet coke|coca cola zero;coca cola light;cola zero
sinaasappelsap|orange juice|zumo de naranja;zumo naranja;jugo de naranja
verse jus d'orange|fresh orange juice|zumo de naranja natural;naranja natural
sap|juice|zumo;jugo
limonade|lemonade|limonada
ijsthee|iced tea|te frio;nestea
bier|beer|cerveza;cervezas;cerv.;cerv;cza.;cza;cerveza de barril;cerveza barril
klein tapbiertje|small draught beer|cana;canas
pint|pint;pint of beer|jarra de cerveza;pinta
pils|lager|cerveza rubia;rubia
pint pils|pint of lager|jarra de rubia
alcoholvrij bier|alcohol-free beer;non-alcoholic beer|cerveza sin alcohol;cerveza 0,0
wijn|wine|vino;vinos
rode wijn|red wine|vino tinto;tinto;vino tto;vino tto.;vno tto;v. tinto;v tinto
witte wijn|white wine|vino blanco;vino bco;vino bco.;v. blanco
glas rode wijn|glass of red wine|copa de vino tinto;copa vino tinto;vino tinto copa;copa tinto;copa de tinto;copa vino tto
glas witte wijn|glass of white wine|copa de vino blanco;copa vino blanco;vino blanco copa;copa blanco;copa de blanco
glas huiswijn|glass of house wine|copa de vino de la casa;copa vino casa
rosé|rose wine;rosé|vino rosado;rosado
huiswijn|house wine|vino de la casa
fles wijn|bottle of wine|botella de vino
fles rode wijn|bottle of red wine|botella vino tinto;botella de vino tinto;bot. vino tto;bot vino tto;bot. vino tinto;botella vino tto
fles witte wijn|bottle of white wine|botella vino blanco;botella de vino blanco;bot. vino blanco;bot. vino bco;bot vino bco
fles water|bottle of water|botella de agua;botella agua;bot. agua
^fles|bottle|botella;bot.;bot;btla.;btla
^glas|glass|copa;vaso
^kop|cup|taza
^kan|jug;carafe|jarra
kan sangria|jug of sangria|jarra de sangria;sangria jarra;jarra sangria
mousserende wijn|sparkling wine|espumoso;vino espumoso
cava|cava|cava
sangria|sangria|sangria
rode wijn met limonade|red wine with lemonade|tinto de verano
koffie|coffee|cafe
espresso|espresso|cafe solo;solo
cortado (espresso met wat melk)|cortado|cortado;cafe cortado;cortado descafeinado
americano|americano|cafe americano;americano
koffie met cognac (carajillo)|coffee with brandy (carajillo)|carajillo
warme chocolademelk|hot chocolate|chocolate caliente;cola cao;colacao
kamillethee|chamomile tea|manzanilla
bier met citroenlimonade (clara)|shandy (clara)|clara;clara con limon
vermout|vermouth|vermut;vermu
shotje|shot|chupito;chupitos
flat white|flat white|flat white
prosecco|prosecco|prosecco
cider|cider|sidra
halve pint|half pint|media pinta
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
^broodje|sandwich;roll|bocadillo;bocata;montadito;bocadillos;montaditos
broodje ham|ham sandwich|bocadillo de jamon;bocata de jamon
brood met tomaat|bread with tomato|pan con tomate;pan tumaca;pa amb tomaquet
brood met olie|bread with olive oil|pan con aceite
tosti|toastie;grilled cheese|sandwich mixto;mixto
voorgerecht|starter;appetizer|entrante;entrantes;primero
hoofdgerecht|main course;main|segundo;plato principal
bijgerecht|side;side dish|acompanamiento;guarnicion
dessert;nagerecht|dessert|postre;postres
menu van de dag|menu of the day;set menu|menu del dia
kindermenu|kids menu;children's menu|menu infantil
menu|menu|menu
^portie|portion|racion;raciones;rac.;rac
^halve portie|half portion|media racion;1/2 racion;1/2 rac;1/2 rac.;m. racion;m. rac.;media rac.
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
kroketten|croquettes|croquetas;croq.;croq
hamkroketten|ham croquettes|croquetas de jamon;croq. jamon;croq jamon;croquetas jamon;croquetas caseras de jamon
kipkroketten|chicken croquettes|croquetas de pollo;croq. pollo
viskroketten|fish croquettes|croquetas de bacalao;croq. bacalao
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
*gebakken|fried|frito;frita;fritos;fritas;frit.
*gestoofd>gestoofde|stewed|guisado;estofado
*huisgemaakt>huisgemaakte|homemade|casero;casera;caseros;caseras;de la casa
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
in knoflooksaus|in garlic sauce|al ajillo
*gefrituurd>gefrituurde|battered|a la romana;rebozado;rebozada;rebozados;rebozadas
tomatensoep|tomato soup|sopa de tomate;crema de tomate
groentesoep|vegetable soup|sopa de verduras;crema de verduras
kippensoep|chicken soup|sopa de pollo
tomatensalade|tomato salad|ensalada de tomate
ossenstaart|oxtail|rabo de toro;rabo de buey
gebakken eieren met friet (huevos rotos)|fried eggs with chips (huevos rotos)|huevos rotos;huevos estrellados
Russische salade|russian salad|ensaladilla rusa;ensaladilla;ensalada rusa
sardinespiesjes van de grill|grilled sardine skewers|espetos de sardinas;espeto de sardinas;espetos;espeto
sardines|sardines|sardinas;sardina
gegrilde sardines|grilled sardines|sardinas a la plancha;sardinas asadas
spiesjes|skewers|brochetas;brocheta;pinchos;pincho
gekruide vleesspies (pincho moruno)|spiced meat skewer (pincho moruno)|pincho moruno;pinchos morunos
kipvleugels|chicken wings|alitas de pollo;alitas
varkenswangetjes|pork cheeks|carrillada;carrilladas;carrillera;carrilleras
speenvarken|suckling pig|cochinillo
Ibérico-varkensvlees (secreto)|iberian pork (secreto)|secreto iberico;secreto
Ibérico-varkensvlees (presa)|iberian pork (presa)|presa iberica;presa
Ibérico-ham (bellota)|iberian ham (acorn-fed)|jamon de bellota;jamon iberico de bellota
konijn|rabbit|conejo
eend|duck|pato
heek|hake|merluza
zeeduivel|monkfish|rape
zeetong|sole|lenguado
zwaardvis|swordfish|pez espada
inktvis (sepia)|cuttlefish|sepia
kleine gefrituurde inktvisjes|baby squid|chipirones;chopitos;puntillitas;puntillas
ansjovis in azijn|anchovies in vinegar|boquerones en vinagre
gefrituurde ansjovis|fried anchovies|boquerones fritos
gefrituurde visjes|fried fish|pescaito frito;pescadito frito;fritura de pescado
kokkels|cockles|berberechos
venusschelpen|clams|almejas
kreeft|lobster|bogavante;langosta
scheermesjes|razor clams|navajas
zwarte rijst met inktvisinkt|black rice with squid ink|arroz negro
rijst met kreeft|rice with lobster|arroz con bogavante
noedelpaella (fideuá)|noodle paella (fideua)|fideua
zeevruchtenpaella|seafood paella|paella marisco;paella de mariscos;paella mixta
koude tomatensoep (salmorejo)|cold tomato soup (salmorejo)|salmorejo
vissoep|fish soup|sopa de pescado
knoflooksoep|garlic soup|sopa de ajo
soep van de dag|soup of the day|sopa del dia
linzen|lentils|lentejas
kikkererwten|chickpeas|garbanzos
manchego-kaas|manchego cheese|queso manchego;manchego
geitenkaas|goat cheese|queso de cabra
gemengde plank vleeswaren en kaas|mixed cold cuts and cheese board|tabla mixta
gerimpelde aardappeltjes met mojo|wrinkled potatoes with mojo|papas arrugadas
empanada (gevuld deeggerecht)|empanada (filled pastry)|empanada;empanadas;empanadilla;empanadillas
appeltaart|apple tart|tarta de manzana
amandeltaart (tarta de Santiago)|almond cake (tarta de santiago)|tarta de santiago
chocoladetaart|chocolate cake|tarta de chocolate
rijstpudding|rice pudding|arroz con leche
vanillevla (natillas)|custard (natillas)|natillas
fruit van het seizoen|seasonal fruit|fruta del tiempo;fruta de temporada
sorbet|sorbet|sorbete
churros met chocolade|churros with chocolate|churros con chocolate
uienringen|onion rings|aros de cebolla
knoflookbrood|garlic bread|pan de ajo;pan con ajo
koolsla|coleslaw|ensalada de col
aardappelpuree|mashed potatoes;mash|pure de patatas;pure de patata
gebakken aardappelen|roast potatoes;roasted potatoes|patatas asadas
caesarsalade|caesar salad|ensalada cesar
clubsandwich|club sandwich|sandwich club
Engels ontbijt|full english breakfast;english breakfast|desayuno ingles
pannenkoeken|pancakes|tortitas;crepes
karamelpudding (sticky toffee pudding)|sticky toffee pudding|
appelkruimeltaart|apple crumble|crumble de manzana
stoofvleespastei|steak and ale pie;steak pie|
herderspastei|shepherd's pie;shepherds pie;cottage pie|
worst met aardappelpuree|bangers and mash;sausage and mash|
vegaburger|veggie burger;vegetarian burger|hamburguesa vegetariana
cheeseburger|cheeseburger|hamburguesa con queso
nacho's|nachos|nachos
taco's|tacos|tacos
brownie|brownie|brownie
bitter bier (ale)|bitter;ale|
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
    const container = line.startsWith('^');
    const cols = (adj || container ? line.slice(1) : line).split('|');
    const c = Object.fromEntries(LANGS.map((l, i) => [l, (cols[i] || '').split(';').map((x) => x.trim()).filter(Boolean)]));
    c.stop = LANGS.some((l) => !c[l].length); // lidwoorden e.d.: weglaten, telt niet mee
    c.adj = adj;
    c.container = container; // fles, glas, portie...: "botella de vino" -> "fles wijn"
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

// Merken en streken: niet vertalen, wel als "bekend" tellen.
const BRANDS = new Set(
  'alhambra mahou estrella damm cruzcampo san miguel heineken amstel guinness peroni corona moretti coca-cola cocacola fanta sprite aquarius nestea schweppes pepsi rioja ribera rueda albarino verdejo tempranillo garnacha priorat txakoli cava moet'.split(' ')
);
// Getallen en eenheden ("1l", "33cl", "(6)", "2x") laten staan; tellen niet mee.
const UNIT = /^\(?\d+([.,]\d+)?(l|cl|ml|g|gr|kg|uds?|u|pcs?|x|p)?\)?$/;

const capitalize = (t) => (t.startsWith('ij') ? 'IJ' + t.slice(2) : t.charAt(0).toUpperCase() + t.slice(1));

/**
 * Vertaalt een omschrijving: de langste bekende frase gaat voor, daarna woord voor woord.
 * Spaanse zinsbouw wordt omgezet: bijvoeglijk naamwoord vooraan ("pollo asado" -> "gegrilde
 * kip"), "X de Y" -> "X van Y" (nl) / "Y X" (en), verpakkingen vooraan ("fles wijn").
 * Geeft { text, coverage } terug; coverage = deel van de woorden dat bekend was (0..1).
 */
export function translateName(name, from, to) {
  if (!name || from === to || !INDEX[from] || !INDEX[to]) return { text: name, coverage: 1 };
  const tokens = norm(name).split(' ').filter(Boolean);
  const out = []; // segmenten { text, known, adj, attr, container, de }
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
    const tok = tokens[i];
    if (hit) {
      const target = hit[to][0];
      if (hit.stop && from === 'es' && (tok === 'de' || tok === 'del') && len === 1) out.push({ de: true });
      else if (target) out.push({ text: target, adj: hit.adj, attr: hit.attr[to] || target, container: hit.container, known: true });
      if (!hit.stop) {
        known += len;
        counted += len;
      }
      i += len;
    } else if (BRANDS.has(tok.replace(/\.$/, ''))) {
      out.push({ text: capitalize(tok), known: true, brand: true });
      known += 1;
      counted += 1;
      i += 1;
    } else {
      const unit = UNIT.test(tok) || /^[\d.,/%]+$/.test(tok);
      out.push({ text: tok, known: unit, unit });
      if (!unit) counted += 1;
      i += 1;
    }
  }

  if (from === 'es' && to !== 'es') {
    // "X de Y": verpakking -> "fles wijn"; anders nl "X van Y", en "Y X" (seafood paella).
    for (let k = out.length - 1; k >= 0; k--) {
      if (!out[k].de) continue;
      const L = out[k - 1], R = out[k + 1];
      if (L && R && L.known && R.known && !L.unit && !R.unit) {
        if (L.container) {
          if (to === 'en') out[k] = { text: 'of', known: true };
          else out.splice(k, 1);
        }
        else if (to === 'en') out.splice(k - 1, 3, R, L);
        else out[k] = { text: 'van', known: true };
      } else out.splice(k, 1);
    }
    // bijvoeglijk naamwoord vóór het zelfstandig naamwoord ("gegrilde kip")
    for (let k = 1; k < out.length; k++) {
      if (out[k].adj && out[k - 1].known && !out[k - 1].adj) {
        const adj = out.splice(k, 1)[0];
        let j = k - 1;
        while (j > 0 && out[j - 1].adj) j--;
        out.splice(j, 0, { ...adj, text: adj.attr, moved: true });
      }
    }
    // verpakking achteraan ("vino blanco copa") -> vooraan ("glas witte wijn")
    const lastReal = out.length - 1;
    if (lastReal > 0 && out[lastReal].container && out.slice(0, lastReal).every((x) => x.known)) out.unshift(out.pop());
  }
  let text = out.map((x) => x.text).join(' ').replace(/\s+/g, ' ').trim();
  text = capitalize(text);
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
