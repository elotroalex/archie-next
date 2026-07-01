#!/bin/bash
# Runs every issue-integrity check against a single issue: HTML validity,
# link integrity (internal + external, scoped to the issue), front-matter/i18n
# completeness, image existence + alt text + minimum width, PDF existence,
# footnote anchor pairing, and non-standard (curly/smart) quotation marks.
# Intended to be run by an editor after finishing a new issue, before
# flipping the live domain over.
#
# Usage: bash utility/check-issue/check-issue.sh [issueSlug]
#        npm run check-issue -- issue09
#
# Defaults issueSlug to the current issue (last key in src/_data/issues.js)
# when omitted, matching how src/_data/site.js derives `current`.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT" || exit 1

ISSUE_SLUG="${1:-}"
if [ -z "$ISSUE_SLUG" ]; then
  ISSUE_SLUG=$(node -e 'const i=require("./src/_data/issues.js"); console.log(Object.keys(i).at(-1))')
fi

echo "== Building site =="
npm run build --silent
if [ $? -ne 0 ]; then
  echo "FAIL - build: npm run build failed, aborting"
  exit 1
fi

echo ""
echo "== Collecting issue manifest: $ISSUE_SLUG =="
MANIFEST="$(mktemp)"
trap 'rm -f "$MANIFEST"' EXIT
node "$SCRIPT_DIR/collect-issue.js" "$ISSUE_SLUG" > "$MANIFEST"
if [ $? -ne 0 ]; then
  echo "FAIL - manifest: could not collect data for issue '$ISSUE_SLUG'"
  exit 1
fi

if [ "$(node -e "console.log(JSON.parse(require('fs').readFileSync('$MANIFEST','utf8')).markdownFiles.length)")" = "0" ]; then
  echo "FAIL - manifest: no markdown files found for issue '$ISSUE_SLUG' (src/$ISSUE_SLUG/*.md)"
  exit 1
fi

declare -a FAILED_CHECKS=()

run_check() {
  local name="$1"
  shift
  echo ""
  echo "== ${name} =="
  "$@"
  if [ $? -ne 0 ]; then
    FAILED_CHECKS+=("$name")
  fi
}

run_check "front matter & i18n"  node "$SCRIPT_DIR/check-frontmatter.js" "$MANIFEST"
run_check "quotes"               node "$SCRIPT_DIR/check-quotes.js" "$MANIFEST"
run_check "images"               node "$SCRIPT_DIR/check-images.js" "$MANIFEST"
run_check "footnotes"            node "$SCRIPT_DIR/check-footnotes.js" "$MANIFEST"
run_check "pdfs"                 bash "$SCRIPT_DIR/check-pdfs.sh" "$MANIFEST"
run_check "html validity"        bash "$SCRIPT_DIR/check-html-validity.sh" "$MANIFEST"
run_check "links"                bash "$SCRIPT_DIR/check-issue-links.sh" "$MANIFEST"

echo ""
echo "================"
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo "PASS - $ISSUE_SLUG is clean (7/7 checks passed)"
  exit 0
else
  echo "FAIL - $ISSUE_SLUG has integrity problems in: $(IFS=', '; echo "${FAILED_CHECKS[*]}")"
  exit 1
fi
