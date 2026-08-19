#!/usr/bin/env node
// Renders log.md (repo root) from the captured output of a check-issue.sh
// run: raw text for most checks, plus structured file/image/problem rows
// for the images check and file/line-resolved, internal/external-split
// rows for the links check.
//
// Usage: node generate-log.js <issueSlug> <outputPath> \
//   --text <name>=<path> [--text <name>=<path> ...] \
//   --images-json <path> --links-json <path>
//
// Each --text entry captures one check's raw stdout under a named section.

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = argv.slice(2);
  const issueSlug = args[0];
  const outputPath = args[1];
  const textSections = [];
  let imagesJson = null;
  let linksJson = null;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === "--text" && args[i + 1]) {
      const [name, ...rest] = args[i + 1].split("=");
      textSections.push({ name, path: rest.join("=") });
      i++;
    } else if (args[i] === "--images-json" && args[i + 1]) {
      imagesJson = args[i + 1];
      i++;
    } else if (args[i] === "--links-json" && args[i + 1]) {
      linksJson = args[i + 1];
      i++;
    }
  }
  return { issueSlug, outputPath, textSections, imagesJson, linksJson };
}

function readTextOrEmpty(p) {
  if (!p || !fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf8").trim();
}

const ACRONYMS = { i18n: "i18n", pdfs: "PDFs", html: "HTML" };

function titleCase(name) {
  return name
    .split(" ")
    .map((word) => ACRONYMS[word.toLowerCase()] || word.replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" ");
}

function renderTextSection(name, text) {
  const body = text ? "```\n" + text + "\n```" : "_No output captured._";
  return `## ${titleCase(name)}\n\n${body}\n`;
}

function renderImagesSection(imagesJson) {
  let entries = [];
  if (imagesJson && fs.existsSync(imagesJson)) {
    entries = JSON.parse(fs.readFileSync(imagesJson, "utf8"));
  }
  if (entries.length === 0) {
    return "## Images\n\n_No image problems found._\n";
  }
  const rows = entries
    .map((e) => `| ${e.file || "—"} | ${e.image || "—"} | ${e.problem || "—"} |`)
    .join("\n");
  return [
    "## Images",
    "",
    `${entries.length} problem(s) found.`,
    "",
    "| File | Image | Problem |",
    "|---|---|---|",
    rows,
    "",
  ].join("\n");
}

function renderLinksSubsection(title, rows, options = {}) {
  const { emptyText = "_No broken links found._", note = null } = options;
  if (rows.length === 0) {
    return [`### ${title}`, "", emptyText, ""].join("\n");
  }
  const body = rows
    .map((r) => `| ${r.file || "—"}${r.line ? ":" + r.line : ""} | ${r.url} | ${r.error} |`)
    .join("\n");
  return [
    `### ${title}`,
    "",
    `${rows.length} ${options.countLabel || "broken/unresolved link(s)"}.`,
    ...(note ? ["", note] : []),
    "",
    "| File:Line | URL | Error |",
    "|---|---|---|",
    body,
    "",
  ].join("\n");
}

function renderLinksSection(linksJson) {
  let data = { internal: [], external: [], tolerated: [] };
  if (linksJson && fs.existsSync(linksJson)) {
    data = JSON.parse(fs.readFileSync(linksJson, "utf8"));
  }
  return [
    "## Links",
    "",
    renderLinksSubsection("Internal", data.internal || []),
    renderLinksSubsection("External", data.external || []),
    renderLinksSubsection("Tolerated (flaky domains)", data.tolerated || [], {
      countLabel: "link(s) on domains listed in `utility/check-issue/flaky-domains.json`",
      note:
        "These did not fail the check. They are web archives, DOI and handle resolvers " +
        "that rate-limit under a recursive crawl, so a failure here usually means the " +
        "crawler was throttled rather than that the link is dead. Worth a spot-check " +
        "before publication, but not a blocker. A 404 or 410 on these domains is still " +
        "reported as a real failure above.",
      emptyText: "_No tolerated failures._",
    }),
  ].join("\n");
}

function main() {
  const { issueSlug, outputPath, textSections, imagesJson, linksJson } = parseArgs(process.argv);
  if (!issueSlug || !outputPath) {
    console.error(
      "Usage: generate-log.js <issueSlug> <outputPath> --text <name>=<path> [...] --images-json <path> --links-json <path>"
    );
    process.exit(1);
  }

  const parts = [
    `# Issue Integrity Log — ${issueSlug}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
  ];

  for (const { name, path: p } of textSections) {
    const lower = name.toLowerCase();
    if (lower === "images" || lower === "links") continue; // handled specially below
    parts.push(renderTextSection(name, readTextOrEmpty(p)));
  }

  parts.push(renderImagesSection(imagesJson));
  parts.push(renderLinksSection(linksJson));

  fs.writeFileSync(path.resolve(outputPath), parts.join("\n"));
  console.log(`Wrote ${outputPath}`);
}

main();
