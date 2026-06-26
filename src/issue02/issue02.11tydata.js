module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue02"],
  eleventyComputed: {
    permalink: (data) => `issue02/${data.page.fileSlug}.html`,
    issueSlug: "issue02",
  },
};
