#!/usr/bin/env bash
#
# Hermetic regression test for the deploy-check IDENTITY gate.
#
# It serves fake live-stats.json payloads from a local HTTP server (127.0.0.1
# only — no external network) and asserts how scripts/deploy-check.sh judges
# them. It exists because the previous check was a recency floor that reported
# success on a stale deploy: commit 94ef068 (2026-09-11T21:57:54Z) while the
# live site served build 20260911215842 (21:58:42) — a build of the PREVIOUS
# commit, 41 seconds later on the clock.
#
# Case 1 replays that exact payload and asserts BOTH:
#   - the old recency rule would have passed it (that is the false green), and
#   - the new identity gate fails it.
# If either stops holding, this script exits non-zero.
#
#   bash scripts/deploy-check-selftest.sh
#
# Exit codes: 0 = all cases behaved as specified, 1 = a case regressed.

set -uo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" || exit 1

CHECK="bash $REPO/scripts/deploy-check.sh"
PORT="${SELFTEST_PORT:-8791}"
BASE="http://127.0.0.1:$PORT"
WORK="$(mktemp -d)"
SERVER_PID=""

# ── The incident, as constants ────────────────────────────────────────────────
# Real values from the false green this gate replaces.
INCIDENT_COMMIT_TIME="20260911215754"   # 94ef068 committed 2026-09-11T21:57:54Z
INCIDENT_STALE_BUILDID="20260911215842" # 21:58:42 — the build actually serving

# Fabricated but well-formed shas: the point is identity, not provenance.
EXPECTED_SHA="94ef0680abcdef1234567890abcdef1234567890"
STALE_SHA="1111111111111111111111111111111111111111"
EXPECTED_BUILDID="20260911215842"

PKG_VERSION="$(node -e 'process.stdout.write(String(require(process.argv[1]).version))' "$REPO/package.json")"
[ -n "$PKG_VERSION" ] || { echo "cannot read package.json version" >&2; exit 1; }

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  rm -rf "$WORK"
}
trap cleanup EXIT

pass=0
failures=0
ok()   { echo "  ✅ $*"; pass=$((pass + 1)); }
bad()  { echo "  ❌ $*" >&2; failures=$((failures + 1)); }

# ── fixture server ────────────────────────────────────────────────────────────
# serve_stats <buildId> <generatedAt> <commit-json-fragment>
# commit-json-fragment is the raw JSON for the marker, e.g. "\"abc123\"" or to
# omit it entirely pass the literal string OMIT.
serve_stats() {
  local buildid="$1" generated="$2" commit_json="$3"
  mkdir -p "$WORK/docroot/data"
  {
    echo '{'
    echo "  \"generatedAt\": \"$generated\","
    echo "  \"version\": \"$PKG_VERSION\","
    echo "  \"buildId\": \"$buildid\","
    if [ "$commit_json" != "OMIT" ]; then
      echo "  \"commit\": $commit_json,"
      echo "  \"commitShort\": \"$(printf '%s' "$commit_json" | tr -d '"' | cut -c1-7)\","
    fi
    echo '  "siteCount": 2611'
    echo '}'
  } > "$WORK/docroot/data/live-stats.json"
}

start_server() {
  if [ -n "$SERVER_PID" ]; then return 0; fi
  ( python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$WORK/docroot" >/dev/null 2>&1 ) &
  SERVER_PID=$!
  # Readiness poll — no blind sleep.
  local i
  for i in $(seq 1 40); do
    if curl -fsS --max-time 2 "$BASE/data/live-stats.json" >/dev/null 2>&1; then return 0; fi
    sleep 0.25
  done
  echo "fixture server never became ready on $BASE" >&2
  return 1
}

# run_check <args...> — stdout+stderr -> OUT, exit code -> RC
run_check() {
  OUT="$("$@" 2>&1)"
  RC=$?
}

echo "── deploy-check identity-gate self-test ────────────────────────────────"
echo "repo        : $REPO"
echo "expected sha: $EXPECTED_SHA"
echo ""

# ── Case 1 — the original false green ────────────────────────────────────────
echo "Case 1 — the 41-second false green (stale commit, clock looks fresh)"
serve_stats "$INCIDENT_STALE_BUILDID" "2026-09-11T21:58:42.000Z" "\"$STALE_SHA\""
start_server || exit 1

# 1a. Prove the OLD rule passes this payload (else the test is not replaying
#     the incident, and would pass vacuously).
if [ "$INCIDENT_STALE_BUILDID" \> "$INCIDENT_COMMIT_TIME" ]; then
  ok "old recency rule on this payload: PASS — stale deploy accepted (the bug, reproduced)"
else
  bad "old recency rule on this payload: FAIL — the incident is no longer being reproduced; fix the fixture"
fi

# 1b. The new gate must reject the same payload.
run_check $CHECK --url "$BASE" --expected-commit "$EXPECTED_SHA"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -q "WRONG COMMIT SERVED"; then
  ok "identity gate on this payload: FAIL (exit 1) — refused the stale deploy"
  printf '%s' "$OUT" | grep -qE "expected $EXPECTED_SHA, live $STALE_SHA" \
    && ok "failure prints seen-vs-expected ($EXPECTED_SHA vs $STALE_SHA)" \
    || bad "failure did not print seen-vs-expected values"
else
  bad "identity gate on the stale payload returned rc=$RC — expected 1 with 'WRONG COMMIT SERVED'"
  printf '%s\n' "$OUT" | sed 's/^/      | /' >&2
fi

# 1c. And with a clock far in the future it is STILL red: identity, not recency.
serve_stats "20991231235959" "2099-12-31T23:59:59.000Z" "\"$STALE_SHA\""
run_check $CHECK --url "$BASE" --expected-commit "$EXPECTED_SHA"
if [ "$RC" -eq 1 ]; then
  ok "future-dated clock + stale commit: still FAIL — the clock is not the gate"
else
  bad "future-dated clock + stale commit returned rc=$RC — expected 1"
fi

# ── Case 2 — marker missing entirely ─────────────────────────────────────────
echo ""
echo "Case 2 — live build names no commit (identity unverifiable)"
serve_stats "$INCIDENT_STALE_BUILDID" "2026-09-11T21:58:42.000Z" "OMIT"
run_check $CHECK --url "$BASE" --expected-commit "$EXPECTED_SHA"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -q "names no commit"; then
  ok "missing marker: FAIL (exit 1) — no fallback to recency"
else
  bad "missing marker returned rc=$RC — expected 1 with 'names no commit'"
  printf '%s\n' "$OUT" | sed 's/^/      | /' >&2
fi

# ── Case 3 — the commit really is live ───────────────────────────────────────
echo ""
echo "Case 3 — live build names the expected commit"
serve_stats "$EXPECTED_BUILDID" "2026-09-11T22:58:42.000Z" "\"$EXPECTED_SHA\""
run_check $CHECK --url "$BASE" --expected-commit "$EXPECTED_SHA"
if [ "$RC" -eq 0 ] && printf '%s' "$OUT" | grep -q "DEPLOY VERIFIED"; then
  ok "correct marker: PASS (exit 0) — 'live build names the commit being shipped'"
else
  bad "correct marker returned rc=$RC — expected 0"
  printf '%s\n' "$OUT" | sed 's/^/      | /' >&2
fi

# ── Case 4 — timeout must fail, not warn ─────────────────────────────────────
echo ""
echo "Case 4 — bounded wait expires with the wrong commit served"
serve_stats "$INCIDENT_STALE_BUILDID" "2026-09-11T21:58:42.000Z" "\"$STALE_SHA\""
run_check $CHECK --url "$BASE" --wait --timeout 3 --interval 1 --expected-commit "$EXPECTED_SHA"
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -q "gave up after"; then
  ok "timeout: FAIL (exit 1) — never warns and stays green"
else
  bad "timeout returned rc=$RC — expected 1 with 'gave up after'"
  printf '%s\n' "$OUT" | sed 's/^/      | /' >&2
fi

# ── Case 5 — short sha accepted, malformed rejected ──────────────────────────
echo ""
echo "Case 5 — sha handling"
serve_stats "$EXPECTED_BUILDID" "2026-09-11T22:58:42.000Z" "\"$EXPECTED_SHA\""
run_check $CHECK --url "$BASE" --expected-commit "${EXPECTED_SHA:0:7}"
[ "$RC" -eq 0 ] && ok "short sha prefix accepted (matches full live sha)" \
               || bad "short sha prefix rejected (rc=$RC) — prefix matching broke"

run_check $CHECK --url "$BASE" --expected-commit "not-a-sha"
[ "$RC" -eq 2 ] || [ "$RC" -eq 1 ]
[ "$RC" -ne 0 ] && ok "malformed --expected-commit rejected (rc=$RC, never green)" \
               || bad "malformed --expected-commit was accepted"

echo ""
echo "────────────────────────────────────────────────────────────────────────"
if [ "$failures" -eq 0 ]; then
  echo "✅ self-test passed — $pass assertion(s): identity is the gate, recency is not"
  exit 0
fi
echo "❌ self-test FAILED — $failures assertion(s) regressed" >&2
exit 1
