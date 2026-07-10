const issues = require("./issues.js");

const issueKeys = Object.keys(issues);
const currentKey = issueKeys[issueKeys.length - 1];

// The "current issue" convention (see CLAUDE.md / issues.js) is that it's
// always the *last key* in issues.js -- there's no explicit `current:` flag.
// That's easy to break silently by reordering or inserting an issue out of
// sequence, so fail the build loudly if the last key doesn't also have the
// highest `number`.
const maxNumberKey = issueKeys.reduce((a, b) => (issues[a].number > issues[b].number ? a : b));
if (maxNumberKey !== currentKey) {
  throw new Error(
    `issues.js: last key "${currentKey}" (number ${issues[currentKey].number}) is not the highest-numbered issue ` +
      `("${maxNumberKey}" is number ${issues[maxNumberKey].number}). The current issue is derived from the last key in ` +
      `issues.js -- reorder it so the highest-numbered issue is last, or fix the "number" field.`
  );
}

module.exports = {
  title: "archipelagos",
  publisher: "Columbia University Libraries",
  description: "a journal of Caribbean digital praxis",
  url: "http://archipelagosjournal.org",
  baseurl: "",
  githuburl: "https://github.com/archipelagosjournal/",
  old_issn: "2473-2206",
  issn: "2689-842X",
  current: currentKey,
  "current-number": issues[currentKey].number,
  languages: ["en", "es", "fr"],
};
