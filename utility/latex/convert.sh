#!/bin/bash
# archipelagos journal — Pandoc 3.x + lualatex PDF conversion
# Usage: ./convert.sh path/to/article.md [/path/to/repo/root]
#
# Replaces the old ConTeXt pipeline (convert.sh + ssed scripts).
# Requires: pandoc >= 3.0, lualatex (texlive-full or equivalent)

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 article.md [repo_root]"
  exit 1
fi

FULLPATH="$1"
ROOT="${2:-$(git -C "$(dirname "$FULLPATH")" rev-parse --show-toplevel 2>/dev/null || pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/template.tex"
FILTER="$SCRIPT_DIR/journal.lua"

FILENAME=$(basename "$FULLPATH" .md)
WORKDIR=$(mktemp -d)
trap "rm -rf $WORKDIR" EXIT

echo "▶ Processing: $FULLPATH"

# Skip articles marked pdf: false
if grep -q "^pdf: false" "$FULLPATH"; then
  echo "  Skipping (pdf: false)"
  exit 0
fi

# Extract front matter variables for Pandoc metadata
# Pandoc reads YAML front matter natively from the markdown file

# Build image path relative to workdir so lualatex can find images
ISSUE_DIR=$(basename "$(dirname "$FULLPATH")")  # e.g. issue01
IMAGE_PATH="$ROOT/images/$ISSUE_DIR"

# Copy images to workdir so lualatex resolves them
mkdir -p "$WORKDIR/images"
if [ -d "$IMAGE_PATH" ]; then
  cp -r "$IMAGE_PATH/." "$WORKDIR/images/"
fi

# Copy fonts so fontspec can find them
mkdir -p "$WORKDIR/.fonts"
if [ -d "$ROOT/.fonts" ]; then
  cp "$ROOT/.fonts/"*.ttf "$WORKDIR/.fonts/" 2>/dev/null || true
  cp "$ROOT/.fonts/"*.otf "$WORKDIR/.fonts/" 2>/dev/null || true
fi

# Run Pandoc: markdown → PDF via lualatex
pandoc "$FULLPATH" \
  --from markdown \
  --to pdf \
  --template "$TEMPLATE" \
  --lua-filter "$FILTER" \
  --pdf-engine lualatex \
  --pdf-engine-opt="-output-directory=$WORKDIR" \
  --resource-path "$WORKDIR:$ROOT" \
  --wrap none \
  --metadata-file <(python3 "$SCRIPT_DIR/extract_meta.py" "$FULLPATH") \
  -o "$WORKDIR/$FILENAME.pdf" \
  2>&1

# Copy PDF to assets directory
ISSUE_NUM=$(echo "$ISSUE_DIR" | sed 's/issue//')
ASSETS_DIR="$ROOT/src/assets/$ISSUE_DIR"
mkdir -p "$ASSETS_DIR"
cp "$WORKDIR/$FILENAME.pdf" "$ASSETS_DIR/$FILENAME.pdf"
echo "  ✓ Written: $ASSETS_DIR/$FILENAME.pdf"
