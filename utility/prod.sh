#!/bin/bash
# Deploy the built site, by hand, from this machine.
#
#   bash utility/prod.sh                        # production: dry run
#   bash utility/prod.sh --go                   # production: deploy
#   bash utility/prod.sh --preview              # preview tier: dry run
#   bash utility/prod.sh --preview --go         # preview tier: deploy
#
# Options:
#   --preview             target the noindexed preview tier instead of production
#   --go                  perform the deploy (default is dry run, writes nothing)
#   --allow-mass-delete   permit more than MAX_DELETIONS remote deletions
#   --any-branch          deploy from a branch other than main (implied by --preview)
#   --allow-dirty         deploy with uncommitted changes (warns only under --preview)
#   --skip-checks         skip check-anchors/check-contrast (not recommended)
#   -h, --help            this text
#
# The two tiers differ in exactly three ways -- docroot, SITE_URL, and whether
# crawlers are allowed -- and the preflight assertions invert accordingly, so a
# build made for one tier cannot be shipped to the other by mistake.
#
# WHY THIS IS A LOCAL SCRIPT AND NOT CI: Reclaim throttles Microsoft/Azure IP
# ranges, and GitHub Actions runners live inside them, so the deploy job in
# .github/workflows/build.yml can never reach the server -- confirmed over
# three runs on 2026-08-20, each hanging ~135s on a TCP timeout. That is
# standing host policy, not a fault awaiting a fix. Production deploys are
# therefore run from a laptop, and this script exists so the parts that are
# easy to get wrong are not retyped each time.

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO" || exit 1

CANONICAL_URL="https://archipelagosjournal.org"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PLAN="$REPO/deploy-plan.txt"

DRY=1
PREVIEW=0
ALLOW_MASS_DELETE=0
ANY_BRANCH=0
ALLOW_DIRTY=0
SKIP_CHECKS=0

while [ $# -gt 0 ]; do
  case "$1" in
    --preview) PREVIEW=1; shift ;;
    --go) DRY=0; shift ;;
    --allow-mass-delete) ALLOW_MASS_DELETE=1; shift ;;
    --any-branch) ANY_BRANCH=1; shift ;;
    --allow-dirty) ALLOW_DIRTY=1; shift ;;
    --skip-checks) SKIP_CHECKS=1; shift ;;
    -h|--help) sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "✗ unknown option: $1  (try --help)" >&2; exit 1 ;;
  esac
done

die() { echo "✗ $*" >&2; exit 1; }

# ---------------------------------------------------------------- config ----
# Host, account and paths are deliberately not hardcoded -- this repository is
# public. See utility/deploy.env.example; environment variables override the
# file, same convention as traffic-report.sh.
CONFIG="$REPO/utility/deploy.env"
if [ -f "$CONFIG" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG"
fi

HOST="${DEPLOY_HOST:-}"
USER_="${DEPLOY_USER:-}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/archie_deploy_ed25519}"
BACKUP_ROOT="${DEPLOY_BACKUP_DIR:-/home/$USER_/.deploy-backups}"
MAX_DELETIONS="${MAX_DELETIONS:-50}"

# Everything that differs between the two tiers is resolved here, once, so the
# rest of the script reads from TIER/PATH_/SITE/CRAWLERS and never re-decides.
if [ "$PREVIEW" = "1" ]; then
  TIER="preview"
  PATH_="${PREVIEW_PATH:-}"
  SITE="${PREVIEW_URL:-https://preview.archipelagosjournal.org}"
  CRAWLERS=""                       # must stay unset -- see the build step
  BACKUP_ROOT="$BACKUP_ROOT/preview"
  MISSING="PREVIEW_PATH"
else
  TIER="production"
  PATH_="${DEPLOY_PATH:-}"
  SITE="$CANONICAL_URL"
  CRAWLERS="true"
  MISSING="DEPLOY_PATH"
fi

[ -n "$HOST" ] && [ -n "$USER_" ] && [ -n "$PATH_" ] || die \
  "DEPLOY_HOST, DEPLOY_USER and $MISSING must all be set.
  Copy utility/deploy.env.example to utility/deploy.env and fill it in.
  The values live in the private archie-ops notes."
[ -f "$KEY" ] || die "SSH key not found: $KEY"

# Cheap guard against the one transposition that would actually hurt: pointing
# a preview deploy at the live docroot, or vice versa.
if [ "$PREVIEW" = "1" ] && [ -n "${DEPLOY_PATH:-}" ] && [ "$PATH_" = "$DEPLOY_PATH" ]; then
  die "PREVIEW_PATH and DEPLOY_PATH are the same path — a preview deploy would
  overwrite production with a noindexed build. Fix utility/deploy.env."
fi

# GNU rsync, never Apple's openrsync. openrsync accepts --delete-after
# alongside --backup-dir and then SILENTLY IGNORES THE DELETIONS -- the dry
# run still lists every file it is not going to remove, so the plan reads
# correctly while the real run deletes nothing. That shipped six days of
# additive-only deploys after the 2026-08-20 cutover.
RSYNC="${RSYNC:-/opt/homebrew/bin/rsync}"
[ -x "$RSYNC" ] || die "GNU rsync not found at $RSYNC. Install it: brew install rsync"
RSYNC_VERSION="$("$RSYNC" --version 2>&1)"
case "$RSYNC_VERSION" in
  *openrsync*) die "$RSYNC is Apple's openrsync, which silently drops --delete-after
  when combined with --backup-dir. Install GNU rsync: brew install rsync" ;;
esac

# ------------------------------------------------------------ git guards ----
# The guards are strict for production and advisory for preview. Preview exists
# precisely to look at work that is not finished yet, so refusing a dirty tree
# there would make the tier useless; production must stay reproducible from a
# commit, because the prod-* tag is the rollback target.
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$PREVIEW" = "0" ]; then
  if [ "$BRANCH" != "main" ] && [ "$ANY_BRANCH" = "0" ]; then
    die "on branch '$BRANCH', not main. Merge staging into main first, or pass --any-branch."
  fi
  if [ -n "$(git status --porcelain)" ] && [ "$ALLOW_DIRTY" = "0" ]; then
    die "working tree is dirty. Commit or stash first, or pass --allow-dirty.
  A deploy from a dirty tree ships bytes no commit describes, so the tag
  you would roll back to does not reproduce what is live."
  fi
  # Advisory only: the tag and the push are the rollback record, but a deploy
  # that runs ahead of the push is still a deploy that works.
  UPSTREAM="$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null)"
  if [ -n "$UPSTREAM" ] && [ "$(git rev-parse HEAD)" != "$(git rev-parse '@{u}')" ]; then
    echo "⚠ HEAD differs from $UPSTREAM — remember to push, so the deploy has a rollback target."
  fi
elif [ -n "$(git status --porcelain)" ]; then
  echo "⚠ working tree is dirty — the preview will show uncommitted work."
fi

echo "▶ archipelagos $TIER deploy — $([ "$DRY" = 1 ] && echo 'DRY RUN' || echo 'LIVE')"
echo "  branch     : $BRANCH @ $(git rev-parse --short HEAD)"
echo "  target     : $USER_@$HOST:$PATH_"
echo "  site url   : $SITE"
echo "  indexing   : $([ "$PREVIEW" = 1 ] && echo 'blocked (noindex + robots.txt + X-Robots-Tag)' || echo 'allowed')"
echo "  backup dir : $BACKUP_ROOT/$STAMP"
echo ""

# ---------------------------------------------------------------- build ----
# rm -rf is not optional: Eleventy does not clean its output directory, so a
# file deleted from src/ survives in _site and gets redeployed as current.
echo "▶ building (clean)"
rm -rf "$REPO/_site" || die "could not remove _site"
# ELEVENTY_ALLOW_CRAWLERS is passed as "true" for production and left entirely
# unset for preview -- not "false". src/_data/site.js throws if it is true
# alongside a non-canonical SITE_URL, and that interlock is what stops a
# mistyped URL from shipping preview canonicals to a crawlable build; passing
# the pair together is how the interlock gets exercised rather than bypassed.
ELEVENTY_ALLOW_CRAWLERS="$CRAWLERS" SITE_URL="$SITE" npm run build > /dev/null \
  || die "build failed. Re-run without the redirect to see the output:
  ELEVENTY_ALLOW_CRAWLERS=$CRAWLERS SITE_URL=$SITE npm run build"
echo "  ✓ $(find "$REPO/_site" -type f | wc -l | tr -d ' ') files, $(du -sh "$REPO/_site" | cut -f1 | tr -d ' ')"

# ------------------------------------------------------------- preflight ----
echo "▶ preflight"
[ -f "$REPO/_site/index.html" ] || die "_site/index.html missing — build is incomplete."
# The assertions invert by tier. robots.txt is only honored at a host root, and
# the preview IS a host root (its own subdomain), so it counts there -- but the
# meta tag is still the load-bearing one, and its .htaccess adds X-Robots-Tag
# as a third layer. The failure worth catching is a build made for one tier
# being shipped to the other, which either assertion catches immediately.
# grep -rq, deliberately not `grep -rl … | head -1`: under `set -o pipefail`
# head exits after the first line, the recursive grep takes SIGPIPE, and the
# pipeline reports non-zero even on a match -- so the detection failed open,
# nondeterministically, in the direction that lets a noindex build reach
# production. No pipeline, no failure mode.
HAS_NOINDEX=0
if grep -rq 'name="robots" content="noindex' "$REPO/_site" --include='*.html'; then
  HAS_NOINDEX=1
fi
if [ "$PREVIEW" = "1" ]; then
  grep -q "^Disallow: /" "$REPO/_site/robots.txt" 2>/dev/null \
    || die "_site/robots.txt does not block crawlers — this build is not preview-safe."
  [ "$HAS_NOINDEX" = "1" ] \
    || die "no noindex meta tag in the build — this must not ship to the preview tier.
  robots.txt alone does not prevent indexing from an external link."
else
  grep -q "^Allow: /" "$REPO/_site/robots.txt" 2>/dev/null \
    || die "_site/robots.txt does not allow crawlers. ELEVENTY_ALLOW_CRAWLERS did not take."
  [ "$HAS_NOINDEX" = "0" ] \
    || die "noindex meta tag present in the build — this must not ship to production."
fi
grep -q "$SITE" "$REPO/_site/sitemap.xml" 2>/dev/null \
  || die "sitemap.xml does not carry $SITE — check SITE_URL."
echo "  ✓ index, robots.txt, sitemap, noindex correct for $TIER"

if [ "$SKIP_CHECKS" = "0" ]; then
  echo "▶ checks"
  npm run check-anchors  > /dev/null || die "check-anchors failed. Run: npm run check-anchors"
  npm run check-contrast > /dev/null || die "check-contrast failed. Run: npm run check-contrast"
  echo "  ✓ check-anchors, check-contrast"
  echo "  (check-links is advisory and not run here — external link rot in an"
  echo "   old article must not block publishing. Run npm run report-links when you want it.)"
else
  echo "⚠ checks skipped"
fi

# ---------------------------------------------------------------- rsync ----
# The excludes are load-bearing on both tiers. .well-known/ carries AutoSSL's
# domain-control challenges (removing it breaks certificate renewal ~60 days
# later, silently). On production .htaccess carries the PHP handler plus 13
# hand-written 301 redirects for URLs the Jekyll→Eleventy rebuild changed; on
# the preview subdomain it carries that tier's X-Robots-Tag header, which is
# the third indexing guard. Because they are excluded they are never
# overwritten AND never deleted.
#
# NEVER add --delete-excluded. It inverts this list into a kill list.
RSYNC_FLAGS=(
  -az --stats --delete-after --no-owner --no-group
  --backup --backup-dir="$BACKUP_ROOT/$STAMP"
  --exclude=/.well-known/ --exclude=/cgi-bin/
  --exclude=.htaccess --exclude=.htpasswd --exclude=.user.ini
  --exclude=php.ini --exclude=error_log --exclude=.ftpquota
  -e "ssh -i $KEY -o BatchMode=yes"
)
DEST="$USER_@$HOST:$PATH_"

echo "▶ rsync plan (dry run)"
"$RSYNC" -nv "${RSYNC_FLAGS[@]}" "$REPO/_site/" "$DEST" > "$PLAN" 2>&1 \
  || { tail -20 "$PLAN" >&2; die "rsync dry run failed — see $PLAN"; }

# --stats prints "Number of deleted files: N", thousands-separated. This is the
# number the risky flags actually control; reading only "files transferred" is
# exactly what let the openrsync bug run unnoticed for six days.
DELETIONS="$(awk -F': *' '/^Number of deleted files:/ {gsub(/[^0-9]/,"",$2); print $2; exit}' "$PLAN")"
DELETIONS="${DELETIONS:-0}"
TRANSFERS="$(awk -F': *' '/^Number of regular files transferred:/ {gsub(/[^0-9]/,"",$2); print $2; exit}' "$PLAN")"
TRANSFERS="${TRANSFERS:-0}"

echo "  files to transfer : $TRANSFERS"
echo "  files to delete   : $DELETIONS   (limit $MAX_DELETIONS)"
echo "  full plan         : deploy-plan.txt"
if [ "$DELETIONS" -gt 0 ]; then
  echo ""
  echo "  ── deletions ──"
  grep '^deleting ' "$PLAN" | head -40 | sed 's/^deleting /  - /'
  [ "$DELETIONS" -gt 40 ] && echo "  … and $((DELETIONS - 40)) more (see deploy-plan.txt)"
fi

# Verify the excludes actually held, on the real plan rather than on trust.
if grep -qE '^deleting (\.well-known/|cgi-bin/|\.htaccess|\.htpasswd|php\.ini)' "$PLAN"; then
  die "the plan would delete server-managed state. Do not proceed; check the exclude list."
fi

if [ "$DELETIONS" -gt "$MAX_DELETIONS" ] && [ "$ALLOW_MASS_DELETE" = "0" ]; then
  die "$DELETIONS deletions exceeds MAX_DELETIONS=$MAX_DELETIONS.
  Read deploy-plan.txt. If every deletion is intended, re-run with --allow-mass-delete."
fi

if [ "$DRY" = "1" ]; then
  echo ""
  echo "▶ dry run complete — nothing was written to the server."
  echo "  Review deploy-plan.txt, then: bash utility/prod.sh $([ "$PREVIEW" = 1 ] && echo '--preview ')--go"
  exit 0
fi

echo ""
echo "▶ deploying"
"$RSYNC" "${RSYNC_FLAGS[@]}" "$REPO/_site/" "$DEST" | tee "$PLAN.live" | grep -E \
  '^(Number of|Total|sent|total size)' | sed 's/^/  /'
STATUS="${PIPESTATUS[0]}"
[ "$STATUS" = "0" ] || die "rsync exited $STATUS — see deploy-plan.txt.live"

ACTUAL="$(awk -F': *' '/^Number of deleted files:/ {gsub(/[^0-9]/,"",$2); print $2; exit}' "$PLAN.live")"
ACTUAL="${ACTUAL:-0}"
echo ""
if [ "$ACTUAL" != "$DELETIONS" ]; then
  echo "⚠ deleted $ACTUAL files, but the plan said $DELETIONS."
  echo "  A real run that deletes 0 where the plan promised more is the openrsync"
  echo "  signature — confirm you are running GNU rsync ($RSYNC)."
fi
echo "▶ deployed to $TIER. $TRANSFERS transferred, $ACTUAL deleted."
echo "  rollback : rsync -a $BACKUP_ROOT/$STAMP/ $PATH_"
if [ "$PREVIEW" = "1" ]; then
  echo "  verify   : curl -sI $SITE | grep -i x-robots-tag"
else
  echo "  verify   : curl -sI $SITE | head -1"
  echo "  next     : git checkout staging"
fi
