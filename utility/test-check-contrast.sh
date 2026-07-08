#!/bin/bash
# Fixture-free unit test for check-contrast.js: verifies it passes against
# the real (fixed) main.css color pairs, and fails against a deliberately
# bad synthetic pair fed in via --pairs.
#
# Usage: bash utility/test-check-contrast.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAIL=0

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

echo "== check-contrast.js =="
check_exit "current main.css color pairs all pass" 0 node "$SCRIPT_DIR/check-contrast.js"

BAD_OUTPUT=$(node "$SCRIPT_DIR/check-contrast.js" --pairs '[{"selector":"test","fg":"#939598","bg":"#ffffff","minRatio":4.5,"file":"test"}]' 2>&1)
BAD_EXIT=$?
check_contains "known-bad pair is detected" "$BAD_OUTPUT" "FAIL - contrast: test"
if [ "$BAD_EXIT" -ne 0 ]; then echo "  ok - bad pair exits nonzero"; else echo "  FAIL - bad pair should exit nonzero"; FAIL=1; fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "All check-contrast fixture tests passed."
else
  echo "Some check-contrast fixture tests FAILED."
  exit 1
fi
