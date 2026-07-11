#!/usr/bin/env node
// GitHub Pages staging deploy serves the site under a /archie-next/ subpath
// (ELEVENTY_PATH_PREFIX in build.yml), but article markdown hardcodes
// root-absolute image paths (e.g. src="/issue09/images/foo.jpg") — those
// never go through Eleventy's `url` filter because markdown is never
// rendered through Nunjucks (markdownTemplateEngine: false in .eleventy.js),
// so the prefix never gets applied to them. Everything template-generated
// (nav, css/js links, page-to-page links) already goes through `| url` and
// is unaffected.
//
// This is a CI-only postprocess: it rewrites the already-built _site HTML
// in place, so local dev and the production rsync deploy (which never sets
// a path prefix) are untouched. Only src="/..." and href="/..." that don't
// already start with the prefix are rewritten, so it's safe to run even if
// some paths are already correctly prefixed.
//
// Usage: node fix-staging-paths.js --prefix /archie-next/ [--root _site]

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = argv.slice(2);
  let prefix = null;
  let root = path.resolve(__dirname, "..", "_site");
  const prefixIdx = args.indexOf("--prefix");
  if (prefixIdx !== -1 && args[prefixIdx + 1]) {
    prefix = args[prefixIdx + 1];
  }
  const rootIdx = args.indexOf("--root");
  if (rootIdx !== -1 && args[rootIdx + 1]) {
    root = path.resolve(args[rootIdx + 1]);
  }
  return { prefix, root };
}

function walkHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

// Root-relative paths only: leading "/" but not "//" (protocol-relative)
// and not already prefixed.
function needsPrefix(value, prefix) {
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith(prefix);
}

function rewriteFile(filePath, prefix) {
  const original = fs.readFileSync(filePath, "utf8");
  const rewritten = original.replace(
    /\b(src|href)=(["'])(\/[^"']*)\2/g,
    (match, attr, quote, value) => {
      if (!needsPrefix(value, prefix)) return match;
      return `${attr}=${quote}${prefix.replace(/\/$/, "")}${value}${quote}`;
    }
  );
  if (rewritten !== original) {
    fs.writeFileSync(filePath, rewritten, "utf8");
    return true;
  }
  return false;
}

function main() {
  const { prefix, root } = parseArgs(process.argv);

  if (!prefix || prefix === "/") {
    console.log("fix-staging-paths: no path prefix set, nothing to do.");
    return;
  }

  if (!fs.existsSync(root)) {
    console.error(`fix-staging-paths: root not found: ${root}`);
    process.exit(1);
  }

  const files = walkHtmlFiles(root);
  let changedCount = 0;
  for (const file of files) {
    if (rewriteFile(file, prefix)) changedCount++;
  }

  console.log(
    `fix-staging-paths: rewrote root-absolute src/href paths in ${changedCount}/${files.length} HTML file(s) with prefix "${prefix}".`
  );
}

main();
