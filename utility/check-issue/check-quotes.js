#!/usr/bin/env node
// Flags non-standard (curly/smart) quotation marks left over from Word in
// an issue's markdown source. Word's autocorrect frequently substitutes
// straight quotes/apostrophes with typographic curly variants; convert-docx.sh
// already escapes straight quotes it finds (rendered as \" in the source),
// but curly quotes are distinct Unicode characters that pandoc passes through
// untouched, and they render unreliably across the PDF/LaTeX pipeline and in
// some fonts. The author style guide asks for straight quotes only.
//
// Flags: U+2018 '  U+2019 '  U+201C "  U+201D " (curly single/double
// open/close quotes -- not the straight quotes/apostrophes contributors are
// asked to use).
//
// Usage: node check-quotes.js <manifestPath> [--root <dir>]

const fs = require("fs");
const path = require("path");

const CURLY_QUOTES = /[‘’“”]/;

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

function findCurlyQuoteLines(text) {
  return text
    .split(/\r?\n/)
    .map((line, i) => ({ num: i + 1, line }))
    .filter(({ line }) => CURLY_QUOTES.test(line));
}

function main() {
  const { manifestPath, root } = parseArgs(process.argv);
  if (!manifestPath) {
    console.error("Usage: check-quotes.js <manifestPath> [--root <dir>]");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let fail = false;

  for (const relFile of manifest.markdownFiles) {
    const filePath = path.join(root, relFile);
    const text = fs.readFileSync(filePath, "utf8");
    const hits = findCurlyQuoteLines(text);
    const fileName = path.basename(relFile);

    if (hits.length === 0) {
      console.log(`ok - quotes: ${fileName}`);
    } else {
      fail = true;
      console.log(`FAIL - quotes: ${fileName} has ${hits.length} line(s) with curly quotation marks`);
      for (const { num, line } of hits) {
        console.log(`    ${num}: ${line.trim()}`);
      }
    }
  }

  process.exit(fail ? 1 : 0);
}

main();
