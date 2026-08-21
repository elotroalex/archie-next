const issues = require("./issues.js");

const issueKeys = Object.keys(issues);
const currentKey = issueKeys[issueKeys.length - 1];

// The "current issue" convention (see CLAUDE.md / issues.js) is that it's
// always the *last key* in issues.js -- there's no explicit `current:` flag.
// That's easy to break silently by reordering or inserting an issue out of
// sequence, so fail the build loudly if the last key doesn't also have the
// highest `number`.
const maxNumberKey = issueKeys.reduce((a, b) => (issues[a].number > issues[b].number ? a : b));
if (maxNumberKey !== currentKey) {
  throw new Error(
    `issues.js: last key "${currentKey}" (number ${issues[currentKey].number}) is not the highest-numbered issue ` +
      `("${maxNumberKey}" is number ${issues[maxNumberKey].number}). The current issue is derived from the last key in ` +
      `issues.js -- reorder it so the highest-numbered issue is last, or fix the "number" field.`
  );
}

// The one true public address of the journal. Every absolute URL the site
// emits -- canonical, hreflang, og:url, citation_* metadata, sitemap <loc>,
// atom feed, JSON-LD -- is built from `url` below.
const CANONICAL_URL = "https://archipelagosjournal.org";

// SITE_URL lets a non-production deploy (the Reclaim preview subdomain) emit
// self-consistent absolute URLs, so shared links and the sitemap point at the
// host actually serving them instead of at the live site. Trailing slashes are
// stripped because consumers concatenate directly (`${site.url}/sitemap.xml`
// in robots.11ty.js, `{{ site.url }}{{ page.url }}` in head.njk).
const url = (process.env.SITE_URL || CANONICAL_URL).trim().replace(/\/+$/, "");

if (!url.startsWith("https://")) {
  throw new Error(
    `site.js: SITE_URL must be https, got "${url}". The journal is served over TLS; an http:// ` +
      `base URL would emit insecure canonical/citation metadata that indexers and DOI consumers cache.`
  );
}

// The safety interlock. ELEVENTY_ALLOW_CRAWLERS=true is what makes a build
// indexable (see robots.11ty.js and the noindex meta in head.njk), so pin it
// to the canonical URL: a mistyped SITE_URL repository variable can then never
// ship preview canonicals, preview citation_* metadata, or a sitemap full of
// preview URLs to a build that search engines are allowed to crawl.
if (process.env.ELEVENTY_ALLOW_CRAWLERS === "true" && url !== CANONICAL_URL) {
  throw new Error(
    `site.js: refusing to build an indexable site at "${url}" -- only "${CANONICAL_URL}" may be crawled. ` +
      `Either unset ELEVENTY_ALLOW_CRAWLERS (for a preview deploy) or set SITE_URL to the canonical URL.`
  );
}

module.exports = {
  title: "archipelagos",
  // The *current* publisher, for pages that belong to no issue (about,
  // credits, the homepage). Issue content resolves its own publisher from
  // issues.js instead -- see the note there. Derived, so adding a new issue
  // with a different publisher updates this automatically.
  publisher: issues[currentKey].publisher,
  description: "a journal of Caribbean digital praxis",
  url,
  // True for any build that isn't the crawlable production one. Drives the
  // <meta name="robots" content="noindex"> in head.njk -- which is the only
  // thing that actually protects a deploy served from a *subpath* (the
  // GitHub Pages staging preview at /archie-next/), since robots.txt is only
  // honored at a host root.
  noindex: process.env.ELEVENTY_ALLOW_CRAWLERS !== "true",
  githuburl: "https://github.com/archipelagosjournal/",
  old_issn: "2473-2206",
  issn: "2689-842X",
  current: currentKey,
  "current-number": issues[currentKey].number,
  languages: ["en", "es", "fr"],
};
