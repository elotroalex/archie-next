module.exports = {
  layout: "article",
  lang: "en",
  tags: ["issue01"],
  eleventyComputed: {
    permalink: (data) => `issue01/${data.page.fileSlug}.html`,
    issueSlug: "issue01",
  },
};
