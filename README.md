# archipelagos | a journal of Caribbean digital praxis

*archipelagos* is a born-digital, peer-reviewed publication devoted to creative exploration, debate, and critical thinking about and through digital practices in contemporary scholarly and artistic work in and on the Caribbean. Given the wide implications of the "digital turn" for our very conceptions of knowledge, our mission is to discern the ways in which the digital may enhance and transform our comprehension of the regional and diasporic Caribbean. *archipelagos* responds to this challenge with three distinct dimensions of critical production: scholarly essays; digital scholarship projects; and digital project reviews.

The journal is trilingual (English, Spanish, French), published by Columbia University Libraries, and committed to access in low-bandwidth environments. ISSN: 2689-842X.

Live site: [archipelagosjournal.org](http://archipelagosjournal.org)

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
issue04: {
  slug: "issue04",
  slug_fr: "fr/issue04",
  slug_es: "es/issue04",
  number: 4,
  date: "March 2020",
  title: "Issue (4)",
  editors: ["Editor Name"],
  production: ["Production Team Member"],
  // Optional: list pure-HTML interactives that fall outside the normal article pipeline
  // interactives: [
  //   { title: "Piece Title", author: ["Author Name"], url: "/issue04/piece/piece.html", pdf: false },
  // ],
},
```

### 2. Add a label in each language file

In `src/_i18n/en.yml`, `es.yml`, and `fr.yml`, add a line under the `issues:` key:

```yaml
issues:
  issue04: "Issue (4) | March 2020"
```

### 3. Create the article directory and its data file

```bash
mkdir src/issue04
```

Create `src/issue04/issue04.11tydata.js`:

```js
module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue04"],
  eleventyComputed: {
    permalink: (data) => `issue04/${data.page.fileSlug}.html`,
    issueSlug: "issue04",
  },
};
```

### 4. Add article files

Place each article as a Markdown file in `src/issue04/`. Every article needs this front matter:

```yaml
---
layout: article          # article | project | page
section: articles        # introduction | articles | projects | reviews
title:
  long: "Full Article Title"
  short: "Short Title"   # used in running headers of PDF
doi: "10.7916/..."
author:
  - name: Author Name
    shortname: Last      # used in PDF running header
    bio: >
      Author bio in markdown.
pubDate: March 2020      # human-readable; do NOT use the key "date"
issue: 4
order: 1                 # controls position within section in TOC
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
thumb: images/issue04/project-thumb.jpg
```

### 5. Add images

Place article images in `src/images/issue04/`. They are served from `/images/issue04/` and referenced in Markdown as:

```markdown
{% include image.html
   img="images/issue04/filename.jpg"
   title="Caption"
   caption="Caption text." %}
```

### 6. Add pure-HTML interactives (optional)

If an issue includes a self-contained HTML piece (like the Parham essay in Issue 3):

1. Place the HTML and its assets in `src/issue04/piece-name/`.
2. In `.eleventy.js`, add passthrough copy and ignore rules:
   ```js
   eleventyConfig.addPassthroughCopy({ "src/issue04/piece-name": "issue04/piece-name" });
   eleventyConfig.ignores.add("src/issue04/piece-name/**");
   ```
3. Register it in the `interactives` array in `src/_data/issues.js` (see step 1 above). It will appear in the TOC under **Featured**.

### 7. Set as current issue

In `src/_data/site.js`, update:

```js
current: "issue04",
"current-number": 4,
```

The homepage will now show Issue 4. Issues 1–3 remain accessible via their individual pages (`/issue01.html` etc.) linked from the "Issues" nav at the bottom of the homepage.

### 8. Generate PDFs

```bash
bash utility/latex/makeIssues.sh issue04
```

Pre-existing PDFs in `src/assets/` are never overwritten unless you explicitly run the script for that issue.

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
