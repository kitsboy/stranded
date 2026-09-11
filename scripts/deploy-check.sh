#!/usr/bin/env bash
#
# Stranded deploy verification — one command, no secret, read-only.
#
# SINGLE-DEPLOYER RULE: Cloudflare Pages builds stranded.giveabit.io straight
# from this repo's git integration (project "strandedbuild"). Nothing else
# deploys. This script never deploys anything — it only *observes* the live
# site and fails loudly when what is served is not what was pushed. It is the
# local twin of the `verify` step in .github/workflows/deploy.yml, so the same
# logic can be run before/after a push and inside CI.
#
#   bash scripts/deploy-check.sh                    # version + freshness
#   bash scripts/deploy-check.sh --dist dist        # + served data payload match
#   bash scripts/deploy-check.sh --wait --timeout 900 --interval 20 --dist dist
#   bash scripts/deploy-check.sh --expected-buildid 20260911125705
#   bash scripts/deploy-check.sh --expected-buildid 19990101000000  # <- failure simulation
#
# Exit codes: 0 = verified, 1 = verification failed, 2 = bad usage.
#
# Env overrides: STRANDED_URL, STRANDED_EXPECTED_BUILDID, STRANDED_DIST
#
# NOTE on buildId: scripts/generate-live-stats.js derives buildId from the
# build clock (UTC), so two independent builds of the same commit NEVER share
# a buildId. "Live buildId == my local buildId" is therefore not a check that
# can pass; the freshness check below ("live build is not older than the commit
# being shipped") plus the served-data comparison are the signals that actually
# catch a stale deploy.
#
# NOTE on comparing built asset filenames: do NOT add a check that compares
# the /_next/static/chunk hashes of a local build against the live HTML. Those
# hashes are NOT portable between this machine/CI and the Cloudflare Pages
# builder — verified 2026-09-11 by building one commit locally and diffing it
# against the CF Pages build of that same commit: every chunk hash differed.
# Such a check would be permanently red. The two portable signals are the
# live build's own UTC build clock (freshness) and the served data payload.
#
set -uo pipefail   # deliberately no -e: every failure below is explicit and
                   # prints a reason, so nothing can pass silently.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" || exit 1

SITE_URL="${STRANDED_URL:-https://stranded.giveabit.io}"
EXPECTED_BUILDID="${STRANDED_EXPECTED_BUILDID:-}"
DIST_DIR="${STRANDED_DIST:-}"
WAIT=0
TIMEOUT=900
INTERVAL=20

usage() {
  sed -n '3,22p' "$0" | sed 's/^# \{0,1\}//'
}

fail() {
  echo "" >&2
  echo "❌ DEPLOY CHECK FAILED — $*" >&2
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --url)               [ $# -ge 2 ] || fail "--url needs a value"; SITE_URL="$2"; shift 2 ;;
    --expected-buildid)  [ $# -ge 2 ] || fail "--expected-buildid needs a value"; EXPECTED_BUILDID="$2"; shift 2 ;;
    --dist)              [ $# -ge 2 ] || fail "--dist needs a value"; DIST_DIR="$2"; shift 2 ;;
    --wait)              WAIT=1; shift ;;
    --timeout)           [ $# -ge 2 ] || fail "--timeout needs a value"; TIMEOUT="$2"; shift 2 ;;
    --interval)          [ $# -ge 2 ] || fail "--interval needs a value"; INTERVAL="$2"; shift 2 ;;
    -h|--help)           usage; exit 0 ;;
    *)                   echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

SITE_URL="${SITE_URL%/}"

# ---------------------------------------------------------------- expectations
PKG_VERSION="$(node -e 'process.stdout.write(String(require(process.argv[1]).version))' "$REPO/package.json" 2>/dev/null)"
[ -n "$PKG_VERSION" ] || fail "could not read version from package.json"

FLOOR=""
if [ -n "$EXPECTED_BUILDID" ]; then
  case "$EXPECTED_BUILDID" in
    *[!0-9]*|'') fail "--expected-buildid must be 14 digits (YYYYMMDDHHMMSS), got '$EXPECTED_BUILDID'" ;;
  esac
  [ "${#EXPECTED_BUILDID}" -eq 14 ] || fail "--expected-buildid must be 14 digits (YYYYMMDDHHMMSS), got '$EXPECTED_BUILDID'"
  echo "expected buildId : $EXPECTED_BUILDID (exact match requested)"
else
  COMMIT_TS="$(git -C "$REPO" log -1 --format=%ct 2>/dev/null)"
  if [ -n "$COMMIT_TS" ]; then
    FLOOR="$(date -u -d "@$COMMIT_TS" +%Y%m%d%H%M%S 2>/dev/null)"
  fi
  if [ -n "$FLOOR" ]; then
    echo "expected buildId : >= $FLOOR (HEAD commit time, UTC — a build older than this is a stale deploy)"
  else
    echo "expected buildId : (unknown — not a git checkout; freshness check skipped)"
  fi
fi
echo "expected version : $PKG_VERSION"
echo "target           : $SITE_URL"

# --------------------------------------------------------------------- helpers
fetch_error=""
try_fetch() { # $1 = url. Body -> FETCH_BODY, error -> fetch_error
  FETCH_BODY=""
  fetch_error=""
  local raw code
  raw="$(curl -sS --max-time 20 -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -w $'\n%{http_code}' "$1" 2>&1)" \
    || { fetch_error="curl error: $(printf '%s' "$raw" | tr '\n' ' ')"; return 1; }
  code="$(printf '%s' "$raw" | tail -n 1)"
  FETCH_BODY="$(printf '%s' "$raw" | sed '$d')"
  [ "$code" = "200" ] || { fetch_error="HTTP $code from $1"; return 1; }
  [ -n "$FETCH_BODY" ] || { fetch_error="empty response body from $1"; return 1; }
  return 0
}

json_field() { # $1 = key, stdin = json. Prints value or empty.
  node -e '
    let s = ""
    process.stdin.on("data", d => s += d).on("end", () => {
      try {
        const v = JSON.parse(s)[process.argv[1]]
        process.stdout.write(v === undefined || v === null ? "" : String(v))
      } catch (e) { process.exit(0) }
    })' "$1" 2>/dev/null
}

normalise_stats() { # stdin = live-stats json. Blanks the two build-clock fields
                    # so a local build and the CF build can be compared.
  sed -E \
    -e 's/("generatedAt": *")[^"]*(")/\1<timestamp>\2/' \
    -e 's/("buildId": *")[^"]*(")/\1<id>\2/'
}

# verify(): 0 = live site matches expectations, 1 = not (yet) — sets verify_reason
verify() {
  verify_reason=""

  try_fetch "$SITE_URL/data/live-stats.json?cb=$(date +%s%N)" \
    || { verify_reason="live /data/live-stats.json unreachable ($fetch_error)"; return 1; }
  local stats="$FETCH_BODY"

  local live_buildid live_version live_generated
  live_buildid="$(printf '%s' "$stats" | json_field buildId)"
  live_version="$(printf '%s' "$stats" | json_field version)"
  live_generated="$(printf '%s' "$stats" | json_field generatedAt)"

  [ -n "$live_buildid" ] || { verify_reason="live-stats.json carries no buildId (malformed deploy?)"; return 1; }
  LIVE_BUILDID="$live_buildid"
  LIVE_VERSION="$live_version"
  LIVE_GENERATED="$live_generated"

  if [ "$live_version" != "$PKG_VERSION" ]; then
    verify_reason="version mismatch — package.json $PKG_VERSION, live $live_version"
    return 1
  fi

  if [ -n "$EXPECTED_BUILDID" ]; then
    if [ "$live_buildid" != "$EXPECTED_BUILDID" ]; then
      verify_reason="expected buildId $EXPECTED_BUILDID, live $live_buildid"
      return 1
    fi
  elif [ -n "$FLOOR" ]; then
    if [ "$live_buildid" \< "$FLOOR" ]; then
      verify_reason="STALE DEPLOY — live buildId $live_buildid (generated $live_generated) predates the commit being shipped ($FLOOR); Cloudflare Pages has not published this commit yet"
      return 1
    fi
  fi

  if [ -n "$DIST_DIR" ]; then
    local local_stats="$DIST_DIR/data/live-stats.json"
    [ -f "$local_stats" ] || fail "--dist $DIST_DIR has no data/live-stats.json (build first, or drop --dist)"
    local data_diff local_norm live_norm
    local_norm="$(normalise_stats < "$local_stats")"     # $() strips trailing newlines
    live_norm="$(printf '%s' "$stats" | normalise_stats)"
    data_diff="$(diff -u <(printf '%s' "$local_norm") <(printf '%s' "$live_norm") | head -30)"
    if [ -n "$data_diff" ]; then
      DATA_DIFF="$data_diff"
      verify_reason="served data payload differs from this build's $local_stats — the live site is serving a different (stale?) dataset"
      return 1
    fi
    DATA_OK=1
  fi

  return 0
}

# ------------------------------------------------------------------------ run
attempt=0
deadline=$(( $(date +%s) + TIMEOUT ))
while : ; do
  attempt=$((attempt + 1))
  LIVE_BUILDID=""; LIVE_VERSION=""; LIVE_GENERATED=""; DATA_OK=0; DATA_DIFF=""
  if verify; then
    echo ""
    echo "✅ DEPLOY VERIFIED after $attempt attempt(s)"
    echo "   live buildId : $LIVE_BUILDID (generated $LIVE_GENERATED)"
    echo "   live version : $LIVE_VERSION (matches package.json)"
    [ -n "$EXPECTED_BUILDID" ] && echo "   matched requested buildId exactly"
    [ -n "$FLOOR" ] && echo "   newer than HEAD commit floor $FLOOR"
    [ "$DATA_OK" = "1" ] && echo "   served data payload matches $DIST_DIR/data/live-stats.json"
    exit 0
  fi

  if [ "$WAIT" -ne 1 ]; then
    [ -n "$DATA_DIFF" ] && printf '%s\n' "$DATA_DIFF" >&2
    fail "$verify_reason"
  fi

  now=$(date +%s)
  if [ "$now" -ge "$deadline" ]; then
    [ -n "$DATA_DIFF" ] && printf '%s\n' "$DATA_DIFF" >&2
    fail "$verify_reason (gave up after ${TIMEOUT}s / ${attempt} attempts)"
  fi
  echo "⏳ [$attempt] $verify_reason — retrying in ${INTERVAL}s (timeout ${TIMEOUT}s)"
  sleep "$INTERVAL"
done
