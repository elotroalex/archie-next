#!/usr/bin/env node
// Checks that no article in the issue still has unresolved front-matter
// placeholders, and that the issue has a label in all three i18n yml files.
//
// Deliberately does NOT just grep for the literal "# TODO:" prefix: real
// data (src/issue09/goilo-1a0801.md) shows an article whose "# TODO: " prefixes
// were stripped by hand while the placeholder text underneath ("Month YYYY",
// "10.7916/...", etc.) was left in place. Comparing each required field's
// parsed value against the known stub text (from convert-docx.sh's template)
// catches both "never touched" and "prefix stripped but not filled in".
//
// Usage: node check-frontmatter.js <manifestPath> [--root <dir>]

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

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

// The distinctive placeholder text from convert-docx.sh's front-matter stub,
// independent of whether the "# TODO: " prefix survived.
const PLACEHOLDERS = {
  section: "articles | projects | reviews | introduction",
  "title.long": "Full article title",
  "title.short": "Short title for running header",
  doi: "10.7916/...",
  pubDate: "Month YYYY",
  issue: "issue number (integer)",
  order: "position within section (integer)",
  abstract: "Article abstract.",
};

const AUTHOR_PLACEHOLDERS = {
  name: "Author full name",
  shortname: "Last name",
  bio: "Author bio in markdown.",
};

function isPlaceholder(value, placeholderText) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.includes("TODO")) return true;
  return trimmed === placeholderText || trimmed === placeholderText.replace(/\.$/, "");
}

function getPath(obj, dottedPath) {
  return dottedPath.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function checkArticleFrontMatter(article) {
  const problems = [];
  const fm = article.frontMatter || {};

  for (const [fieldPath, placeholder] of Object.entries(PLACEHOLDERS)) {
    const value = getPath(fm, fieldPath);
    if (isPlaceholder(value, placeholder)) {
      problems.push(`${fieldPath} still has placeholder text ("${String(value).trim()}")`);
    }
  }

  const authors = Array.isArray(fm.author) ? fm.author : [];
  authors.forEach((author, i) => {
    for (const [field, placeholder] of Object.entries(AUTHOR_PLACEHOLDERS)) {
      const value = author && author[field];
      if (isPlaceholder(value, placeholder)) {
        problems.push(`author[${i}].${field} still has placeholder text ("${String(value).trim()}")`);
      }
    }
  });

  return problems;
}

function checkI18nLabel(root, issueSlug) {
  const langs = ["en", "es", "fr"];
  const missing = [];
  for (const lang of langs) {
    const file = path.join(root, "src/_i18n", `${lang}.yml`);
    if (!fs.existsSync(file)) {
      missing.push(`${lang}.yml (file not found)`);
      continue;
    }
    const data = yaml.load(fs.readFileSync(file, "utf8")) || {};
    const label = data.issues && data.issues[issueSlug];
    if (typeof label !== "string" || label.trim() === "") {
      missing.push(`${lang}.yml`);
    }
  }
  return missing;
}

function main() {
  const { manifestPath, root } = parseArgs(process.argv);
  if (!manifestPath) {
    console.error("Usage: check-frontmatter.js <manifestPath> [--root <dir>]");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let fail = false;

  for (const article of manifest.articles) {
    const problems = checkArticleFrontMatter(article);
    if (problems.length === 0) {
      console.log(`ok - frontmatter: ${article.fileSlug}`);
    } else {
      fail = true;
      console.log(`FAIL - frontmatter: ${article.fileSlug} has ${problems.length} unresolved field(s)`);
      for (const p of problems) console.log(`    ${p}`);
    }
  }

  const missingI18n = checkI18nLabel(root, manifest.issueSlug);
  if (missingI18n.length === 0) {
    console.log(`ok - i18n label: ${manifest.issueSlug} present in en/es/fr`);
  } else {
    fail = true;
    console.log(`FAIL - i18n label: ${manifest.issueSlug} missing in ${missingI18n.join(", ")}`);
  }

  process.exit(fail ? 1 : 0);
}

main();
