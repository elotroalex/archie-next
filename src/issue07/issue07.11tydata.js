module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue07"],
  eleventyComputed: {
    permalink: (data) => `issue07/${data.page.fileSlug}.html`,
    issueSlug: "issue07",
  },
};
