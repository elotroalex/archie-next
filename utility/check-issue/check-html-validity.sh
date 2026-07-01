#!/bin/bash
# Runs html-validate against every built HTML page (en/es/fr) for the issue.
# Invoked one file at a time so each page gets its own ok/FAIL line, matching
# this project's check-issue reporting convention.
#
# Usage: bash check-html-validity.sh <manifestPath> [--root <dir>]
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$1"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [ "${2:-}" = "--root" ] && [ -n "${3:-}" ]; then
  ROOT="$(cd "$3" && pwd)"
fi

FAIL=0

while IFS= read -r relPath; do
  [ -z "$relPath" ] && continue
  file="$ROOT/$relPath"
  if [ ! -f "$file" ]; then
    echo "FAIL - html validity: $relPath (built file missing)"
    FAIL=1
    continue
  fi
  OUTPUT=$(npx html-validate --config "$SCRIPT_DIR/htmlvalidate.config.json" "$file" 2>&1)
  if [ $? -eq 0 ]; then
    echo "ok - html validity: $relPath"
  else
    echo "FAIL - html validity: $relPath"
    echo "$OUTPUT" | sed 's/^/    /'
    FAIL=1
  fi
done < <(node -e '
const manifest = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
for (const f of [...manifest.builtHtml.en, ...manifest.builtHtml.es, ...manifest.builtHtml.fr]) {
  console.log(f);
}
' "$MANIFEST")

exit $FAIL
