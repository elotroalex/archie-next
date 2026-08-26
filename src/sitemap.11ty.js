class Sitemap {
  data() {
    return {
      permalink: "/sitemap.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ collections, site, issues }) {
    const today = new Date().toISOString().slice(0, 10);
    const pages = (collections.all || []).filter(
      (p) => p.url && !p.data.eleventyExcludeFromCollections
    );

    // Interactives are passthrough HTML declared in issues.js, so they are in
    // no collection and were missing from the sitemap -- leaving their only
    // route to discovery the single link on the issue's TOC page.
    const interactiveUrls = Object.values(issues || {})
      .flatMap((issue) => issue.interactives || [])
      .map((piece) => piece.url);

    const allUrls = [...pages.map((p) => p.url), ...interactiveUrls].filter(
      (u, i, arr) => u && arr.indexOf(u) === i
    );

    const urls = allUrls
      .map((u) => `  <url>\n    <loc>${site.url}${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
  }
}

module.exports = Sitemap;
