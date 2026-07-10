#!/usr/bin/env python3
"""Convert figure markup into <figure> HTML.

Two input shapes are recognized, both keyed off a caption=/alt=/url= rubric
that authors type as plain paragraphs (a blank line between each field, no
manual line break inside one):

1. Placeholder blocks -- used when the image isn't embedded in the .docx yet.
   Four fields, in this exact order:

       img="my-image.jpg"

       caption="insert caption here"

       alt="insert alt text here."

       url="http://optional-url.com"

   `img`, `caption`, and `alt` are required; `url` is optional. The `img`
   filename must match a file an editor separately drops into images/.

2. Embedded images -- the author inserts the real picture directly in the
   .docx (Insert > Picture); convert-docx.sh's `pandoc --extract-media`
   already pulls it out and renames it, so by the time this script runs it's
   a bare `![](...)` paragraph in the body. If that paragraph is immediately
   followed by caption=/alt=[/url=] fields (no img= line -- the picture is
   already there), it's paired with them the same way. This is the preferred
   shape going forward since it needs no separately-supplied file.

   Note this only matches an image that is the *entire* content of its own
   paragraph (typical figure placement). An image floated inline within a
   sentence is left untouched, same as any other unrecognized shape.

In both cases, quotation marks inside the caption or alt text must be
escaped with a backslash (\") so the parser can tell them apart from the
field's own closing quote. A block that doesn't match either shape exactly
--wrong order, a missing required field, or a field split across multiple
paragraphs--is left untouched in the output so an editor can convert it by
hand.

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

# A paragraph that is *only* a markdown image (nothing else on the line) --
# the shape convert-docx.sh's extracted/renamed embedded images take by the
# time this script runs (path already rewritten to /issueXX/images/...).
IMAGE_ONLY = re.compile(r'^!\[[^\]]*\]\(([^)]+)\)$')


def parse_field(paragraph, key):
    m = FIELD.match(paragraph.strip())
    if not m or m.group(1) != key:
        return None
    return m.group(2)


def parse_image_src(paragraph):
    m = IMAGE_ONLY.match(paragraph.strip())
    return m.group(1) if m else None


def make_figure(img_src, caption, alt, url):
    if url:
        return (
            "<figure>\n"
            f'<a href="{url}" target="_blank">\n'
            f'<img src="{img_src}" alt="{alt}" loading="lazy">\n'
            "</a>\n"
            f"<figcaption>{caption}</figcaption>\n"
            "</figure>"
        )
    return (
        "<figure>\n"
        f'<img src="{img_src}" alt="{alt}" loading="lazy">\n'
        f"<figcaption>{caption}</figcaption>\n"
        "</figure>"
    )


def parse_caption_alt_url(paragraphs, start):
    """Tries to read caption=/alt=[/url=] fields starting at `start`.
    Returns (caption, alt, url, consumed) or None if the shape doesn't match.
    """
    n = len(paragraphs)
    caption = parse_field(paragraphs[start], "caption") if start < n else None
    alt = parse_field(paragraphs[start + 1], "alt") if start + 1 < n else None
    if caption is None or alt is None:
        return None

    consumed = 2
    url = None
    if start + 2 < n:
        maybe_url = parse_field(paragraphs[start + 2], "url")
        if maybe_url is not None:
            url = maybe_url
            consumed = 3

    return caption, alt, url, consumed


def convert(text, issue_slug):
    paragraphs = text.split("\n\n")
    out = []
    i = 0
    n = len(paragraphs)
    while i < n:
        img = parse_field(paragraphs[i], "img")
        if img is not None:
            # Placeholder shape: img="..." then caption=/alt=[/url=].
            parsed = parse_caption_alt_url(paragraphs, i + 1)
            if parsed is None:
                out.append(paragraphs[i])
                i += 1
                continue
            caption, alt, url, consumed = parsed
            img_src = f"/{issue_slug}/images/{img}"
            out.append(make_figure(img_src, caption, alt, url))
            i += 1 + consumed
            continue

        img_src = parse_image_src(paragraphs[i])
        if img_src is not None:
            # Embedded-image shape: bare ![](...) then caption=/alt=[/url=],
            # no img= line since the picture is already extracted in place.
            parsed = parse_caption_alt_url(paragraphs, i + 1)
            if parsed is None:
                out.append(paragraphs[i])
                i += 1
                continue
            caption, alt, url, consumed = parsed
            out.append(make_figure(img_src, caption, alt, url))
            i += 1 + consumed
            continue

        out.append(paragraphs[i])
        i += 1

    return "\n\n".join(out)


def main():
    if len(sys.argv) != 2:
        print("Usage: convert-images.py ISSUE_SLUG < body.md > body.md", file=sys.stderr)
        sys.exit(1)
    issue_slug = sys.argv[1]
    sys.stdout.write(convert(sys.stdin.read(), issue_slug))


if __name__ == "__main__":
    main()
