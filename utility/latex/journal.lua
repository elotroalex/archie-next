-- archipelagos journal Pandoc Lua filter
-- Handles journal-specific elements: epigraphs, iframes (omitted), figure captions
-- Replaces the old contextStyles.py + ssed pipeline

-- Strip iframe embeds from PDF output (they're HTML-only)
function RawBlock(el)
  if el.format == "html" then
    if el.text:match("<iframe") or el.text:match("<audio") then
      return pandoc.Para({
        pandoc.RawInline("latex",
          "\\begin{quoting}[leftmargin=0pt]\\textit{[Interactive content available in the online version.]}\\end{quoting}")
      })
    end
  end
end

-- Handle Jekyll-style liquid include tags left in markdown
-- e.g. {% include image.html ... %} → strip silently
function RawInline(el)
  if el.format == "html" then
    return {}
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
    local source = ""
    local content = {}
    for _, block in ipairs(el.content) do
      if block.t == "Para" then
        local text = pandoc.utils.stringify(block)
        -- Last Para is typically the attribution
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
