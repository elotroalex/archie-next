-- Convert Pandoc Table elements to raw HTML during docx→markdown conversion.
-- Grid tables produced by Pandoc from Word files are not supported by markdown-it,
-- so we emit them as HTML tables, which markdown-it passes through (html: true)
-- and which the PDF pipeline's journal.lua filter reads back as Pandoc Tables.
function Table(el)
  local html = pandoc.write(pandoc.Pandoc({el}), 'html')
  return pandoc.RawBlock('html', html)
end
