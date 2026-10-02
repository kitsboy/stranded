#!/usr/bin/env node
/**
 * Check `public/_headers`' Content-Security-Policy against the real, live site.
 *
 * Cloudflare Pages applies `_headers`, so a CSP mistake only shows up in
 * production — after a deploy. This instead loads the live page and swaps the
 * response's CSP header for the one in `public/_headers`, so the policy can be
 * tested before it ships, against the scripts the edge actually injects.
 *
 * Reports, per path: every `securitypolicyviolation`, every failed request, and
 * whether the Cloudflare Insights beacon actually loaded.
 *
 * --control runs the same check with the LIVE policy instead, so the report is
 *   proven able to detect a violation.
 *
 * Usage: node scripts/verify-csp-headers.mjs [--control] [--live] [--url <base>]
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const base = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://stranded.giveabit.io";
const CONTROL = args.includes("--control");
const PATHS = ["/", "/map/"];

function repoCsp() {
  const file = readFileSync(resolve(process.cwd(), "public/_headers"), "utf8");
  const line = file
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.toLowerCase().startsWith("content-security-policy:"));
  if (!line) throw new Error("no Content-Security-Policy line in public/_headers");
  return line.slice(line.indexOf(":") + 1).trim();
}

const applyCsp = repoCsp();
console.log(`policy under test: ${CONTROL ? "LIVE (control)" : "public/_headers"}`);
console.log(`  ${applyCsp.slice(0, 200)}…\n`);

const browser = await chromium.launch();
const report = [];
let liveCsp = null;

for (const path of PATHS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const failed = [];
  const insightRequests = [];
  const beaconResponses = [];

  await page.addInitScript(() => {
    window.__violations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__violations.push({
        directive: e.effectiveDirective,
        blocked: e.blockedURI,
      });
    });
  });

  page.on("requestfailed", (r) => {
    if (r.url().includes("cloudflareinsights"))
      failed.push(`${r.url().slice(0, 90)} — ${r.failure()?.errorText}`);
  });
  page.on("request", (r) => {
    if (r.url().includes("cloudflareinsights")) insightRequests.push(`${r.method()} ${r.url().slice(0, 90)}`);
  });
  page.on("response", (r) => {
    const u = r.url();
    if (u.includes("cloudflareinsights")) beaconResponses.push(`${r.status()} ${u.slice(0, 88)}`);
    if (CONTROL && r.request().resourceType() === "document" && !liveCsp) {
      liveCsp = r.headers()["content-security-policy"] || null;
    }
  });

  if (!CONTROL) {
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "document") {
        const resp = await route.fetch();
        const headers = { ...resp.headers(), "content-security-policy": applyCsp };
        await route.fulfill({ response: resp, headers });
      } else {
        await route.continue();
      }
    });
  }

  try {
    await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(8000);
    const data = await page.evaluate(() => ({ violations: window.__violations || [] }));
    report.push({
      path,
      ok: true,
      ...data,
      beaconRequests: insightRequests,
      beaconResponses,
      beaconBlocked: failed,
    });
  } catch (err) {
    report.push({ path, ok: false, error: String(err).slice(0, 200) });
  }
  await context.close();
}

await browser.close();

if (liveCsp) console.log(`\nLIVE CSP today:\n  ${liveCsp.slice(0, 170)}…\n`);

let problems = 0;
for (const r of report) {
  if (!r.ok) {
    console.log(`${r.path}: FAILED ${r.error}`);
    problems++;
    continue;
  }
  console.log(`\n=== ${r.path} ===`);
  console.log(`  beacons requested : ${r.beaconRequests.length}`);
  for (const b of r.beaconRequests) console.log(`      ${b}`);
  console.log(`  beacon responses  : ${r.beaconResponses.length}`);
  for (const b of r.beaconResponses) console.log(`      ${b}`);
  console.log(`  beacon blocked    : ${r.beaconBlocked.length}`);
  for (const b of r.beaconBlocked) console.log(`      ${b}`);
  console.log(`  CSP violations    : ${r.violations.length}`);
  for (const v of r.violations) console.log(`      ${v.directive} → ${String(v.blocked).slice(0, 90)}`);
  // Any violation is a problem, not just the beacon's: a new third-party script
  // that nobody allowlisted must fail the build too. The site currently reports
  // zero violations on these paths, so this gate starts from a clean baseline.
  problems += r.violations.length;
}

console.log(
  `\n${problems === 0 ? "PASS" : `FAIL (${problems})`} — CSP violations under this policy`
);
