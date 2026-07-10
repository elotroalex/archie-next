// Generates /es/issueXX/slug.html for every article in all three issues.
// These pages render with lang: "es" so UI strings appear in Spanish,
// while the article content itself stays as written (English primary).
// Shared logic lives in ../_includes/issue-articles-template.js — see the
// fr/ variant for the other language using the same factory.
module.exports = require("../_includes/issue-articles-template.js")("es");
