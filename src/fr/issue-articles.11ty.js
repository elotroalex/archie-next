// Generates /fr/issueXX/slug.html for every article in all three issues.
// Shared logic lives in ../_includes/issue-articles-template.js — see the
// es/ variant for the other language using the same factory.
module.exports = require("../_includes/issue-articles-template.js")("fr");
