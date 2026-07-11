#!/usr/bin/env node
// Validates every same-page anchor link (href="#id") in the built site
// against a real id="..."/name="..." on that same page.
//
// linkinator's `checkFragments` option (tried first) turned out to be
// unreliable for this: it only validates fragments on pages discovered
// within the first hop or two of the crawl's entry point (e.g. root-level
// files like credits.html, listed directly on the "." directory-listing
// page) and silently skips validation entirely -- no warning, no result --
// for anything reached deeper in the recursion, which is nearly all of this
// site's real content (issueXX/*.html, es/*, fr/*, footnote anchors). A
// deliberately broken footnote anchor several hops from the root went
// completely undetected even with checkFragments enabled. This script does
// the same job with a plain HTML scan instead: no crawling, no network, no
// recursion-depth blind spot -- every file gets checked the same way
// regardless of how deep it sits in the site.
//
// Usage:
//   node check-anchors.js [--root <dir>] [--json <path>]
//     Scans every *.html under --root (default: _site).
//   node check-anchors.js <manifestPath> [--root <dir>] [--json <path>]
//     Scopes the scan to just one issue's own built pages (manifest from
//     collect-issue.js), matching the calling convention every other
//     check-issue/*.js script uses.

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = argv.slice(2);
  const manifestPath = args[0] && !args[0].startsWith("--") ? args[0] : null;
  // Standalone (no manifest) defaults to _site/ itself, since it walks html
  // files directly. Manifest mode defaults to the repo root, since
  // collect-issue.js's builtHtml entries are already "_site/..." paths
  // relative to the repo root.
  let root = manifestPath
    ? path.resolve(__dirname, "..")
    : path.resolve(__dirname, "..", "_site");
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

function walkHtmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(fullPath);
    }
  }
  return out;
}

// Same-page fragment links only: href="#id" where the whole attribute value
// is the fragment (not a full URL like href="https://x.com/y#id", and not
// the bare href="#" "return to top" idiom, which needs no matching id).
const FRAGMENT_HREF_RE = /\bhref="#([^"#]+)"/g;
const ID_RE = /\bid="([^"]+)"/g;
const NAME_RE = /\bname="([^"]+)"/g;

function checkFile(absPath) {
  const html = fs.readFileSync(absPath, "utf8");

  const ids = new Set();
  for (const m of html.matchAll(ID_RE)) ids.add(m[1]);
  for (const m of html.matchAll(NAME_RE)) ids.add(m[1]);

  const missing = [];
  const seen = new Set();
  for (const m of html.matchAll(FRAGMENT_HREF_RE)) {
    const fragment = m[1];
    if (ids.has(fragment) || seen.has(fragment)) continue;
    seen.add(fragment);
    missing.push(fragment);
  }
  return missing;
}

function main() {
  const { manifestPath, root, jsonPath } = parseArgs(process.argv);

  if (!fs.existsSync(root)) {
    console.error(`check-anchors: root not found: ${root}`);
    process.exit(1);
  }

  let absFiles;
  if (manifestPath) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const relFiles = [...manifest.builtHtml.en, ...manifest.builtHtml.es, ...manifest.builtHtml.fr];
    absFiles = relFiles.map((f) => path.join(root, f)).filter((f) => fs.existsSync(f));
  } else {
    absFiles = walkHtmlFiles(root);
  }

  const failures = [];
  for (const absPath of absFiles) {
    const relPath = path.relative(root, absPath);
    const missing = checkFile(absPath);
    for (const fragment of missing) {
      failures.push({ file: relPath, fragment: `#${fragment}` });
    }
  }

  if (failures.length === 0) {
    console.log(`ok - anchors: no broken same-page anchor links in ${absFiles.length} file(s)`);
    if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify([], null, 2));
    process.exit(0);
  }

  console.log(`FAIL - anchors: ${failures.length} broken same-page anchor link(s)`);
  for (const f of failures) {
    console.log(`    [anchor] ${f.fragment} has no matching id on ${f.file}`);
  }
  if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify(failures, null, 2));
  process.exit(1);
}

main();
