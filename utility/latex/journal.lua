-- archipelagos journal Pandoc Lua filter
-- Handles journal-specific elements: epigraphs, iframes, figures
-- Replaces the old contextStyles.py + ssed pipeline
-- luacheck: globals pandoc PANDOC_DOCUMENT PANDOC_VERSION
-- luacheck: globals is_url strip_trailing_punct unnest_links UrlLink BareUrl

-- Normalize title: if front matter has title.long / title.short (nested dict),
-- flatten it so $title$ renders correctly in the template.
-- In Pandoc 3.x Lua, MetaMap is a plain table with direct key access.
--
-- Also derive $it.orcid_id$ (the bare ORCID identifier, for link display
-- text) from $it.orcid$ for each author. This has to happen here rather
-- than in extract_meta.py: Pandoc's --metadata-file values for a field are
-- entirely discarded in favor of the document's own front matter whenever
-- both define that same top-level key, and every article's front matter
-- already defines `author`--so any per-author field extract_meta.py adds
-- (like orcid_id) is silently dropped before the template ever sees it.
function Meta(meta)
  if type(meta.title) == "table" then
    meta.title = meta.title["long"] or meta.title["short"] or meta.title
  end
  if meta.author then
    for _, a in ipairs(meta.author) do
      if type(a) == "table" and a.orcid then
        local orcid_str = pandoc.utils.stringify(a.orcid)
        local id = orcid_str:gsub("^https?://orcid%.org/", "")
        a.orcid_id = pandoc.MetaString(id)
      end
    end
  end
  return meta
end

-- Convert divs with class "epigraph" to LaTeX \epigraph{}{}.
-- The div content arrives as: RawBlock(<blockquote>), Plain(text),
-- RawBlock(</blockquote>), RawBlock(<p class="citation">), Plain(text), RawBlock(</p>)
-- We collect Plain/Para blocks in order: first = quote body, last = attribution.
function Div(el)
  if el.classes:includes("epigraph") then
    local plains = {}
    for _, block in ipairs(el.content) do
      if block.t == "Plain" or block.t == "Para" then
        plains[#plains + 1] = block
      end
    end
    local body_str = ""
    local attrib   = ""
    if #plains >= 2 then
      body_str = pandoc.utils.stringify(plains[1])
      attrib   = pandoc.utils.stringify(plains[2])
    elseif #plains == 1 then
      body_str = pandoc.utils.stringify(plains[1])
    end
    return pandoc.RawBlock("latex",
      "\\epigraph{" .. body_str .. "}{" .. attrib .. "}")
  end
end

-- Process the full document to convert <figure>…</figure> HTML block sequences
-- into proper LaTeX \includegraphics figures, since Pandoc splits them into
-- separate RawBlocks rather than a single parseable unit.
function Pandoc(doc)
  local out = {}
  local i   = 1
  while i <= #doc.blocks do
    local block = doc.blocks[i]
    if block.t == "RawBlock" and block.format == "html"
        and block.text:match("^<figure") then
      -- Collect everything until </figure>
      local img_src, img_alt, caption = "", "", ""
      local in_caption = false
      i = i + 1
      while i <= #doc.blocks do
        local inner = doc.blocks[i]
        i = i + 1
        if inner.t == "RawBlock" and inner.format == "html" then
          if inner.text:match("^</figure") then break end
          if inner.text:match("<figcaption") then in_caption = true end
          if inner.text:match("</figcaption") then in_caption = false end
          -- img may be in the RawBlock text itself (self-closing tag)
          local src = inner.text:match('src="([^"]+)"')
          local alt = inner.text:match('alt="([^"]+)"')
          if src then img_src = src end
          if alt and alt ~= "" then img_alt = alt end
        elseif inner.t == "Plain" or inner.t == "Para" then
          if in_caption then
            caption = pandoc.utils.stringify(inner)
          else
            -- img may be encoded as a RawInline inside a Plain block
            for _, inline in ipairs(inner.c) do
              if inline.t == "RawInline" and inline.format == "html" then
                local src = inline.text:match('src="([^"]+)"')
                local alt = inline.text:match('alt="([^"]+)"')
                if src then img_src = src end
                if alt and alt ~= "" then img_alt = alt end
              end
            end
          end
        end
      end
      if img_src ~= "" then
        -- Strip leading slash — lualatex resolves relative to resource-path
        local path = img_src:gsub("^/", "")
        -- Strip leaked HTML tags, trim whitespace, then escape LaTeX specials
        local function clean(s)
          s = s:gsub("<[^>]+>", ""):gsub("^%s+", ""):gsub("%s+$", "")
          -- Escape LaTeX special characters in plain caption text
          s = s:gsub("\\", "\\textbackslash{}")
          s = s:gsub("&",  "\\&")
          s = s:gsub("%%", "\\%%")
          s = s:gsub("#",  "\\#")
          s = s:gsub("%$", "\\$")
          s = s:gsub("_",  "\\_")
          s = s:gsub("%^", "\\^{}")
          s = s:gsub("~",  "\\textasciitilde{}")
          return s
        end
        local cap_text = clean(caption ~= "" and caption or img_alt)
        -- Use a plain styled paragraph for the caption rather than \caption{}:
        -- the journal already includes "Figure N." in its caption text, so
        -- LaTeX's auto-numbering ("Figure N:") would double-count.
        local latex = "\\begin{figure}[htbp]\n\\centering\n"
        latex = latex .. "\\includegraphics[width=\\linewidth,height=0.8\\textheight,keepaspectratio]{" .. path .. "}\n"
        if cap_text ~= "" then
          latex = latex .. "\\par\\vspace{0.4em}{\\small\\color{gray!80}" .. cap_text .. "}\n"
        end
        latex = latex .. "\\end{figure}"
        out[#out + 1] = pandoc.RawBlock("latex", latex)
      end
    -- Strip iframes and audio: replace with a note for PDF readers
    elseif block.t == "RawBlock" and block.format == "html"
        and (block.text:match("<iframe") or block.text:match("<audio")) then
      out[#out + 1] = pandoc.Para({
        pandoc.RawInline("latex",
          "\\textit{[Interactive content available in the online version.]}")
      })
      i = i + 1
    -- Strip loose HTML structural tags that Pandoc emits as their own RawBlocks
    elseif block.t == "RawBlock" and block.format == "html"
        and block.text:match("^</?%s*(%a+)") then
      local tag = block.text:match("^</?%s*(%a+)")
      local skip = { figcaption=true, figure=true, a=true }
      if skip[tag] then
        -- drop it silently
      else
        out[#out + 1] = block
      end
      i = i + 1
    else
      out[#out + 1] = block
      i = i + 1
    end
  end
  -- URL handling (see the section at the end of this file) runs here, over the
  -- body only, rather than as a top-level Link/Str filter. Pandoc applies
  -- element filters to metadata inlines too, and an author's `orcid:` front
  -- matter value is a bare URL: rewritten there, it reaches template.tex as
  -- \href{\url{...}}{...}, and the nested url.sty catcode scan blows the input
  -- stack ("TeX capacity exceeded").
  local body = pandoc.walk_block(pandoc.Div(out), { Link = UrlLink, Str = BareUrl })
  return pandoc.Pandoc(body.content, doc.meta)
end

-- Pandoc 3.x parses {.underline} as a first-class Underline inline node
-- and emits \ul{} in LaTeX, which requires the soul package. Strip it and
-- keep the content — redundant in PDFs where links are already coloured.
function Underline(el)
  return el.content
end

-- Strip inline HTML that Pandoc can't use in LaTeX (Liquid tags, etc.)
function RawInline(el)
  if el.format == "html" then
    if el.text:match("{%%") or el.text:match("{%-") then
      return {}
    end
  end
end

-- Strip {.mark} highlighted spans — Word copy-editing artifacts that produce
-- \hl{} in LaTeX, which requires the soul package (not in the template).
function Span(el)
  if el.classes:includes("mark") then
    return el.content
  end
end

-- Ensure native Pandoc Image elements don't overflow the text width,
-- and strip leading slash so lualatex resolves relative to resource-path.
function Image(el)
  el.attributes["width"] = nil
  el.src = el.src:gsub("^/", "")
  return el
end

-- Convert raw HTML tables (produced by the intake tables-to-html.lua filter)
-- back to Pandoc Table elements so lualatex renders them as proper LaTeX tables.
function RawBlock(el)
  if el.format == "html" and el.text:match("<table") then
    local doc = pandoc.read(el.text, "html")
    return doc.blocks
  end
end

-- ── URLs shown as their own text ──────────────────────────────────────────────
-- template.tex sets \urlstyle{same} and a break-anywhere \UrlBreaks, but that
-- only reaches text that actually goes through url.sty — i.e. \url{}. Two
-- common shapes in this journal's footnotes miss it:
--
--   [https://x.org/a](https://x.org/a/)  → \href{target}{plain text}
--        Pandoc only shortens a link to \url{} when its text and target match
--        exactly, so a trailing slash or an "http" vs "https" difference is
--        enough to lose it.
--   https://x.org/a                      → not a link at all; Pandoc's default
--        markdown reader has no autolink_bare_uris, so it stays plain text.
--
-- Either way the URL is typeset as one ordinary word with no break points, so
-- a long one forces TeX to stretch the whole line's interword glue — the white
-- space rivers in URL-heavy citation footnotes. Both are normalized here into
-- a Link whose text is exactly its target, which is the shape Pandoc's LaTeX
-- writer renders as \url{}.
--
-- Note this is deliberately *not* done by emitting raw \href{...}{\nolinkurl{...}}:
-- hand-built LaTeX has to hand-escape the target too, and a URL containing a
-- fragment (#) then blows up with "Illegal parameter number". Handing Pandoc a
-- normal Link instead keeps its own escaping in charge.

-- Scheme-qualified only, and non-empty after the scheme. A bare "www.foo.org"
-- is deliberately not matched: turning it into a link would mean inventing a
-- scheme for a target the author never wrote, and a scheme-less PDF link target
-- is not reliably resolvable anyway. Those keep their previous plain-text
-- treatment. (8 in the corpus as of issue 9, all short enough not to strand a
-- line.)
function is_url(s)
  return s:match("^%a[%w+.%-]*://[^%s]") ~= nil
end

-- Trailing sentence punctuation that a writer put after a bare URL, not in it.
function strip_trailing_punct(s)
  local core, tail = s, ""
  while #core > 0 and core:find("[%.,;:%)%]]$") do
    tail = core:sub(-1) .. tail
    core = core:sub(1, -2)
  end
  return core, tail
end

-- Any Link that ended up nested inside this inline list is replaced by its own
-- content. Markdown can't produce a link inside a link; the only ones that ever
-- show up here are the ones BareUrl just created inside an existing link's text,
-- and flattening them is how that gets undone.
function unnest_links(inlines)
  local out = {}
  for _, il in ipairs(inlines) do
    if il.t == "Link" then
      for _, inner in ipairs(il.content) do out[#out + 1] = inner end
    else
      out[#out + 1] = il
    end
  end
  return out
end

-- A link already showing its own URL: display the target verbatim, which is the
-- shape Pandoc's LaTeX writer renders as \url{}. The only visible change is
-- trivia the author didn't mean to assert (a dropped trailing slash), and it now
-- agrees with where the link actually goes.
function UrlLink(el)
  if is_url(pandoc.utils.stringify(el.content)) then
    el.content = { pandoc.Str(el.target) }
  else
    el.content = unnest_links(el.content)
  end
  return el
end

-- A bare URL in running text becomes a real link. It renders identically —
-- hyperref is configured colorlinks with allcolors=black — but gains url.sty's
-- break points, which is the whole point.
function BareUrl(el)
  if not is_url(el.text) then return nil end
  local core, tail = strip_trailing_punct(el.text)
  if not is_url(core) then return nil end
  local out = { pandoc.Link({ pandoc.Str(core) }, core) }
  if tail ~= "" then out[#out + 1] = pandoc.Str(tail) end
  return out
end

-- Note where these two get applied: not as top-level `Link`/`Str` filter
-- functions, but by the explicit pandoc.walk_block call inside Pandoc() above.
-- That keeps them off metadata (see the comment there), and it fixes them to a
-- bottom-up walk. Bottom-up is what makes this terminate — Pandoc does not
-- re-walk what a handler returns, whereas a topdown pass re-walks BareUrl's new
-- Link, finds the URL Str inside it, and loops forever building links inside
-- links. It also means BareUrl runs on a link's text before UrlLink runs on the
-- link itself, briefly nesting a link inside a link; UrlLink resolves that,
-- either by replacing the content outright or via unnest_links.
