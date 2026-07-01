#!/usr/bin/env node
// Checks every <img> belonging to the issue's own content (built English
// HTML is authoritative; es/fr pages render the same article body) for:
// existence on disk, non-empty alt text, and minimum pixel width.
//
// Usage: node check-images.js <manifestPath> [--root <dir>]

const fs = require("fs");
const path = require("path");
const { imageSize } = require("image-size");

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

function loadConfig() {
  const configPath = path.join(__dirname, "check-issue.config.json");
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

// Extracts {src, alt} for every <img> tag in an HTML string, tolerant of
// attribute order (matches the templated markup: src/alt/width/height/loading
// appear in varying order across legacy vs. new-issue figure markup).
function extractImgTags(html) {
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  return tags.map((tag) => {
    const srcMatch = tag.match(/\bsrc="([^"]*)"/);
    const altMatch = tag.match(/\balt="([^"]*)"/);
    return {
      tag,
      src: srcMatch ? srcMatch[1] : null,
      alt: altMatch ? altMatch[1] : null,
      hasAltAttr: altMatch !== null,
    };
  });
}

function belongsToIssue(src, issueSlug) {
  if (!src) return false;
  return src.startsWith(`/${issueSlug}/images/`) || src.startsWith(`/images/${issueSlug}/`);
}

function main() {
  const { manifestPath, root } = parseArgs(process.argv);
  if (!manifestPath) {
    console.error("Usage: check-images.js <manifestPath> [--root <dir>]");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const { minImageWidthPx } = loadConfig();
  let fail = false;
  const seen = new Set();

  for (const htmlRelPath of manifest.builtHtml.en) {
    const htmlPath = path.join(root, htmlRelPath);
    if (!fs.existsSync(htmlPath)) {
      console.log(`FAIL - image: built file missing, cannot check images (${htmlRelPath})`);
      fail = true;
      continue;
    }
    const html = fs.readFileSync(htmlPath, "utf8");
    const imgs = extractImgTags(html).filter((img) => belongsToIssue(img.src, manifest.issueSlug));

    for (const img of imgs) {
      if (seen.has(img.src)) continue;
      seen.add(img.src);

      const problems = [];
      const filePath = path.join(root, "src", img.src.replace(/^\//, ""));

      if (!fs.existsSync(filePath)) {
        console.log(`FAIL - image: ${img.src} does not exist on disk`);
        fail = true;
        continue;
      }

      if (!img.hasAltAttr || img.alt.trim() === "") {
        problems.push("missing alt text");
      }

      let width;
      try {
        width = imageSize(fs.readFileSync(filePath)).width;
        if (width < minImageWidthPx) {
          problems.push(`${width}px < ${minImageWidthPx}px minimum`);
        }
      } catch (e) {
        problems.push(`could not read dimensions (${e.message})`);
      }

      if (problems.length === 0) {
        console.log(`ok - image: ${img.src} (${width}px, alt present)`);
      } else {
        console.log(`FAIL - image: ${img.src} — ${problems.join("; ")}`);
        fail = true;
      }
    }
  }

  if (seen.size === 0) {
    console.log(`ok - image: no issue-owned images referenced in ${manifest.issueSlug}`);
  }

  process.exit(fail ? 1 : 0);
}

main();
