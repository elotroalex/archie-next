#!/bin/bash
# Create the folder structure for a forthcoming issue.
# Usage: bash utility/intake/new-issue.sh issue09

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <issueSlug>   (e.g. issue09)"
  exit 1
fi

SLUG="$1"
ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
ISSUE_DIR="$ROOT/src/$SLUG"

if [ -d "$ISSUE_DIR" ]; then
  echo "✗ $ISSUE_DIR already exists. Aborting."
  exit 1
fi

mkdir -p "$ISSUE_DIR/incoming"
mkdir -p "$ISSUE_DIR/images"

# Generate the Eleventy directory data file
cat > "$ISSUE_DIR/${SLUG}.11tydata.js" <<EOF
module.exports = {
  layout: "article",
  lang: "en",
  tags: ["$SLUG"],
  eleventyComputed: {
    permalink: (data) => \`$SLUG/\${data.page.fileSlug}.html\`,
    issueSlug: "$SLUG",
  },
};
EOF

echo "✓ Created $ISSUE_DIR"
echo "  $ISSUE_DIR/incoming/    ← drop .docx files here"
echo "  $ISSUE_DIR/images/      ← extracted images will land here"
echo "  $ISSUE_DIR/${SLUG}.11tydata.js"
echo ""
echo "Next steps:"
echo "  1. Add '$SLUG' to src/_data/issues.js"
echo "  2. Add '$SLUG' labels to src/_i18n/en.yml, es.yml, fr.yml"
echo "  3. Drop .docx files into incoming/ and run:"
echo "     bash utility/intake/convert-docx.sh src/$SLUG/incoming/author-title.docx"
