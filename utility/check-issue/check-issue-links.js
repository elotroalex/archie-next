#!/usr/bin/env node
// Runs linkinator (programmatic API) with the issue's own built pages
// (en/es/fr) as crawl entry points, reusing the repo's root
// linkinator.config.json unmodified. Because recurse stays on, every link
// reachable from those pages is still followed and validated (older issues,
// /public/, homepage, cross-language switcher links) -- this is narrower and
// faster than `npm run check-links` (which starts from the whole _site/
// root) while still catching real cross-issue breakage, not just links
// within the new issue's own pages.
//
// Unlike utility/report-links.sh (which leaves status [0] for manual triage),
// this is a pre-publication gate: unresolved (status 0 / network error)
// links are treated as hard failures too, since an editor is expected to
// look at every failure before cutover anyway.
//
// For each broken/unresolved link this also tries to locate exactly where
// it was authored (source markdown for issue content, or a template file
// for site-wide nav/footer/head links) so the failure can be reported as
// file:line rather than just a built HTML page, and classifies each link as
// "internal" (resolves to a local file under _site/) or "external" (a
// real http(s) request to another domain) for reporting.
//
// Usage: node check-issue-links.js <manifestPath> [--root <dir>] [--json <path>]

const fs = require("fs");
const path = require("path");
const { check } = require("linkinator");

function parseArgs(argv) {
  const args = argv.slice(2);
  const manifestPath = args[0];
  let root = path.resolve(__dirname, "..", "..");
  const rootIdx = args.indexOf("--root");
  if (rootIdx !== -1 && args[rootIdx + 1]) {
    root = path.resolve(args[rootIdx + 1]);
  }
  let jsonPath = null;
  const jsonIdx = args.indexOf("--json");
  if (jsonIdx !== -1 && args[jsonIdx + 1]) {
    jsonPath = args[jsonIdx + 1];
  }
  return { manifestPath, root, jsonPath };
}

// Recursively collects template files (.njk) that can contain site-wide
// links not sourced from any article's own markdown (nav, sidebar, footer,
// head metadata, homepage, etc.).
function listTemplateFiles(root) {
  const dirs = ["src/_includes", "src/_layouts"];
  const topLevel = fs
    .readdirSync(path.join(root, "src"), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".njk"))
    .map((e) => `src/${e.name}`);

  const files = [...topLevel];
  for (const dir of dirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".njk")) {
        files.push(`${dir}/${entry.name}`);
      }
    }
  }
  return files;
}

// Finds the first file (issue markdown first, then site templates) that
// contains a literal occurrence of `rawText` (the href/src exactly as
// authored), returning its path and 1-indexed line number.
function findSourceLocation(root, candidateFiles, rawText, lineCache) {
  for (const relFile of candidateFiles) {
    if (!lineCache.has(relFile)) {
      const abs = path.join(root, relFile);
      if (!fs.existsSync(abs)) {
        lineCache.set(relFile, null);
        continue;
      }
      lineCache.set(relFile, fs.readFileSync(abs, "utf8").split("\n"));
    }
    const lines = lineCache.get(relFile);
    if (!lines) continue;
    const idx = lines.findIndex((line) => line.includes(rawText));
    if (idx !== -1) {
      return { file: relFile, line: idx + 1 };
    }
  }
  return null;
}

// Extracts every href="..."/src="..." raw attribute value from an HTML
// document, tolerant of attribute order.
function extractRawLinks(html) {
  const out = [];
  const attrRe = /\b(?:href|src)="([^"]*)"/g;
  let m;
  while ((m = attrRe.exec(html)) !== null) {
    out.push(m[1]);
  }
  return out;
}

// Resolves a raw local href/src (root-relative "/foo.html", or relative
// "foo.html") against the parent built HTML page's location, producing the
// same _site-root-relative path shape linkinator reports in LinkResult.url
// (both are relative to _site/, since that's the serverRoot used for the
// crawl below), so it can be matched back to exactly which raw attribute
// text produced a given broken result.
function resolveLocalHref(parentRelPath, raw) {
  const clean = raw.split(/[?#]/)[0];
  if (/^https?:\/\//i.test(clean) || clean === "") return null;
  if (clean.startsWith("/")) {
    return path.posix.normalize(clean.slice(1));
  }
  const parentDir = path.posix.dirname(parentRelPath);
  return path.posix.normalize(path.posix.join(parentDir, clean));
}

// Given a broken LinkResult, find the literal raw href/src text that
// produced it by re-parsing its parent page's HTML (under _site/) and
// resolving each candidate the same way linkinator would have.
function findRawHrefText(siteRoot, result) {
  if (!result.parent) return result.url;
  const parentAbs = path.join(siteRoot, result.parent);
  if (!fs.existsSync(parentAbs)) return result.url;
  const html = fs.readFileSync(parentAbs, "utf8");
  const isExternal = /^https?:\/\//i.test(result.url);

  for (const raw of extractRawLinks(html)) {
    if (isExternal) {
      if (raw === result.url) return raw;
    } else {
      if (resolveLocalHref(result.parent, raw) === result.url) return raw;
    }
  }
  return result.url;
}

async function main() {
  const { manifestPath, root, jsonPath } = parseArgs(process.argv);
  if (!manifestPath) {
    console.error("Usage: check-issue-links.js <manifestPath> [--root <dir>] [--json <path>]");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const siteRoot = path.join(root, "_site");

  // Entry points must be relative to _site/ (the actual document root
  // root-relative hrefs like "/sitemap.xml" resolve against on the live
  // site) rather than the repo root — passing repo-root-relative paths
  // like "_site/issue09/x.html" with no explicit serverRoot makes
  // linkinator default serverRoot to the repo root, so every root-relative
  // link 404s against a nonexistent repo-root copy of the site (a real bug
  // in the previous shell-script version of this check, silently masked
  // there by a `grep 'http'` filter that also hid genuine internal 404s).
  const entryPoints = [...manifest.builtHtml.en, ...manifest.builtHtml.es, ...manifest.builtHtml.fr]
    .filter((f) => fs.existsSync(path.join(root, f)))
    .map((f) => path.posix.relative("_site", f));

  if (entryPoints.length === 0) {
    console.log("FAIL - links: no built HTML files found for this issue (did you run npm run build?)");
    process.exit(1);
  }

  const configPath = path.join(root, "linkinator.config.json");
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : {};

  const result = await check({
    path: entryPoints,
    recurse: true,
    linksToSkip: config.skip || [],
    timeout: config.timeout,
    concurrency: config.concurrency,
    statusCodes: config.statusCodes,
    serverRoot: siteRoot,
  });

  // Internal links share the same concurrency pool as (often slow/timing-out)
  // external requests, and linkinator proxies local files through its own
  // http://localhost static server rather than reading them directly -- under
  // load from hundreds of external checks in the same crawl, local requests
  // can spuriously time out (status 0) even though the file exists on disk.
  // Since we already know exactly which file on disk a local link resolves
  // to, cross-check directly against the filesystem and drop any "broken"
  // result the file actually satisfies, rather than trusting the flaky
  // network round-trip for something we can verify deterministically.
  const broken = result.links.filter((l) => {
    if (l.state !== "BROKEN") return false;
    if (/^https?:\/\//i.test(l.url)) return true;
    const localPath = path.join(siteRoot, l.url.split(/[?#]/)[0]);
    return !fs.existsSync(localPath);
  });

  if (broken.length === 0) {
    console.log("ok - links: no broken links reachable from this issue's pages");
    if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify({ internal: [], external: [] }, null, 2));
    process.exit(0);
  }

  const candidateFiles = [...manifest.markdownFiles, ...listTemplateFiles(root)];
  const lineCache = new Map();
  const seenRows = new Set();
  const internal = [];
  const external = [];

  for (const l of broken) {
    const isExternal = /^https?:\/\//i.test(l.url);
    const rawText = findRawHrefText(siteRoot, l);
    const location = findSourceLocation(root, candidateFiles, rawText, lineCache);
    const errorLabel = l.status && l.status > 0 ? String(l.status) : "unresolved (timeout/network error)";

    const builtParent = l.parent ? `_site/${l.parent}` : null;
    const row = {
      url: l.url,
      error: errorLabel,
      file: location ? location.file : builtParent,
      line: location ? location.line : null,
      parentPage: builtParent,
    };

    const dedupeKey = `${row.url}|${row.file}|${row.line}|${row.error}`;
    if (seenRows.has(dedupeKey)) continue;
    seenRows.add(dedupeKey);

    (isExternal ? external : internal).push(row);
  }

  console.log(`FAIL - links: ${internal.length} internal, ${external.length} external broken/unresolved`);
  for (const row of internal) {
    console.log(`    [internal] ${row.error} ${row.url} (${row.file}${row.line ? ":" + row.line : ""})`);
  }
  for (const row of external) {
    console.log(`    [external] ${row.error} ${row.url} (${row.file}${row.line ? ":" + row.line : ""})`);
  }

  if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify({ internal, external }, null, 2));
  }

  process.exit(1);
}

main();
