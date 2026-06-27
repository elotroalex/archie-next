const fs = require("fs");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItAttrs = require("markdown-it-attrs");

module.exports = function (eleventyConfig) {
  // --- Passthrough copies ---
  eleventyConfig.addPassthroughCopy({ "src/public": "public" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  // Co-located images: new issues keep images inside src/issueXX/images/
  // rather than the central src/images/issueXX/ tree used by older issues.
  const issues = require("./src/_data/issues.js");
  for (const key of Object.keys(issues)) {
    const imgDir = `src/${key}/images`;
    if (fs.existsSync(imgDir)) {
      eleventyConfig.addPassthroughCopy({ [imgDir]: `${key}/images` });
    }
  }

  // HTML interactives — pass through untouched, do not template-process
  eleventyConfig.addPassthroughCopy({ "src/issue03/parham": "issue03/parham" });
  eleventyConfig.addPassthroughCopy({ "src/issue03/parham-process": "issue03/parham-process" });
  eleventyConfig.ignores.add("src/issue03/parham/**");
  eleventyConfig.ignores.add("src/issue03/parham-process/**");

  // _i18n content fragments are data files used by templates, not standalone pages
  eleventyConfig.ignores.add("src/_i18n/**");

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
    .use(markdownItAttrs);

  eleventyConfig.setLibrary("md", md);

  // --- Custom filters ---

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

  // Format a date string like "July 2017" → keep as-is (already human-readable in front matter)
  eleventyConfig.addFilter("dateDisplay", function (str) {
    return str || "";
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

  // --- Input / output directories ---
  return {
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
