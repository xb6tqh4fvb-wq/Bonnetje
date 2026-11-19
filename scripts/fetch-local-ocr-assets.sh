#!/usr/bin/env bash
set -euo pipefail

# Haalt de echte PP-OCRv6_tiny modelbestanden, de browsermodule en de
# onnxruntime-WASM-bestanden op voor zelf-hosting (bijv. GitHub Pages).
# Bron modellen: https://huggingface.co/snowfluke/ppu-paddle-ocr-models
# (npm-pakket: PT-Perkasa-Pilar-Utama/ppu-paddle-ocr)

BASE_URL="https://huggingface.co/snowfluke/ppu-paddle-ocr-models/resolve/main"
MODEL_DIR="models/pp-ocrv6-tiny"
WASM_DIR="js/vendor/ort-wasm"
ORT_VERSION="1.23.2"
mkdir -p "$MODEL_DIR" "$WASM_DIR"

echo "Downloading PP-OCRv6_tiny model files into $MODEL_DIR ..."
curl -fL "$BASE_URL/detection/ort/PP-OCRv6_tiny_det.ort" -o "$MODEL_DIR/PP-OCRv6_tiny_det.ort"
curl -fL "$BASE_URL/recognition/ort/PP-OCRv6_tiny_rec.ort" -o "$MODEL_DIR/PP-OCRv6_tiny_rec.ort"
curl -fL "$BASE_URL/recognition/ppocrv6_tiny_dict.txt" -o "$MODEL_DIR/ppocrv6_tiny_dict.txt"

echo "SHA-256-checksums controleren..."
if [ -f "$MODEL_DIR/SHA256SUMS.txt" ]; then
  (cd "$MODEL_DIR" && sha256sum -c SHA256SUMS.txt)
else
  (cd "$MODEL_DIR" && sha256sum PP-OCRv6_tiny_det.ort PP-OCRv6_tiny_rec.ort ppocrv6_tiny_dict.txt > SHA256SUMS.txt)
  cat "$MODEL_DIR/SHA256SUMS.txt"
fi

echo "npm-afhankelijkheden voor de browsermodule ophalen ..."
npm install --no-save ppu-paddle-ocr@6.7.1 onnxruntime-web@"$ORT_VERSION" esbuild

echo "onnxruntime-WASM-bestanden kopieren naar $WASM_DIR ..."
ORT_DIST="node_modules/onnxruntime-web/dist"
cp "$ORT_DIST/ort-wasm-simd-threaded.jsep.mjs" "$ORT_DIST/ort-wasm-simd-threaded.jsep.wasm" "$WASM_DIR/"

echo "Browsermodule bundelen naar js/vendor/ppu-paddle-ocr.mjs ..."
cat > /tmp/bonnetje-vendor-entry.mjs <<'ENTRY'
import * as ort from 'onnxruntime-web';
import { PaddleOcrService, V6_TINY_MODEL } from 'ppu-paddle-ocr/web';

export function setLocalWasmPaths(baseUrl) {
  const base = (typeof document !== 'undefined' && document.baseURI) || import.meta.url;
  ort.env.wasm.wasmPaths = new URL(baseUrl, base).href;
}

export { PaddleOcrService, V6_TINY_MODEL, ort };
export default PaddleOcrService;
ENTRY
npx esbuild /tmp/bonnetje-vendor-entry.mjs --bundle --format=esm --outfile=js/vendor/ppu-paddle-ocr.mjs
rm -f /tmp/bonnetje-vendor-entry.mjs

echo ""
echo "Klaar. Alles staat nu zelf-gehost in de repo:"
echo "  $MODEL_DIR/  (detectie + herkenning + woordenboek, ~6 MB)"
echo "  $WASM_DIR/   (onnxruntime WASM, ~24 MB)"
echo "  js/vendor/ppu-paddle-ocr.mjs (browsermodule)"
