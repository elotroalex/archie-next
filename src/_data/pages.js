// Load the translated content for info pages from _i18n language directories
const fs = require("fs");
const path = require("path");

const i18nDir = path.join(__dirname, "../_i18n");
const langs = ["en", "es", "fr"];
const pageKeys = ["about", "authors", "credits", "reviewers", "workflow", "valences"];

const result = {};
for (const lang of langs) {
  result[lang] = {};
  for (const key of pageKeys) {
    const file = path.join(i18nDir, lang, key, `${key}.md`);
    if (fs.existsSync(file)) {
      result[lang][key] = fs.readFileSync(file, "utf8");
    } else {
      result[lang][key] = "";
    }
  }
}

module.exports = result;
