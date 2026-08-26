const fs = require("fs");
const path = require("path");

const STOP_WORDS = new Set([
  // English
  "the","and","for","are","but","not","you","all","any","can","had","her","was","one","our","out","day","get","has","him","his","how","its","may","now","off","old","own","see","set","two","way","who","did","let","put","say","she","too","use","man","men","ago","via","per","yet","nor","got","lot","big","few","far","due","inc","ltd","etc","say","got","yes","ago","due","far","set","put","get","let","did","two","old","own","our","now","off","its","him","has","her","had","can","but","are","and","all","any","also","been","come","does","each","even","from","give","going","good","have","here","into","just","keep","know","like","look","made","make","many","more","most","much","must","need","next","only","open","other","over","part","said","same","show","some","take","than","that","them","then","there","they","this","time","under","used","very","want","well","were","what","when","will","with","would","year","your","about","after","again","also","back","been","both","case","come","does","down","each","even","first","from","give","going","good","have","here","into","just","keep","know","like","look","made","make","many","more","most","much","must","need","next","only","open","other","over","part","said","same","show","some","take","than","that","them","then","there","they","this","time","under","used","very","want","well","were","what","when","will","with","would","year","your","across","almost","along","already","among","another","around","because","before","between","comes","could","during","every","found","given","going","having","helped","however","include","including","indeed","instead","later","local","might","never","often","once","other","rather","really","right","since","still","such","these","thing","those","though","through","today","toward","until","using","value","which","while","whose","within","without","above","below","being","doing","going","says","said","like","just","back","also","well","even","only","than","then","they","them","that","this","with","from","have","will","were","been","when","what","more","your","into","over","make","take","know",
  // Spanish
  "los","las","del","que","una","con","por","para","como","pero","más","sus","son","hay","ser","una","uno","han","fue","era","sin","nos","les","mis","más","qué","así","solo","sido","ante","bajo","este","esta","estos","estas","ese","esa","esos","esas","aquel","aquella","otro","otra","otros","otras","todo","toda","todos","todas","algo","alguien","algún","alguna","algunos","algunas","mucho","mucha","muchos","muchas","poco","poca","pocos","pocas","tanto","tanta","tantos","tantas","cuyo","cuya","cuyos","cuyas","cuanto","cuanta","cuantos","cuantas","aunque","porque","cuando","donde","quien","quién","cuál","cual","cuáles","según","entre","sobre","hasta","desde","hacia","mediante","durante","contra","versus","cada","mismo","misma","mismos","mismas","además","también","tampoco","sino","pues","luego","entonces","mientras","antes","después","nunca","siempre","aquí","ahí","allí","acá","allá","hoy","ayer","mañana","ahora","bien","mal","muy","tan","más","menos",
  // French
  "les","des","une","est","pas","sur","par","qui","que","son","ses","dans","avec","pour","mais","elle","ils","elles","nous","vous","leur","leurs","tout","tous","cette","ceci","cela","même","plus","moins","très","aussi","puis","donc","ainsi","comme","quand","dont","doit","était","sont","avoir","fait","peut","faire","être","dit","ces","aux","ont","été","bien","car","ici","lors","peu","quel","quels","quelle","quelles","aucun","aucune","autre","autres","chaque","plusieurs","entre","après","avant","sans","sous","depuis","selon","jamais","toujours","encore","déjà","puis","lors","chez","vers",
]);

function stripHtml(html) {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function filterStops(text) {
  const seen = new Set();
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúüñàâçèêëîïôùûœæ\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => {
      if (w.length <= 2 || STOP_WORDS.has(w) || seen.has(w)) return false;
      seen.add(w);
      return true;
    })
    .join(" ");
}

class SearchIndex {
  data() {
    return {
      permalink: "/search-index.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ collections, issues }) {
    const index = (collections.allIssueArticles || []).map((item) => {
      const raw = stripHtml(item.templateContent || "");
      return {
        title: item.data.title?.long || item.data.title || "",
        short: item.data.title?.short || "",
        authors: (item.data.author || []).map((a) => a.name).join(", "),
        abstract: item.data.abstract || "",
        issue: item.data.issue || "",
        section: item.data.section || "",
        pubDate: item.data.pubDate || "",
        lang: item.data.language || "en",
        // Raw canonical (English) path, e.g. "/issue09/daut.html" -- NOT
        // prefixed with pathPrefix or a language here. search-script.njk
        // builds the final href client-side so it can localize the link
        // to whichever language's search page produced the result (see
        // the localizeUrl filter in .eleventy.js for the server-side
        // equivalent of this same fix in toc.njk).
        url: item.url,
        content: filterStops(raw),
      };
    });

    // Interactives (e.g. the Parham choreo-essay) are passthrough HTML
    // declared in issues.js, not markdown, so Eleventy never puts them in a
    // collection and they were absent from this index entirely -- searching
    // the site for "break dance" or "Parham" returned nothing. Add them from
    // their issues.js metadata, reading the source file for whatever text the
    // page actually exposes. That is very little for JS-driven pieces (the
    // choreo-essay has ~47 characters of markup text), so the title and
    // authors do most of the work here -- which is the point: findable by
    // name beats invisible.
    for (const [issueKey, issue] of Object.entries(issues || {})) {
      for (const piece of issue.interactives || []) {
        let text = "";
        try {
          const src = path.join(__dirname, piece.url.replace(/^\//, ""));
          text = stripHtml(fs.readFileSync(src, "utf8"));
        } catch (e) {
          // Not fatal: a missing source file just means no body text for this
          // entry. Title and authors still make it findable.
        }
        index.push({
          title: piece.title || "",
          short: "",
          authors: (piece.author || []).join(", "),
          abstract: "",
          issue: String(issue.number || ""),
          section: "interactives",
          pubDate: issue.date || "",
          lang: "en",
          url: piece.url,
          content: filterStops(text),
        });
      }
    }

    return JSON.stringify(index);
  }
}

module.exports = SearchIndex;
