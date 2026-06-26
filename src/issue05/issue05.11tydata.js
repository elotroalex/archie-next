module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue05"],
  eleventyComputed: {
    permalink: (data) => `issue05/${data.page.fileSlug}.html`,
    issueSlug: "issue05",
  },
};
