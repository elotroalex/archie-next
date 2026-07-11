#!/bin/bash
# Runs every issue-integrity check against a single issue: HTML validity,
# link integrity (internal + external, scoped to the issue), same-page
# anchor links (href="#id" resolving to a real id on that page -- separate
# from "links" because linkinator's own fragment-checking turned out to be
# unreliable for anything past the first hop or two of a crawl, see
# check-anchors.js), front-matter/i18n completeness, image existence + alt
# text + minimum width, PDF existence, footnote anchor pairing, non-standard
# (curly/smart) quotation marks, and an axe-core accessibility scan (heading
# order, labels, ARIA, landmarks). Intended to be run by an editor after
# finishing a new issue, before flipping the live domain over.
#
# Every run also writes log.md at the repo root (gitignored, overwritten
# each run) with one section per check -- Images and Links get extra
# structure (file/image/problem rows; internal/external file:line rows)
# since those are the two categories expected to need manual triage.
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
LOG_DIR="$(mktemp -d)"
trap 'rm -f "$MANIFEST"; rm -rf "$LOG_DIR"' EXIT
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
declare -a LOG_TEXT_ARGS=()
IMAGES_JSON="$LOG_DIR/images.json"
LINKS_JSON="$LOG_DIR/links.json"

# Runs a check, teeing its output to both the terminal (unbuffered, as
# before) and a per-check log file consumed by generate-log.js afterward.
run_check() {
  local name="$1"
  local logfile="$LOG_DIR/$(echo "$name" | tr -cs 'a-zA-Z0-9' '-').log"
  shift
  echo ""
  echo "== ${name} =="
  "$@" 2>&1 | tee "$logfile"
  local status=${PIPESTATUS[0]}
  if [ "$status" -ne 0 ]; then
    FAILED_CHECKS+=("$name")
  fi
  LOG_TEXT_ARGS+=(--text "${name}=${logfile}")
}

run_check "front matter & i18n"  node "$SCRIPT_DIR/check-frontmatter.js" "$MANIFEST"
run_check "quotes"               node "$SCRIPT_DIR/check-quotes.js" "$MANIFEST"
run_check "images"               node "$SCRIPT_DIR/check-images.js" "$MANIFEST" --json "$IMAGES_JSON"
run_check "footnotes"            node "$SCRIPT_DIR/check-footnotes.js" "$MANIFEST"
run_check "accessibility"        node "$SCRIPT_DIR/check-a11y.js" "$MANIFEST"
run_check "pdfs"                 bash "$SCRIPT_DIR/check-pdfs.sh" "$MANIFEST"
run_check "html validity"        bash "$SCRIPT_DIR/check-html-validity.sh" "$MANIFEST"
run_check "links"                node "$SCRIPT_DIR/check-issue-links.js" "$MANIFEST" --json "$LINKS_JSON"
run_check "anchors"              node "$ROOT/utility/check-anchors.js" "$MANIFEST" --root "$ROOT"

node "$SCRIPT_DIR/generate-log.js" "$ISSUE_SLUG" "$ROOT/log.md" \
  "${LOG_TEXT_ARGS[@]}" \
  --images-json "$IMAGES_JSON" \
  --links-json "$LINKS_JSON"

echo ""
echo "================"
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
  echo "PASS - $ISSUE_SLUG is clean (9/9 checks passed)"
  exit 0
else
  echo "FAIL - $ISSUE_SLUG has integrity problems in: $(IFS=', '; echo "${FAILED_CHECKS[*]}")"
  exit 1
fi
