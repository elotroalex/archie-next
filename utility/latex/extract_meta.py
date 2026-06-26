#!/usr/bin/env python3
"""Extract front matter from a markdown file and emit Pandoc-compatible YAML metadata.

Provides the variables that the LaTeX template uses:
  title, author, abstract, doi, issue, date (pubDate), shortauthor
"""

import sys
import re
import yaml

def extract_front_matter(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()

    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}

    return yaml.safe_load(match.group(1)) or {}

def build_meta(fm):
    meta = {}

    # Title: handle nested {long: ..., short: ...} or plain string
    title = fm.get("title", "")
    if isinstance(title, dict):
        meta["title"] = title.get("long", title.get("short", ""))
    else:
        meta["title"] = str(title)

    # Authors
    authors = fm.get("author", [])
    if isinstance(authors, list):
        meta["author"] = [
            {"name": a.get("name", a) if isinstance(a, dict) else a}
            for a in authors
        ]
        # shortauthor: last names joined
        shorts = [a.get("shortname", a.get("name", "").split()[-1])
                  if isinstance(a, dict) else str(a).split()[-1]
                  for a in authors]
        meta["shortauthor"] = " and ".join(shorts) if len(shorts) <= 2 else shorts[0] + " et al."
    else:
        meta["author"] = str(authors)

    # Scalar fields
    for key in ("abstract", "doi", "issue", "language"):
        if key in fm:
            meta[key] = fm[key]

    # Date: prefer pubDate (renamed from date), fall back to date
    meta["date"] = fm.get("pubDate", fm.get("date", ""))

    return meta

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: extract_meta.py article.md")
    fm = extract_front_matter(sys.argv[1])
    print(yaml.dump(build_meta(fm), allow_unicode=True))
