module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue06"],
  eleventyComputed: {
    permalink: (data) => `issue06/${data.page.fileSlug}.html`,
    issueSlug: "issue06",
  },
};
