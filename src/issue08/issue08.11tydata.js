module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue08"],
  eleventyComputed: {
    permalink: (data) => `issue08/${data.page.fileSlug}.html`,
    issueSlug: "issue08",
  },
};
