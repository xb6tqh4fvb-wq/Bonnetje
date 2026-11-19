# Zelf-gehoste modelbestanden voor ppu-paddle-ocr/web (PP-OCRv6_tiny)

De lokale backup van Bonnetje gebruikt de echte browser-interface van **PT-Perkasa-Pilar-Utama/ppu-paddle-ocr** (`ppu-paddle-ocr/web`) met zelf-gehoste **PP-OCRv6_tiny**-bestanden. Er wordt nergens verwezen naar een externe CDN: de modellen, het woordenboek, de gebundelde browsermodule en de onnxruntime-WASM komen allemaal van dezelfde server als de app zelf.

## Bestanden in deze map (`models/pp-ocrv6-tiny/`, ~6 MB, Apache 2.0)
1. `PP-OCRv6_tiny_det.ort` — detectiemodel
2. `PP-OCRv6_tiny_rec.ort` — herkenningsmodel
3. `ppocrv6_tiny_dict.txt` — tekenwoordenboek (dit is echt het *tiny*-woordenboek; het gewone `ppocrv6_dict.txt` van de grote modellen werkt niet)

## Bestanden elders in de repo
- `js/vendor/ppu-paddle-ocr.mjs` — gebundelde browsermodule (npm `ppu-paddle-ocr/web` + `onnxruntime-web`), met een `setLocalWasmPaths()`-functie zodat de WASM-bestanden van de eigen server komen
- `js/vendor/ort-wasm/ort-wasm-simd-threaded.jsep.mjs` en `.jsep.wasm` (~24 MB) — de onnxruntime-WASM die de module in een blob-worker opvraagt; zonder deze twee bestanden valt de backup stil terug op een CDN

## Ophalen met checksums
Vanuit de hoofdmap van de repo:
```bash
bash scripts/fetch-local-ocr-assets.sh
```
Dit script haalt de modelbestanden van Hugging Face, controleert ze tegen `SHA256SUMS.txt`, kopieert de twee WASM-bestanden uit `onnxruntime-web` en bouwt de browsermodule met esbuild.

Ontbreken de bestanden op je server, dan meldt Bonnetje dat vriendelijk en blijven het plakvak (iPhone Live Text) en handmatig invoeren direct beschikbaar. De Service Worker (`sw.js`) cachet alle bestanden op het toestel zodra de lokale backup voor het eerst wordt gebruikt.
