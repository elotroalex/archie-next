// Generates /atom.xml, listing recent articles/projects across all issues
// (English originals only, from collections.allIssueArticles -- same
// source src/es/fr's issue-articles.11ty.js pull from). Was previously
// commented out in head.njk with a "not yet generated" note; readers/
// aggregators following new-issue releases had no way to do so.
//
// Per-article pubDate front matter is too inconsistent to parse reliably
// ("July 9 2019", "February, 2020", "May 2022", ...), so entries are dated
// using their issue's `date` field in issues.js instead (always a clean
// "Month YYYY") and ordered by issue number, then each article's `order`
// field within that issue.

const MarkdownIt = require("markdown-it");
const issues = require("./_data/issues.js");

// Renders raw front-matter text (title, abstract) the same way
// article.njk does (mdInline filter -> md.renderInline) so CommonMark
// backslash-escapes (\") and *emphasis* markup don't leak into the feed
// as literal characters, then strips the resulting inline tags since Atom
// <title>/<summary> here are plain text, not HTML. markdown-it already
// HTML-escapes text nodes (&amp; &lt; &gt; &quot;) as it renders -- those
// are also valid XML predefined entities, so the result is used as-is
// rather than re-escaping (which would double-encode into e.g. &amp;quot;).
const mdPlain = new MarkdownIt({ typographer: true });
function toPlainText(str) {
  if (!str) return "";
  return mdPlain.renderInline(String(str)).replace(/<[^>]+>/g, "");
}

const MONTHS = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08", september: "09",
  october: "10", november: "11", december: "12",
};

// "July 2019" -> "2019-07-01T00:00:00Z"
function issueDateToIso(dateStr) {
  const parts = String(dateStr || "").trim().split(/\s+/);
  if (parts.length === 2) {
    const month = MONTHS[parts[0].toLowerCase()];
    if (month) return `${parts[1]}-${month}-01T00:00:00Z`;
  }
  return new Date().toISOString();
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MAX_ENTRIES = 30;

class Atom {
  data() {
    return {
      permalink: "/atom.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ collections, site }) {
    const articles = (collections.allIssueArticles || [])
      .slice()
      .sort((a, b) => {
        const issueDiff = (b.data.issue || 0) - (a.data.issue || 0);
        if (issueDiff !== 0) return issueDiff;
        return (a.data.order || 0) - (b.data.order || 0);
      })
      .slice(0, MAX_ENTRIES);

    const entries = articles
      .map((art) => {
        const title = art.data.title && art.data.title.long ? art.data.title.long : art.data.title;
        const url = `${site.url}${art.url}`;
        const issueMeta = issues[art.data.issueSlug] || {};
        const updated = issueDateToIso(issueMeta.date);
        const id = art.data.doi ? `https://doi.org/${art.data.doi}` : url;
        return `  <entry>
    <title>${toPlainText(title)}</title>
    <link href="${url}" />
    <id>${escapeXml(id)}</id>
    <updated>${updated}</updated>
    ${art.data.abstract ? `<summary>${toPlainText(art.data.abstract)}</summary>` : ""}
  </entry>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(site.title)}</title>
  <subtitle>${escapeXml(site.description)}</subtitle>
  <link href="${site.url}/atom.xml" rel="self" />
  <link href="${site.url}/" />
  <id>${site.url}/</id>
  <updated>${new Date().toISOString()}</updated>
${entries}
</feed>`;
  }
}

module.exports = Atom;
