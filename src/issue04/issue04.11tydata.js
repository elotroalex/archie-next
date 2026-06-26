module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue04"],
  eleventyComputed: {
    permalink: (data) => `issue04/${data.page.fileSlug}.html`,
    issueSlug: "issue04",
  },
};
