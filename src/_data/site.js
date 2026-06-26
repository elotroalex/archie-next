const issues = require("./issues.js");

const issueKeys = Object.keys(issues);
const currentKey = issueKeys[issueKeys.length - 1];

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
