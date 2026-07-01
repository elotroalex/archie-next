#!/bin/bash
# Fixture tests for the check-issue utility's individual check scripts.
# Runs each script directly against a small synthetic fixture issue (see
# fixtures/fixture-root/) rather than a real built site, following the same
# pattern as utility/intake/test-convert-images.sh.
#
# Usage: bash utility/check-issue/test-check-issue.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE_ROOT="$SCRIPT_DIR/fixtures/fixture-root"
FAIL=0

# check_exit NAME EXPECTED_EXIT_CODE COMMAND...
# Runs COMMAND, asserts its exit code matches EXPECTED_EXIT_CODE.
check_exit() {
  local name="$1" expected="$2"
  shift 2
  local output
  output=$("$@" 2>&1)
  local actual=$?
  if [ "$actual" -eq "$expected" ]; then
    echo "  ok - $name (exit $actual)"
  else
    echo "  FAIL - $name (expected exit $expected, got $actual)"
    echo "$output" | sed 's/^/      /'
    FAIL=1
  fi
}

# check_contains NAME COMMAND_OUTPUT EXPECTED_SUBSTRING
# Asserts that CAPTURED_OUTPUT contains EXPECTED_SUBSTRING.
check_contains() {
  local name="$1" output="$2" expected="$3"
  if echo "$output" | grep -qF "$expected"; then
    echo "  ok - $name"
  else
    echo "  FAIL - $name (expected to find: $expected)"
    echo "$output" | sed 's/^/      /'
    FAIL=1
  fi
}

echo "== collect-issue.js =="
MANIFEST="$(mktemp)"
COLLECT_OUTPUT=$(node "$SCRIPT_DIR/collect-issue.js" issuefx --root "$FIXTURE_ROOT" | tee "$MANIFEST")
check_contains "finds both fixture articles" "$COLLECT_OUTPUT" "broken-article"
check_contains "finds both fixture articles" "$COLLECT_OUTPUT" "clean-article"
check_contains "derives fileSlug correctly" "$COLLECT_OUTPUT" '"fileSlug": "clean-article"'

echo ""
echo "== check-frontmatter.js =="
FM_OUTPUT=$(node "$SCRIPT_DIR/check-frontmatter.js" "$MANIFEST" --root "$FIXTURE_ROOT" 2>&1)
FM_EXIT=$?
check_contains "clean article passes" "$FM_OUTPUT" "ok - frontmatter: clean-article"
check_contains "broken article fails (TODO prefix survived)" "$FM_OUTPUT" "FAIL - frontmatter: broken-article"
check_contains "broken article: section placeholder detected" "$FM_OUTPUT" "section still has placeholder text"
check_contains "broken article: doi placeholder detected (no TODO prefix)" "$FM_OUTPUT" 'doi still has placeholder text ("10.7916/...")'
check_contains "i18n label: fr missing is detected" "$FM_OUTPUT" "FAIL - i18n label: issuefx missing in fr.yml"
if [ "$FM_EXIT" -ne 0 ]; then echo "  ok - overall exit is nonzero"; else echo "  FAIL - overall exit should be nonzero"; FAIL=1; fi

echo ""
echo "== check-quotes.js =="
QUOTES_OUTPUT=$(node "$SCRIPT_DIR/check-quotes.js" "$MANIFEST" --root "$FIXTURE_ROOT" 2>&1)
check_contains "clean article has no curly quotes" "$QUOTES_OUTPUT" "ok - quotes: clean-article.md"
check_contains "broken article's curly double quote is detected" "$QUOTES_OUTPUT" "FAIL - quotes: broken-article.md has 1 line(s) with curly quotation marks"
check_contains "broken article's curly quote line is reported" "$QUOTES_OUTPUT" "curly quote"

echo ""
echo "== check-images.js =="
IMG_OUTPUT=$(node "$SCRIPT_DIR/check-images.js" "$MANIFEST" --root "$FIXTURE_ROOT" 2>&1)
check_contains "wide image with alt passes" "$IMG_OUTPUT" "ok - image: /issuefx/images/wide.png"
check_contains "no-alt image is missing alt attribute" "$IMG_OUTPUT" "/issuefx/images/no-alt.png — missing alt text"
check_contains "empty-alt image is missing alt text" "$IMG_OUTPUT" "/issuefx/images/empty-alt.png — missing alt text"
check_contains "narrow image fails width check" "$IMG_OUTPUT" "100px < 800px minimum"
check_contains "image with no alt attribute fails" "$IMG_OUTPUT" "missing alt text"
check_contains "missing file is detected" "$IMG_OUTPUT" "does not exist on disk"

echo ""
echo "== check-footnotes.js =="
FN_OUTPUT=$(node "$SCRIPT_DIR/check-footnotes.js" "$MANIFEST" --root "$FIXTURE_ROOT" 2>&1)
check_contains "clean article footnotes pass" "$FN_OUTPUT" "ok - footnotes: clean-article"
check_contains "orphaned reference is detected" "$FN_OUTPUT" "reference(s) with no definition: #2"
check_contains "orphaned definition is detected" "$FN_OUTPUT" "definition(s) with no reference: #3"

echo ""
echo "== check-pdfs.sh =="
PDF_OUTPUT=$(bash "$SCRIPT_DIR/check-pdfs.sh" "$MANIFEST" --root "$FIXTURE_ROOT" 2>&1)
check_contains "clean article (pdf: false) is skipped" "$PDF_OUTPUT" "skip - pdf: clean-article (pdf: false)"
check_contains "broken article missing pdf fails" "$PDF_OUTPUT" "FAIL - pdf: src/assets/issuefx/broken-article.pdf missing"

rm -f "$MANIFEST"

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "All check-issue fixture tests passed."
else
  echo "Some check-issue fixture tests FAILED."
  exit 1
fi
