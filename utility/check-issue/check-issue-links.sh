#!/bin/bash
# Runs linkinator with the issue's own built pages (en/es/fr) as crawl entry
# points, reusing the repo's root linkinator.config.json unmodified. Because
# --recurse stays on, every link reachable from those pages is still followed
# and validated (older issues, /public/, homepage, cross-language switcher
# links) -- this is narrower and faster than `npm run check-links` (which
# starts from the whole _site/ root) while still catching real cross-issue
# breakage, not just links within the new issue's own pages.
#
# Unlike utility/report-links.sh (which leaves status [0] for manual triage),
# this is a pre-publication gate: unresolved [0] links are treated as hard
# failures too, since an editor is expected to look at every failure before
# cutover anyway.
#
# Usage: bash check-issue-links.sh <manifestPath> [--root <dir>]
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$1"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [ "${2:-}" = "--root" ] && [ -n "${3:-}" ]; then
  ROOT="$(cd "$3" && pwd)"
fi

ENTRY_POINTS=$(node -e '
const manifest = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const fs = require("fs");
const path = require("path");
const files = [...manifest.builtHtml.en, ...manifest.builtHtml.es, ...manifest.builtHtml.fr];
for (const f of files) {
  if (fs.existsSync(path.join(process.argv[2], f))) console.log(f);
}
' "$MANIFEST" "$ROOT")

if [ -z "$ENTRY_POINTS" ]; then
  echo "FAIL - links: no built HTML files found for this issue (did you run npm run build?)"
  exit 1
fi

cd "$ROOT" || exit 1
OUTPUT=$(npx linkinator $ENTRY_POINTS --recurse --config linkinator.config.json 2>&1)

BROKEN=$(echo "$OUTPUT" | grep -E '^\[[1-9][0-9]{2}\]' | grep 'http')
UNRESOLVED=$(echo "$OUTPUT" | grep -E '^\[0\]')

if [ -z "$BROKEN" ] && [ -z "$UNRESOLVED" ]; then
  echo "ok - links: no broken links reachable from this issue's pages"
  exit 0
fi

BROKEN_COUNT=$(echo "$BROKEN" | grep -c . || true)
UNRESOLVED_COUNT=$(echo "$UNRESOLVED" | grep -c . || true)
echo "FAIL - links: $BROKEN_COUNT broken, $UNRESOLVED_COUNT unresolved"
[ -n "$BROKEN" ] && echo "$BROKEN" | sed 's/^/    /'
[ -n "$UNRESOLVED" ] && echo "$UNRESOLVED" | sed 's/^/    /'
exit 1
