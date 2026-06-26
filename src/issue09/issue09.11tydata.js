module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue09"],
  eleventyComputed: {
    permalink: (data) => `issue09/${data.page.fileSlug}.html`,
    issueSlug: "issue09",
  },
};
