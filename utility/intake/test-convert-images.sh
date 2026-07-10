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

# 7. Embedded image (already extracted/renamed by convert-docx.sh) followed
# by caption=/alt=, no img= line needed since the picture is already there.
check "embedded image paired with caption/alt, no url" \
'![](/issue09/images/some-article-image1.png)

caption=\"A view of the harbor\"

alt=\"Fishing boats docked at sunset\"' \
'<figure>
<img src="/issue09/images/some-article-image1.png" alt="Fishing boats docked at sunset" loading="lazy">
<figcaption>A view of the harbor</figcaption>
</figure>'

# 8. Embedded image, caption/alt/url all present.
check "embedded image paired with caption/alt/url" \
'![](/issue09/images/some-article-image2.png)

caption=\"An interactive map\"

alt=\"Screenshot of the interactive map interface\"

url=\"https://example.com/map\"' \
'<figure>
<a href="https://example.com/map" target="_blank">
<img src="/issue09/images/some-article-image2.png" alt="Screenshot of the interactive map interface" loading="lazy">
</a>
<figcaption>An interactive map</figcaption>
</figure>'

# 9. Embedded image with no caption/alt rubric following it at all -- left
# untouched (an editor has to caption it by hand).
check "embedded image with no following rubric is left as-is" \
'![](/issue09/images/some-article-image3.png)

Some regular paragraph text here, unrelated to the image.' \
'![](/issue09/images/some-article-image3.png)

Some regular paragraph text here, unrelated to the image.'

# 10. Embedded image immediately followed by only alt= (no caption) -- left
# untouched, same as the placeholder-shape missing-field case.
check "embedded image with only alt (missing caption) is left as-is" \
'![](/issue09/images/some-article-image4.png)

alt=\"Alt only, no caption\"' \
'![](/issue09/images/some-article-image4.png)

alt=\"Alt only, no caption\"'

# 11. An inline image that is part of a larger paragraph (not alone on its
# own paragraph) is never treated as a figure candidate.
check "inline image within a sentence is left as-is" \
'See the diagram below: ![](/issue09/images/inline.png) for details.

caption=\"Should not be consumed\"

alt=\"Should not be consumed\"' \
'See the diagram below: ![](/issue09/images/inline.png) for details.

caption=\"Should not be consumed\"

alt=\"Should not be consumed\"'

if [ "$FAIL" -eq 0 ]; then
  echo "All convert-images.py tests passed."
else
  echo "Some convert-images.py tests FAILED."
  exit 1
fi
