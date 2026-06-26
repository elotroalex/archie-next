#!/bin/bash
# Generate PDF for a single article
# Usage: ./makeSinglePaper.sh src/issue01/haynes-mapping.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 src/issueXX/article.md"
  exit 1
fi

bash "$SCRIPT_DIR/convert.sh" "$1" "$ROOT"
