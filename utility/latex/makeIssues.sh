#!/bin/bash
# Generate PDFs for all issues (or a single named issue)
# Usage:
#   ./makeIssues.sh              — process all issue directories
#   ./makeIssues.sh issue01      — process a single issue
#   ./makeIssues.sh issue01 issue03  — process selected issues

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONVERT="$SCRIPT_DIR/convert.sh"

if [ $# -gt 0 ]; then
  ISSUES=("$@")
else
  # Auto-discover issue directories
  ISSUES=()
  for dir in "$ROOT/src"/issue*/; do
    [ -d "$dir" ] && ISSUES+=("$(basename "$dir")")
  done
fi

echo "Processing issues: ${ISSUES[*]}"

for ISSUE in "${ISSUES[@]}"; do
  ISSUE_DIR="$ROOT/src/$ISSUE"
  if [ ! -d "$ISSUE_DIR" ]; then
    echo "⚠  Directory not found: $ISSUE_DIR — skipping"
    continue
  fi

  echo ""
  echo "══════════════════════════════"
  echo "  Issue: $ISSUE"
  echo "══════════════════════════════"

  for mdfile in "$ISSUE_DIR"/*.md; do
    [ -f "$mdfile" ] || continue
    bash "$CONVERT" "$mdfile" "$ROOT" || echo "  ⚠ Error processing $mdfile"
  done
done

echo ""
echo "Done."
