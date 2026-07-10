const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItSup = require("markdown-it-sup");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItTocDoneRight = require("markdown-it-toc-done-right");
const i18n = require("./src/_data/i18n.js");

// Shared between markdown-it-anchor (assigns heading ids) and
// markdown-it-toc-done-right (builds hrefs pointing at those same ids) so a
// [[toc]] block's links always match the ids actually on the page. Produces
// clean, readable slugs (accents stripped, punctuation dropped) instead of
// each library's own default percent-encoded fallback.
function slugify(str) {
  return String(str)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

module.exports = function (eleventyConfig) {
  // --- Passthrough copies ---
  eleventyConfig.addPassthroughCopy({ "src/public": "public" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Co-located images: every issue keeps its images inside src/issueXX/images/.
  const issues = require("./src/_data/issues.js");
  for (const key of Object.keys(issues)) {
    const imgDir = `src/${key}/images`;
    if (fs.existsSync(imgDir)) {
      eleventyConfig.addPassthroughCopy({ [imgDir]: `${key}/images` });
    }
  }

  // HTML interactives (pure-HTML pieces like the Parham essay) — pass
  // through untouched, do not template-process. Derived from each issue's
  // `interactives` array in issues.js (the directory is the parent of the
  // interactive's `url`), so a future issue with its own interactive needs
  // no changes here.
  for (const key of Object.keys(issues)) {
    for (const interactive of issues[key].interactives || []) {
      const dir = path.dirname(interactive.url).replace(/^\/+/, "");
      eleventyConfig.addPassthroughCopy({ [`src/${dir}`]: dir });
      eleventyConfig.ignores.add(`src/${dir}/**`);
    }
  }

  // --- Collections ---

  // All issue articles combined — used by the i18n language variant generators.
  // Derived from the keys in src/_data/issues.js so no manual update is needed
  // when a new issue is added.
  eleventyConfig.addCollection("allIssueArticles", (collectionApi) => {
    return Object.keys(issues).flatMap((tag) =>
      collectionApi.getFilteredByTag(tag)
    );
  });

  // Strip Pandoc {=html} raw-block fences so markdown-it renders inline HTML.
  // The fences are kept in the source files for the PDF pipeline (journal.lua
  // needs each table as a single RawBlock); this preprocessor removes them
  // only during the Eleventy web build.
  eleventyConfig.addPreprocessor("strip-pandoc-raw-html", "md", (_data, content) => {
    return content.replace(/^```\{=html\}\n([\s\S]*?)^```/gm, "$1");
  });

  // --- Markdown configuration ---
  const md = markdownIt({
    html: true,
    linkify: true,
    typographer: true, // smart quotes
  })
    .use(markdownItFootnote)
    .use(markdownItAttrs)
    .use(markdownItSup)
    .use(markdownItAnchor, { slugify })
    .use(markdownItTocDoneRight, { slugify, level: [2, 3], listType: "ul" });

  eleventyConfig.setLibrary("md", md);

  // Both accessibility-label transforms below share the same "only touch
  // built HTML, and Eleventy doesn't thread page.lang into markdown-it's
  // render env so read it off `this.lang` in a transform instead" shape —
  // factored out so the two labeling rules stay obviously parallel.
  function addI18nHtmlTransform(name, i18nKey, fallback, pattern, replacement) {
    eleventyConfig.addTransform(name, function (content, outputPath) {
      if (!outputPath || !outputPath.endsWith(".html")) return content;
      const lang = this.lang || "en";
      const label = (i18n[lang] && i18n[lang].global[i18nKey]) || fallback;
      return content.replace(pattern, replacement(label));
    });
  }

  // markdown-it-footnote's default backref markup is just an arrow glyph
  // (<a href="#fnrefN" class="footnote-backref">↩︎</a>) with no accessible name.
  addI18nHtmlTransform(
    "footnote-backref-label",
    "footnote_backref_label",
    "Back to content",
    /(<a href="#fnref\d+" class="footnote-backref")(>)/g,
    (label) => `$1 aria-label="${label}"$2`
  );

  // markdown-it-toc-done-right's <nav class="table-of-contents"> has no
  // accessible name, which collides with the sidebar's own <nav> landmark
  // (two unlabeled <nav> regions on one page).
  addI18nHtmlTransform(
    "toc-nav-label",
    "toc_label",
    "Table of contents",
    /(<nav class="table-of-contents")(>)/g,
    (label) => `$1 aria-label="${label}"$2`
  );

  // --- Custom filters ---

  // Build the "Return to Table of Contents" link for an article/project's
  // own issue (not always the current issue — a reader can land on an
  // older issue's article via search/citation/external link with no other
  // in-page way back to that issue's TOC). Usage: {{ issueSlug | issueTocUrl(lang) | url }}
  eleventyConfig.addFilter("issueTocUrl", function (issueSlug, lang) {
    const prefix = lang === "es" || lang === "fr" ? `/${lang}` : "";
    return `${prefix}/${issueSlug}.html`;
  });

  // Localize a canonical (English) article/project URL for the current
  // page's language. Needed because collections[issueTag] and
  // collections.allIssueArticles only contain the original English-tagged
  // pages (the es/fr variants are deliberately excluded via
  // addAllPagesToCollections: false so those collections stay a clean
  // "canonical English source" list for search-index/check-issue) --
  // meaning art.url inside a shared include like toc.njk is always the
  // English path regardless of which language page it's rendered on.
  // Usage: {{ art.url | localizeUrl(lang) | url }}
  eleventyConfig.addFilter("localizeUrl", function (canonicalUrl, lang) {
    const prefix = lang === "es" || lang === "fr" ? `/${lang}` : "";
    return `${prefix}${canonicalUrl}`;
  });

  // Render markdown block (with <p> tags) — for author bios
  eleventyConfig.addFilter("markdown", function (str) {
    if (!str) return "";
    return md.render(String(str));
  });

  // Render markdown inline (no wrapping <p> tag) — replaces Jekyll's markdownify + remove
  eleventyConfig.addFilter("mdInline", function (str) {
    if (!str) return "";
    return md.renderInline(String(str));
  });

  // Derive the PDF asset path from a page URL
  // e.g. /issue01/haynes-mapping/ → /assets/issue01/haynes-mapping.pdf
  eleventyConfig.addFilter("pdfUrl", function (pageUrl) {
    // strip trailing slash, then swap /issueXX/slug/ → /assets/issueXX/slug.pdf
    const clean = pageUrl.replace(/\/$/, "");
    return `/assets${clean}.pdf`;
  });

  // Lookup a dotted key in the i18n data for a given lang
  // Usage in Nunjucks: {{ "global.subtitle" | t(lang) }}
  eleventyConfig.addFilter("t", function (key, lang) {
    const i18n = this.ctx?.i18n;
    if (!i18n) return key;
    const dict = i18n[lang] || i18n["en"] || {};
    return key.split(".").reduce((obj, k) => (obj ? obj[k] : undefined), dict) ?? key;
  });

  // Convert "Month YYYY" pubDate to YYYY/MM for citation_publication_date (Google Scholar format)
  eleventyConfig.addFilter("isoDate", function (str) {
    if (!str) return "";
    const months = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08", september: "09",
      october: "10", november: "11", december: "12",
    };
    const parts = str.trim().split(/\s+/);
    if (parts.length === 2) {
      const m = months[parts[0].toLowerCase()];
      if (m) return `${parts[1]}/${m}`;
    }
    return str;
  });

  // schema.org JSON-LD for article/project pages -- the Highwire Press
  // citation_* meta tags in head.njk already cover Google Scholar
  // indexing; this adds structured data for general search engines and
  // other discovery tools that look for ScholarlyArticle/CreativeWork
  // instead. A *filter* (not addShortcode -- tried first, but shortcodes
  // silently don't resolve when a page's layout is applied on top of a
  // paginated .11ty.js template, e.g. src/es/issue-articles.11ty.js;
  // filters render fine there, same as mdInline/isoDate above already do
  // for those same pages' citation_* tags). Explicit args since none of
  // this data is threaded through `this.ctx` for either shortcodes or
  // filters here -- these are the same bare template variables head.njk
  // already uses directly (e.g. {{ title }}).
  // Usage in head.njk: {{ layout | articleJsonLd(title, author, doi, issue, language, abstract, page, site) | safe }}
  eleventyConfig.addFilter(
    "articleJsonLd",
    function (layout, title, author, doi, issue, language, abstract, page, site) {
      if (layout !== "article" && layout !== "project") return "";
      const titleText = (title && title.long) || title;
      const json = {
        "@context": "https://schema.org",
        "@type": layout === "article" ? "ScholarlyArticle" : "CreativeWork",
        headline: titleText,
        name: titleText,
        inLanguage: language,
        url: `${site.url}${page.url}`,
        ...(abstract ? { abstract } : {}),
        ...(doi ? { identifier: `https://doi.org/${doi}`, sameAs: `https://doi.org/${doi}` } : {}),
        author: (author || []).map((a) => ({ "@type": "Person", name: a.name })),
        publisher: { "@type": "Organization", name: site.publisher },
        isPartOf: {
          "@type": "PublicationIssue",
          issueNumber: issue,
          isPartOf: {
            "@type": "Periodical",
            name: site.title,
            issn: site.issn,
            url: site.url,
          },
        },
      };
      // Escape "<" (not just "</script>") so no JSON string value can break
      // out of the surrounding <script> tag; < is valid inside a JSON
      // string and browsers decode it back to "<" when parsing the script.
      return JSON.stringify(json).replace(/</g, "\\u003c");
    }
  );

  // --- Input / output directories ---
  const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || "/";
  return {
    pathPrefix,
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
};
