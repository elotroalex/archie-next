#!/usr/bin/env node
// Checks that every footnote reference in the built HTML has a matching
// footnote definition, and vice versa. Catches numbering/renumbering
// mistakes (e.g. a footnote deleted mid-document leaving an orphaned
// reference or a gap in the definitions list).
//
// markdown-it-footnote renders references as <sup class="footnote-ref">
// <a href="#fnN" id="fnrefN">[N]</a></sup> and definitions as
// <li id="fnN" class="footnote-item">...<a href="#fnrefN" ...>. Comparing
// the set of "fnrefN" ids (references) against "fnN" ids (definitions) is
// sufficient — plain regex is fine given this very regular, templated markup.
//
// Usage: node check-footnotes.js <manifestPath> [--root <dir>]

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = argv.slice(2);
  const manifestPath = args[0];
  let root = path.resolve(__dirname, "..", "..");
  const rootIdx = args.indexOf("--root");
  if (rootIdx !== -1 && args[rootIdx + 1]) {
    root = path.resolve(args[rootIdx + 1]);
  }
  return { manifestPath, root };
}

function extractIds(html, pattern) {
  const nums = new Set();
  let m;
  const re = new RegExp(pattern, "g");
  while ((m = re.exec(html)) !== null) {
    nums.add(m[1]);
  }
  return nums;
}

function checkFootnotes(html) {
  const refs = extractIds(html, 'id="fnref(\\d+)"');
  const defs = extractIds(html, 'id="fn(\\d+)"(?!ref)');

  const orphanedRefs = [...refs].filter((n) => !defs.has(n));
  const orphanedDefs = [...defs].filter((n) => !refs.has(n));

  return { total: refs.size, orphanedRefs, orphanedDefs };
}

function main() {
  const { manifestPath, root } = parseArgs(process.argv);
  if (!manifestPath) {
    console.error("Usage: check-footnotes.js <manifestPath> [--root <dir>]");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let fail = false;

  for (const htmlRelPath of manifest.builtHtml.en) {
    const htmlPath = path.join(root, htmlRelPath);
    if (!fs.existsSync(htmlPath)) {
      console.log(`FAIL - footnotes: built file missing (${htmlRelPath})`);
      fail = true;
      continue;
    }
    const html = fs.readFileSync(htmlPath, "utf8");
    const { total, orphanedRefs, orphanedDefs } = checkFootnotes(html);
    const fileSlug = path.basename(htmlRelPath, ".html");

    if (orphanedRefs.length === 0 && orphanedDefs.length === 0) {
      console.log(`ok - footnotes: ${fileSlug} (${total} footnotes, all paired)`);
    } else {
      fail = true;
      const parts = [];
      if (orphanedRefs.length) parts.push(`reference(s) with no definition: #${orphanedRefs.join(", #")}`);
      if (orphanedDefs.length) parts.push(`definition(s) with no reference: #${orphanedDefs.join(", #")}`);
      console.log(`FAIL - footnotes: ${fileSlug} — ${parts.join("; ")}`);
    }
  }

  process.exit(fail ? 1 : 0);
}

main();
