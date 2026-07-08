#!/usr/bin/env node
// Checks every <img> belonging to the issue's own content (built English
// HTML is authoritative; es/fr pages render the same article body) for:
// existence on disk, non-empty alt text, minimum pixel width, alt text that
// looks like a raw filename, and duplicate alt text reused across multiple
// images within the same article.
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
//
// The tag-matching regex is quote-aware: a naive `[^>]*` stops at the FIRST
// `>` it sees, which breaks if an attribute value itself contains one (e.g.
// alt="Miranda's <em>Little Pep Talks</em> marketing." — real content found
// in issue04/machado-gratitude.md). `(?:[^>"]|"[^"]*")*` instead treats a
// fully-quoted "..." run as a single unit that can safely contain `>`.
function extractImgTags(html) {
  const tags = html.match(/<img\b(?:[^>"]|"[^"]*")*>/gi) || [];
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

// Flags alt text that's just the image's own filename (e.g. alt="schoolclass"
// for schoolclass.jpg) rather than an actual description — a copy-paste/
// intake shortcut that passes the "non-empty" check but tells a screen
// reader nothing useful.
function looksLikeFilename(alt, src) {
  const base = path.basename(src, path.extname(src)).toLowerCase().replace(/[-_\s]/g, "");
  const normalizedAlt = alt.trim().toLowerCase().replace(/[-_\s]/g, "");
  return normalizedAlt === base;
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
    const fileSlug = path.basename(htmlRelPath, ".html");

    // Tracked per article (not issue-wide) so two different articles reusing
    // the same generic alt text (e.g. both captioning a "photograph") isn't
    // a false positive — only a repeat within the same file is a real bug.
    const altsInThisArticle = new Map();

    for (const img of imgs) {
      if (img.hasAltAttr && img.alt.trim() !== "") {
        const list = altsInThisArticle.get(img.alt) || [];
        list.push(img.src);
        altsInThisArticle.set(img.alt, list);
      }

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
      } else if (looksLikeFilename(img.alt, img.src)) {
        problems.push(`alt text looks like a raw filename ("${img.alt}")`);
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

    for (const [alt, srcs] of altsInThisArticle) {
      if (srcs.length > 1) {
        fail = true;
        console.log(`FAIL - image: duplicate alt text "${alt}" used for ${srcs.length} images in ${fileSlug} (${srcs.join(", ")})`);
      }
    }
  }

  if (seen.size === 0) {
    console.log(`ok - image: no issue-owned images referenced in ${manifest.issueSlug}`);
  }

  process.exit(fail ? 1 : 0);
}

main();
