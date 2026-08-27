#!/usr/bin/env node
// Verifies WCAG contrast ratios for known text/background color pairs used
// in src/public/css/main.css. This is NOT a general contrast linter — it
// does not parse or render CSS, it just computes the standard relative-
// luminance/contrast-ratio formula against a hardcoded allowlist of pairs.
// It will not catch a newly-introduced low-contrast color on a selector not
// listed below; extend PAIRS whenever a new text color is added to main.css.
//
// Usage: node utility/check-contrast.js [--pairs <json>]
//   --pairs lets a caller (e.g. tests) override the built-in PAIRS array
//   with a JSON string of the same shape, without touching real CSS.

const PAIRS = [
  { selector: "h2.tagline", fg: "#6b6e70", bg: "#ffffff", minRatio: 3.0, file: "src/public/css/main.css:229" },
  { selector: "a.footer-menu-item", fg: "#6b6e70", bg: "#ffffff", minRatio: 4.5, file: "src/public/css/main.css:302" },
  { selector: ".alt-link", fg: "#6b6e70", bg: "#ffffff", minRatio: 4.5, file: "src/public/css/main.css:332" },
  { selector: ".pdf-download", fg: "#6b6e70", bg: "#ffffff", minRatio: 4.5, file: "src/public/css/main.css:337" },
  { selector: "span.caption, figcaption", fg: "#6b6e70", bg: "#ffffff", minRatio: 4.5, file: "src/public/css/main.css:474" },
  { selector: "caption", fg: "#6b6e70", bg: "#ffffff", minRatio: 4.5, file: "src/public/css/main.css:496" },
  { selector: "ul#main-nav-small a", fg: "#6b6e70", bg: "#ffffff", minRatio: 4.5, file: "src/public/css/main.css:727" },
  { selector: ".page-title", fg: "#6b6e70", bg: "#ffffff", minRatio: 3.0, file: "src/public/css/main.css:785" },
  { selector: "p.alert, div.alert", fg: "#454545", bg: "#fbf3f3", minRatio: 4.5, file: "src/public/css/main.css:471" },
];

function hexToRgb(hex) {
  const clean = hex.replace(/^#/, "");
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function channelLuminance(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const idx = args.indexOf("--pairs");
  if (idx !== -1 && args[idx + 1]) {
    return JSON.parse(args[idx + 1]);
  }
  return PAIRS;
}

function main() {
  const pairs = parseArgs(process.argv);
  let fail = false;

  for (const pair of pairs) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const rounded = Math.round(ratio * 100) / 100;
    if (ratio >= pair.minRatio) {
      console.log(`ok - contrast: ${pair.selector} (${rounded}:1 >= ${pair.minRatio}:1)`);
    } else {
      fail = true;
      console.log(`FAIL - contrast: ${pair.selector} (${rounded}:1 < ${pair.minRatio}:1 required) — ${pair.file}`);
    }
  }

  process.exit(fail ? 1 : 0);
}

main();
