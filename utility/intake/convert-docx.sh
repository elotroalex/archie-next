#!/bin/bash
# Convert a copy-edited .docx file to archipelagos-ready Markdown.
# Usage: bash utility/intake/convert-docx.sh src/issueXX/incoming/author-title.docx
#
# Requires: pandoc >= 3.0
# Output:   src/issueXX/author-title.md
# Images:   src/issueXX/images/media/imageN.ext

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 path/to/incoming/author-title.docx"
  exit 1
fi

DOCX="$(realpath "$1")"
ROOT="$(git -C "$(dirname "$DOCX")" rev-parse --show-toplevel)"

# Derive issue slug from path: src/issueXX/incoming/file.docx → issueXX
ISSUE_DIR="$(dirname "$(dirname "$DOCX")")"
ISSUE_SLUG="$(basename "$ISSUE_DIR")"

# Derive output slug: lowercase, spaces and underscores → hyphens, strip .docx
BASENAME="$(basename "$DOCX" .docx)"
SLUG="$(echo "$BASENAME" | tr '[:upper:]' '[:lower:]' | tr ' _' '-')"

OUT_MD="$ISSUE_DIR/$SLUG.md"
IMAGES_DIR="$ISSUE_DIR/images"

if [ ! -d "$IMAGES_DIR" ]; then
  echo "✗ Images directory not found: $IMAGES_DIR"
  echo "  Did you run new-issue.sh first?"
  exit 1
fi

echo "▶ Converting: $DOCX"

# Use a temp file and clean it up even if the script aborts.
TMP="$ISSUE_DIR/_tmp_$SLUG.md"
trap "rm -f '$TMP'" EXIT

# Run Pandoc from the issue directory so --extract-media resolves relative to it.
# No --standalone: author Word files rarely have document properties set, and
# --standalone's YAML block only appears when they do, making parsing unreliable.
# We generate the full front matter stub ourselves below.
cd "$ISSUE_DIR"
pandoc "$DOCX" \
  --extract-media=images \
  --wrap=none \
  -f docx \
  -t markdown \
  -o "$TMP"

# Rewrite image paths to absolute /issueXX/images/... so they work on
# language-variant pages (/es/, /fr/) which are served from a different depth.
# Also strip [x]{dir="rtl"} spans that Pandoc emits for typographic quotes
# (curly " and ' characters) — they are not RTL text, just Word smart quotes.
BODY=$(sed \
  -e "s|](images/|](/$ISSUE_SLUG/images/|g" \
  -e 's/\["\]{dir="rtl"}/"/g' \
  -e "s/\['\]{dir=\"rtl\"}/'/g" \
  -e 's/\["'"'"'\]{dir="rtl"}/"\x27/g' \
  "$TMP")
rm -f "$TMP"

# Write the output file: complete front matter stub followed by the article body.
# Editors fill in every '# TODO' field before the article is built.
cat > "$OUT_MD" <<FRONTMATTER
---
layout: article
section: "# TODO: articles | projects | reviews | introduction"
title:
  long: "# TODO: Full article title"
  short: "# TODO: Short title for running header"
doi: "# TODO: 10.7916/..."
author:
- name: "# TODO: Author full name"
  shortname: "# TODO: Last name"
  bio: >
    # TODO: Author bio in markdown.
pubDate: "# TODO: Month YYYY"
issue: "# TODO: issue number (integer)"
order: "# TODO: position within section (integer)"
abstract: >
  # TODO: Article abstract.
language: en
---

$BODY
FRONTMATTER

echo "  ✓ Markdown: $OUT_MD"
if [ -d "images/media" ]; then
  IMG_COUNT=$(find "images/media" -type f | wc -l | tr -d ' ')
  echo "  ✓ Images:   $IMAGES_DIR/media/ ($IMG_COUNT file(s))"
fi
echo ""
echo "Edit $OUT_MD and fill in all '# TODO' fields before building."
