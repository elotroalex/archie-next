#!/usr/bin/env python3
"""Convert Jekyll Liquid includes to native HTML.

Handles:
  {% include image.html img="..." title="..." caption="..." %}
    → <figure><img ...><figcaption>...</figcaption></figure>

  {% include interactive.html type="youtube" url="..." img="..." title="..." caption="..." %}
    → <figure><a href="url"><img ...></a><figcaption>...</figcaption></figure>

  {% include audio.html url="..." title="..." %}
    → <figure><audio controls><source src="..." type="audio/mpeg"></audio><figcaption>...</figcaption></figure>

  {% include epigraph.html quote="..." citation="..." %}
    → <div class="epigraph"><blockquote>quote</blockquote><p class="citation">citation</p></div>
"""

import re
import sys
import pathlib


def parse_attrs(raw):
    """Parse key="value" or key='value' pairs, tolerating newlines and inner quotes."""
    attrs = {}
    # Double-quoted values (may contain single quotes)
    for m in re.finditer(r'(\w+)\s*=\s*"([^"]*)"', raw, re.DOTALL):
        attrs[m.group(1)] = ' '.join(m.group(2).split())
    # Single-quoted values (may contain double quotes) — only if key not already found
    for m in re.finditer(r"(\w+)\s*=\s*'([^']*)'", raw, re.DOTALL):
        if m.group(1) not in attrs:
            attrs[m.group(1)] = ' '.join(m.group(2).split())
    return attrs


def img_path(raw):
    """Ensure image path is root-relative."""
    if not raw:
        return ""
    if raw.startswith("/"):
        return raw
    return "/images/" + raw


def convert_image(attrs):
    src     = img_path(attrs.get("img", ""))
    alt     = attrs.get("title", "")
    caption = attrs.get("caption", "")
    lines = ["<figure>"]
    lines.append(f'<img src="{src}" alt="{alt}" loading="lazy">')
    if caption:
        lines.append(f"<figcaption>{caption}</figcaption>")
    lines.append("</figure>")
    return "\n".join(lines)


def convert_interactive(attrs):
    src     = img_path(attrs.get("img", ""))
    alt     = attrs.get("title", "")
    caption = attrs.get("caption", "")
    url     = attrs.get("url", "")
    lines = ["<figure>"]
    if url:
        lines.append(f'<a href="{url}" target="_blank">')
    lines.append(f'<img src="{src}" alt="{alt}" loading="lazy">')
    if url:
        lines.append("</a>")
    if caption:
        lines.append(f"<figcaption>{caption}</figcaption>")
    lines.append("</figure>")
    return "\n".join(lines)


def convert_audio(attrs):
    url   = attrs.get("url", "")
    title = attrs.get("title", "")
    # Guess MIME type from extension
    if url.lower().endswith(".ogg"):
        mime = "audio/ogg"
    elif url.lower().endswith(".wav"):
        mime = "audio/wav"
    else:
        mime = "audio/mpeg"
    lines = ["<figure>"]
    lines.append(f'<audio controls>')
    lines.append(f'  <source src="{url}" type="{mime}">')
    lines.append(f'</audio>')
    if title:
        lines.append(f"<figcaption>{title}</figcaption>")
    lines.append("</figure>")
    return "\n".join(lines)


def convert_epigraph(attrs):
    quote    = attrs.get("quote", "")
    citation = attrs.get("citation", "")
    lines = ['<div class="epigraph">']
    lines.append(f"<blockquote>{quote}</blockquote>")
    if citation:
        lines.append(f'<p class="citation">{citation}</p>')
    lines.append("</div>")
    return "\n".join(lines)


PATTERN = re.compile(
    r'\{%[-\s]*include\s+(\w+)\.html(.*?)[-\s]*%\}',
    re.DOTALL | re.IGNORECASE
)


def replacer(m):
    include_name = m.group(1).lower()
    attrs = parse_attrs(m.group(2))

    if include_name == "image":
        return convert_image(attrs)
    elif include_name == "interactive":
        return convert_interactive(attrs)
    elif include_name == "audio":
        return convert_audio(attrs)
    elif include_name == "epigraph":
        return convert_epigraph(attrs)
    else:
        return f"<!-- TODO: unconverted include {include_name} -->"


def convert(text):
    return PATTERN.sub(replacer, text)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        path = pathlib.Path(p)
        original = path.read_text(encoding="utf-8")
        converted = convert(original)
        if converted != original:
            path.write_text(converted, encoding="utf-8")
            print(f"  converted: {path}")
        else:
            print(f"  (no changes): {path}")
