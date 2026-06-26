module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue03"],
  eleventyComputed: {
    permalink: (data) => `issue03/${data.page.fileSlug}.html`,
    issueSlug: "issue03",
  },
};
