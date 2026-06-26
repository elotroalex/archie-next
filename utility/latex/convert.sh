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

# Copy images into the workdir mirroring the URL path so lualatex can resolve
# them after the Lua filter strips the leading slash from image src attributes.
#
# New issues (co-located):  src/issueXX/images/ → articles reference /issueXX/images/…
#                            workdir needs:        issueXX/images/
# Old issues (central):     src/images/issueXX/  → articles reference /images/issueXX/…
#                            workdir needs:        images/issueXX/
ISSUE_DIR=$(basename "$(dirname "$FULLPATH")")  # e.g. issue01
if [ -d "$ROOT/src/$ISSUE_DIR/images" ]; then
  mkdir -p "$WORKDIR/$ISSUE_DIR/images"
  cp -r "$ROOT/src/$ISSUE_DIR/images/." "$WORKDIR/$ISSUE_DIR/images/"
elif [ -d "$ROOT/src/images/$ISSUE_DIR" ]; then
  mkdir -p "$WORKDIR/images/$ISSUE_DIR"
  cp -r "$ROOT/src/images/$ISSUE_DIR/." "$WORKDIR/images/$ISSUE_DIR/"
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
