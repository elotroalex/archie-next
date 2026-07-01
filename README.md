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

2. **Register the issue** in `src/_data/issues.js` (see [Adding a new issue](#adding-a-new-issue) for the full entry format). The homepage updates automatically — no other config change needed.

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

   Verifies HTML validity, internal/external links, front-matter and i18n completeness, curly/smart quotation marks, image existence/alt text/minimum width, PDF existence, and footnote anchor pairing — see [Issue integrity check](#issue-integrity-check).

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

Place each article as a Markdown file in `src/issue09/`. Use `utility/intake/convert-docx.sh` to generate them from Word files (recommended), or create them manually. Every article needs this front matter:

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
- Extract embedded images to `src/issue09/images/media/`
- Rewrite image paths to absolute `/issue09/images/media/…` (required for language-variant pages)
- Normalize bare curly/smart quotes (`‘ ’ “ ”`) left over from Word — most often found in table cells — to the same escaped straight-quote style used throughout the rest of the document
- Inject a complete YAML front matter stub with `# TODO` placeholders for every required field

Edit the output `.md` and fill in all `# TODO` fields before building. The `section` field must be exactly one of: `introduction`, `articles`, `projects`, `reviews` — the TOC will not display the article otherwise.

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

---

## Issue integrity check

Before cutting a finished issue over to production, run a full integrity gate scoped to just that issue:

```bash
npm run check-issue -- issue09   # defaults to the current issue (last key in issues.js) if omitted
```

This builds the site, then runs seven checks (`utility/check-issue/`) and exits non-zero if any of them fail:

| Check | What it verifies |
| --- | --- |
| **HTML validity** | Runs [html-validate](https://html-validate.org/) against the issue's built pages (en/es/fr). Config (`htmlvalidate.config.json`) disables rules that just reflect this codebase's deliberate conventions (self-closing void elements, inline table-width styles, legacy Dublin Core `profile`/`scheme` attributes) so only genuine structural errors surface — unclosed/misnested tags, duplicate ids, empty headings, etc. |
| **Links** | Runs linkinator with the issue's own built pages as crawl entry points (reuses the root `linkinator.config.json` unmodified). `--recurse` stays on, so links out into older issues, `/public/`, the homepage, and cross-language switcher links are still followed and validated — this is narrower and faster than `npm run check-links`, not just a re-run of it. Unlike `report-links.sh`, unresolved (`[0]`) links are treated as hard failures here. |
| **Front matter & i18n** | Every article's front matter is checked field-by-field against the intake stub's known placeholder text (not just a `# TODO:` grep — this also catches placeholders where the `# TODO:` prefix was stripped but the text itself was never replaced). Also confirms the issue has a label in `en.yml`, `es.yml`, and `fr.yml`. |
| **Quotation marks** | Flags curly/smart quotation marks (`‘ ’ “ ”`) left in an article's markdown source — a common Word autocorrect artifact contributors are asked to avoid (see [Submission Guidelines](src/_i18n/en/authors/authors.md)), which can render unreliably through the PDF/LaTeX pipeline. `convert-docx.sh` now normalizes these automatically at intake time, so this is mainly a safety net for hand-edited content or articles converted before that fix. |
| **Images** | Every `<img>` under `/issueXX/images/` (or the legacy `/images/issueXX/`) in the built English page must exist on disk, have non-empty `alt` text, and meet a minimum width (`check-issue.config.json`, default 800px, matching the [author image guidelines](#adding-a-new-issue)). |
| **PDFs** | Every article without `pdf: false` must have a matching file at `src/assets/issueXX/<slug>.pdf`. |
| **Footnotes** | Every footnote reference (`#fnrefN`) in the built HTML must have a matching definition (`#fnN`), and vice versa — catches renumbering mistakes. |

Run the fixture-based unit tests for the check scripts themselves with:

```bash
bash utility/check-issue/test-check-issue.sh
```

This is a manual, standalone script — it is **not** wired into CI, so it won't block a build.

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

### Info pages (About, Authors, Credits, etc.)

Translated content for info pages lives in `src/_i18n/{en,es,fr}/` subdirectories as Markdown files, loaded at build time via `src/_data/pages.js`. The corresponding page templates in `src/es/` and `src/fr/` render this content automatically.

### Adding a new UI string

1. Add the key under `global:` in all three yml files (`en.yml`, `es.yml`, `fr.yml`).
2. Use it in any Nunjucks template as `{{ i18n[lang].global.your_key }}`.
