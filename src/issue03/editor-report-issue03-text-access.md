# Proposed Issue 3 Repository Update

**Works affected:** Marisa Parham, *.break .dance* and *Breaking, Dancing, Making in the Machine: Notes on “.break .dance”*  
**Purpose:** Improve scholarly discovery and provide an interim screen-reader-accessible route without replacing or redesigning either interactive work.

## Summary

This update adds a static, text-oriented companion page for each of the two Issue 3 interactive works. The companions are authored as Markdown and built through the journal’s existing Eleventy article pipeline. They expose the works’ text and scholarly metadata to search engines, Google Scholar, the journal’s search system, and assistive technologies while directing readers back to the interactive originals.

The companions are deliberately framed as **text-access companions**, not substitute editions. They do not reproduce the works’ audiovisual composition, timing, branching, hover actions, maps, spatial movement, or other interface-specific arguments.

## Public-facing changes

### 1. New Markdown companion for *.break .dance*

Proposed URL: `https://archipelagosjournal.org/issue03/parham-landing.html`

The page includes:

- article title, author, publication date, DOI, abstract, and journal metadata;
- searchable text grouped by source scene;
- a conventional table of contents;
- a numbered choose-your-own-adventure structure with working internal links;
- an opening and closing link to the interactive work;
- explicit language explaining which parts of the digital experience are not reproduced.

### 2. New Markdown companion for *Making, Breaking*

Proposed URL: `https://archipelagosjournal.org/issue03/parham-process-landing.html`

The page includes:

- article title, author, publication date, DOI, abstract, and journal metadata;
- searchable essay text organized by source scene;
- a conventional table of contents and working internal navigation;
- an opening and closing link to the interactive essay;
- explicit language explaining that the page does not reproduce the original timing, media, horizontal movement, mouseover actions, map, or post–Born Digital navigation.

### 3. Discovery metadata

The existing interactive HTML files now use `citation_fulltext_html_url` to identify their respective Markdown companions as the readily indexable full-text representations:

- *.break .dance* → `/issue03/parham-landing.html`
- *Making, Breaking* → `/issue03/parham-process-landing.html`

The companion pages also supply the journal’s normal Highwire/Google Scholar, Dublin Core, canonical, and JSON-LD metadata through the shared article template. They are included in the site sitemap and journal search index.

### 4. No public PDF edition

Both Markdown pages set `pdf: false`. The journal template therefore emits neither a PDF download link nor `citation_pdf_url` metadata for these companions. No direct video, audio, GIF, or other media-download links are included.

Because the journal repository itself is public, the Markdown source can still be viewed through GitHub like other article sources. The intended distinction is that the website offers no dedicated downloadable or print-ready substitute edition.

The print/PDF experiments created while developing a possible small paper edition remain local working artifacts and are not uploaded to the repository.

## Accessibility status

The Markdown is rendered as semantic HTML rather than served as raw Markdown. The resulting pages provide:

- linear document order;
- a single page title and correctly ordered section headings;
- keyboard-accessible internal navigation;
- descriptive links;
- no dependence on JavaScript, timing, hover, audio, or precise pointer movement for access to the text.

Both new pages passed the repository’s automated accessibility checks with **zero reported violations**. They also passed the targeted HTML-validity and same-page-anchor checks.

These companions are an interim text-access measure, not a claim of complete equivalence with the interactive works. More developed accessibility work—including authored scene descriptions, audio description, transcripts, and the annotation systems planned for *.break .dance redux*—can proceed separately.

## Visual and editorial scope

This update does **not** alter the visible design, navigation, timing, media, or interaction of either original work. No visible “text access” link has yet been added to the interactives; its placement and visual treatment remain an editorial/design decision.

The companion pages currently use `section: access`, so they are discoverable through the sitemap and journal search but do not appear as duplicate entries in the visible Issue 3 table of contents.

## Recommended commit contents

Include:

- `src/issue03/parham-landing.md`
- `src/issue03/parham-process-landing.md`
- the two `citation_fulltext_html_url` edits in the original interactive HTML files;
- the `.gitignore` additions protecting local print/PDF artifacts.

Held back from this public-facing commit:

- generated PDFs and print-layout experiments;
- temporary renders and media thumbnails;
- raw mechanical scene extractions;
- local PDF-generation and extraction scripts, unless the editorial team separately decides they belong in the repository as maintenance tooling.

## Validation completed

- Full Eleventy site build: passed
- Same-page anchor audit: passed across the built site
- Targeted HTML validation for both companions: passed
- Automated accessibility audit for both companions: zero reported violations
- Confirmed absence of PDF and direct media-download links from both companions
