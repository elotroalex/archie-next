#!/usr/bin/env node
// Runs axe-core against each built English page for the issue (es/fr render
// the same article body/layout structure, matching the rationale already
// used by check-images.js/check-footnotes.js for English-only scanning).
//
// Uses jsdom rather than a headless browser — this repo has no browser
// automation dependency and the other check-issue scripts are all plain
// Node, so this follows that lightweight convention. jsdom doesn't compute
// a real CSS cascade/layout, so color-contrast is deliberately disabled
// here and checked instead by utility/check-contrast.js against a small
// hardcoded set of known text/background color pairs.
//
// Usage: node check-a11y.js <manifestPath> [--root <dir>]

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// Known, accepted exceptions to the "region" rule (all page content must be
// contained by a landmark). #sidebar-checkbox and its <label> drive the
// site's CSS-only mobile-menu toggle via sibling selectors in main.css
// (`#sidebar-checkbox:checked + .sidebar`, `~ .wrap`, `~ .sidebar-toggle`),
// which require both elements to stay direct body-level siblings of
// .sidebar/.wrap — wrapping them in a landmark would break the toggle.
// Both already have a correct accessible name (the label supplies one via
// its `for=` association), so this is a landmark-containment nitpick on a
// non-content control, not a real accessibility gap. Every other rule and
// every other node still fails normally — this only ever suppresses these
// two specific, known nodes for this one rule.
const KNOWN_EXCEPTIONS = [
  { ruleId: "region", htmlIncludes: 'id="sidebar-checkbox"' },
  { ruleId: "region", htmlIncludes: 'for="sidebar-checkbox"' },
];

function isKnownException(ruleId, nodeHtml) {
  return KNOWN_EXCEPTIONS.some(
    (ex) => ex.ruleId === ruleId && nodeHtml.includes(ex.htmlIncludes)
  );
}

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

async function runAxeOnHtml(html, url) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });
  dom.window.eval(AXE_SOURCE);
  const results = await dom.window.axe.run(dom.window.document, {
    // heading-order (used to catch skipped heading levels, e.g. h1 -> h4)
    // is only tagged "best-practice" in axe-core, not wcag2a/wcag2aa, so it
    // has to be included explicitly alongside the WCAG rule sets.
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
    rules: { "color-contrast": { enabled: false } },
  });
  dom.window.close();
  return results.violations;
}

async function main() {
  const { manifestPath, root } = parseArgs(process.argv);
  if (!manifestPath) {
    console.error("Usage: check-a11y.js <manifestPath> [--root <dir>]");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let fail = false;

  for (const htmlRelPath of manifest.builtHtml.en) {
    const htmlPath = path.join(root, htmlRelPath);
    const fileSlug = path.basename(htmlRelPath, ".html");
    if (!fs.existsSync(htmlPath)) {
      console.log(`FAIL - a11y: built file missing (${htmlRelPath})`);
      fail = true;
      continue;
    }
    const html = fs.readFileSync(htmlPath, "utf8");
    const violations = await runAxeOnHtml(html, "file://" + htmlPath);

    let pageFail = false;
    for (const v of violations) {
      const remainingNodes = v.nodes.filter((n) => !isKnownException(v.id, n.html || ""));
      if (remainingNodes.length === 0) continue;
      pageFail = true;
      fail = true;
      console.log(`FAIL - a11y: ${fileSlug} — ${v.id}: ${v.help} (${remainingNodes.length} node(s))`);
    }
    if (!pageFail) {
      console.log(`ok - a11y: ${fileSlug} (0 violations)`);
    }
  }

  process.exit(fail ? 1 : 0);
}

main();
