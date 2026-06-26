const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItAttrs = require("markdown-it-attrs");

module.exports = function (eleventyConfig) {
  // --- Passthrough copies ---
  eleventyConfig.addPassthroughCopy({ "src/public": "public" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });

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
    const i18n = this.ctx?.i18n || this.ctx?.collections?.i18n;
    if (!i18n) return key;
    const dict = i18n[lang] || i18n["en"] || {};
    return key.split(".").reduce((obj, k) => (obj ? obj[k] : undefined), dict) ?? key;
  });

  // Format a date string like "July 2017" → keep as-is (already human-readable in front matter)
  eleventyConfig.addFilter("dateDisplay", function (str) {
    return str || "";
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
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
