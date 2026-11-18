# Meting bonherkenning

Testset: 10 bonnen, 63 regels (`receipts.mjs`). Negen zelfgemaakte bonnen (NL/ES/EN, waaronder een vage
thermische bon en een scheve foto), gerenderd met reproduceerbare ruis (`make-images.mjs`), plus één echte
foto (Soester Duinen) waarop de naam van de medewerker is weggelakt; er staan alleen bedrijfsgegevens op.

Per bon: regels volledig goed (naam, aantal én bedrag), totaal herkend, som van de regels sluit aan op het
totaal, en het aantal correcties dat de gebruiker moet doen (aantal of bedrag wijzigen, regel toevoegen of
verwijderen, totaal invullen). Draaien: `npm install`, `node tests/ocr-bench/make-images.mjs`,
`node tests/ocr-bench/run.mjs huidig app`.

| stap | configuratie | regels volledig goed | bedrag | aantal | naam | totaal | som sluit | correcties | tijd (10 bonnen) |
|---|---|---|---|---|---|---|---|---|---|
| 0 | huidig (nulmeting) | 47/63 (75%) | 53 | 53 | 50 | 9/10 | 6/10 | 20 | 17 s |
| 2.2 | Otsu | 34/63 (54%) | 45 | 47 | 37 | 7/10 | 6/10 | 38 | 16 s |
| 2.2 | Sauvola | 39/63 (62%) | 49 | 54 | 47 | 8/10 | 3/10 | 31 | 20 s |
| 2.2 | rechtzetten | 45/63 (71%) | 54 | 52 | 47 | 9/10 | 7/10 | 23 | 19 s |
| 2.3 | PSM 4 | 0/63 | 0 | 0 | 0 | 0/10 | 0/10 | 76 | 14 s |
| 2.3 | PSM 11 | 0/63 | 36 | 22 | 0 | 0/10 | 0/10 | 122 | 17 s |
| P | parser (x2-achtervoegsel, 0,75L) | 52/63 (83%) | 53 | 56 | 55 | 9/10 | 6/10 | 12 | 15 s |
| 2.5 | regels uit woorden (PSM 6) | 52/63 (83%) | 53 | 56 | 55 | 9/10 | 6/10 | 12 | 16 s |
| 2.5 | woorden + PSM 4 | 0/63 | 0 | 0 | 0 | 1/10 | 0/10 | 72 | 13 s |
| 2.5 | woorden + PSM 11 | 26/63 (41%) | 36 | 29 | 31 | 7/10 | 5/10 | 42 | 16 s |
| 2.4 | P + dubbele passage (Sauvola), keuze op controles + zekerheid | **59/63 (94%)** | 60 | 63 | 62 | 10/10 | 8/10 | **4** | 25 s |
| 2.4 | idem, keuze alleen op som | 59/63 (94%) | 60 | 63 | 62 | 10/10 | 8/10 | 4 | 25 s |
| app | gekozen instelling (`APP_OCR`) | 59/63 (94%) | 60 | 63 | 62 | 10/10 | 8/10 | 4 | 25 s |

Markering "onzeker" (stap 2.1), gemeten op de gekozen instelling:

| markeerregel | foute regels gemarkeerd | goede regels onterecht gemarkeerd |
|---|---|---|
| regelzekerheid < 70 | 0/4 | 0/59 |
| woordzekerheid bedrag < 60 | 1/4 | 0/59 |
| **woordzekerheid bedrag < 70** (gekozen) | **3/4** | **0/59** |
| woordzekerheid bedrag < 80 | 3/4 | 1/59 |
| laagste woordzekerheid < 70 | 3/4 | 5/59 |

Beperkingen: kleine, grotendeels synthetische set; tijden gemeten op een laptop in Chromium, niet op een
oude telefoon; de PDF-scanroute heeft geen tweede passage.
