#!/bin/bash
# Convert a copy-edited .docx file to archipelagos-ready Markdown.
# Usage: bash utility/intake/convert-docx.sh src/issueXX/incoming/author-title.docx
#
# Requires: pandoc >= 3.0
# Output:   src/issueXX/author-title.md
# Images:   src/issueXX/images/slug-imageN.ext

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 path/to/incoming/author-title.docx"
  exit 1
fi

DOCX="$(realpath "$1")"
ROOT="$(git -C "$(dirname "$DOCX")" rev-parse --show-toplevel)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
EXTRACT_TMP="$ISSUE_DIR/_extract_tmp"
trap "rm -f '$TMP'; rm -rf '$EXTRACT_TMP'" EXIT

# Run Pandoc from the issue directory so paths resolve relative to it.
# --extract-media places images into _extract_tmp/media/; we move them up
# to images/ afterwards so there is no media/ subdirectory in the final paths.
# tables-to-html.lua converts grid tables (unsupported by markdown-it) to
# raw HTML tables, which pass through on the HTML side and are read back as
# Pandoc Table elements by journal.lua during PDF generation.
cd "$ISSUE_DIR"
pandoc "$DOCX" \
  --lua-filter "$SCRIPT_DIR/tables-to-html.lua" \
  --extract-media=_extract_tmp \
  --wrap=none \
  -f docx \
  -t markdown \
  -o "$TMP"

# Move images from _extract_tmp/media/ directly into images/ (no media/ subdir).
if [ -d "_extract_tmp/media" ]; then
  cp -r _extract_tmp/media/. images/
fi
rm -rf _extract_tmp

# Fix paths in the markdown: _extract_tmp/media/ → images/
sed -i '' "s|_extract_tmp/media/|images/|g" "$TMP"

# Rename extracted images from imageN.ext → slug-imageN.ext so filenames
# are unique and traceable to their source article, then update references.
for img in images/image*; do
  [ -f "$img" ] || continue
  filename="$(basename "$img")"
  newname="${SLUG}-${filename}"
  mv "$img" "images/$newname"
  sed -i '' "s|images/${filename}|images/${newname}|g" "$TMP"
done

# Rewrite image paths to absolute /issueXX/images/... so they work on
# language-variant pages (/es/, /fr/) which are served from a different depth.
# Also strip Word copy-editing artifacts that Pandoc preserves:
#   {.mark}      — highlighted text (→ \hl{} in LaTeX, requires soul package)
#   {.underline} — underlined text, most often Word's auto-underlined
#                  hyperlinks (→ stray literal brackets/braces in rendered HTML)
#   {dir="rtl"}  — curly/smart quotes tagged as RTL by Unicode bidi algorithm
# Also normalize bare curly/smart quotes (‘ ’ “ ”) that Pandoc otherwise
# passes through untouched — these are a common Word autocorrect artifact
# (contributors are asked to avoid them, see authors.md) and render
# unreliably through the PDF/LaTeX pipeline. Converted to the same escaped
# straight-quote form (\" / \') Pandoc already uses for every other quote
# in the document, so the output style stays consistent throughout.
BODY=$(sed \
  -e "s|](images/|](/$ISSUE_SLUG/images/|g" \
  -e 's/\[\([^]]*\)\]{\.mark}/\1/g' \
  -e 's/\[\([^][]*\)\]{\.underline}/\1/g' \
  -e 's/\["\]{dir="rtl"}/"/g' \
  -e "s/\['\]{dir=\"rtl\"}/'/g" \
  -e 's/\["'"'"'\]{dir="rtl"}/"\x27/g' \
  -e 's/[“”]/\\"/g' \
  -e 's/[‘’]/\\'"'"'/g' \
  "$TMP")

# Convert img=/caption=/alt=/url= placeholder blocks (author-typed figure
# markup, used when images aren't embedded in the docx yet) into <figure>
# HTML. Blocks that don't match the expected shape are left as-is for
# manual conversion--see convert-images.py for the exact format required.
BODY=$(printf '%s' "$BODY" | python3 "$SCRIPT_DIR/convert-images.py" "$ISSUE_SLUG")
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

IMG_COUNT=$(find "images" -maxdepth 1 -name "${SLUG}-*" | wc -l | tr -d ' ')
echo "  ✓ Markdown: $OUT_MD"
echo "  ✓ Images:   $IMAGES_DIR/ ($IMG_COUNT file(s))"
echo ""
echo "Edit $OUT_MD and fill in all '# TODO' fields before building."
