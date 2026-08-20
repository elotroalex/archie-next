# Inline text normalization applied to Pandoc's markdown output during intake.
# Run as: ISSUE_SLUG=issueXX perl -CSD -p normalize-inline.pl file.md
#
# Perl rather than sed, deliberately. These substitutions match multibyte
# characters, and BSD sed (macOS) matches *bytes* unless the caller's locale is
# UTF-8: in the C locale a class like ["] becomes the byte set E2 80 9C 9D, so
# it also chews the first two bytes of every other U+20xx character -- em dash
# (E2 80 94), en dash (E2 80 93), ellipsis (E2 80 A6), narrow no-break space
# (E2 80 AF) -- replacing them and orphaning the trailing byte. The output is
# then not valid UTF-8. That made correctness depend on the caller's
# environment, so intake run from cron, CI, or a shell without LANG produced
# silently corrupted files. `perl -CSD` decodes UTF-8 itself, so behaviour is
# identical everywhere.
#
# \x27 is an apostrophe, escaped so callers can wrap this in single quotes.

# Image paths -> absolute /issueXX/images/..., so they resolve on the /es/ and
# /fr/ variants, which are served from a different depth.
s{\]\(images/}{](/$ENV{ISSUE_SLUG}/images/}g;

# Word copy-editing artifacts Pandoc preserves but the pipeline can't use:
#   {.mark}      highlighted text -> \hl{} in LaTeX, needs the soul package
#   {.underline} underlined text, usually Word's auto-underlined hyperlinks,
#                which otherwise leave stray literal braces in rendered HTML
s/\[([^\]]*)\]\{\.mark\}/$1/g;
s/\[([^\][]*)\]\{\.underline\}/$1/g;

# Quotes the Unicode bidi algorithm tagged as right-to-left.
s/\["\]\{dir="rtl"\}/"/g;
s/\[\x27\]\{dir="rtl"\}/\x27/g;
s/\["\x27\]\{dir="rtl"\}/"\x27/g;

# Curly/smart quotes (a Word autocorrect artifact; contributors are asked to
# avoid them) -> the same escaped straight-quote form Pandoc already uses for
# every other quote in the document, so the output style stays consistent.
s/[\x{201C}\x{201D}]/\\"/g;
s/[\x{2018}\x{2019}]/\\\x27/g;
