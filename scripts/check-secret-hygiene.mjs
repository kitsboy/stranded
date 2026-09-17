#!/usr/bin/env node
/**
 * Secret-hygiene gate — REPO-WIDE and BASE64-AWARE.
 *
 * Why repo-wide: `check-security-contracts.mjs` reads seven hand-picked
 * production files, so a credential committed to a shell script at the repo
 * root was invisible to it. This gate enumerates every TRACKED file.
 *
 * Why base64-aware: base64-encoding a credential defeats every plaintext
 * pattern matcher. This gate also DECODES every base64-looking blob it finds
 * and re-runs the same detectors against the decoded text, so
 *     echo "<blob>" | base64 -d > /tmp/token
 * fails the build like the plaintext literal would.
 *
 * Never prints a matched value. Findings are reported as `path:line [rule]`
 * with a length, never the text — CI logs on a public repo are public.
 *
 * Run: `npm run check:security` (wired in package.json). Exit 1 = do not ship.
 * Pass explicit paths to scan those instead of the tracked tree (used by the
 * self-tests): `node scripts/check-secret-hygiene.mjs path/to/file`.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX_BYTES = 2_000_000; // skip anything bigger: no credentials, no perf cost
const SELF = 'scripts/check-secret-hygiene.mjs';

// Files whose job is to DEFINE credential patterns (they necessarily contain
// the patterns they hunt for), so they match their own rules and would block
// every push. Allowlist these exact paths — never loosen a rule to silence one.
const PATTERN_SOURCES = new Set([
  SELF,
  'scripts/check-security-contracts.mjs',
  'scripts/check-endpoints-fixture.mjs',
  // HQ is where the gate lives before adoption; it and its README necessarily
  // contain the patterns and the fix commands they document.
  'scripts/secret-hygiene-gate/check-secret-hygiene.mjs',
  'scripts/secret-hygiene-gate/README.md',
]);

/**
 * The SHAPE rules: they flag a *form* of writing (a quoted literal, a decode
 * command) rather than a recognisable provider credential. Documentation and
 * runbooks legitimately quote those forms. ALLOWLIST entries scoped to this set
 * still fail on every VALUE-bearing rule — private-key-block, nostr-secret-key,
 * cloudflare-token/global-key, github-token, openai-key, aws-access-key,
 * slack-token, env-credential-literal and base64-wrapped-credential — and on any
 * shape hit whose line does not match the entry's `line` shape. The residual
 * exposure is a generic high-entropy quoted literal in one of those doc files;
 * that is the documented price of a gate that does not cry wolf on the runbooks
 * it ships with.
 */
const SHAPE_RULES = [
  'quoted-credential-literal',
  'base64-decode-to-file',
  'base64-decode-into-substitution',
  'credential-exported-from-file',
];

/**
 * Known false positives — allowlisted by PATH **and** LINE SHAPE (and rule),
 * never by path alone, so a *different* finding in the same file still fails.
 * Convention follows kb-leakcheck.sh (~/.hermes/scripts/kb-leakcheck.sh):
 * exact path + the reason in a comment; never loosen a rule to silence a hit.
 * Every suppression is PRINTED as `ALLOWLISTED …` — silence-with-a-record,
 * never silence. This list ships WITH the gate, so adoption stays one commit.
 * Add an entry only after reading the line; a gate that cries wolf is ignored,
 * and an ignored gate manufactures the belief that scanning happens.
 */
const ALLOWLIST = [
  {
    // satohash — default parameter of a client-side encrypt helper. Hardcoding a
    // default passphrase is poor practice, but it is published source and not a
    // service credential: it grants access to nothing the repo does not already ship.
    // The line-shape requires that exact published value (any identifier spelling
    // before `password =`), covering all three places it appears: the function
    // default parameter, a plain assignment, and the hoisted named constant
    // (`const LOCAL_VAULT_DEFAULT_PASSWORD = '…'`) used by the staged rollout.
    // The tightening of `quoted-credential-literal` (t_490ea29e) is what surfaced
    // the hoisted spelling — the old `\b`-anchored rule was blind to it.
    path: 'src/utils/crypto.js',
    rule: 'quoted-credential-literal',
    line: /password\s*=\s*['"]local_satohash_vault_key['"]/i,
    reason: 'client-side encrypt-helper default parameter, not a service credential',
  },
  {
    // motopass — test-only value built at runtime from Math.random(); never stored,
    // never sent as a credential, exists only inside a live test's ephemeral state.
    path: 'src/lib/zkNostrSync.live.test.ts',
    rule: 'quoted-credential-literal',
    line: /const secret = `paige-memory-\$\{Math\.random\(\)\}`/,
    reason: 'test-only generated string (Math.random), never a stored credential',
  },
  {
    // katoa — React autoComplete attribute whose ternary operands are both quoted
    // 16-char strings. Surfaced by the JSON-key allowance (t_a07a0299): the optional
    // closing quote lets the `.new-password' : 'current-password'` shape match the
    // rule. This is prose/attribute data, not a credential. Precise line-shape only;
    // a different finding in this file still fails.
    path: 'src/pages/AuthPage.tsx',
    rule: 'quoted-credential-literal',
    line: /autoComplete=\{isSignUp \? 'new-password' : 'current-password'\}/,
    reason: 'React autoComplete ternary with two quoted 16-char strings, not a credential',
  },
  {
    // HQ incident log — prose that necessarily quotes the rule names and the leaked
    // command shapes ("decodes to cfut_T…", `base64 -d > /tmp/token`). Rule-scoped
    // to the SHAPE rules only: `cloudflare-token`, `github-token`, `nostr-secret-key`,
    // `private-key-block`, `openai-key`, `aws-access-key`, `slack-token`,
    // `env-credential-literal` and `base64-wrapped-credential` all stay active here,
    // so a real value pasted into this file still fails the gate.
    path: 'docs/FIXES-LOG.md',
    rules: SHAPE_RULES,
    line: /^[-#|>+]{1,3} /,
    reason: 'HQ incident log prose — shape-rule hits only, value-bearing rules stay active',
  },
  {
    // HQ runbook — names the env var a service reads, never its value.
    path: 'docs/OPENCODE-THOR.md',
    rules: SHAPE_RULES,
    line: /^- \*\*Auth:\*\*/,
    reason: 'runbook names an env-var NAME (`OPENCODE_SERVER_PASSWORD`), not a value',
  },
  {
    // HQ purge runbook — documents the exact command shapes the gate was proved on.
    path: 'docs/SHERPACARTA-CREDENTIAL-PURGE.md',
    rules: SHAPE_RULES,
    line: /^\|/,
    reason: 'purge runbook table quoting the gate\'s own probe commands — no values',
  },
  {
    // the runbook as a patch file: added lines are the same quoted probe commands.
    path: 'docs/patches/SHERPACARTA-CREDENTIAL-PURGE-20260916.patch',
    rules: SHAPE_RULES,
    line: /^\+\s/,
    reason: 'patch of the purge runbook — added lines are the quoted probe commands',
  },
  {
    // otto-bridge-check.py legitimately decodes GitHub API content into a local
    // cache file — the `base64 -d > file` shape here carries no credential.
    path: 'scripts/otto-bridge-check.py',
    rule: 'base64-decode-to-file',
    line: /gh api .*contents\/.*\|\s*base64 -d >/,
    reason: 'otto-bridge decodes GitHub API content into a cache file, not a credential',
  },
];

const matchAllowlist = (file, rule, line) =>
  ALLOWLIST.find(
    (e) =>
      (file === e.path || file.endsWith('/' + e.path)) &&
      (!e.rule && !e.rules ? true : e.rule === rule || (e.rules || []).includes(rule)) &&
      e.line.test(line),
  );

/** Plaintext credential shapes. Order matters only for reporting. */
const RULES = [
  ['private-key-block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['nostr-secret-key', /\bnsec1[0-9a-z]{20,}/],
  ['cloudflare-token', /\bcfut_[A-Za-z0-9_-]{20,}/],
  ['cloudflare-global-key', /\bcfk_[A-Za-z0-9_-]{20,}/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}/],
  ['openai-key', /\bsk-[A-Za-z0-9_-]{24,}/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  // A `\b` anchor here was the bug (t_490ea29e): `\b` demands a non-word char
  // before the keyword, so `MY_API_TOKEN = "…"` / `AWS_SECRET_KEY = "…"` never
  // matched — the underscore itself defeated the rule. Anchoring on
  // `(?:^|[^A-Za-z0-9])` plus an optional `[A-Za-z0-9]+_` identifier run catches
  // every prefixed shape while still requiring a real token boundary (so
  // `mypassword = "…"` still does not match). Strict tightening: every line the
  // old pattern caught is still caught, and the 16-char value floor and the
  // quote requirement are unchanged.
  // A second residual gap (t_a07a0299): a JSON object key puts a closing quote
  // between the keyword and the colon — `{"DB_PASSWORD": "…"}` / `{"password": "…"}` —
  // so the keyword may optionally be followed by one closing quote before `[:=]`.
  // This is a strict superset (proved 0 regressions across all 10 clones) and is
  // required to see a credential written as a JSON object key. The 16-char value
  // floor and the quote requirement are unchanged. Line-shape ALLOWLIST entries
  // absorb the handful of real false positives this surfaced (e.g. a React
  // `autoComplete` ternary whose operands happen to be quoted 16-char strings),
  // never a relaxed rule.
  ['quoted-credential-literal',
    /(?:^|[^A-Za-z0-9])(?:[A-Za-z0-9]+_)*(?:API_?KEY|API_?TOKEN|ACCESS_?TOKEN|SECRET_?KEY|SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL)["'`]?\s*[:=]\s*["'`][^"'`\s]{16,}["'`]/i],
  // Unquoted env-style set: `db_password=s3cr3t…` / `DB_PASSWORD=s3cr3t…` at line
  // start. The residual gap (t_a07a0299) was lowercase identifiers (`db_password=…`)
  // being invisible — the old `[A-Z]` leading anchor demanded an uppercase line
  // start. The fix allows a lowercase-leading identifier AND matches the credential
  // words case-insensitively, while the generic `KEY` keyword stays UPPERCASE-ONLY
  // so JSX handler names (`onKeyDown=`, `animationKey=`, `sortKey=`) never cry wolf
  // — that measured distinction is what keeps this rule from flagging every typed
  // React prop. Strict superset, 0 regressions and 0 new detections across the fleet.
  ['env-credential-literal',
    /^\s*[A-Za-z][A-Za-z0-9_]*(?:TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL|token|secret|password|credential)[A-Za-z0-9_]*\s*=\s*[^\s"'`$][^\s]{11,}\s*$/m],
];

/**
 * Placeholder values are not credentials. Without this, `.env.example` and setup
 * docs (which exist to be filled in) fail the gate and the gate gets switched off
 * — the failure mode this whole script exists to prevent.
 */
const PLACEHOLDER =
  /^(?:your|my|the|change|replace|insert|add|put|test|example|sample|dummy|fake|placeholder|todo|xxx+)[-_]/i;
const isPlaceholder = (line) => {
  const value = (line.split(/[:=]/).slice(1).join('=') || '').trim().replace(/^["'`]|["'`]$/g, '');
  if (!value) return false;
  if (PLACEHOLDER.test(value)) return true;
  if (/^[<[{].*[>}\]]$/.test(value)) return true; // <your-key-here>, ${VAR}, {json}
  return /(change[-_ ]?(me|this)|replace[-_ ]?me|placeholder|example\.com|your[-_]?key)/i.test(value);
};

/** Structural tells: decoding a blob straight into a credential sink. */
const STRUCTURAL_RULES = [
  ['base64-decode-to-file', /base64\s+(?:-d|-D|--decode)[^\n|]*\s*(?:>|>>)\s*\S+/],
  ['base64-decode-into-substitution',
    /(?:\$\(|`)[^`\n)]*\|\s*base64\s+(?:-d|-D|--decode)/],
  ['credential-exported-from-file', /export\s+[A-Z0-9_]*(?:TOKEN|SECRET|KEY|PASSWORD)[A-Z0-9_]*=\$\(cat\s+\S+/],
];

/** A credential hidden by encoding still reveals itself when decoded. */
const DECODED_SENSITIVE = /\b(?:cfut_|cfk_|gh[pousr]_|sk-|AKIA|xox[baprs]-|nsec1)[A-Za-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/;

const base64Candidates = (line) =>
  line.match(/[A-Za-z0-9+/]{20,}={0,2}/g) || [];

const isProbablyText = (buf) => {
  const sample = buf.subarray(0, 4096);
  for (const byte of sample) if (byte === 0) return false;
  return true;
};

const listTrackedFiles = () => {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], { encoding: 'buffer' });
    return out.toString('utf8').split('\0').filter(Boolean);
  } catch {
    // Fallback for a tree without git (e.g. a tarball export).
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) return [];
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      });
    return walk('.');
  }
};

const targets = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const scanTargets = targets.length ? targets : listTrackedFiles();

const findings = [];
const suppressed = [];
/** A finding is either recorded as a failure, or recorded as an allowlisted hit. */
const record = (file, line, rule, detail, lineText) => {
  const allow = matchAllowlist(file, rule, lineText || '');
  if (allow) suppressed.push({ file, line, rule, reason: allow.reason });
  else findings.push({ file, line, rule, detail });
};

const scanLine = (file, lineNo, line) => {
  const placeholder = isPlaceholder(line);
  for (const [rule, re] of RULES) {
    if (placeholder && (rule === 'env-credential-literal' || rule === 'quoted-credential-literal')) continue;
    if (re.test(line)) record(file, lineNo, rule, '', line);
  }
  for (const [rule, re] of STRUCTURAL_RULES) if (re.test(line)) record(file, lineNo, rule, '', line);

  for (const candidate of base64Candidates(line)) {
    if (candidate.length < 20 || candidate.length % 4 === 1) continue;
    let decoded;
    try {
      decoded = Buffer.from(candidate, 'base64').toString('utf8');
    } catch {
      continue;
    }
    if (!decoded || /[\u0000-\u0008\u000e-\u001f]/.test(decoded)) continue;
    const hit = DECODED_SENSITIVE.exec(decoded);
    if (hit) {
      const offset = Math.max(0, hit.index);
      record(file, lineNo, 'base64-wrapped-credential',
        `decodes to ${decoded.slice(offset, offset + 6)}… (${decoded.length} chars, value redacted)`);
    }
  }
};

for (const file of scanTargets) {
  if (PATTERN_SOURCES.has(file) || [...PATTERN_SOURCES].some((p) => file.endsWith(p))) continue;
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > MAX_BYTES) continue;
  const buf = fs.readFileSync(file);
  if (!isProbablyText(buf)) continue;
  buf.toString('utf8').split('\n').forEach((line, i) => scanLine(file, i + 1, line));
}

/** Allowlisted hits are always printed — silence-with-a-record, never silence. */
const printSuppressed = (log) => {
  if (!suppressed.length) return;
  log(`Allowlisted false positives (${suppressed.length}) — recorded, not failures:`);
  for (const s of suppressed) {
    log(`  ALLOWLISTED ${s.file}:${s.line} [${s.rule}] — ${s.reason}`);
  }
};

if (findings.length) {
  console.error('Secret-hygiene gate FAILED — do not ship:');
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} [${f.rule}]${f.detail ? ' ' + f.detail : ''}`);
  }
  console.error('');
  printSuppressed((m) => console.error(m));
  console.error(
    '\nRotate the credential first (a deleted file does not un-leak a value), then remove it\n' +
    'from the tree and from history. See docs/DEPLOYMENT.md — there is no committed deploy\n' +
    'script and no credential in this repo by design.'
  );
  process.exit(1);
}

console.log('Secret-hygiene gate passed: 0 credential findings across all tracked files.');
printSuppressed((m) => console.log(m));
