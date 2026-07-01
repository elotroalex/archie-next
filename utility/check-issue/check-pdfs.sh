#!/bin/bash
# Checks that every article in the issue (unless front matter sets
# `pdf: false`) has a corresponding PDF in src/assets/issueXX/.
#
# Usage: bash check-pdfs.sh <manifestPath> [--root <dir>]
set -uo pipefail

MANIFEST="$1"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [ "${2:-}" = "--root" ] && [ -n "${3:-}" ]; then
  ROOT="$(cd "$3" && pwd)"
fi

FAIL=0

# Emit one "fileSlug<TAB>pdfExpected<TAB>pdfPath" line per article.
while IFS=$'\t' read -r fileSlug pdfExpected pdfPath; do
  if [ "$pdfExpected" = "false" ]; then
    echo "skip - pdf: $fileSlug (pdf: false)"
    continue
  fi
  if [ -f "$ROOT/$pdfPath" ]; then
    echo "ok - pdf: $pdfPath"
  else
    echo "FAIL - pdf: $pdfPath missing (front matter does not set pdf: false)"
    FAIL=1
  fi
done < <(node -e '
const manifest = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
for (const a of manifest.articles) {
  console.log([a.fileSlug, a.pdfExpected, a.pdfPath].join("\t"));
}
' "$MANIFEST")

exit $FAIL
