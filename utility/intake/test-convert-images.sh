#!/bin/bash
# Fixture tests for convert-images.py.
# Usage: bash utility/intake/test-convert-images.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONVERTER="$SCRIPT_DIR/convert-images.py"
FAIL=0

check() {
  local name="$1" input="$2" expected="$3"
  local actual
  actual="$(printf '%s' "$input" | python3 "$CONVERTER" issue09)"
  if [ "$actual" = "$expected" ]; then
    echo "  ok - $name"
  else
    echo "  FAIL - $name"
    echo "    expected:"
    printf '%s\n' "$expected" | sed 's/^/      /'
    echo "    actual:"
    printf '%s\n' "$actual" | sed 's/^/      /'
    FAIL=1
  fi
}

# 1. Valid block, no url.
check "valid block without url" \
'img=\"photo.jpg\"

caption=\"A caption here\"

alt=\"Some alt text\"' \
'<figure>
<img src="/issue09/images/photo.jpg" alt="Some alt text" loading="lazy">
<figcaption>A caption here</figcaption>
</figure>'

# 2. Valid block, with url.
check "valid block with url" \
'img=\"photo2.jpg\"

caption=\"Another caption\"

alt=\"Alt2\"

url=\"https://example.com\"' \
'<figure>
<a href="https://example.com" target="_blank">
<img src="/issue09/images/photo2.jpg" alt="Alt2" loading="lazy">
</a>
<figcaption>Another caption</figcaption>
</figure>'

# 3. Malformed: missing alt entirely -- left untouched.
check "missing alt field is left as-is" \
'img=\"photo3.jpg\"

caption=\"Only caption, no alt\"

Some regular paragraph text here.' \
'img=\"photo3.jpg\"

caption=\"Only caption, no alt\"

Some regular paragraph text here.'

# 4. Malformed: fields out of order -- left untouched.
check "fields out of order are left as-is" \
'caption=\"A caption with no preceding img\"

alt=\"Some alt\"

img=\"photo4.jpg\"' \
'caption=\"A caption with no preceding img\"

alt=\"Some alt\"

img=\"photo4.jpg\"'

# 5. Caption with an escaped quote embedded mid-text is preserved verbatim.
check "escaped quotes inside caption are preserved" \
'img=\"photo5.jpg\"

caption=\"She said \"hi\" to the camera\"

alt=\"Alt5\"' \
'<figure>
<img src="/issue09/images/photo5.jpg" alt="Alt5" loading="lazy">
<figcaption>She said \"hi\" to the camera</figcaption>
</figure>'

# 6. Malformed: caption split across a Word paragraph break -- left untouched.
check "multi-paragraph caption is left as-is" \
'img=\"photo6.jpg\"

caption=\"First part of the caption.

Second part of the caption.\"

alt=\"Alt6\"' \
'img=\"photo6.jpg\"

caption=\"First part of the caption.

Second part of the caption.\"

alt=\"Alt6\"'

if [ "$FAIL" -eq 0 ]; then
  echo "All convert-images.py tests passed."
else
  echo "Some convert-images.py tests FAILED."
  exit 1
fi
