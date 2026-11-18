# Bonnetje

**Rekening verdelen in een paar tikken** · *Split a restaurant bill in a few taps*

👉 **https://xb6tqh4fvb-wq.github.io/Bonnetje/**

[Nederlands](#nederlands) · [English](#english)

---

## Nederlands

### Wat doet de app?

Na een etentje met vrienden: maak een foto van de bon en Bonnetje rekent uit wie wat moet betalen.

1. **Bon** – foto maken (of foto/PDF kiezen). De app probeert de regels zelf uit te lezen. Daarna controleer je ze in één overzicht: wat er op de bon staat, de vertaling, aantal en bedrag naast elkaar, met een duidelijke waarschuwing als de regels niet optellen tot het totaal op de bon. Onzeker gelezen regels zijn gemarkeerd.
2. **Deelnemers** – vul de namen in.
3. **Verdelen** – kies wie, tik aan wat hij of zij had. Samen een fles wijn? Tik hem bij ieder aan. Iets voor de hele groep? Eén tik.
4. **Overzicht** – ieders bedrag, inclusief fooi. Vink af wie betaald heeft, zie wat iemand terugkrijgt bij contant betalen en stuur iedereen zijn bedrag via WhatsApp, e-mail of Signal.

Verder: fooi verdelen (bijv. "maak er € 110 van" of per persoon), bonnen uit het buitenland vertalen (Spaans/Engels), app in het Nederlands of Engels, grote tekst, donkere weergave en een knop om een stap terug te gaan.

**Gratis, geen account, geen reclame.** De foto wordt op je telefoon zelf uitgelezen; foto, namen en bedragen blijven op het toestel. Wel gaat er tekst naar buiten in twee gevallen: omschrijvingen van bonregels die het ingebouwde woordenboek niet kent, worden **automatisch online vertaald via MyMemory** (alleen die omschrijvingen, bijvoorbeeld "Berenjenas a la miel"; geen namen, bedragen of foto), en berichten die jij zelf verstuurt. De eerste keer downloadt de app de leesmodule van jsDelivr; daarbij gaat geen informatie over je bon mee.

**Let op:** het uitlezen gaat niet altijd foutloos, zeker niet bij vage, scheve of verkreukte bonnen. Controleer de regels altijd even met de foto voordat je verdeelt.

**Installeren:** open de link in Safari (iPhone) of Chrome (Android) en kies *Zet op beginscherm*.

### Help de app beter maken

De app is nieuw en nog niet met veel echte bonnen getest. Juist daar kun je helpen:

- **Werkte het uitlezen niet goed?** Stuur een foto van de bon en een screenshot van het resultaat. (Haal eventueel persoonlijke gegevens zoals pasnummers weg.)
- **Iets onduidelijk of een fout gevonden?** Laat weten wat je deed, wat je verwachtte en wat er gebeurde, met het type telefoon.
- **Idee voor iets wat ontbreekt?** Graag!

Heb je een GitHub-account, maak dan een melding aan via [Issues → New issue](https://github.com/xb6tqh4fvb-wq/Bonnetje/issues/new/choose). Geen GitHub? Stuur het gewoon naar degene van wie je de link kreeg.

### Steunen

Vind je Bonnetje handig? Een kleine bijdrage via de knop **Sponsor** bovenaan deze pagina of via https://www.paypal.me/Inzane007 wordt gewaardeerd, maar is nooit nodig.

---

## English

### What does the app do?

After dinner with friends: take a photo of the bill and Bonnetje works out who owes what.

1. **Bill** – take a photo (or choose a photo/PDF). The app tries to read the lines itself. You then check them in one overview: what is on the bill, the translation, quantity and amount side by side, with a clear warning if the lines don't add up to the total on the bill. Lines read with low confidence are marked.
2. **People** – enter the names.
3. **Split** – choose who, then tap what they had. Shared a bottle of wine? Tap it for each person. Something for the whole group? One tap.
4. **Overview** – everyone's amount, including tip. Tick off who has paid, see how much change someone gets when paying cash, and send everyone their amount via WhatsApp, email or Signal.

Also: splitting the tip (e.g. "make it €110" or per person), translating bills from abroad (Spanish/English → Dutch or English), the app in Dutch or English, large text, dark mode and an undo button.

**Free, no account, no ads.** The photo is read on your phone itself; photo, names and amounts stay on the device. Text does leave it in two cases: line descriptions that the built-in dictionary doesn't know are **translated online automatically via MyMemory** (only those descriptions, e.g. "Berenjenas a la miel"; no names, amounts or photo), and messages you send yourself. The first time, the app downloads the reader from jsDelivr; nothing about your bill is sent along.

**Note:** reading the bill isn't always perfect, especially with blurry, skewed or crumpled bills. Always check the lines against the photo before splitting.

**Install:** open the link in Safari (iPhone) or Chrome (Android) and choose *Add to Home Screen*.

### Help improve the app

The app is new and hasn't been tested with many real bills yet. That's where you can help:

- **Did reading the bill go wrong?** Send a photo of the bill and a screenshot of the result. (Feel free to blank out personal details such as card numbers.)
- **Something unclear, or found a bug?** Tell us what you did, what you expected and what happened, plus your phone model.
- **An idea for something missing?** Very welcome!

If you have a GitHub account, open an issue via [Issues → New issue](https://github.com/xb6tqh4fvb-wq/Bonnetje/issues/new/choose). No GitHub? Just send it to whoever shared the link with you.

### Support

Find Bonnetje useful? A small contribution via the **Sponsor** button at the top of this page or via https://www.paypal.me/Inzane007 is appreciated, but never required.

---

## Technische details (Nederlands)

### Zo werkt het

1. **Bon** – maak een foto van de rekening of kies een foto/PDF. De bon wordt op de telefoon zelf uitgelezen (Tesseract, Nederlands); een PDF met tekstlaag wordt direct gelezen. Controleer de regels naast de voorvertoning; het totaal op de bon wordt automatisch vergeleken met de som van de regels.
2. **Deelnemers** – namen invoeren (meerdere tegelijk met komma's).
3. **Verdelen** – kies een persoon en tik aan wat die heeft gehad. Alleen regels van de bon zijn kiesbaar.
   - Een korte uitleg in twee stappen (*kies wie, tik wat*) bij het eerste gebruik.
   - Aantallen (3× bier): elke tik is één stuk. Met **Splits** maak je van een regel met meerdere stuks losse regels, bv. om twee flessen wijn elk over andere personen te verdelen.
   - Delen (fles wijn): tik het item bij meerdere personen aan → naar rato verdeeld.
   - 👥-knop: gelijk over iedereen (ook mensen die later worden toegevoegd), bv. servicekosten.
4. **Overzicht** – per persoon in één oogopslag: vinkje *betaald*, naam, bedrag en een statusregel (bv. "Contant · terug € 3,16"). Onder *Betaling en details*: betaalwijze (contant / pin / Tikkie), wat iemand geeft en terugkrijgt, de specificatie en een persoonlijk bericht. Bovenaan: betaald, nog open, voortgang. Bij afvinken wordt het betaalde bedrag vastgelegd; verandert de verdeling daarna, dan toont de app het verschil (bijbetalen of teruggeven).

#### Bon aanleveren

- Foto maken of een foto/PDF kiezen. PDF's zonder tekstlaag (bv. uit Voorvertoning geëxporteerd) worden met tekstherkenning gelezen.
- Op een computer: sleep een foto of PDF op de app, of kopieer de bon in Voorvertoning (⌘A, ⌘C) en plak hem in de app (⌘V).
- Een webapp kan op iPhone/Mac niet in het deelmenu van andere apps verschijnen; daarom deze routes.

#### Verdeling versturen

- Naar de hele groep of per deelnemer een persoonlijk bericht met eigen bedrag en specificatie.
- Via WhatsApp, e-mail of *Meer…* (het deelmenu van het toestel: Signal, Berichten, enz.). Signal heeft geen link om een bericht voor te vullen, dus dat gaat via het deelmenu.
- Het bericht aan iedereen staat onderaan; het persoonlijke bericht bij de persoon zelf (*Betaling en details*).
- Optioneel veld voor betaalgegevens (Tikkie-link of IBAN), dat in de berichten wordt opgenomen. Wie al betaald heeft, krijgt een bedankje in plaats van een betaalverzoek.

#### Ongedaan maken

- Knop **↶** bovenin (of ⌘Z / Ctrl+Z): stap voor stap terug, tot 50 stappen.
- Na verwijderen van een bon, persoon of regel verschijnt een melding met *Ongedaan maken*; een extra bevestigingsvraag is daardoor niet meer nodig.
- Waarschuwingen: bij versturen terwijl nog niet alles verdeeld is, en als een aantal lager wordt dan wat al is toegewezen.

#### Fooi

- **Totaal betaald**: vul in wat er aan het restaurant is betaald ("maak er maar € 110 van"); het bedrag boven de bon is de fooi. Met snelknoppen voor ronde bedragen.
- **Per persoon**: ieder bepaalt zelf zijn fooi. Je vult per deelnemer in wat die in totaal betaalt (of kiest een afgerond bedrag); de fooi is betaald min eigen consumpties. Niet iedereen hoeft fooi te geven.
- De fooi wordt verdeeld naar verhouding van consumpties of gelijk per persoon.
- Laat iemand wisselgeld liggen ("Rest is fooi") of geeft iemand extra fooi, dan wordt dat eerst met diens eigen fooi-aandeel verrekend; het overschot verlaagt de fooi van de anderen naar rato. Het bedrag voor een Tikkie past zich automatisch aan.
- Alle bedragen worden in centen berekend; afrondingsverschillen worden zo verdeeld dat de som altijd exact klopt.

#### Uitlezen en controleren

- De foto wordt voorbewerkt: bon uit de achtergrond knippen, scheefstand rechtzetten, schaduw egaliseren. De app controleert zelf of de regels optellen tot het totaal; zo niet, dan leest hij opnieuw met een andere beeldbewerking en kiest de beste uitkomst.
- Herkent ook: aantallen voor of achter de naam (`2 Cola`, `Cola x2`), stukprijs + regeltotaal, bedragen boven € 1.000, kortingen, en naam en bedrag die door een scheve foto op aparte regels staan.
- Getest met vier nagemaakte Spaanse bonnen (tapasbar, restaurant met afkortingen, strandtent, en een scheve, vage foto): alle 33 regels, aantallen en totalen goed. **Met echte bonnen is dit nog beperkt getest**; daarom is de controlestap er.

#### Talen

- **App in het Nederlands of Engels**: schakelaar NL/EN rechtsboven. Bedragen en datums volgen de taal (€ 22,50 / €22.50, DD-MM-JJJJ / DD/MM/YYYY).
- **Bonnen in het Nederlands, Spaans of Engels**: de taal wordt automatisch herkend (of kies hem vooraf). Bij *Automatisch* leest de app eerst in de taal van de app (één taalbestand van ±3 MB); blijkt de bon in een andere taal, dan leest hij nog één keer met het juiste taalbestand. Ook woorden als *total*, *IVA*, *propina*, *tax* en *tip* worden herkend.
- **Vertalen van de regels**: een ingebouwd horecawoordenboek (offline) vertaalt de omschrijvingen naar de taal van de app, bv. *Pollo a la plancha* → "Gegrilde kip", *CERV. ALHAMBRA* → "Bier Alhambra", *Paella marisco* → "Zeevruchtenpaella". Kent het woordenboek Spaanse afkortingen, merken en zinsbouw ("X de Y", verpakking als *botella*/*copa*). Origineel en vertaling staan naast elkaar.
- **Onzeker = origineel blijft staan.** Kan een omschrijving niet volledig vertaald worden, dan blijft het origineel de naam en verschijnt de deelvertaling alleen als suggestie ("Gebruiken").
- **Online vertalen** gebeurt automatisch voor omschrijvingen die het woordenboek niet volledig kent: alleen die tekst gaat naar MyMemory. Zulke regels krijgen het label *Online vertaald via MyMemory*. Zonder internet blijft het origineel staan met een knop *Opnieuw proberen*.
- Een taal toevoegen: een kolom in de tabel in `js/translate.js`, de bonwoorden in `js/parse.js`, het taalbestand in `js/ocr.js` en (voor de app zelf) een blok in `js/i18n.js`.

#### Weergave en leesbaarheid

Via de knop **Aa Weergave** bovenin:

- **Thema**: Automatisch (volgt de telefoon), Licht of Donker.
- **Tekstgrootte**: Normaal, Groot (120%) of Extra groot (140%). Knoppen en aanraakvlakken groeien mee; de opmaak is getest tot 320 px schermbreedte.
- **Hoog contrast**: zwartere tekst, duidelijke randen, goed zichtbare selectie en focus. Staat *meer contrast* op de telefoon aan, dan neemt de app dat over.
- De keuze wordt op het toestel onthouden en direct bij openen toegepast.

### Privacy

Wat er over internet gaat:

| Wanneer | Waarheen | Wat |
|---|---|---|
| App openen | GitHub Pages | de app zelf |
| Eerste keer een bon lezen | cdn.jsdelivr.net | leesmodule en taalbestanden (alleen downloaden; daarna bewaard) |
| Automatisch, als het woordenboek een omschrijving niet kent | api.mymemory.translated.net | alleen die omschrijvingen (geen namen, bedragen of foto); zulke regels krijgen het label *Online vertaald via MyMemory* |
| Alleen als jij een bericht verstuurt | WhatsApp / e-mail / gekozen app | het bericht dat je ziet |

Foto, namen, bedragen en betaalstatus blijven op het toestel (localStorage). Geen account, geen server, geen statistieken.

### Ontwikkelen

```bash
python3 -m http.server 8000   # open http://localhost:8000
npm test                      # unit tests rekenkern en bon-parser
```

Geen build-stap: gewone HTML, CSS en JavaScript-modules.

### Publiceren

De workflow `.github/workflows/pages.yml` publiceert de app op GitHub Pages bij een push naar `main`
(eenmalig aanzetten: *Settings → Pages → Source: GitHub Actions*). Daarna op de telefoon openen en
*Zet op beginscherm* kiezen. Camera en installeren werken alleen via https.
