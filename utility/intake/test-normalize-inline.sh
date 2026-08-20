#!/bin/bash
# Fixture tests for normalize-inline.pl, the inline text normalization applied
# during .docx intake. Follows the same pattern as test-convert-images.sh.
#
# Every case runs under BOTH a UTF-8 locale and the C locale, because the bug
# this guards against was invisible under the first and silent under the
# second: BSD sed matched bytes rather than characters, so a class like ["]
# also destroyed em dashes, en dashes, ellipses, and narrow no-break spaces,
# which share their leading bytes (E2 80 xx).
#
# Usage: bash utility/intake/test-normalize-inline.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NORMALIZE="$SCRIPT_DIR/normalize-inline.pl"
FAIL=0

# run_case NAME INPUT EXPECTED
# Feeds INPUT through normalize-inline.pl under each locale and compares.
run_case() {
  local name="$1" input="$2" expected="$3"
  for loc in en_US.UTF-8 C; do
    local actual
    actual=$(printf '%s\n' "$input" \
      | LC_ALL="$loc" LANG="$loc" ISSUE_SLUG=issuefx perl -CSD -p "$NORMALIZE")
    if [ "$actual" = "$expected" ]; then
      echo "  ok - $name [locale=$loc]"
    else
      echo "  FAIL - $name [locale=$loc]"
      echo "      expected: $expected"
      echo "      actual:   $actual"
      FAIL=1
    fi
  done
}

echo "== normalize-inline.pl =="

# The regression this file exists for: characters that share leading bytes with
# the curly quotes must survive untouched.
run_case "em dash survives" \
  'a — b' 'a — b'
run_case "en dash survives" \
  'a – b' 'a – b'
run_case "ellipsis survives" \
  'a … b' 'a … b'
run_case "narrow no-break space survives" \
  'a b' 'a b'

# Curly quotes become the escaped straight form Pandoc uses elsewhere.
run_case "curly double quotes are escaped" \
  'say “hello” now' 'say \"hello\" now'
run_case "curly single quotes are escaped" \
  'it ‘works’ fine' 'it \'"'"'works\'"'"' fine'

# Mixed: quotes converted, neighbours intact.
run_case "curly quotes converted without harming an em dash" \
  '“quoted” — dashed' '\"quoted\" — dashed'

# Word artifacts.
run_case "mark span is stripped" \
  '[highlighted]{.mark} text' 'highlighted text'
run_case "underline span is stripped" \
  '[underlined]{.underline} text' 'underlined text'
run_case "rtl-tagged double quote" \
  'x ["]{dir="rtl"} y' 'x " y'

# Image paths become absolute, using ISSUE_SLUG.
run_case "image path is made absolute" \
  '![alt](images/foo.jpg)' '![alt](/issuefx/images/foo.jpg)'

# Valid UTF-8 must come out valid UTF-8, in either locale.
echo "== output stays valid UTF-8 =="
for loc in en_US.UTF-8 C; do
  out=$(printf 'em — en – ellipsis … nnbsp   curly “q” and ‘r’\n' \
    | LC_ALL="$loc" LANG="$loc" ISSUE_SLUG=issuefx perl -CSD -p "$NORMALIZE")
  if printf '%s' "$out" | python3 -c "import sys; sys.stdin.buffer.read().decode('utf-8')" 2>/dev/null; then
    echo "  ok - output is valid UTF-8 [locale=$loc]"
  else
    echo "  FAIL - output is not valid UTF-8 [locale=$loc]"
    FAIL=1
  fi
done

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "All normalize-inline tests passed."
else
  echo "Some normalize-inline tests FAILED."
  exit 1
fi
