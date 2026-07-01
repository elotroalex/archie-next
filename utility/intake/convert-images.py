#!/usr/bin/env python3
"""Convert img=/caption=/alt=/url= placeholder blocks into <figure> HTML.

Authors and copy-editors mark up figures in the incoming .docx as their own
paragraphs, in this exact order:

    img="my-image.jpg"

    caption="insert caption here"

    alt="insert alt text here."

    url="http://optional-url.com"

`url` is optional; the other three fields are required. Quotation marks
inside the caption or alt text must be escaped with a backslash (\") so the
parser can tell them apart from the field's own closing quote.

Each field must live in its own paragraph (i.e. a plain Enter/blank line
between fields in the Word doc, no manual line breaks inside a field). A
block that doesn't match this shape exactly--wrong order, a missing
required field, or a field split across multiple paragraphs--is left
untouched in the output so an editor can convert it by hand.

Usage: convert-images.py ISSUE_SLUG < body.md > body.md
"""
import re
import sys

# Pandoc escapes literal quotes in its markdown output as \", so a field
# paragraph looks like: img=\"my-image.jpg\". The regex is greedy on the
# value so it always pairs the first quote after `key=` with the LAST quote
# on the line--which means quotes the author escaped with a backslash
# (rendered by Pandoc as \\\", since Pandoc also escapes the author's own
# backslash) safely stay inside the captured value.
FIELD = re.compile(r'^(\w+)=\\"(.*)\\"$')


def parse_field(paragraph, key):
    m = FIELD.match(paragraph.strip())
    if not m or m.group(1) != key:
        return None
    return m.group(2)


def make_figure(issue_slug, img, caption, alt, url):
    img_path = f"/{issue_slug}/images/{img}"
    if url:
        return (
            "<figure>\n"
            f'<a href="{url}" target="_blank">\n'
            f'<img src="{img_path}" alt="{alt}" loading="lazy">\n'
            "</a>\n"
            f"<figcaption>{caption}</figcaption>\n"
            "</figure>"
        )
    return (
        "<figure>\n"
        f'<img src="{img_path}" alt="{alt}" loading="lazy">\n'
        f"<figcaption>{caption}</figcaption>\n"
        "</figure>"
    )


def convert(text, issue_slug):
    paragraphs = text.split("\n\n")
    out = []
    i = 0
    n = len(paragraphs)
    while i < n:
        img = parse_field(paragraphs[i], "img")
        if img is None:
            out.append(paragraphs[i])
            i += 1
            continue

        caption = parse_field(paragraphs[i + 1], "caption") if i + 1 < n else None
        alt = parse_field(paragraphs[i + 2], "alt") if i + 2 < n else None
        if caption is None or alt is None:
            # Doesn't match the expected shape--leave as-is for manual fixup.
            out.append(paragraphs[i])
            i += 1
            continue

        consumed = 3
        url = None
        if i + 3 < n:
            maybe_url = parse_field(paragraphs[i + 3], "url")
            if maybe_url is not None:
                url = maybe_url
                consumed = 4

        out.append(make_figure(issue_slug, img, caption, alt, url))
        i += consumed

    return "\n\n".join(out)


def main():
    if len(sys.argv) != 2:
        print("Usage: convert-images.py ISSUE_SLUG < body.md > body.md", file=sys.stderr)
        sys.exit(1)
    issue_slug = sys.argv[1]
    sys.stdout.write(convert(sys.stdin.read(), issue_slug))


if __name__ == "__main__":
    main()
