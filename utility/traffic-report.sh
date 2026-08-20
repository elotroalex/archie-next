#!/bin/bash
# Traffic report for the journal, read from the production Apache access log.
#
#   bash utility/traffic-report.sh              # whole site, current month
#   bash utility/traffic-report.sh issue09      # just issue09 (all languages)
#   bash utility/traffic-report.sh issue09 --archive Aug-2026
#   bash utility/traffic-report.sh --all-logs   # current + every archive
#
# Why this exists: cPanel's AWStats is not usable for per-article numbers on
# this domain -- its top-pages section comes back empty -- and it offers no way
# to ask "everything under /issue09/". Google Search Console covers Google
# search traffic only, which misses the citation- and syllabus-following
# readers who are a real share of this journal's audience. The raw access log
# sees everyone.
#
# Parsing happens ON THE SERVER (the current log is ~8MB and grows), so only
# the summary crosses the wire.
#
# NOTE ON RETENTION: cPanel can be set to delete last month's archived logs at
# the end of each month. If you want to compare across months, check
# cPanel -> Metrics -> Raw Access: "Archive logs in your home directory" ON,
# "Remove the previous month's archived logs" OFF.

set -uo pipefail

# Connection details are deliberately NOT hardcoded -- this repository is
# public, and there is no reason to publish host, account and paths together
# with working commands. Put them in utility/deploy.env (gitignored):
#
#   DEPLOY_HOST=server.example.com
#   DEPLOY_USER=youraccount
#   DEPLOY_KEY=$HOME/.ssh/your_deploy_key
#
# See utility/deploy.env.example. Environment variables override the file.
CONFIG="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/deploy.env"
if [ -f "$CONFIG" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG"
fi

HOST="${DEPLOY_HOST:-}"
USER="${DEPLOY_USER:-}"
# Names the log files to read, and filters self-referrals from the referrer
# list. The account hosts several sites, so an unscoped glob would silently
# mix their traffic into these numbers.
SITE_DOMAIN="${SITE_DOMAIN:-}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/archie_deploy_ed25519}"

if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$SITE_DOMAIN" ]; then
  echo "✗ DEPLOY_HOST, DEPLOY_USER and SITE_DOMAIN must all be set." >&2
  echo "  Copy utility/deploy.env.example to utility/deploy.env and fill it in," >&2
  echo "  or export the variables. See the private ops notes for the values." >&2
  exit 1
fi

FILTER=""
ARCHIVE=""
ALL_LOGS=0
while [ $# -gt 0 ]; do
  case "$1" in
    --archive) ARCHIVE="${2:-}"; shift 2 ;;
    --all-logs) ALL_LOGS=1; shift ;;
    -h|--help) sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) FILTER="$1"; shift ;;
  esac
done

if [ ! -f "$KEY" ]; then
  echo "✗ SSH key not found: $KEY" >&2
  exit 1
fi

# Which log(s) to read. The ssl_log is the real one -- the site redirects
# http to https, so the plain log holds only the redirect hops.
if [ -n "$ARCHIVE" ]; then
  SRC="zcat ~/logs/${SITE_DOMAIN}-ssl_log-${ARCHIVE}.gz"
  LABEL="archive ${ARCHIVE}"
elif [ "$ALL_LOGS" = "1" ]; then
  SRC="cat ~/access-logs/${SITE_DOMAIN}-ssl_log; zcat ~/logs/${SITE_DOMAIN}-ssl_log-*.gz 2>/dev/null"
  LABEL="current month + all archives"
else
  SRC="cat ~/access-logs/${SITE_DOMAIN}-ssl_log"
  LABEL="current month"
fi

# Bot filter. Deliberately conservative -- it catches self-identifying
# crawlers, not stealth scrapers, so treat the numbers as an upper bound on
# human traffic rather than a precise count.
BOTS='bot|crawler|spider|slurp|facebookexternalhit|headless|python-requests|curl/|wget|go-http|okhttp|scrapy|bingpreview|ahrefs|semrush|mj12|dotbot|petalbot'

echo "▶ traffic — ${LABEL}${FILTER:+ — filter: /${FILTER}/}"
echo ""

ssh -i "$KEY" -o BatchMode=yes "${USER}@${HOST}" \
  "SRC_CMD='$SRC' FILTER='$FILTER' BOTS='$BOTS' SITE_DOMAIN='$SITE_DOMAIN' bash -s" <<'REMOTE'
set -uo pipefail
SITE_DOMAIN="${SITE_DOMAIN:-}"
TMP=$(mktemp); trap 'rm -f "$TMP" "$TMP.h"' EXIT
eval "$SRC_CMD" > "$TMP" 2>/dev/null

if [ ! -s "$TMP" ]; then echo "  (no log data found)"; exit 0; fi

echo "  log span   : $(head -1 "$TMP" | grep -oE '\[[^]]+\]' | head -1 | tr -d '[]') → $(tail -1 "$TMP" | grep -oE '\[[^]]+\]' | head -1 | tr -d '[]')"
echo "  raw hits   : $(wc -l < "$TMP")"

# Human-ish page views: successful HTML requests from non-bot agents.
grep -viE "$BOTS" "$TMP" \
  | awk '$9==200 && ($7 ~ /\.html/ || $7 ~ /\/$/) {sub(/\?.*/,"",$7); print $7}' > "$TMP.h"

if [ -n "$FILTER" ]; then
  grep -E "(^|/)${FILTER}(/|\.)" "$TMP.h" > "$TMP.h.f" && mv "$TMP.h.f" "$TMP.h"
fi

echo "  page views : $(wc -l < "$TMP.h")   (bots excluded; upper bound on humans)"
echo "  distinct   : $(sort -u "$TMP.h" | wc -l) pages"
echo ""
echo "  ── most read ──"
sort "$TMP.h" | uniq -c | sort -rn | head -20 | awk '{printf "  %6d  %s\n", $1, $2}'

echo ""
echo "  ── PDF downloads ──"
grep -viE "$BOTS" "$TMP" \
  | awk '($9==200||$9==206) && $7 ~ /\.pdf/ {sub(/\?.*/,"",$7); print $7}' \
  | { if [ -n "$FILTER" ]; then grep -E "/${FILTER}/" || true; else cat; fi; } \
  | sort | uniq -c | sort -rn | head -10 | awk '{printf "  %6d  %s\n", $1, $2}'

echo ""
echo "  ── by language ──"
for L in en es fr; do
  if [ "$L" = "en" ]; then n=$(grep -cvE '^/(es|fr)/' "$TMP.h"); else n=$(grep -cE "^/$L/" "$TMP.h"); fi
  printf "  %6d  %s\n" "${n:-0}" "$L"
done

echo ""
echo "  ── external referrers ──"
# Scoped to the filtered paths when a filter is given, so "referrers for
# issue09" means referrers that landed on issue09 -- not site-wide noise.
grep -viE "$BOTS" "$TMP" \
  | { if [ -n "$FILTER" ]; then grep -E "\"[A-Z]+ /(es/|fr/)?${FILTER}[/.]" || true; else cat; fi; } \
  | awk -F'"' '{print $4}' \
  | grep -vE "${SITE_DOMAIN:+$(printf '%s' "$SITE_DOMAIN" | sed 's/\./\\./g')|}^-$|^$" \
  | sed 's|\(https\?://[^/]*\).*|\1|' \
  | sort | uniq -c | sort -rn | head -10 | awk '{printf "  %6d  %s\n", $1, $2}'
echo ""
echo "  (referrer spam is common -- www.bing.org, www.google.org and similar"
echo "   are fake; only exact domains like https://www.google.com are real.)"
REMOTE
