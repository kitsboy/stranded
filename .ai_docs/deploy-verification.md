# Deploy verification — why we check IDENTITY and not recency

Read this before touching `scripts/deploy-check.sh` or the
`Stranded — verify live deploy` workflow (`.github/workflows/deploy.yml`).

## The rule

**The gate is identity: the live site must name the commit it was built from,
and that commit must be the one being shipped.**

`scripts/deploy-check.sh` polls `/data/live-stats.json` (cache-busted) on the
live site and compares the `commit` field against the expected commit
(`--expected-commit`, `STRANDED_EXPECTED_COMMIT`, `GITHUB_SHA`, or local
`git rev-parse HEAD`, in that order). Mismatch or a missing marker = the job
fails red, printing seen-vs-expected. There is no "warn" path and no
"flaky-friendly" timeout: after the bounded wait (`--timeout`, default 900s) it
exits 1.

The marker is written at build time by `scripts/generate-live-stats.js`
(`commit` = full sha, `commitShort` = 7 chars) from `GITHUB_SHA` (GitHub
Actions), `CF_PAGES_COMMIT_SHA` (the Cloudflare Pages builder), or local
`git rev-parse HEAD`, and mirrored into `public/status.json` and the footer
build line.

## Why recency is not sufficient — the incident this replaces

The first version of this check was a **recency floor**: it required only that
the live build clock (`buildId`, derived from the build's UTC time) be
**>= the commit timestamp**.

On 2026-09-11 it reported **success** for commit `94ef068` while that commit was
not serving:

| | value |
|---|---|
| commit `94ef068` committed | `2026-09-11T21:57:54Z` |
| live site actually serving | build `20260911215842` = `21:58:42` |
| verdict of the recency floor | ✅ pass (215842 > 215754) |
| what was really serving | the build of the **previous** commit |

The build that was serving finished **41 seconds after** the new commit landed.
Two builds seconds apart cannot be told apart by a timestamp, so the floor
passed a stale deploy. That is a false green: it looks exactly like a real pass,
which is worse than having no check at all, because a human trusts it and stops
looking.

So: **never reintroduce a timestamp comparison as the gate.** A build clock is
still printed by the check for humans ("live buildId … generated …"), and the
recency floor still exists as an explicitly-labelled *fallback* for the case
where no commit is knowable anywhere (no git checkout, no `GITHUB_SHA`) — but
whenever the expected commit is known, the clock is never consulted for the
verdict.

## Practical consequences

- **Cloudflare Pages must rebuild before the check can pass.** That is the
  point: the check is red until the commit is genuinely live. Do not "fix" a
  red deploy check by relaxing it; look at the Pages build for project
  `strandedbuild`.
- **Rollout ordering is self-consistent.** The commit that introduced the
  marker is also the first commit whose Pages build carries it, so the check
  passes on that same push. Older deploys (no `commit` field) fail the identity
  gate with an explicit "live build names no commit" message — correct, since
  identity genuinely cannot be verified for them.
- **Do not compare build clocks between two builds of the same commit.** Two
  independent builds never share a `buildId`. `--expected-buildid` exists only
  for pinning one known deploy by hand, and it stacks on top of the identity
  check rather than replacing it.
- **Do not compare `/_next/static/chunk` hashes** against the live HTML; they
  are not portable between this machine and the Cloudflare Pages builder
  (verified 2026-09-11: every hash differed for the same commit).
- **`commit`/`commitShort` are normalised away in two diffs on purpose:**
  `deploy-check.sh --dist` (identity is checked explicitly; that diff is a
  *data* diff) and the CI "Docs in sync" step (a committed file can never name
  the commit that contains it — the sha does not exist until after the file is
  written, so the checked-in value is always one commit behind).

## Proving it still works

`npm run deploy:check:selftest` (`scripts/deploy-check-selftest.sh`) is a
hermetic regression test: it serves fake `live-stats.json` payloads from a
local HTTP server and asserts

1. the **identity check fails** on the exact 41-second false-green marker
   (stale `commit`, clock newer than the commit) — the case the old check
   wrongly passed;
2. it **fails when the marker is missing** entirely;
3. it **passes** when the served marker names the expected commit;
4. the **identity check is the gate, not the clock** — the same payload that
   made the old check green is red now.

Run it after any edit to `deploy-check.sh`.
