// robots.txt content depends on which deploy target is building, the same
// way pathPrefix does (see CLAUDE.md / .github/workflows/build.yml) --
// staging (GitHub Pages preview) must keep blocking all crawlers, while
// the production build (main branch, rsynced to archipelagosjournal.org)
// needs to allow them plus point at the sitemap. Defaults to blocking
// (the safe choice) unless ELEVENTY_ALLOW_CRAWLERS=true is set, so a
// local `npm run build` or any CI step that forgets to set it fails safe
// rather than accidentally shipping a Disallow-all to production.
class Robots {
  data() {
    return {
      permalink: "/robots.txt",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ site }) {
    if (process.env.ELEVENTY_ALLOW_CRAWLERS === "true") {
      return `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`;
    }
    return `User-agent: *\nDisallow: /\n`;
  }
}

module.exports = Robots;
