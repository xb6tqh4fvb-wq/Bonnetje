# Overdracht Bonnetje

Korte handleiding voor wie dit project overneemt of eraan verder bouwt. Staat: 20 november 2026.

## Wat de app doet

Bonnetje is een gratis, statische webapp (PWA) die een restaurantbon verdeelt per persoon: foto, pdf of geplakte tekst van de bon → regels worden gelezen en zo nodig naar het Nederlands vertaald → per regel aantikken wie het had → eindbedrag per persoon inclusief fooi/retour, te delen via WhatsApp.

- Geen server, geen accounts, geen database: alle gegevens blijven op het toestel (localStorage/IndexedDB).
- De online AI-scan loopt via Firebase AI Logic (Agent Platform Gemini API, model `gemini-3.8-flash`, EU-multiregio) met App Check (reCAPTCHA Enterprise). De kosten lopen via de app-eigenaar met een vast maandmaximum (spend cap). Er zit geen persoonlijke sleutel in de app.
- De lokale OCR-backup (`ppu-paddle-ocr/web` met zelf-gehost `PP-OCRv6_tiny`, bestanden in de repo) start automatisch bij een fout of bij het bereiken van het maximum en stuurt niets naar buiten.
- De volledige wijzigingsgeschiedenis per versie staat in `README.md` (t/m v25; v26 en v27 staan vooralsnog alleen in de commithistorie).

## Huidige versie

- v27, commit `a2b5d40` (20-11-2026), live op https://xb6tqh4fvb-wq.github.io/Bonnetje/.

## Bouwen, testen, lokaal starten

- Er is geen build-stap: de site bestaat uit statische bestanden.
- Tests: `npm test` (draait `node tests/calculator.test.js`, 123/123 groen bij v27) of `http://localhost:8000/tests/run-tests.html` in een browser.
- Lokaal draaien: `python3 -m http.server 8000` en open `http://localhost:8000/`.
- Zelf-gehoste OCR-modelbestanden ophalen (als ze ontbreken): `bash scripts/fetch-local-ocr-assets.sh` (checksums in `models/pp-ocrv6-tiny/README.md`).

## Uitrollen

- De GitHub Actions workflow `.github/workflows/pages.yml` doet alles: bij elke push naar `main` draait eerst `npm test`; alleen bij groene tests volgt de deploy naar GitHub Pages.
- Er wordt dus nooit handmatig iets geüpload; een push naar `main` is de uitrol.

## Terugzetten

- Terugzetten = `main` terugzetten op een oudere commit en pushen (de workflow test en rolt opnieuw uit). Bekende versiepunten:
  - v17 `0cf6baa`, v18 `2894cd8`, v19 `f9e3c76`, v20 `dbad562`, v22 `538fe18`, v23 `c752b80`, v24 `c37fee5`, v25 `4aafaec`, v26 `689ba00`, v27 `a2b5d40` (huidig).
- De service worker laadt open vensters bij een versiewissel vanzelf opnieuw (sinds v19), dus bezoekers komen vanzelf op de nieuwe versie.

## Firebase / App Check

- Firebase-project: `bonnetje-78c25` (Google Cloud-console van de eigenaar).
- In de repo staat alleen de publieke webconfiguratie (`js/firebase-config.js`): apiKey, projectId, appId en de reCAPTCHA Enterprise site key. Die zijn publiek-by-design en geen geheim. De geheime reCAPTCHA-sleutel hoort hier nooit.
- Misbruik wordt beperkt door App Check (reCAPTCHA Enterprise, geregistreerd voor het domein) en de spend cap op het Google Cloud-project. Beide worden beheerd in de consoles van de eigenaar, niet in de repo.

## Open punten (november 2026)

- De online scan op de iPhone van de eigenaar is nooit bevestigd; die viel terug op de lokale backup.
- Twee beveiligingsvoorstellen zonder besluit: App Check afdwingen (enforced) in de Firebase-console en de web-API-sleutel beperken tot het domein `xb6tqh4fvb-wq.github.io`.
- De testset met 10 echte bonnen uit de gesloten PR #3 (branch `claude/modest-mendel-xnj94p`, map `tests/ocr-bench`) ligt nog als mogelijke naslag; die is niet overgenomen.
- In stap 4 telt bij "één betaalt" het eigen deel van de betaler mee als "nog open" tot hij zichzelf afvinkt. Dat is bewust zo gelaten.
- `README.md` kent nog geen hoofdstuk voor v26 en v27.

## Grens

Zaakinhoud en persoonsgegevens horen nooit in deze repo of in de app; de code en de site staan publiek.
