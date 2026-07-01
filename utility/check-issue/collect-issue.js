#!/usr/bin/env node
// Single source of truth for "everything belonging to issueXX": which
// markdown files, parsed front matter, expected built HTML paths (en/es/fr),
// image directory convention, and expected PDF paths. Every other check
// script consumes this JSON instead of re-deriving any of it.
//
// Usage: node collect-issue.js <issueSlug> [--root <dir>]
// Prints a JSON manifest to stdout.

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function parseArgs(argv) {
  const args = argv.slice(2);
  const issueSlug = args[0];
  let root = path.resolve(__dirname, "..", "..");
  const rootIdx = args.indexOf("--root");
  if (rootIdx !== -1 && args[rootIdx + 1]) {
    root = path.resolve(args[rootIdx + 1]);
  }
  return { issueSlug, root };
}

function loadIssueMeta(root, issueSlug) {
  const issuesPath = path.join(root, "src/_data/issues.js");
  if (!fs.existsSync(issuesPath)) return {};
  const issues = require(issuesPath);
  return issues[issueSlug] || {};
}

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return {};
  try {
    return yaml.load(match[1]) || {};
  } catch (e) {
    return { __parseError: e.message };
  }
}

function findImagesDir(root, issueSlug) {
  const coLocated = `src/${issueSlug}/images`;
  const central = `src/images/${issueSlug}`;
  if (fs.existsSync(path.join(root, coLocated))) return coLocated;
  if (fs.existsSync(path.join(root, central))) return central;
  return null;
}

function collect(root, issueSlug) {
  const meta = loadIssueMeta(root, issueSlug);
  const issueDir = path.join(root, "src", issueSlug);

  let markdownFiles = [];
  if (fs.existsSync(issueDir)) {
    markdownFiles = fs
      .readdirSync(issueDir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => `src/${issueSlug}/${e.name}`)
      .sort();
  }

  const articles = markdownFiles.map((relFile) => {
    const fileSlug = path.basename(relFile, ".md");
    const raw = fs.readFileSync(path.join(root, relFile), "utf8");
    const frontMatter = parseFrontMatter(raw);
    const pdfExpected = frontMatter.pdf !== false;
    const pdfPath = `src/assets/${issueSlug}/${fileSlug}.pdf`;
    return { file: relFile, fileSlug, frontMatter, pdfExpected, pdfPath };
  });

  const builtHtml = { en: [], es: [], fr: [] };
  for (const { fileSlug } of articles) {
    builtHtml.en.push(`_site/${issueSlug}/${fileSlug}.html`);
    builtHtml.es.push(`_site/es/${issueSlug}/${fileSlug}.html`);
    builtHtml.fr.push(`_site/fr/${issueSlug}/${fileSlug}.html`);
  }

  return {
    issueSlug,
    issueNumber: meta.number ?? null,
    slugEs: meta.slug_es ?? null,
    slugFr: meta.slug_fr ?? null,
    imagesDir: findImagesDir(root, issueSlug),
    markdownFiles,
    articles,
    builtHtml,
  };
}

function main() {
  const { issueSlug, root } = parseArgs(process.argv);
  if (!issueSlug) {
    console.error("Usage: collect-issue.js <issueSlug> [--root <dir>]");
    process.exit(1);
  }
  const manifest = collect(root, issueSlug);
  process.stdout.write(JSON.stringify(manifest, null, 2));
}

main();
