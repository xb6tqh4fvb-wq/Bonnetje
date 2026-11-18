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

### Fooi

- **Totaal betaald**: vul in wat er aan het restaurant is betaald ("maak er maar € 110 van"); het bedrag boven de bon is de fooi. Met snelknoppen voor ronde bedragen.
- **Fooibedrag**: een vast fooibedrag.
- **Per persoon**: ieder bepaalt zelf zijn fooi. Je vult per deelnemer in wat die in totaal betaalt (of kiest een afgerond bedrag); de fooi is betaald min eigen consumpties. Niet iedereen hoeft fooi te geven.
- De fooi wordt verdeeld naar verhouding van consumpties of gelijk per persoon.
- Laat iemand wisselgeld liggen ("Rest is fooi") of geeft iemand extra fooi, dan wordt dat eerst met diens eigen fooi-aandeel verrekend; het overschot verlaagt de fooi van de anderen naar rato. Het bedrag voor een Tikkie past zich automatisch aan.
- Alle bedragen worden in centen berekend; afrondingsverschillen worden zo verdeeld dat de som altijd exact klopt.

## Privacy

Alles blijft op het toestel (localStorage). Geen account, geen server. Alleen de leesmodules (Tesseract, pdf.js en het taalbestand) worden de eerste keer van cdn.jsdelivr.net gedownload en daarna gecachet.

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
