# Bonnetje

Web-app (PWA) om een restaurantrekening eerlijk te verdelen over de deelnemers.

## Zo werkt het

1. **Bon** – maak een foto van de rekening of kies een foto/PDF. De bon wordt op de telefoon zelf uitgelezen (Tesseract, Nederlands); een PDF met tekstlaag wordt direct gelezen. Controleer de regels naast de voorvertoning; het totaal op de bon wordt automatisch vergeleken met de som van de regels.
2. **Deelnemers** – namen invoeren (meerdere tegelijk met komma's).
3. **Verdelen** – kies een persoon en tik aan wat die heeft gehad. Alleen regels van de bon zijn kiesbaar.
   - Aantallen (3× bier): elke tik is één stuk.
   - Delen (fles wijn): tik het item bij meerdere personen aan → naar rato verdeeld.
   - 👥-knop: gelijk over iedereen (ook mensen die later worden toegevoegd), bv. servicekosten.
4. **Overzicht** – per persoon het te betalen bedrag, betaalwijze (contant / pin / Tikkie), wat iemand geeft en wat hij/zij terugkrijgt, en een vinkje voor *betaald*. Bovenaan: betaald, nog open, voortgang.

### Bon aanleveren

- Foto maken of een foto/PDF kiezen. PDF's zonder tekstlaag (bv. uit Voorvertoning geëxporteerd) worden met tekstherkenning gelezen.
- Op een computer: sleep een foto of PDF op de app, of kopieer de bon in Voorvertoning (⌘A, ⌘C) en plak hem in de app (⌘V).
- Een webapp kan op iPhone/Mac niet in het deelmenu van andere apps verschijnen; daarom deze routes.

### Verdeling versturen

- Naar de hele groep of per deelnemer een persoonlijk bericht met eigen bedrag en specificatie.
- Via WhatsApp, e-mail of *Meer…* (het deelmenu van het toestel: Signal, Berichten, enz.). Signal heeft geen link om een bericht voor te vullen, dus dat gaat via het deelmenu.
- Optioneel veld voor betaalgegevens (Tikkie-link of IBAN), dat in de berichten wordt opgenomen. Wie al betaald heeft, krijgt een bedankje in plaats van een betaalverzoek.

### Fooi

- **Totaal betaald**: vul in wat er aan het restaurant is betaald ("maak er maar € 110 van"); het bedrag boven de bon is de fooi. Met snelknoppen voor ronde bedragen.
- **Fooibedrag**: een vast fooibedrag.
- **Per persoon**: ieder bepaalt zelf zijn fooi. Je vult per deelnemer in wat die in totaal betaalt (of kiest een afgerond bedrag); de fooi is betaald min eigen consumpties. Niet iedereen hoeft fooi te geven.
- De fooi wordt verdeeld naar verhouding van consumpties of gelijk per persoon.
- Laat iemand wisselgeld liggen ("Rest is fooi") of geeft iemand extra fooi, dan wordt dat eerst met diens eigen fooi-aandeel verrekend; het overschot verlaagt de fooi van de anderen naar rato. Het bedrag voor een Tikkie past zich automatisch aan.
- Alle bedragen worden in centen berekend; afrondingsverschillen worden zo verdeeld dat de som altijd exact klopt.

### Talen

- **App in het Nederlands of Engels**: schakelaar NL/EN rechtsboven. Bedragen en datums volgen de taal (€ 22,50 / €22.50, DD-MM-JJJJ / DD/MM/YYYY).
- **Bonnen in het Nederlands, Spaans of Engels**: de taal wordt automatisch herkend (of kies hem vooraf). Ook woorden als *total*, *IVA*, *propina*, *tax* en *tip* worden herkend.
- **Vertalen van de regels**: een ingebouwd horecawoordenboek (offline) vertaalt de omschrijvingen naar de taal van de app, bv. *Pollo a la plancha* → "Gegrilde kip". Het origineel blijft eronder staan, zodat je het op de bon terugvindt. Kent het woordenboek een woord niet, dan kun je de rest **online** laten vertalen (MyMemory; alleen de omschrijvingen worden verstuurd).
- Een taal toevoegen: een kolom in de tabel in `js/translate.js`, de bonwoorden in `js/parse.js`, het taalbestand in `js/ocr.js` en (voor de app zelf) een blok in `js/i18n.js`.

### Weergave en leesbaarheid

Via de knop **Aa Weergave** bovenin:

- **Thema**: Automatisch (volgt de telefoon), Licht of Donker.
- **Tekstgrootte**: Normaal, Groot (120%) of Extra groot (140%). Knoppen en aanraakvlakken groeien mee; de opmaak is getest tot 320 px schermbreedte.
- **Hoog contrast**: zwartere tekst, duidelijke randen, goed zichtbare selectie en focus. Staat *meer contrast* op de telefoon aan, dan neemt de app dat over.
- De keuze wordt op het toestel onthouden en direct bij openen toegepast.

## Privacy

Alles blijft op het toestel (localStorage). Geen account, geen server. Uitzondering: de knop *Online vertalen* stuurt de omschrijvingen van de bonregels naar MyMemory. Alleen de leesmodules (Tesseract, pdf.js en de taalbestanden) worden de eerste keer van cdn.jsdelivr.net gedownload en daarna gecachet.

## Ontwikkelen

```bash
python3 -m http.server 8000   # open http://localhost:8000
npm test                      # unit tests rekenkern en bon-parser
```

Geen build-stap: gewone HTML, CSS en JavaScript-modules.

## Publiceren

De workflow `.github/workflows/pages.yml` publiceert de app op GitHub Pages bij een push naar `main`
(eenmalig aanzetten: *Settings → Pages → Source: GitHub Actions*). Daarna op de telefoon openen en
*Zet op beginscherm* kiezen. Camera en installeren werken alleen via https.
