#!/bin/bash
# Run linkinator and write two reports to the repo root:
#   broken-links.txt  — external URLs returning 404/410/5xx (genuinely broken)
#   missing-local.txt — URLs returning 0 (no response; usually local file paths)

cd "$(dirname "$0")/../_site" || exit 1

OUTPUT=$(npx linkinator . --config ../linkinator.config.json 2>&1)

echo "$OUTPUT" | grep -E '^\[[1-9][0-9]{2}\]' | grep 'http' > ../broken-links.txt
echo "$OUTPUT" | grep -E '^\[0\]' > ../missing-local.txt

echo "broken-links.txt:  $(wc -l < ../broken-links.txt) entries"
echo "missing-local.txt: $(wc -l < ../missing-local.txt) entries"
