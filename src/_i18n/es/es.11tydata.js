module.exports = {
  layout: "page",
  lang: "es",
  eleventyComputed: {
    // Pages can set `published: false` in their own front matter to be
    // excluded from the build entirely (e.g. a closed call for papers)
    // without deleting the source file.
    permalink: (data) => (data.published === false ? false : data.permalink),
  },
};
