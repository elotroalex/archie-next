# archipelagos | a journal of Caribbean digital praxis

_archipelagos_ is a born-digital, peer-reviewed publication devoted to creative exploration, debate, and critical thinking about and through digital practices in contemporary scholarly and artistic work in and on the Caribbean. Given the wide implications of the "digital turn" for our very conceptions of knowledge, our mission is to discern the ways in which the digital may enhance and transform our comprehension of the regional and diasporic Caribbean. _archipelagos_ responds to this challenge with three distinct dimensions of critical production: scholarly essays; digital scholarship projects; and digital project reviews.

The journal is trilingual (English, Spanish, French), published by Columbia University Libraries, and committed to access in low-bandwidth environments. ISSN: 2689-842X.

Live site: [archipelagosjournal.org](http://archipelagosjournal.org)

---

## Quick guide: create a new issue

1. **Scaffold the folder structure**

   ```bash
   bash utility/intake/new-issue.sh issue09
   ```

2. **Register the issue** in `src/_data/issues.js` (see [Adding a new issue](#adding-a-new-issue) for the full entry format). The homepage's featured issue, its table of contents, and the issues list on every issue page (`src/_includes/issues-list.njk`) all update automatically — no other config change needed. The previous issue simply stops being highlighted as current and stays in the list like every other past issue.

3. **Add labels** in `src/_i18n/en.yml`, `es.yml`, and `fr.yml` under the `issues:` key:

   ```yaml
   issue09: "Issue (9) | Theme | Month YYYY"
   ```

4. **Convert Word files to Markdown** — drop `.docx` files in `src/issue09/incoming/`, then for each one:

   ```bash
   bash utility/intake/convert-docx.sh src/issue09/incoming/author-title.docx
   ```

5. **Fill in front matter** — edit each generated `.md` file and replace every `# TODO` placeholder with real values. The `section` field must be one of: `introduction`, `articles`, `projects`, `reviews`.

6. **Generate PDFs**

   ```bash
   bash utility/latex/makeIssues.sh issue09
   bash utility/latex/makeSinglePaper.sh src/issue09/kulstad-1a0906.md
   ```

7. **Build and verify**

   ```bash
   npm run serve
   ```

   Open `http://localhost:8080` and check the homepage TOC.

8. **Run the issue integrity check**

   ```bash
   npm run check-issue -- issue09
   ```

   Verifies HTML validity, internal/external links, same-page anchor links, front-matter and i18n completeness, curly/smart quotation marks, image existence/alt text/minimum width, PDF existence, footnote anchor pairing, and an accessibility scan — see [Issue integrity check](#issue-integrity-check) and [Accessibility](#accessibility).

9. **Commit and push** — GitHub Actions builds and deploys automatically.

---

## Installation

**Requirements:** Node.js 18+, npm.

```bash
git clone https://github.com/elotroalex/archie-next.git
cd archie-next
npm install
npm run serve      # local dev server at http://localhost:8080
npm run build      # production build to _site/
```

**PDF generation** additionally requires Pandoc ≥ 3.0 and a TeX Live installation with lualatex. See [utility/latex/](utility/latex/) for the pipeline scripts.

---

## Adding a new issue

### 1. Register the issue in `src/_data/issues.js`

Add an entry for the new issue. Follow the existing pattern:

```js
issue09: {
  slug: "issue09",
  slug_fr: "fr/issue09",
  slug_es: "es/issue09",
  number: 9,
  date: "April 2025",
  title: "Issue (9)",
  editors: ["Editor Name"],
  production: ["Production Team Member"],
  // Optional: list pure-HTML interactives that fall outside the normal article pipeline
  // interactives: [
  //   { title: "Piece Title", author: ["Author Name"], url: "/issue09/piece/piece.html", pdf: false },
  // ],
},
```

The last key in `issues.js` is automatically treated as the current issue — the homepage updates without any further configuration change.

### 2. Add a label in each language file

In `src/_i18n/en.yml`, `es.yml`, and `fr.yml`, add a line under the `issues:` key:

```yaml
issues:
  issue09: "Issue (9) | Theme | April 2025"
```

### 3. Scaffold the article directory

```bash
bash utility/intake/new-issue.sh issue09
```

This creates `src/issue09/`, `src/issue09/incoming/`, `src/issue09/images/`, and the Eleventy directory data file. See [Issue intake utility](#issue-intake-utility) for the full conversion workflow.

### 4. Add article files

#### Converting from Word

Place each article as a Markdown file in the `incoming` folder inside the relevant issue folder, ex. `src/issue09/incoming/`. Use `utility/intake/convert-docx.sh` to generate them from Word files (recommended). Example of the full command:

```bash
$ utility/intake/convert-docx.sh src/issue09/incoming/editors-intro.docx
```

#### Adding manually

You can also create them manually. Every article needs this front matter:

```yaml
---
layout: article # article | project | page
section: articles # introduction | articles | projects | reviews
title:
  long: "Full Article Title"
  short: "Short Title" # used in running headers of PDF
doi: "10.7916/..."
author:
  - name: Author Name
    shortname: Last # used in PDF running header
    bio: >
      Author bio in markdown.
pubDate: April 2025 # human-readable; do NOT use the key "date"
issue: 9
order: 1 # controls position within section in TOC
abstract: >
  Article abstract.
language: en
# pdf: false             # add this line to suppress the PDF link
---
Article body in Markdown.
```

For **project** entries, also include:

```yaml
layout: project
link: "https://project-url.example"
thumb: /issue09/images/project-thumb.jpg
```

### 5. Add images

For new issues, images live inside the issue folder at `src/issue09/images/` and are served from `/issue09/images/`. When using `convert-docx.sh`, images are extracted there automatically.

Reference images in article markdown using a root-relative path:

```html
<figure>
  <img src="/issue09/images/filename.jpg" alt="Short description" loading="lazy" />
  <figcaption>Figure 1. Full caption text.</figcaption>
</figure>
```

To wrap the image in a link:

```html
<figure>
  <a href="https://external-site.com" target="_blank">
    <img src="/issue09/images/filename.jpg" alt="Short description" loading="lazy" />
  </a>
  <figcaption>Figure 1. Caption with link to the source.</figcaption>
</figure>
```

**Rules:**

- Always use a root-relative path starting with `/issue09/images/` — relative paths break on language-variant pages (`/es/`, `/fr/`).
- Always include `alt` (used as the PDF caption fallback) and `loading="lazy"`.
- Do not use the old Jekyll `{% include image.html %}` syntax — it is not processed by Eleventy.

### 6. Add pure-HTML interactives (optional)

If an issue includes a self-contained HTML piece (like the Parham essay in Issue 3):

1. Place the HTML and its assets in `src/issue09/piece-name/`.
2. In `.eleventy.js`, add passthrough copy and ignore rules:
   ```js
   eleventyConfig.addPassthroughCopy({ "src/issue09/piece-name": "issue09/piece-name" });
   eleventyConfig.ignores.add("src/issue09/piece-name/**");
   ```
3. Register it in the `interactives` array in `src/_data/issues.js` (see step 1 above). It will appear in the TOC under **Featured**.

### 7. Generate PDFs

```bash
bash utility/latex/makeIssues.sh issue09
```

Pre-existing PDFs in `src/assets/` are never overwritten unless you explicitly run the script for that issue.

---

## Issue intake utility

When editors receive copy-edited Word files from authors, two scripts in `utility/intake/` handle the conversion to Markdown.

### Scaffold a new issue

```bash
bash utility/intake/new-issue.sh issue09
```

Creates:

- `src/issue09/incoming/` — drop `.docx` files here
- `src/issue09/images/` — extracted images will land here
- `src/issue09/issue09.11tydata.js` — Eleventy directory data file

### Convert a Word file to Markdown

```bash
bash utility/intake/convert-docx.sh src/issue09/incoming/author-title.docx
```

This uses Pandoc 3 (already required by the PDF pipeline) to:

- Convert the `.docx` to `src/issue09/author-title.md`
- Extract embedded images directly to `src/issue09/images/` (no `media/` subdirectory), renamed `author-title-imageN.ext` so they're traceable back to the source article
- Rewrite image paths to absolute `/issue09/images/…` (required for language-variant pages)
- Normalize bare curly/smart quotes (`‘ ’ “ ”`) left over from Word — most often found in table cells — to the same escaped straight-quote style used throughout the rest of the document
- Inject a complete YAML front matter stub with `# TODO` placeholders for every required field
- Convert figure rubric blocks into `<figure>` HTML (see [Captioning images](#captioning-images) below)

Edit the output `.md` and fill in all `# TODO` fields before building. The `section` field must be exactly one of: `introduction`, `articles`, `projects`, `reviews` — the TOC will not display the article otherwise.

### Captioning images

Authors caption a figure by typing a `caption=`/`alt=`/`url=` rubric as its own paragraphs directly after the image (blank line between each, no manual line break inside one — see the [For Authors](https://archipelagosjournal.org/authors.html#images) guidelines for the author-facing version of this). Two shapes are recognized by `utility/intake/convert-images.py`:

1. **Embedded image** (preferred) — the author inserts the real picture in the `.docx` (Insert > Picture); Pandoc already extracts and renames it before this script runs, so only the rubric is needed, no `img=` line:

   ```
   caption="insert caption here"

   alt="insert alt text here."

   url="http://optional-url.com"
   ```

2. **Placeholder** — used when the image isn't embedded yet; an editor must separately drop a matching file into `src/issue09/images/`. Same rubric, with an `img=` filename line first:

   ```
   img="my-image.jpg"

   caption="insert caption here"

   alt="insert alt text here."

   url="http://optional-url.com"
   ```

`caption` and `alt` are required in both shapes; `url` is optional. A block that doesn't match either shape exactly (wrong order, a missing required field, an image inline within a sentence rather than alone on its own paragraph) is left untouched in the output for manual conversion. Run `bash utility/intake/test-convert-images.sh` to check the converter against its fixtures.

---

## Link checking

The project uses [linkinator](https://github.com/JustinBeckwith/linkinator) to scan the built site for broken links.

```bash
npm run build
npm run check-links
```

linkinator crawls `_site/` recursively and reports any URLs that return an error status. Results are printed to stdout — broken links appear as `[404]`, gone pages as `[410]`, server errors as `[5xx]`.

**Configuration** is in [`linkinator.config.json`](linkinator.config.json) at the repo root. Key settings:

- `skip` — patterns for URLs to skip entirely (DOIs, social media, known bot-blocked domains, the live `archipelagosjournal.org` domain)
- `statusCodes` — `429` and `403` are treated as warnings rather than errors (rate-limiting and bot blocks that don't mean the link is actually dead)
- `verbosity: "error"` — only broken links are printed; passing links are suppressed

To write a report of all broken external links to a file at the repo root (local use only — macOS/Linux):

```bash
npm run report-links
```

This writes two files to the repo root (both gitignored):

- `broken-links.txt` — external URLs returning 404/410/5xx (genuinely broken)
- `missing-local.txt` — URLs returning status `0` (no HTTP response; usually local image paths, not real errors)

**What to ignore:** `[0]` status on local image paths is a linkinator limitation (it cannot HEAD-check local files) — these are not real errors. Dead links in article body content (old blogs, defunct academic sites) are expected and not fixable from here.

**CI:** The link check runs automatically on every push via GitHub Actions (`.github/workflows/build.yml`) with `continue-on-error: true`, so it surfaces the report without blocking deployment.

### Same-page anchor links

linkinator doesn't cover `href="#id"` links (in-page anchors, e.g. the editor bio links on the Credits page, or footnote references). Those are checked separately:

```bash
npm run check-anchors
```

`utility/check-anchors.js` scans every built HTML file and checks each `href="#..."` against a real `id="..."`/`name="..."` on that same page (the bare `href="#"` "return to top" idiom is intentionally skipped, since it needs no target). This is a plain per-file HTML scan, not a crawl — linkinator does have a `checkFragments` option, but it turned out to only reliably validate fragments on pages reached within the first hop or two of a crawl (e.g. a page linked directly from the site root); it silently skips validation, with no warning, for anything reached deeper in the recursion — which is nearly all of this site's actual content. `check-anchors.js` avoids that blind spot entirely since it doesn't crawl at all.

**CI:** Runs automatically on every push, same non-blocking pattern as the link check (`continue-on-error: true`).

---

## Issue integrity check

Before cutting a finished issue over to production, run a full integrity gate scoped to just that issue:

```bash
npm run check-issue -- issue09   # defaults to the current issue (last key in issues.js) if omitted
```

This builds the site, then runs nine checks (`utility/check-issue/`) and exits non-zero if any of them fail:

| Check | What it verifies |
| --- | --- |
| **HTML validity** | Runs [html-validate](https://html-validate.org/) against the issue's built pages (en/es/fr). Config (`htmlvalidate.config.json`) disables rules that just reflect this codebase's deliberate conventions (self-closing void elements, inline table-width styles, legacy Dublin Core `profile`/`scheme` attributes) so only genuine structural errors surface — unclosed/misnested tags, duplicate ids, empty headings, etc. |
| **Links** | Runs linkinator with the issue's own built pages as crawl entry points (reuses the root `linkinator.config.json` unmodified). `--recurse` stays on, so links out into older issues, `/public/`, the homepage, and cross-language switcher links are still followed and validated — this is narrower and faster than `npm run check-links`, not just a re-run of it. Unlike `report-links.sh`, unresolved (`[0]`) links are treated as hard failures here. |
| **Anchors** | Runs `check-anchors.js` (see [Same-page anchor links](#same-page-anchor-links)) scoped to just the issue's own built pages, via the same manifest every other check here uses. Catches broken `href="#id"` links — e.g. a bio link or footnote reference pointing at an id that doesn't exist on the page. |
| **Front matter & i18n** | Every article's front matter is checked field-by-field against the intake stub's known placeholder text (not just a `# TODO:` grep — this also catches placeholders where the `# TODO:` prefix was stripped but the text itself was never replaced). Also confirms the issue has a label in `en.yml`, `es.yml`, and `fr.yml`. |
| **Quotation marks** | Flags curly/smart quotation marks (`‘ ’ “ ”`) left in an article's markdown source — a common Word autocorrect artifact contributors are asked to avoid (see [Submission Guidelines](src/_i18n/en/authors/authors.md)), which can render unreliably through the PDF/LaTeX pipeline. `convert-docx.sh` now normalizes these automatically at intake time, so this is mainly a safety net for hand-edited content or articles converted before that fix. |
| **Images** | Every `<img>` under `/issueXX/images/` (or the legacy `/images/issueXX/`) in the built English page must exist on disk, have non-empty `alt` text that isn't just the filename, meet a minimum width (`check-issue.config.json`, default 800px, matching the [author image guidelines](#adding-a-new-issue)), and not duplicate another image's alt text within the same article. |
| **PDFs** | Every article without `pdf: false` must have a matching file at `src/assets/issueXX/<slug>.pdf`. |
| **Footnotes** | Every footnote reference (`#fnrefN`) in the built HTML must have a matching definition (`#fnN`), and vice versa — catches renumbering mistakes. |
| **Accessibility** | Runs [axe-core](https://github.com/dequelabs/axe-core) against each built English page via jsdom (no headless browser) — see [Accessibility](#accessibility). |

Run the fixture-based unit tests for the check scripts themselves with:

```bash
bash utility/check-issue/test-check-issue.sh
```

This is a manual, standalone script — it is **not** wired into CI, so it won't block a build.

---

## Accessibility

### Conventions to follow when writing/converting content

- **Heading levels must not skip.** `article.njk`/`project.njk` already emit the page's only `<h1>` (the title). Article body markdown must start its own sections at `##` (h2), never `#` — the abstract heading and the "Authors' Bios" heading are also h2, as siblings of the body's own `##` sections.
- **Alt text must describe the image**, not name the file (`alt="schoolclass.jpg"`) or reuse another image's alt text. Every `<figure>` should have a real, descriptive `alt` distinct from any other image in the same article.

### Site-wide structure

`default.njk` provides a full landmark structure on every page: a skip-to-content link, `<aside>` (sidebar), `<header>` (masthead), `<main id="main-content">`, and `<footer>`. Footnote back-references get a localized `aria-label` ("Back to content" / "Volver al contenido" / "Retour au contenu") via an Eleventy transform (`.eleventy.js`, `footnote-backref-label`) rather than at the markdown-it level, since Eleventy doesn't thread the page's `lang` into markdown-it's render `env`.

### Automated checks

| Tool | What it checks | How to run |
| --- | --- | --- |
| **`check-a11y.js`** | Runs [axe-core](https://github.com/dequelabs/axe-core) against each built English page via [jsdom](https://github.com/jsdom/jsdom) (no headless browser dependency) — heading order, landmarks, labels, and ARIA under the `wcag2a`/`wcag2aa`/`best-practice` rule sets. `color-contrast` is disabled here since jsdom can't compute a real CSS cascade/layout. | Wired into `npm run check-issue` as one of the eight checks (manual, not in CI). |
| **`check-contrast.js`** | Verifies a small hardcoded set of known text/background color pairs in `main.css` against their WCAG AA thresholds (4.5:1 normal text, 3:1 large text), using plain hex-math — no CSS parsing/rendering. It's an allowlist, not a general linter: extend `PAIRS` in the script whenever a new text color is added to `main.css`. | `npm run check-contrast`. Wired into CI (`.github/workflows/build.yml`) as a non-blocking step, same pattern as `check-links`. |

Test both with:

```bash
bash utility/check-issue/test-check-issue.sh   # includes check-a11y.js fixture tests
bash utility/test-check-contrast.sh
```

**Known, documented exception:** `check-a11y.js` hardcodes one exception (`KNOWN_EXCEPTIONS` in the script) for the `region` rule on `#sidebar-checkbox` and its `<label>`, which drive the site's CSS-only mobile-menu toggle via sibling selectors in `main.css` (`#sidebar-checkbox:checked + .sidebar`, `~ .wrap`, `~ .sidebar-toggle`). Both elements must stay direct body-level siblings for that CSS to work, so they can't be wrapped in a landmark without breaking the toggle. Every other rule and node still fails normally — this is the only suppressed finding.

---

## Internationalization

The site publishes in English, Spanish, and French. Each language is a full parallel version of the site, not a translation layer.

### UI strings

All interface text lives in `src/_i18n/{en,es,fr}.yml`. Add or edit keys there to change labels, headings, and navigation text. Keys are accessed in templates as:

```nunjucks
{{ i18n[lang].global.key_name }}
```

The `lang` variable is set per-directory (`en` by default; `es` in `src/es/`; `fr` in `src/fr/`).

### Article content

Articles are written in one language. Spanish and French variants of article pages share the same body content but render the site shell (navigation, labels, headings) in the appropriate language. Abstract translations can be included in front matter:

```yaml
abstract: >
  English abstract.
abstract_es: >
  Resumen en español.
abstract_fr: >
  Résumé en français.
```

### Info pages (About, Authors, Credits, Reviewers, Valences, Workflow, CFPs)

Each info page is a native Eleventy page — front matter plus a markdown body — living directly in `src/_i18n/{en,es,fr}/`, e.g. `src/_i18n/es/about.md`. There's no separate template file to edit; the content file *is* the page. A per-language directory data file (`src/_i18n/{en,es,fr}/{lang}.11tydata.js`) supplies the shared `layout: page` and `lang` defaults, so an individual page's front matter only needs its own `title` and `permalink`:

```yaml
---
title: about
permalink: es/about.html
---
Page content in markdown.
```

To add a new info page in this style: create the `.md` file in all three `src/_i18n/{en,es,fr}/` directories with matching `title`/`permalink` front matter (`permalink: about.html` for English, `permalink: es/about.html` / `fr/about.html` for the others).

A page can be taken down without deleting it by adding `published: false` to its front matter — used for calls for papers (`src/_i18n/{en,es,fr}/cfp/`) that are open one issue and closed the next; see `cfp/special.md` for a live example.

Any info page can drop `[[toc]]` on its own line to get an auto-generated table of contents (a nested list of links to that page's own `##`/`###` headings) — see [Table of contents](#table-of-contents) below.

### Table of contents

Drop `[[toc]]` on its own line anywhere in a page's markdown body to get an auto-generated, nested list of links to that page's `##`/`###` headings (deeper headings get real anchor ids too, for manual `[text](#id)` cross-references, but aren't listed in the TOC itself). Used on the Authors, Reviewers, and Valences pages.

```markdown
**Table of Contents**

[[toc]]
```

Powered by `markdown-it-anchor` + `markdown-it-toc-done-right`, wired into the shared markdown-it instance in `.eleventy.js`. Heading ids are slugified consistently (accents and punctuation stripped, e.g. "Índice" → `indice`), and repeated heading text on the same page (e.g. four separate "Review Process" subsections) is disambiguated automatically (`review-process`, `review-process-1`, `review-process-2`, ...).

### Adding a new UI string

1. Add the key under `global:` in all three yml files (`en.yml`, `es.yml`, `fr.yml`).
2. Use it in any Nunjucks template as `{{ i18n[lang].global.your_key }}`.
