-- archipelagos journal Pandoc Lua filter
-- Handles journal-specific elements: epigraphs, iframes (omitted), figure captions
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

-- Strip iframe/audio embeds from PDF output (they're HTML-only); let everything else through.
function RawBlock(el)
  if el.format == "html" then
    if el.text:match("<iframe") or el.text:match("<audio") then
      return pandoc.Para({
        pandoc.RawInline("latex",
          "\\textit{[Interactive content available in the online version.]}")
      })
    end
    -- Strip any remaining Jekyll Liquid tags silently
    if el.text:match("{%%") or el.text:match("{%-") then
      return {}
    end
  end
end

-- Strip inline HTML that Pandoc can't use in LaTeX (Liquid tags, etc.)
function RawInline(el)
  if el.format == "html" then
    if el.text:match("{%%") or el.text:match("{%-") then
      return {}
    end
  end
end

-- Ensure images don't overflow text width
function Image(el)
  el.attributes["width"] = nil
  return el
end

-- Convert divs with class "epigraph" to LaTeX epigraph
function Div(el)
  if el.classes:includes("epigraph") then
    local content = {}
    for _, block in ipairs(el.content) do
      if block.t == "Para" then
        content[#content + 1] = block
      end
    end
    -- Wrap in \epigraph{}{}
    local body_blocks = {}
    local attrib = ""
    if #content >= 2 then
      attrib = pandoc.utils.stringify(content[#content])
      body_blocks = {table.unpack(content, 1, #content - 1)}
    else
      body_blocks = content
    end
    local body_str = pandoc.write(pandoc.Pandoc(body_blocks), "latex")
    return pandoc.RawBlock("latex",
      "\\epigraph{" .. body_str .. "}{" .. attrib .. "}")
  end
end
