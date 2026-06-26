// Generates /fr/issueXX/slug.html for every article in all three issues.

class FrArticles {
  data() {
    return {
      pagination: {
        data: "collections.allIssueArticles",
        size: 1,
        alias: "art",
        addAllPagesToCollections: false,
      },
      lang: "fr",
      eleventyComputed: {
        permalink: (data) =>
          `fr/${data.art.data.issueSlug}/${data.art.page.fileSlug}.html`,
        title: (data) => data.art.data.title,
        abstract: (data) => data.art.data.abstract,
        abstract_es: (data) => data.art.data.abstract_es,
        abstract_en: (data) => data.art.data.abstract_en,
        abstract_fr: (data) => data.art.data.abstract_fr,
        author: (data) => data.art.data.author,
        doi: (data) => data.art.data.doi,
        issue: (data) => data.art.data.issue,
        pubDate: (data) => data.art.data.pubDate,
        section: (data) => data.art.data.section,
        pdf: (data) => data.art.data.pdf,
        layout: (data) => data.art.data.layout,
        language: (data) => data.art.data.language,
        issueSlug: (data) => data.art.data.issueSlug,
      },
    };
  }

  render(data) {
    return data.art.content;
  }
}

module.exports = FrArticles;
