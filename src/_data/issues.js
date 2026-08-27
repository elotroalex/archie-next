// Publisher by era, because the journal's institutional home changed twice:
// the Small Axe Project for issues 1-3, when it was called Small Axe
// Archipelagos; Columbia University Libraries from issue 4, when that
// partnership became official; and Yale University Library from issue 9.
// (Columbia collaborated informally on DOIs before issue 4.) It lives per issue
// rather than in site.js because it is a property of when a piece was
// published, not of the site today -- back issues must keep saying Columbia
// in their DC.publisher, citation_publisher and JSON-LD.
// Issue metadata — migrated from _config.yml collections block
//
// The LAST key here is always treated as the current issue (src/_data/site.js
// derives `current`/`current-number` from it) -- add new issues as the last
// entry, in increasing `number` order. site.js throws at build time if the
// last key isn't also the highest-numbered issue, to catch accidental
// reordering.
module.exports = {
  issue01: {
    slug: "issue01",
    slug_fr: "fr/issue01",
    slug_es: "es/issue01",
    number: 1,
    publisher: "Small Axe Project",
    date: "June 2016",
    title: "Issue (1)",
    editors: ["Kaiama Glover", "Alex Gil", "Kelly Baker Josephs"],
    production: ["Alex Gil", "Dennis Tenen", "Brian Ballsun-Stanton", "Kelly S. Martin"],
  },
  issue02: {
    slug: "issue02",
    slug_fr: "fr/issue02",
    slug_es: "es/issue02",
    number: 2,
    publisher: "Small Axe Project",
    date: "September 2017",
    title: "Issue (2)",
    editors: ["Kaiama Glover", "Alex Gil"],
    production: ["Alex Gil", "Brian Ballsun-Stanton", "Kelly S. Martin"],
  },
  issue03: {
    slug: "issue03",
    slug_fr: "fr/issue03",
    slug_es: "es/issue03",
    number: 3,
    publisher: "Small Axe Project",
    date: "July 2019",
    title: "Issue (3)",
    editors: ["Kaiama Glover", "Alex Gil", "Jessica Marie Johnson"],
    production: ["Alex Gil", "Brian Ballsun-Stanton", "Kelly S. Martin"],
    // Every interactive is two things: a `companion` markdown page in this
    // issue's directory carrying the linear text, standard metadata and the
    // DOI -- which is what the TOC, search and citations point at -- and the
    // flat HTML/JS at `url`, the authored experience.
    //
    // `url` is the only field the build reads: it drives the passthrough +
    // ignore loop in .eleventy.js and the raw page's sitemap entry. `title`
    // and `author` are documentation of the pairing; the TOC takes those from
    // the companion's own front matter.
    interactives: [
      {
        title: ".break .dance",
        author: ["Marisa Parham"],
        companion: "/issue03/parham.html",
        url: "/issue03/parham/parham.html",
      },
      {
        title: "Breaking, Dancing, Making in the Machine: Notes on \".break .dance\"",
        author: ["Marisa Parham"],
        companion: "/issue03/parham-process.html",
        url: "/issue03/parham-process/parham-process.html",
      },
    ],
  },
  issue04: {
    slug: "issue04",
    slug_fr: "fr/issue04",
    slug_es: "es/issue04",
    number: 4,
    publisher: "Columbia University Libraries",
    date: "March 2020",
    title: "Issue (4)",
    editors: ["Kaiama Glover", "Alex Gil"],
    production: ["Alex Gil", "Brian Ballsun-Stanton"],
  },
  issue05: {
    slug: "issue05",
    slug_fr: "fr/issue05",
    slug_es: "es/issue05",
    number: 5,
    publisher: "Columbia University Libraries",
    date: "December 2020",
    title: "Issue (5)",
    editors: ["Kaiama Glover", "Alex Gil"],
    production: ["Alex Gil", "Brian Ballsun-Stanton"],
  },
  issue06: {
    slug: "issue06",
    slug_fr: "fr/issue06",
    slug_es: "es/issue06",
    number: 6,
    publisher: "Columbia University Libraries",
    date: "May 2022",
    title: "Issue (6)",
    editors: ["Kaiama Glover", "Alex Gil"],
    production: ["Alex Gil", "Brian Ballsun-Stanton"],
  },
  issue07: {
    slug: "issue07",
    slug_fr: "fr/issue07",
    slug_es: "es/issue07",
    number: 7,
    publisher: "Columbia University Libraries",
    date: "May 2023",
    title: "Issue (7)",
    editors: ["Kaiama Glover", "Alex Gil"],
    production: ["Alex Gil", "Brian Ballsun-Stanton", "Winnie E. Pérez Martínez"],
  },
  issue08: {
    slug: "issue08",
    slug_fr: "fr/issue08",
    slug_es: "es/issue08",
    number: 8,
    publisher: "Columbia University Libraries",
    date: "April 2025",
    title: "Issue (8)",
    editors: ["Kaiama Glover", "Alex Gil"],
    production: ["Alex Gil", "Brian Ballsun-Stanton", "Winnie E. Pérez Martínez"],
  },
  issue09: {
    slug: "issue09",
    slug_fr: "fr/issue09",
    slug_es: "es/issue09",
    number: 9,
    publisher: "Yale University Library",
    date: "July 2026",
    title: "Issue (9)",
    editors: ["Kaiama Glover", "Alex Gil"],
    production: ["Alex Gil", "Isabella García Bernstein"],
  },
};
