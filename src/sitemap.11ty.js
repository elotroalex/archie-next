class Sitemap {
  data() {
    return {
      permalink: "/sitemap.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ collections, site }) {
    const today = new Date().toISOString().slice(0, 10);
    const pages = (collections.all || []).filter(
      (p) => p.url && !p.data.eleventyExcludeFromCollections
    );

    const urls = pages
      .map((p) => `  <url>\n    <loc>${site.url}${p.url}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
  }
}

module.exports = Sitemap;
