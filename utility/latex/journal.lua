-- archipelagos journal Pandoc Lua filter
-- Handles journal-specific elements: epigraphs, iframes, figures
-- Replaces the old contextStyles.py + ssed pipeline
-- luacheck: globals pandoc PANDOC_DOCUMENT PANDOC_VERSION

-- Normalize title: if front matter has title.long / title.short (nested dict),
-- flatten it so $title$ renders correctly in the template.
-- In Pandoc 3.x Lua, MetaMap is a plain table with direct key access.
function Meta(meta)
  if type(meta.title) == "table" then
    meta.title = meta.title["long"] or meta.title["short"] or meta.title
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
        local latex = "\\begin{figure}[htbp]\n\\centering\n"
        latex = latex .. "\\includegraphics[width=\\linewidth]{" .. path .. "}\n"
        if caption ~= "" then
          latex = latex .. "\\caption{" .. caption:gsub("{", "\\{"):gsub("}", "\\}") .. "}\n"
        elseif img_alt ~= "" then
          latex = latex .. "\\caption{" .. img_alt:gsub("{", "\\{"):gsub("}", "\\}") .. "}\n"
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
  return pandoc.Pandoc(out, doc.meta)
end

-- Strip inline HTML that Pandoc can't use in LaTeX (Liquid tags, etc.)
function RawInline(el)
  if el.format == "html" then
    if el.text:match("{%%") or el.text:match("{%-") then
      return {}
    end
  end
end

-- Ensure native Pandoc Image elements don't overflow the text width
function Image(el)
  el.attributes["width"] = nil
  return el
end
