# Bonnetje — Samen eerlijk afrekenen (v17)

Gratis, statische webapp voor GitHub Pages zonder eigen server en zonder account.

## Opbouw & terugvalketen
1. **Gemini via Firebase AI Logic (eerste en standaardroute, v14):** Leest bonfoto's en gescande PDF's (alle pagina's) rechtstreeks vanuit je browser met vaste JSON-velden (`items`, `subtotal`, `vat`, `tip`, `discount`, `total`, `currency`, `language`) en vertaalt buitenlandse bonregels naar het Nederlands. De aanroep loopt via Firebase AI Logic naar de **Agent Platform Gemini API** (voorheen Vertex AI Gemini API) met **App Check (reCAPTCHA Enterprise)** als misbruikbeveiliging. Er is **geen persoonlijke API-sleutel** meer: jij stelt geen sleutel in en de app bevat ook geen sleutel van de maker. De kosten lopen via de app-eigenaar met een vast maandmaximum (spend cap). De aanroep gebeurt direct bij het scannen of vertalen (v16: geen apart toestemmingsvenster meer); onder Instellingen & privacy staat precies wat er wordt verstuurd.
2. **Lokale backup (`ppu-paddle-ocr/web` met zelf-gehost `PP-OCRv6_tiny`):** Start automatisch als de online aanroep mislukt of het maandmaximum bereikt is (quotum/spend cap, storing, geen internet, ontbrekende config). Draait volledig lokaal op je toestel en stuurt niets naar buiten. Alle benodigde bestanden (modellen ~6 MB, woordenboek, browsermodule en onnxruntime-WASM ~24 MB) staan in de repo zelf en komen dus van dezelfde server als de app. Vertaalt niet.
3. **Plakvak (iPhone Live Text / Tekst van camera)** en **handmatig invoeren** werken altijd.

## Wijzigingen in v17 (verzoek Henk: simpelere bonregel, hele bon op één scherm)

Regressietests: 90/90 groen in Node (`node tests/calculator.test.js`), inclusief 6 nieuwe tests voor kruisje, ongedaan maken en uitklappen.

- **Compacte regel:** elke bonregel is één rij met naam (vertaling als die er is), aantal en regeltotaal. De prijs per stuk is geen los veld meer in de rij maar wordt afgeleid (regeltotaal ÷ aantal, `computedUnitPriceCents`); de rekenkern gebruikt `lineTotalCents` en `qty` zoals voorheen.
- **Kruisje rechts:** klein maar duimvriendelijk (44×44), met extra afstand tot het bedrag en de uitklaptik. Verwijdert zonder vraagvenster; onderin verschijnt kort een klein, rustig pilletje met het kromme pijltje ↩ "Ongedaan maken" (visueel klein, 44px raakvlak, regelnaam in het aria-label) dat de regel op dezelfde plek terugzet. Het pilletje verdwijnt vanzelf na ±8 seconden en bij een stapwissel. Niets gaat definitief kwijt (de algemene Stap-terug-knop blijft ook werken).
- **Tik = uitklappen:** achter de rij zit de volledige bewerker: origineel op de bon, vertaling, aantal, prijs p.s. (aanpasbaar), regeltotaal, regeltype en "Niet meetellen". Uitklaptoestand is ui-only (geen sessiedata).
- **Twijfelregels open + gekleurd:** regels met onzeker gelezen tekst of een bedrag dat niet klopt staan standaard uitgeklapt met de bestaande needs-review-kleur; ze zijn dicht te klappen per tik.
- **Nieuwe module `js/item-rows.js`:** DOM-vrije helpers (deleteItemAt, restoreDeletedItem, isItemExpanded, toggleItemExpanded, computedUnitPriceCents, compactRowModel) zodat de Node-tests het gedrag direct dekken.
- **Compacte kop (puur visueel):** fotovoorbeeld max 260px → 140px hoog en kleinere marge onder de hulptekst, zodat meer bonregels zonder scrollen passen. Rekenkern onaangeroerd.
- Cache `bonnetje-v17` in `sw.js` en `js/assets-manifest.js` (met `js/item-rows.js` in de app-shell).
- **Instelbare schakelaar "Online AI-scan (Google)"** (verzoek Henk 14:28): staat in Instellingen & privacy, standaard AAN, onthouden per toestel (`onlineAiEnabled` in settings). Aan = foto/pdf via Firebase AI Logic naar Google (EU-multiregio) zoals nu, inclusief online vertalen. Uit = er gaat niets naar buiten: de scan gebruikt alleen de lokale OCR-lezer en de Vertaal-knop staat uit (geen online vertaling). De uitleg eronder zegt in gewone taal wat er verstuurd wordt, waar het verwerkt wordt (EU-multiregio), dat de kosten via de app-eigenaar lopen met een vast maandmaximum, en wat je mist als hij uit staat (lokaal lezen werkt minder goed, geen vertaling). De privacytekst zegt nu dat de foto altijd eerst naar Google gaat *met de schakelaar aan*. Alle poorten lopen via `isOnlineAiUsable(settings)` in `js/firebase-ai.js`; de app maakt bij uit óók geen Firebase-initialisatie aan tijdens de scan (fail-soft naar lokale route met duidelijke statusregel). Tests V17.7/V17.8 dekken standaard-aan, onthouden en de poort.

## Wijzigingen in v16 (verzoek Henk: toestemmingsvenster weg)

Regressietests: 84/84 groen in Node (`node tests/calculator.test.js`).

- **Geen toestemmingsvenster meer:** `confirmGeminiConsent` is verwijderd. De online scan en vertaling gaan direct via Firebase AI Logic, zonder `window.confirm` vooraf. Henk heeft dit expliciet gekozen (13:50, screenshot van het venster: "Weg met die betuttelende onzin"), nadat het AVG-risico (bonfoto naar Google) eerder is toegelicht.
- **Blijft:** de lokale backup als terugval bij elke fout, de privacy-uitleg onder Instellingen & privacy en alle fout- en statusmeldingen. De terugvalmelding claimt niet meer "niets verstuurd naar buiten" (na een mislukte online aanroep is de foto immers al verstuurd); hij zegt alleen nog "Lokaal gelezen met backup (ppu-paddle-ocr, PP-OCRv6_tiny)".
- **Privacytekst aangepast (NL + EN):** de alinea's zeiden nog "alleen nadat jij vooraf expliciet toestemming geeft"; dat was na het weghalen van het venster niet meer waar. De tekst beschrijft nu de directe route en wijst voor wie niets wil versturen op het plakvak en handmatig invoeren (de lokale backup is géén keuze-optie: een foto gaat altijd eerst naar Google).
- **Opruiming:** instelling `geminiPrivacyAccepted` verwijderd uit de defaults en bij opstarten uit opgeslagen instellingen gehaald (`cleanupLegacyStorage`); import van `AI_LOCATION` uit app.js weg (was alleen voor het venster).
- Cache `bonnetje-v16` in `sw.js` en `js/assets-manifest.js`.

## Wijzigingen in v15 (verzoek Henk: dubbele "Foto maken"-knop weg)

Regressietests: 84/84 groen in Node (`node tests/calculator.test.js`).

- **Eén knop voor foto/pdf:** de losse knop "Foto maken" is verwijderd uit stap 1. iOS en Android bieden "Foto maken" al aan in de kiezer van de knop "Foto of pdf kiezen", dus de camera was via twee knoppen bereikbaar (dubbel). Over: de ene knop "Foto of pdf kiezen" (nu de primaire knop), die camera, fotobibliotheek, pdf en bestanden dekt. Verwijderd: `input-camera` en de i18n-sleutel `takePhoto`. De hulptekst in stap 1 legt uit dat de camera in dezelfde kiezer zit.
- **Statusregel AI-aanroepen weg uit stap 1:** het vaste vak "AI-aanroepen vandaag op dit toestel: N ..." boven de knoppen is verwijderd (verzoek Henk). De dagteller en de status van de online route blijven zichtbaar onder Instellingen & privacy; het toestemmingsvenster en de privacytekst zijn ongewijzigd.
- Cache `bonnetje-v15` in `sw.js` en `js/assets-manifest.js`.

## Wijzigingen in v14 (verzoek Henk: eigen-sleutel-optie eruit, kosten via app-eigenaar met spend cap)

Regressietests: 84/84 groen in Node (`node tests/calculator.test.js`).

- **Eigen Gemini-sleutel verwijderd:** het invoerveld in Instellingen is weg, `loadGeminiApiKey`/`saveGeminiApiKey` zijn uit `js/storage.js`, en `cleanupLegacyStorage()` verwijdert bij het opstarten een eventueel nog opgeslagen sleutel van versies ≤ v13. De app bevat nergens een sleutel van de maker.
- **Nieuwe online route (`js/firebase-ai.js` + `js/firebase-config.js`):** de Firebase JS SDK (versie-vastgepind op 12.17.0, vanaf googles CDN gstatic.com) wordt pas geladen bij de eerste AI-aanroep. Backend: `AgentPlatformBackend` (de opvolger van `VertexAIBackend`). Model en regio staan als constanten in `js/firebase-config.js` (`AI_MODEL`, `AI_LOCATION`). App Check met `ReCaptchaEnterpriseProvider` wordt geïnitialiseerd zodra de site key is ingevuld.
- **Model & regio:** `gemini-3.8-flash` in de `eu`-multiregio. De oude `gemini-2.5-flash` is op de Agent Platform-route buiten gebruik gesteld; `gemini-3.8-flash` is de opvolger voor dit soort taken. Een losse EU-regio (bijv. europe-west4) bestaat voor dit model niet: alleen `global`, de `us`- en `eu`-multiregio's en enkele niet-EU-regio's (bron: modelpagina Gemini 3.8 Flash, Google Cloud).
- **Altijd lokale terugval:** elke fout uit de online aanroep krijgt een `fallbackCode` en valt terug op de lokale backup, inclusief quotum/spend cap (429), storing (5xx), netwerk/time-out, App Check-weigering (403) en ontbrekende config. Dat is de afspraak van v14 en ligt vast in test V9.6.
- **Config nog in te vullen (2 placeholders):** `js/firebase-config.js` bevat placeholders voor de Firebase-webconfig (apiKey, appId e.d.) en de reCAPTCHA Enterprise site key. Zolang die ontbreken meldt de app eerlijk dat de online AI nog niet is ingesteld en werkt de rest (lokale backup, plakvak, handmatig) gewoon.
- **Teksten bijgewerkt:** toestemmingsmelding, statusregels, Instellingen & privacy (NL + EN), foutmeldingen en de meetpagina `tests/benchmark.html` beschrijven de nieuwe route.

## Wijzigingen in v13 (verzoek Henk: deelnemer die niet hoeft te betalen)

Regressietests: 80/80 groen in Node (69 bestaand + 11 nieuw, v13a t/m v13k).

- **Deelnemer betaalt niet mee (te gast, jarig, andere reden):** per deelnemer een schakelaar in stap 2. Het hele deel van zo'n gast (eigen verbruik + fooi + bon-extra's) wordt overgenomen door de andere deelnemers. De fooi volgt daarbij het bedrag dat iemand uiteindelijk betaalt: het fooiaandeel van de gast wordt mee overgenomen.
- **Wie neemt over, en welk aandeel:** in stap 4 kies je per gast de overnemer(s) — standaard alle anderen — en het aandeel per overnemer: gelijk verdeeld, een percentage, of een vast bedrag. Meerdere gasten kunnen tegelijk, elk met een eigen keuze.
- **Nooit bedragen verzinnen:** bij een vast bedrag moet de som exact gelijk zijn aan het over te nemen deel; klopt het niet, dan blokkeert de afronding met een melding en verandert er niets. Percentages moeten samen 100% zijn.
- **Restcenten zichtbaar:** restcenten gaan naar de overnemer met het grootste aandeel (bij gelijk aandeel: het grootste eigen totaal, daarna de volgorde van de lijst) en worden in het overzicht getoond ("waarvan € 0,01 restcenten"). Het totaal blijft altijd exact kloppen.
- **Overal zichtbaar:** de gast ziet wie het deel overneemt, overnemers zien een eigen regel per overgenomen deel, de deelberichten (WhatsApp/e-mail/kopiëren) noemen het overgenomen bedrag, en de gast krijgt een eigen bericht ("je was te gast, je hoeft niets te betalen"). De schakelaar, contant-terugkrijgen en de deelknoppen blijven werken zoals ze waren.

## Wijzigingen in v12 (per bevinding, onafhankelijke v11-review)

Regressietests: 69/69 groen in Node én echte headless Chrome (68 bestaand + 1 nieuw, V12.1).

- **V1 — US-tax verdween uit de verdeling op stap 4 (`js/calculator.js`, `js/app.js`):** de app bewaart erbovenop-getelde btw als `session.receiptVatAddedCents`, maar `calculateSettlement` las `state.vatAddedCents`. Daardoor verdween de tax uit de verdeling en verscheen de vage melding "los eerst het totaalverschil op". De sleutelnamen zijn nu gelijk (`receiptVatAddedCents` overal). Alle `session.*`- en `state.*`-velden in `js/app.js` en `js/calculator.js` zijn nagelopen (grep); dit was de enige mismatch. De bestaande rekentests V11.1a/b voeden de calculator nu met de echte sessie-sleutels, en er zijn twee nieuwe browsertests die door de ECHTE app-route lopen (plakvak -> stap 2 -> verdelen -> stap 4 + deeltekst): een Amerikaanse bon met tax en een NL-bon met fooi. Beide sluiten op stap 1, eindigen op stap 4 met de persoonssommen exact gelijk aan het bontotaal (21,65 resp. 19,00), met de fooi/tax zichtbaar in de deeltekst en zonder de vage melding.
- **V2 — A-nagebouwde set (98 regels) is nu echt meegeleverd:** `tests/testset-a98/` (15 bonnen, 98 regels) plus generator `scripts/gen-a98-testset.py`. De meting hieronder draait tegen deze meegeleverde set. De claim klopt nu met de inhoud van de zip.
- **V3 — engine-opmerking: geen actie (staat onder "eerlijk over de grenzen").**
- **Koffieknop (verzoek Henk, exact zoals de online versie):** `SUPPORT_URL = 'https://www.paypal.me/Inzane007'` (`js/app.js`), footerlink onderaan met `t('support')` — NL "Handig? Trakteer op een kop koffie ☕", EN "Find it useful? Buy me a coffee ☕" — zonder waarschuwingen. De privacytekst vermeldt de externe PayPal-link nu eerlijk (alleen een link, geen app-data). Test V12.1; de koffielink is ook meegecheckt in de browser-test van de app-route.

## Metingen v12 (identiek harnas; v12 naast de v11-cijfers van dezelfde sets)

| Meting | v11 | v12 |
|---|---|---|
| Plakvak v11-set (28 regels) | 10/10 sluitend, 28/28, 0 valse | 10/10 sluitend, 28/28, 0 valse |
| Backup OCR v11-set | 7/10 sluitend, 27/28, 7 valse | 7/10 sluitend, 27/28, 7 valse |
| Plakvak v10-set (29 regels) | 10/10, 29/29, 0 valse | 10/10, 29/29, 0 valse |
| Backup OCR v10-set | 8/10, 28/29, 4 valse | 8/10, 28/29, 4 valse |
| Plakvak v9-set (33 regels) | 10/10, 33/33, 0 valse | 10/10, 33/33, 0 valse |
| Backup OCR v9-set | 8/10, 31/33, 0 valse | 8/10, 31/33, 0 valse |
| Plakvak A-nagebouwd (98 regels, nu meegeleverd) | 15/15, 98/98, 0 valse | 15/15, 98/98, 0 valse |
| Backup OCR A-nagebouwd | 9/15, 83/98, 0 valse | 9/15, 83/98, 0 valse |
| Plakvak B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |
| Backup OCR B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |

Conclusies:
- **Geen terugval:** alle scores zijn identiek aan v11, op beide routes, op alle sets.
- De V1-reparatie zit in de afrekenlaag (stap 4); de parser- en OCR-cijfers veranderen daardoor niet, en de app-route-browsertests bewijzen dat de US-tax- en NL-fooi-bonnen nu ook in de echte bediening sluiten.

## Tests v13
- `node tests/calculator.test.js`: **80/80 groen** (69 bestaand + 11 nieuw v13), volledige output in `tests/test-output-v13.txt`.
- `tests/run-tests.html` in echte headless Chrome: **79/80 groen**; enige FAIL is V10.6 (PDF.js-laadfout-melding), die op ongewijzigde v12-main in deze omgeving identiek faalt (68/69) en dus geen terugval van v13 is.
- UI-rooktest in echte headless Chrome (v13): schakelaar in stap 2, gastkaart in stap 4, gelijk verdeeld én percentage 75/25 met zichtbare restcent, deelknoppen, contant-wisselgeld en gast- en dragerberichten kloppen; screenshots meegeleverd in het bouwrapport.

## Tests v12
- `node tests/calculator.test.js`: **69/69 groen**, volledige output in `tests/test-output-v12.txt`.
- `tests/run-tests.html` in echte headless Chrome: **69/69 groen**.
- App-route-browsertests (nieuw in het meet-harnas): US-tax en NL-fooi via plakvak t/m stap 4 — beide sluitend, deeltekst met fooi/belasting, geen vage melding, deelknoppen actief; koffielink in de footer aanwezig met de exacte URL.
- UI-breektests in echte browser: kapot/leeg/verkeerd bestand, pdf zonder PDF.js, offline-modellen, HTTP 500-terugval, klembord-mislukking, plakvak-keuze-UI: allemaal groen; 0 externe app-requests onder de blackhole-proxy.
- Syntaxcontrole `node --check` op alle js-bestanden en `sw.js`: schoon.

## Eerlijk over de grenzen van deze meting (v12)
- Er is **geen echte Gemini-call** gedaan (geen sleutel beschikbaar); de Gemini-route is getest met gemockte antwoorden. De tokencijfers uit v11 zijn daarom gelabelde schattingen; met een sleutel rapporteert de app de echte usageMetadata.
- De meetsets zijn synthetisch; echte bonnen kunnen afwijken. De resterende OCR-missers zijn rijfouten van het tiny-model zelf (verschoven bedragen bij scheefstand), geen parserfouten.
- Browserproeven draaiden in headless Chrome op Linux, niet op een echte iPhone.

## Wijzigingen in v11 (per bevinding, ter referentie)

Regressietests V11.1 t/m V11.8 (68/68 groen in Node én echte headless Chrome).

- **N1 — Fooi en erbovenop-getelde btw tellen mee in de afronding (`js/calculator.js`, `js/app.js`):** `validateReceiptTotal` accepteert nu extras (fooi + btw-erbovenop) en eist "som gerechten + fooi/btw == bontotaal". De plakvak- en scanroutes gooien `tipCents`/`vatCents` niet meer weg maar bewaren ze in de sessie (`receiptTipCents`, `receiptVatAddedCents` alleen bij taxMode vat_added). De afrekening verdeelt die bedragen pro rata over de deelnemers (naar rato van subtotaal), zichtbaar als eigen regel per persoon en in de deeltekst. Een Amerikaanse bon met sales tax en een NL-bon met fooiregel zijn nu exact afrondbaar. Tests V11.1a/b.
- **N2 — Geen verzonnen bedragen meer uit "Est. 1998", busletters en "Rekening 45,60" (`js/parser.js`):** Jaartalabels (est/established/since/sinds/seit/depuis/desde/dal/anno/opgericht/founded) blokkeren komma-herstel; een huisnummer gevolgd door een losse busletter aan het regeleinde ("Avenue Louise 221 B", "Kerkstraat 480 A") is een adres; "Rekening" met een bedrag is het bontotaal (NL/BE), geen gerecht. Test V11.2.
- **N3 — Los woord "bar" dropt geen gerechten meer (`js/parser.js`):** De zwakke betaalwoorden bar/karte/carte gelden alleen nog als betaling als het het enige woord op de regel is (plus bedrag/leestekens). "Chocolade bar" en "Bar Tapas" blijven gerechten; "BAR 34,00" blijft een betaalregel. Test V11.3.
- **N4 — NL-bedragsvormen en volumes (`js/parser.js`):** "6,-" en "6," worden 6,00 en "2,5" wordt 2,50 (volgens de decimaalnotatie van de bon). Een expliciet bedrag onder 0,50 op een gerechtregel is een volume ("Cola 0,33") en nooit een (eenheids)prijs: "2 Cola 0,33 6,60" geeft stukprijs 3,30 en "Cola 0,33" alleen wordt geen gerecht van 0,33. Test V11.4.
- **N5 — Woordlijsten (`js/parser.js`):** Tikkie en MULTIBANCO (+ MB WAY) zijn betaalwoorden; Rua (en Largo/Travessa/Praceta) zijn straatwoorden. Test V11.5.
- **N7 — Privacytekst over PDF.js-prefetch (`js/i18n.js`):** De tekst zegt nu eerlijk dat het PDF.js-programmabestand al bij het eerste bezoek eenmalig op de achtergrond van jsDelivr wordt opgehaald en gecachet (prefetch, sinds v10), niet pas "bij een PDF". NL en EN. Test V11.7.

- **N6 — Gemini blijft zoals het is (beslissing Henk) + model- en tokenmeting bij elke aanroep (`js/gemini.js`, `js/app.js`):** De scan- en vertaalroute leggen nu bij elke geslaagde aanroep vast welk model is gebruikt (standaard `gemini-2.5-flash`, instelbaar) en wat de tokenkosten zijn: echte `usageMetadata` uit de respons als die er is, anders een expliciet als "schatting" gelabelde berekening (tekst ~4 tekens/token; afbeelding volgens de gedocumenteerde tegelregel van de 2.5-modellen: tegels van 768 px à 258 tokens). De info zit in `session.geminiMeta` en `getLastGeminiCallInfo()`. Tests V11.8a/b.

**Gemeten tokencijfers (schatting — er was geen API-sleutel beschikbaar, dus geen echte usageMetadata):**

| Aanroep | Invoer | Uitvoer (geschat) |
|---|---|---|
| Scan, testset-bon (1120×936 px) | 313 tekst + 1032 afbeelding = **1345 tokens** | 68–93 tokens |
| Scan, telefoonfoto (3024×4032 px) | 313 tekst + 6192 afbeelding = **6505 tokens** | ±70–150 tokens (meer gerechten = meer) |
| Vertaling (10 bonnen, 28 omschrijvingen) | **±433 tokens** | ±100–200 tokens |

## Metingen v11 (v10 en v11 naast elkaar, identiek harnas en identieke bonnen)

Zelfde werkwijze als bij v9/v10: echte headless Chrome, loggende blackhole-proxy, 0 externe app-requests. Nieuwe set: **eigen v11-set** (10 bonnen, 28 regels, met Est./since-regels, busletters, Rekening als totaal, "bar"-gerechten, NL-bedragsvormen, volumes, Tikkie/MULTIBANCO/Rua, US-tax en NL-fooi; `tests/testset-v11/` + generator `scripts/gen-v11-testset.py`). De bonnen uit de controleset van de reviewer zijn niet gebruikt; dit zijn eigen varianten.

| Meting | v10 | v11 |
|---|---|---|
| Plakvak v11-set (28 regels) | 1/10 sluitend, 24/28, 13 valse regels | **10/10 sluitend, 28/28, 0 valse** |
| Backup OCR v11-set | 2/10 sluitend, 24/28, 11 valse | **7/10 sluitend, 27/28, 7 valse** |
| Plakvak v10-set (29 regels) | 10/10, 29/29, 0 valse | 10/10, 29/29, 0 valse |
| Backup OCR v10-set | 8/10, 28/29, 4 valse | 8/10, 28/29, 4 valse |
| Plakvak v9-set (33 regels) | 10/10, 33/33, 0 valse | 10/10, 33/33, 0 valse |
| Backup OCR v9-set | 8/10, 31/33, 0 valse | 8/10, 31/33, 0 valse |
| Plakvak A-nagebouwd (98 regels) | 15/15, 98/98, 0 valse | 15/15, 98/98, 0 valse |
| Backup OCR A-nagebouwd | 9/15, 83/98, 0 valse | 9/15, 83/98, 0 valse |
| Plakvak B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |
| Backup OCR B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |

Conclusies:
- **Geen terugval op bekende sets:** alle v10- en oudere scores zijn identiek gebleven, op beide routes.
- **De v11-set bewijst de fixes:** v10 verzint op deze bonnen 11-13 valse regels (Est.-jaartallen, busletters, "Chocolade bar" als betaling, "0,33" als prijs); v11 sluit alle 10 bonnen op het plakvak met 0 valse regels.
- De 3 niet-sluitende OCR-bonnen in de v11-set komen door rijfouten van de tiny-OCR zelf (het totaalbedrag belandt op de verkeerde regel; zware scheefstand geeft onleesbare tekst). De valse OCR-regels zijn die verschoven bedragen, geen parserfouten.

## Tests v11
- `node tests/calculator.test.js`: **68/68 groen** (59 bestaand + 9 nieuw), volledige output in `tests/test-output-v11.txt`.
- `tests/run-tests.html` in echte headless Chrome: **68/68 groen**.
- Syntaxcontrole `node --check` op alle js-bestanden en `sw.js`: schoon.
- UI-breektests in echte browser: kapot/leeg/verkeerd bestand, pdf zonder PDF.js, offline-modellen, HTTP 500-terugval, klembord-mislukking, plakvak-keuze-UI: allemaal groen.
- Meetpagina `tests/measure-v9.html` werkt ook voor de v11-set (`?set=/tests/testset-v11&route=ocr`); generator `scripts/gen-v11-testset.py` meegeleverd.

## Eerlijk over de grenzen van deze meting (v11)
- Er is **geen echte Gemini-call** gedaan (geen sleutel beschikbaar); de Gemini-route is getest met gemockte antwoorden en is in v11 ongewijzigd.
- De meetsets zijn synthetisch; echte bonnen kunnen afwijken.
- Browserproeven draaiden in headless Chrome op Linux, niet op een echte iPhone.

## Wijzigingen in v10 (per bevinding, ter referentie)

Elke bevinding heeft eigen regressietests (V10.1 t/m V10.8, 59/59 groen in Node én echte headless Chrome).

- **B1 — Dode gewicht-/aantal-uitzondering gerepareerd (`js/parser.js`):** In `isDecimalRestoreException` stonden `\s` en `\b` in gewone template literals, waar ze letterlijke "s" en backspace werden; de uitzondering werkte dus nooit en "1 Huiswijn rood 750 ml 18,50" kreeg stukprijs 7,50. Nu `String.raw`, met ml/g/cl/kg/l/oz/lb/stuks/pcs en aantallen (2 x). Tests V10.1a/b.
- **B2 — Kale cijfergroepen worden geen spookgerecht meer (`js/parser.js`):** Telefoon- ("020 555 0134", "01904 555022"), bon- ("Bon: 1042", "Kassabon nr 2026"), tafel- ("Tafel 123", "Mesa 4"), rekening- ("Rekening 450") en checknummers ("Check 2211") kregen een herstelde komma en werden een gerecht. Robuuste regel (niet alleen een labellijst): administratief label op de regel (NL/EN/DE/FR/ES/IT), twee of meer kale cijfergroepen van 3+ cijfers, voorloopnul, of geïmpliceerd bedrag boven 250,00 -> nooit herstellen. Test V10.2.
- **B3 — CONTANTI/CONTANTE + straatnamen met tussenvoegsel (`js/parser.js`):** Italiaanse contant-woorden toegevoegd aan de betaalwoorden. Huisnummerherkenning zoekt nu tot 4 woorden terug naar een straatindicator, dus "Carrer de Balmes 112", "Rue de la Paix 12", "Via dei Fori Imperiali 1", "Avenida de Mayo 800" en "Plaza de la Villa 4" worden nooit meer een gerecht van 1,12. Test V10.3.
- **B4 — Fuzzy sleutelwoorden bij OCR-verwarring (`js/parser.js`):** Totaal-, betaal-, btw-, subtotaal-, fooi-, service- en kortingwoorden worden ook herkend met de bewezen tiny-modelverwarringen (0->o, 1->i, 5->s, 8->b): "T0TAAL", "P1N", "1VA", "5UMME". Totaalwoorden aangevuld met TOTAL A PAYER, AMOUNT DUE en TOTALE COMPLESSIVO. Bedragen met ruis blijven bestaan: "4,60-" wordt 4,60 en "4,8O" wordt 4,80 (alleen als het token verder volledig uit cijfers bestaat). Test V10.4.
- **B5 — Plakvakroute geeft ambiguousCandidates door (`js/app.js`):** De paste-handler zette de twijfelkandidaten niet in de sessie, dus de keuze-UI verscheen alleen bij scans. Nu wel; browserproef toont de keuze-UI met beide knoppen bij een ambigue geplakte bon. Test V10.5 + browser-UI-test.
- **B6 — Eerlijke melding als PDF.js niet laadt (`js/parser.js`, `js/app.js`, `js/errors.js`):** Een laadfout van de pdf-lezer zelf (jsDelivr geblokkeerd/offline) heeft nu eigen code `pdfjs_load_failed` en een eigen melding ("De pdf-lezer (PDF.js) kon niet geladen worden..."), niet meer het misleidende "scan zonder tekstlaag". Test V10.6 + browser-UI-test.
- **B7 — Kleine punten:** Gemini-dagteller telt pas na een geslaagde call (mislukte calls tellen niet meer; test V10.7); dode `js/preprocess.js` verwijderd; `rawText` van Gemini- en OCR-scans wordt in de sessie bewaard; de service worker cachet PDF.js al bij installatie (best-effort: een geblokkeerde jsDelivr breekt de installatie niet; test V10.8).

## Metingen v10 (v9 en v10 naast elkaar, identiek harnas en identieke bonnen)

Zelfde werkwijze als bij v9: echte headless Chrome, loggende blackhole-proxy, 0 externe app-requests. Nieuwe set: **eigen v10-set** (10 bonnen, 29 regels, met telefoon-/bon-/tafelnummers, CONTANTI, tussenvoegsel-straatnamen, eenheden, streepjes achter bedragen en scheve/onscherpe foto's; `tests/testset-v10/` + generator `scripts/gen-v10-testset.py`).

| Meting | v9 | v10 |
|---|---|---|
| Plakvak v10-set (29 regels) | 3/10 sluitend, 27/29, 11 valse regels | **10/10 sluitend, 29/29, 0 valse** |
| Backup OCR v10-set | 2/10 sluitend, 25/29, 15 valse | **8/10 sluitend, 28/29, 4 valse** |
| Plakvak v9-set (33 regels) | 10/10, 33/33, 0 valse | 10/10, 33/33, 0 valse |
| Backup OCR v9-set | 7/10, 29/33, 0 valse | **8/10, 31/33, 0 valse** |
| Plakvak A-nagebouwd (98 regels) | 15/15, 98/98, 0 valse | 15/15, 98/98, 0 valse |
| Backup OCR A-nagebouwd | 6/15, 83/98, 0 valse | **9/15, 83/98, 0 valse** |
| Plakvak B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |
| Backup OCR B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |

Conclusies:
- **Geen terugval op bekende sets:** alle plakvak-scores blijven 100% en set B blijft 59/59 op beide routes. De OCR-route werd juist beter door de fuzzy totaalherkenning (v9-set 7->8 sluitend, A-nagebouwd 6->9 sluitend, alle gemiste regels blijven zuivere OCR-leesruis).
- **De v10-set bewijst de fixes:** v9 maakt 11-15 valse regels op deze bonnen (telefoonnummers, CONTANTI-regels, Carrer de Balmes als gerecht); v10 maakt er op het plakvak 0 en sluit alle 10 bonnen.
- De 2 niet-sluitende OCR-bonnen in de v10-set komen door rij-fouten van de tiny-OCR zelf (bedragen op de verkeerde regel gezet, totaalbedrag los van het totaalwoord); de parser kan een bedrag dat op een andere regel belandt niet terughalen.

## Tests v10
- `node tests/calculator.test.js`: **59/59 groen** (50 bestaand + 9 nieuw), volledige output in `tests/test-output-v10.txt`.
- `tests/run-tests.html` in echte headless Chrome: **59/59 groen**.
- Syntaxcontrole `node --check` op alle js-bestanden en `sw.js`: schoon.
- UI-breektests in echte browser: kapot/leeg/verkeerd bestand, pdf met geblokkeerde PDF.js (nieuwe B6-melding), offline-modellen, HTTP 500-terugval, klembord-mislukking, én de plakvak-keuze-UI (B5): allemaal groen.
- Meetpagina `tests/measure-v9.html` werkt ook voor de v10-set (`?set=/tests/testset-v10&route=ocr`); generator `scripts/gen-v10-testset.py` meegeleverd.

## Eerlijk over de grenzen van deze meting (v10)
- Er is **geen echte Gemini-call** gedaan (geen sleutel beschikbaar); de Gemini-route is getest met gemockte antwoorden.
- De meetsets zijn synthetisch; echte bonnen kunnen afwijken. De v10-set is bewust lastiger gemaakt dan dagelijkse bonnen.
- Browserproeven draaiden in headless Chrome op Linux, niet op een echte iPhone.

## Wijzigingen in v9 (per punt, ter referentie)

Alle zeven bevindingen uit de onafhankelijke v8-review zijn verwerkt. Elke fix heeft eigen regressietests (V9.1 t/m V9.6 in `tests/calculator.test.js`, 50/50 groen in Node én in echte headless Chrome).

- **Punt 1 — Komma-herstel raakt nooit meer huisnummers of postcodes (`js/parser.js`):** Nieuwe `isAddressOrPostalNumber()` herkent huisnummers na straatwoorden en straatsuffixen (NL/DE/FR/ES/IT/EN: straat/weg/laan/plein/gracht, rue/avenue/boulevard, Strasse, via/calle, street/road/lane...), Nederlandse postcodes (`1234 AB`), Duitse/Franse/Italiaanse/Spaanse 5-cijfer-postcodes voor of na een plaatsnaam, en Amerikaanse `STAAT 12345` / `12345-6789`. Zo'n regel is geen gerecht en wordt nooit stil `4,80`. Werkt op alle routes (plakvak, lokale OCR en Gemini-verificatie). Regressietests V9.1a t/m V9.1g.
- **Punt 2 — PIN en varianten als betaalwoord (`js/parser.js`):** `PIN`, `PINNEN`, `PINBETALING`, `PINPAS`, `EC`, `V PAY`, `MASTERCARD`, `AMEX` en `CONTACTLOOS/CONTACTLESS` classificeren als betaling (met woordgrenzen; `Pinot`, `Pinsa`, `Pint`, `Pincho`, `Spinazie` blijven gewoon gerechten). Regressietests V9.2a/b.
- **Punt 3 — Privacytekst klopt weer (`js/i18n.js`, `js/local-ocr.js`, `js/dictionary.js`):** Rekenmotor staat overal op ~24 MB (was ~12 MB op twee plekken). De dode `lookupSinglePhraseOnline()` met het MyMemory-endpoint is verwijderd; er staat geen enkele functie meer die dat endpoint noemt. Er is bewust geen juridische claim over Google-voorwaarden toegevoegd; dat is aan Henk.
- **Punt 4 — Btw-regel nooit dubbel geteld (`js/gemini.js`):** Staat een btw-bedrag zowel in `vat[]` als als regel in `items[]`, dan telt de somcontrole het eenmalig mee. Regressietest V9.4.
- **Punt 5 — Eerlijke Nederlandse foutmeldingen (`js/errors.js`, `js/app.js`, `js/local-ocr.js`):** Kapot/lekker-bestand, 0 bytes, verkeerd bestandstype en een gescande pdf zonder Gemini-sleutel krijgen elk een eigen vriendelijke melding met een werkbare vervolgstap. Offline met nog-gecachete modellen zegt nu eerlijk dat je eenmalig internet nodig hebt; alleen een echte HTTP-status zegt nog "ontbreken op server". Regressietests V9.5/V9.5b + UI-breektests in de browser.
- **Punt 6 — HTTP 500 is geen dood spoor meer (`js/gemini.js`, `js/app.js`):** Elke 5xx van Gemini valt terug op de lokale backup (`fallbackCode http_5xx`; 429 blijft `http_429`), en elke foutmelding bij een foto biedt de knop "Lokale backup starten". Regressietest V9.6 + browserproef met gesimuleerde 500.
- **Punt 7 — Klembord-terugval meldt mislukking zichtbaar (`js/app.js`, `js/i18n.js`):** Alle drie de klembordpaden tonen bij falen "Kopiëren naar het klembord is mislukt. Selecteer de tekst en kopieer hem zelf." en kondigen dat aan voor schermlezers. Browserproef met geblokkeerd klembord.

## Metingen v9 (v8 en v9 naast elkaar, identiek harnas en identieke bonnen)

Alles hieronder is gemeten in echte headless Chrome met een loggende blackhole-proxy: alle niet-lokale requests worden verbroken en gelogd. De app deed in alle meetruns **0 externe requests** (alleen Chrome-interne telemetrie naar google.com/gstatic verscheen in het log; die is geen app-verkeer en werd eveneens verbroken). De eenmalige jsDelivr-aanroep voor PDF.js bij het openen van een pdf is zichtbaar in de UI-test en staat vermeld in de privacytekst.

Drie sets: **eigen v9-set** (10 nieuwe bonnen, 33 regels, met adresregels, PIN-betaalregels, postcodes, twee btw-tarieven, scheef tot 8,5° en blur; `tests/testset-v9/` + generator `scripts/gen-v9-testset.py`), **A-nagebouwd** (15 bonnen, 98 regels, stijl van set A uit v6-v8; de originele set A zat niet in de v8-zip) en **B** (15 bonnen, 59 regels, ongewijzigd uit de repo).

| Meting | v8 | v9 |
|---|---|---|
| Plakvak eigen v9-set (33 regels) | 7/10 bonnen sluitend, 33/33 regels, 5 valse regels | **10/10 sluitend, 33/33, 0 valse** |
| Backup OCR eigen v9-set | 4/10 sluitend, 29/33, 9 valse | **7/10 sluitend, 29/33, 0 valse** |
| Plakvak A-nagebouwd (98 regels) | 10/15 sluitend, 98/98, 10 valse | **15/15 sluitend, 98/98, 0 valse** |
| Backup OCR A-nagebouwd | 4/15 sluitend, 83/98, 10 valse | **6/15 sluitend, 83/98, 0 valse** |
| Plakvak B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |
| Backup OCR B (59 regels) | 15/15, 59/59, 0 valse | 15/15, 59/59, 0 valse |

Conclusies:
- **Geen terugval op de bekende sets:** B is op beide routes identiek (59/59). Op A-nagebouwd scoort v9 op de OCR-route exact dezelfde 83/98 herkende regels als v8 op hetzelfde harnas; de gemiste regels zijn OCR-leesruis (bijv. `T0TAAL` met een nul op 8° scheef), geen parserfouten. De v8-claim 98/98 op backup A kon ik op mijn nagebouwde set A niet reproduceren — v8 zelf haalt daar in dit harnas ook 83/98 — maar omdat de originele set A ontbreekt kan ik niet uitsluiten dat mijn set lastiger is dan de originele.
- **De fixes doen wat ze moeten:** alle valse regels in v8 (adresregels als `Kerkstraat 480` -> € 4,80 en PIN-regels als gerecht) zijn in v9 weg, op alle sets en beide routes. Daardoor sluiten er meer bonnen (plakvak 10/10 en 15/15).
- De overige OCR-missers op scheve bonnen zijn herkenningsfouten van de tiny-modellen zelf; daar verandert deze versie niets aan.

## Tests v9
- `node tests/calculator.test.js`: **50/50 groen** (36 bestaand + 14 nieuw), volledige output in `tests/test-output-v9.txt`.
- `tests/run-tests.html` in echte headless Chrome: **50/50 groen**.
- Syntaxcontrole `node --check` op alle js-bestanden en `sw.js`: schoon.
- UI-breektests in echte browser (kapot png, leeg bestand, .txt, gescande pdf zonder sleutel, offline-modellen, gesimuleerde HTTP 500 met terugval, geblokkeerd klembord): alle 7 tonen de juiste Nederlandse melding en/of werkende terugval.
- Meetpagina `tests/measure-v9.html` (met `<base href="../">`) en generator `scripts/gen-v9-testset.py` zijn meegeleverd zodat de reviewer alles kan herhalen.

## Eerlijk over de grenzen van deze meting (v9)
- Er is **geen echte Gemini-call** gedaan (geen sleutel beschikbaar); de Gemini-route is getest met gemockte antwoorden, inclusief de 500-terugval.
- De originele set A uit de v6-v8-metingen zat niet in de v8-zip; A-nagebouwd is een eigen reproductie in dezelfde stijl.
- De meetsets zijn synthetisch; een echte kasbon met afwijkende opmaak kan altijd afwijken.
- De browserproeven draaiden in headless Chrome op Linux, niet op een echte iPhone.

## Wijzigingen in v8 (per punt, ter referentie)
- **Punt 1 — Syntaxfouten hersteld, tests draaien echt (`js/i18n.js`, `tests/calculator.test.js`):** De twee syntaxfouten uit v7 zijn eruit. De teststrings V7.3/V7.4/V7.5 stonden in v7 kapot door aanhalingstekens in de tekst zelf; ze gebruiken nu template literals. Alle 36 tests draaien en slagen: `node tests/calculator.test.js` (volledige output in `tests/test-output-v8.txt`) of `tests/run-tests.html` in de browser.
- **Punt 2 — "Geen naam = geen gerecht" echt gefixt (`js/parser.js`):** In v7 werd een kale cijferregel zoals `"480"` (een huisnummer) door de samenvoeglogica alsnog aan de vorige regel geplakt en kon zo toch een gerecht worden of een bedrag beinvloeden. Kale cijferregels zonder letters worden nu nooit meer samengevoegd en nooit een gerecht; bedragen mét decimalen plakken nog wel (gewenst bij afgebroken bedragen). Getest met V8.1 (cijferregel boven, onder en onderaan de bon) en het bestaande V7.4 is groen.
- **Punt 3 — Lokale backup echt zelf-gehost en werkend (`js/local-ocr.js`, `js/assets-manifest.js`, `js/vendor/`, `models/`):**
  - Het woordenboek is nu het echte tiny-woordenboek `ppocrv6_tiny_dict.txt` (het gewone `ppocrv6_dict.txt` van de grote modellen gaf foute tekens).
  - De browsermodule wordt meegeleverd als `js/vendor/ppu-paddle-ocr.mjs` (esbuild-bundle van `ppu-paddle-ocr/web` + `onnxruntime-web`).
  - onnxruntime laadde zijn WASM stilletjes van een CDN; de module krijgt nu via `setLocalWasmPaths()` een absolute URL naar `js/vendor/ort-wasm/`, waar `ort-wasm-simd-threaded.jsep.mjs` en `.jsep.wasm` (~24 MB) in de repo staan.
  - Het woordenboek wordt als ArrayBuffer doorgegeven; v7 gaf tekst en de library behandelde dat als URL, waardoor de echte dienst faalde.
  - Echte netwerkproef in een echte browser (headless Chrome, alle niet-lokale requests geblokkeerd): de backup draait een volledige OCR op een bonfoto, geeft de juiste gerechten en het juiste totaal, en doet **0 externe requests**. Alleen localhost wordt aangeroepen.
  - Scheve bonnen: naam en prijs worden nu gekoppeld via schuinte-gecorrigeerde bounding-box-rijen (geschatte helling van de bon), niet via kale y-coordinaten. Zie de metingen hieronder.
- **Punt 4 — Eerlijke privacytekst (`js/i18n.js`):** De tekst noemt nu precies wat waarheen gaat: de bonfoto gaat bij online OCR naar Google Gemini; PDF.js komt van jsDelivr; de lokale backup downloadt ~6 MB aan modellen en ~24 MB aan WASM van dezelfde server als de app en stuurt daarna niets naar buiten. Geen vage beloftes meer.
- **Punt 5 — Gemini-voorwaardenlink bijgewerkt (`js/gemini.js`):** Verwijst nu naar `https://aistudio.google.com/docs/terms` (de oude link gaf een doorverwijzing).
- **Punt 6 — Delen zonder waarschuwingen (`js/app.js`, `js/calculator.js`, `js/i18n.js`):** Twee aparte knoppen: "Deel uitslag" deelt de verdeling als tekst (bijv. `Jan € 14,50 · Els € 22,00 · totaal € 36,50`) via het deelvenster van het toestel, met klembord als terugval; "Deel bonfoto" deelt de originele foto (alleen zichtbaar als het toestel dat ondersteunt). Geen contacten, geen waarschuwingen, geen extra stappen.
- **Punt 7 — Opnieuw gemeten op beide sets:** zie de tabel hieronder. Alles is gemeten met exact dezelfde sets en scripts als bij v6 en v7.

## Metingen (identieke sets en scripts als v6/v7)

Twee testsets: **A** (15 bonnen, 98 regels, gegenereerd) en **B** (15 bonnen, 59 regels, uit de repo, met scheve/onscherpe/ruizige foto's). Plakvak = parser op tekst; backup = echte PP-OCRv6_tiny-modellen.

| Meting | v6 | v7 | v8 |
|---|---|---|---|
| Plakvak A, perfecte tekst (98 regels) | 98/98 | 98/98 | 98/98 |
| Plakvak A, tesseract-tekst | 89/98 | 89/98 (0 valse) | 89/98 (0 valse) |
| Plakvak B, perfecte tekst (59 regels) | 59/59 | 59/59 | 59/59 |
| Plakvak B, tesseract-tekst | 38/59 | 38/59 (1 valse) | 38/59 (1 valse) |
| Backup A, echte OCR | 90/98 | 98/98 | 98/98 |
| Backup B, app-route via OCR-boxen | — | 34/59 (6 valse) | **59/59 (0 valse)** |

De v7-backup koppelde naam en prijs op regelvolgorde of kale y-positie; bij scheve foto's gleed dat weg (34/59, 6 valse gerechtregels). De v8-boxroute schat de helling van de bon en corrigeert de rijindeling: alle 59 regels goed, alle 15 bontotalen goed, nul valse regels. Ter vergelijking: de pure tekstroute van de backup (zonder boxen, alleen terugval die de app in de praktijk niet gebruikt) scoort in v8 28/59 met 6 valse regels; daar staat de 34/59 uit v7 tegenover. De app gebruikt altijd de boxroute zodra de OCR-dienst posities teruggeeft, en dat doet zowel de Node- als de browserversie.

## Eerlijk over de grenzen van deze meting
- Er is **geen echte Gemini-call** gedaan (geen sleutel beschikbaar); de Gemini-route is getest met gemockte antwoorden.
- De browserproef draaide in headless Chrome op Linux, niet op een echte iPhone; het plakvak (Live Text) is dus niet op iOS getest.
- De meetsets zijn synthetisch; een echte kasbon met afwijkende opmaak kan altijd afwijken.

## Zelf-gehoste modelbestanden ophalen
```bash
bash scripts/fetch-local-ocr-assets.sh
```
Zie `models/pp-ocrv6-tiny/README.md` voor de exacte bestanden en checksums.

## Lokaal starten & testen
```bash
python3 -m http.server 8000
```
- App: `http://localhost:8000/`
- Automatische tests (69 tests): `http://localhost:8000/tests/run-tests.html` of `node tests/calculator.test.js` (output: `tests/test-output-v12.txt`)
- Meetpagina v9 (plakvak + lokale backup op de eigen v9-set, A-nagebouwd en B): `http://localhost:8000/tests/measure-v9.html?set=/tests/testset-v9&route=ocr`
- Oude benchmarkpagina uit v8: `http://localhost:8000/tests/benchmark.html`

---

## Wijzigingen in v7 (per punt, ter referentie)
## Wijzigingen in v7 (per punt)
- **Punt 1 — Komma-herstel op de Gemini-route (`js/gemini.js`):** `parseGeminiReceiptJson()` past nu exact dezelfde decimale notatiedetectie (`detectReceiptNumberFormat`) en herstelstap (`parseAmountWithFormat`) toe op alle velden (`items`, `subtotal`, `vat`, `tip`, `discount`, `total`), met dezelfde uitzonderingen (gewichten, aantallen, percentages, datums, valuta zonder centen). Herstelde bedragen worden zichtbaar gemarkeerd met `restoredDecimal: true` en `lowConfidence: true`.
- **Punt 2 — Lokale backup op echte `ppu-paddle-ocr`-interface (`js/local-ocr.js`, `js/assets-manifest.js`, `js/parser.js`, `scripts/fetch-local-ocr-assets.sh`):** Aangesloten op de echte `PaddleOcrService` uit `ppu-paddle-ocr/web` met `{ model: { detection, recognition, charactersDictionary } }` en de echte `PP-OCRv6_tiny`-bestanden (`PP-OCRv6_tiny_det.ort`, `PP-OCRv6_tiny_rec.ort`, `ppocrv6_dict.txt`). Downloadscript met SHA-256-checksums toegevoegd zonder externe CDN-links in de app. `mergeOcrLinesToSingleRow()` koppelt naam en prijs op bounding-box-positie (zelfde regelhoogte, naam links, prijs rechts) in plaats van regelvolgorde, en `normalizePunctuation()` herstelt spaties in bedragen zoals `"€2, 49"` → `"€2,49"`.
- **Punt 3 — Meerdere btw-regels op de Gemini-route (`js/gemini.js`):** Ondersteunt zowel een lijst in `vat[]` als meerdere btw-regels die het model in `items[]` plaatst en telt ze op zodat de somcontrole van onderaf ook bij twee btw-tarieven (bijv. 9% en 21%) sluit.
- **Punt 4 — Betaalwoorden `BAR`, `KARTE` en `CARTE` (`js/parser.js`):** Toegevoegd met woordgrenzen (`\b`) aan `classifyNonDishKeyword()` zodat Duitse en Franse betaalregels nooit een gerecht worden.
- **Punt 5 — Geen naam is geen gerecht (`js/parser.js`):** Regels zonder naamdeel (alleen cijfers en tekens, zoals een huisnummer `"480"`) worden nooit een gerecht en blokkeren het afronden niet; losse bedragen wegen hooguit mee als kandidaat-subtotaal of -totaal.
- **Punt 6 — Kleine herstelpunten:** Privacytekst in `js/i18n.js` en `js/app.js` bijgewerkt voor Gemini, vertalen, PDF.js (jsDelivr) en de zelf-gehoste lokale backup (~6 MB van eigen GitHub Pages); dode v4-bestanden (`js/ocr.js`, `tests/ocr-benchmark.html`) verwijderd; ongebruikte v4/Tesseract i18n-strings opgeruimd; kopregel van `js/app.js` en Service Worker (`sw.js`) bijgewerkt naar v7.
- **Punt 7 — Tests & meting (`tests/calculator.test.js`, `tests/run-tests.html`, `tests/benchmark.html`):** Alle 25 bestaande tests zijn ongewijzigd behouden. Toegevoegd: `V7.1` (komma-herstel `"1450"` in Gemini items + vaste velden), `V7.2` (twee btw-regels in Gemini), `V7.3` (`BAR`/`KARTE`/`CARTE` met woordgrenzen), `V7.4` (huisnummer zonder naam), `V7.5` (`"€2, 49"` met spatie), `V7.6` (bounding-box kolomkoppeling in wisselende volgorde) en `V7.7` (netwerkvrije proef van `runLocalBackupOcr` met geblokkeerde externe `fetch`).

## Zelf-gehoste modelbestanden ophalen
```bash
bash scripts/fetch-local-ocr-assets.sh
```
Zie `models/pp-ocrv6-tiny/README.md` voor de exacte bestanden en checksums.

## Lokaal starten & testen
```bash
python3 -m http.server 8000
```
- App: `http://localhost:8000/`
- Automatische tests (32 tests: 25 bestaand + 7 nieuw): `http://localhost:8000/tests/run-tests.html` of `node tests/calculator.test.js`
- Meetpagina (Gemini + lokale backup + plakvak op 15 bonnen / 59 regels): `http://localhost:8000/tests/benchmark.html`
