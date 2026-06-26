const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const i18nDir = path.join(__dirname, "../_i18n");
const result = {};

for (const lang of ["en", "es", "fr"]) {
  const file = path.join(i18nDir, `${lang}.yml`);
  if (fs.existsSync(file)) {
    result[lang] = yaml.load(fs.readFileSync(file, "utf8"));
  }
}

module.exports = result;
