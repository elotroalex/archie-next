// Shared factory behind src/es/issue-articles.11ty.js and
// src/fr/issue-articles.11ty.js — both generate /{lang}/issueXX/slug.html
// for every article in collections.allIssueArticles, forwarding every
// front-matter field via eleventyComputed so the translated-language page
// has the same data available as the English original. The two language
// variants were previously near-identical hand-duplicated files; any field
// added to one had to be remembered for the other. Now there's one place
// to add a field, called once per language.
module.exports = function makeIssueArticlesClass(lang) {
  return class IssueArticles {
    data() {
      return {
        pagination: {
          data: "collections.allIssueArticles",
          size: 1,
          alias: "art",
          addAllPagesToCollections: false,
        },
        lang,
        eleventyComputed: {
          permalink: (data) =>
            `${lang}/${data.art.data.issueSlug}/${data.art.page.fileSlug}.html`,
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
          image: (data) => data.art.data.image,
          thumb: (data) => data.art.data.thumb,
          link: (data) => data.art.data.link,
        },
      };
    }

    render(data) {
      return data.art.content;
    }
  };
};
