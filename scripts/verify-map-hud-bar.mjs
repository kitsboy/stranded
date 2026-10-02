#!/usr/bin/env node
/**
 * Verify the map HUD dark-bar fix on a running site.
 *
 * The bug: `app/globals.css` styles the jewel-glass HUD with the substring
 * selector `.map-command-center [class*="hud"]`, which also matched the
 * full-width outer wrapper `div.map-top-hud` — so the wrapper was painted with
 * the gradient/border/shadow and a dark bar stretched past the pill.
 *
 * This checks, per viewport:
 *   1. the outer wrapper is genuinely unpainted (no bg, border, shadow, blur)
 *   2. the inner pill is still solid (so the fix did not strip its background)
 *   3. the HUD content is intact (count, Pin proof, geolocate, BTC ticker)
 *   4. no horizontal overflow, no console errors, map canvas renders
 * and writes a clipped screenshot + geometry JSON for pixel analysis.
 *
 * Usage: node scripts/verify-map-hud-bar.mjs [--live] [--url <url>] [--out <dir>]
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const url = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://stranded.giveabit.io/map/";
const outDir = resolve(
  args.includes("--out") ? args[args.indexOf("--out") + 1] : "/tmp/hud-verify"
);
// --control re-injects the pre-fix jewel-glass rule and re-measures, proving the
// check can actually see the bug (a test that cannot fail proves nothing).
const CONTROL = args.includes("--control");
const OLD_HUD_RULE = `
  .map-command-center .map-hud-panel,
  .map-command-center [class*="hud"],
  .map-command-center .maplibregl-ctrl {
    background:
      linear-gradient(160deg, rgba(91,192,190,0.10), rgba(20,44,66,0.05)),
      linear-gradient(180deg, rgba(24,40,58,0.92), rgba(13,23,33,0.96));
    border: 1px solid rgba(91,192,190,0.22);
  }
`;

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
  { name: "laptop-1280", width: 1280, height: 800, isMobile: false },
  { name: "phone-390", width: 390, height: 844, isMobile: true },
  { name: "phone-360", width: 360, height: 780, isMobile: true },
];

const results = [];

async function inspect(page, vp) {
  return page.evaluate(() => {
    const outer = document.querySelector(".map-top-hud");
    const inner = document.querySelector(".map-top-hud__inner");
    const read = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        bgColor: cs.backgroundColor,
        bgImage: cs.backgroundImage,
        borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderBottom: `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`,
        boxShadow: cs.boxShadow,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      };
    };
    const text = (sel) =>
      document.querySelector(sel)?.textContent?.replace(/\s+/g, " ").trim() ?? null;

    const canvas = document.querySelector(".maplibregl-canvas");
    const cr = canvas?.getBoundingClientRect();

    return {
      outer: read(outer),
      inner: read(inner),
      // is anything *else* inside the command center painted like a HUD?
      strayHudPainted: Array.from(
        document.querySelectorAll('.map-command-center [class*="hud"]')
      )
        .filter((el) => el !== inner && !el.contains(inner) && !inner?.contains(el))
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.backgroundImage !== "none" || cs.backgroundColor !== "rgba(0, 0, 0, 0)";
        })
        .map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
      // the fix must not have stripped the jewel glass from its siblings
      hudFamily: Array.from(
        document.querySelectorAll(
          '.map-command-center .maplibregl-ctrl, .map-command-center .map-hud-panel'
        )
      )
        .slice(0, 10)
        .map((el) => {
          const cs = getComputedStyle(el);
          return {
            cls: String(el.className).slice(0, 48),
            painted: cs.backgroundImage !== "none" || cs.backgroundColor !== "rgba(0, 0, 0, 0)",
          };
        }),
      count: text('[data-testid="map-site-count"]'),
      hudText: text(".map-top-hud__inner"),
      hasGeolocate: !!document.querySelector('[data-testid="geolocate-btn"]'),
      hasPinProof: /pin proof/i.test(document.querySelector(".map-top-hud")?.textContent || ""),
      hasBtc: /BTC|CAD|\$/i.test(document.querySelector(".btc-ticker")?.textContent || ""),
      btcText: text(".btc-ticker"),
      scrollOverflow: document.documentElement.scrollWidth - window.innerWidth,
      canvas: cr ? { width: Math.round(cr.width), height: Math.round(cr.height) } : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    userAgent: vp.isMobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    // the HUD renders once the dataset/records resolve; the count is the tell
    await page.waitForSelector('[data-testid="map-site-count"]', { timeout: 45_000 });
    await page.waitForSelector(".maplibregl-canvas", { timeout: 45_000 });
    await page.waitForTimeout(4000); // let tiles + tickers settle

    const data = await inspect(page, vp);

    // clipped strip around the whole wrapper, for pixel analysis
    let shot = null;
    if (data.outer) {
      const pad = 10;
      const x = Math.max(0, Math.floor(data.outer.rect.x - pad));
      const y = Math.max(0, Math.floor(data.outer.rect.y - pad));
      const width = Math.min(vp.width - x, Math.ceil(data.outer.rect.width + pad * 2));
      const height = Math.min(
        vp.height - y,
        Math.ceil(Math.max(data.outer.rect.height, 4) + pad * 2)
      );
      const file = resolve(outDir, `${vp.name}.png`);
      await page.screenshot({ path: file, clip: { x, y, width, height } });
      shot = {
        file,
        clip: { x, y, width, height },
        // inner pill in clip-local coordinates, so pixels can be sampled outside it
        pill: data.inner
          ? {
              x: data.inner.rect.x - x,
              y: data.inner.rect.y - y,
              width: data.inner.rect.width,
              height: data.inner.rect.height,
            }
          : null,
      };
    }
    const record = { viewport: vp.name, ok: true, ...data, screenshot: shot, errors };

    if (CONTROL && shot) {
      await page.addStyleTag({ content: OLD_HUD_RULE });
      await page.waitForTimeout(400);
      const before = await inspect(page, vp);
      const controlFile = resolve(outDir, `${vp.name}-control.png`);
      await page.screenshot({ path: controlFile, clip: shot.clip });
      record.control = {
        ...before,
        screenshot: { file: controlFile, clip: shot.clip, pill: shot.pill },
      };
    }

    results.push(record);
  } catch (err) {
    results.push({ viewport: vp.name, ok: false, error: String(err).slice(0, 300), errors });
  }
  await context.close();
}

await browser.close();
writeFileSync(resolve(outDir, "results.json"), JSON.stringify(results, null, 2));

// ── assertions ─────────────────────────────────────────────────────────────
// The bar was painted on the WRAPPER by CSS, so the invariant is "the wrapper is
// unpainted and only the pill paints". Screenshots land in outDir as evidence.
const failures = [];

function checkViewport(r) {
  const size = `${r.viewport.width}x${r.viewport.height}`;
  const at = (msg) => failures.push(`${size}: ${msg}`);
  if (!r.ok) return at(`page failed — ${r.error}`);
  const { outer, inner } = r;
  if (!outer) return at("no .map-top-hud wrapper in the DOM");
  if (!inner) return at("no .map-top-hud__inner pill in the DOM");

  // 1. the wrapper must not paint anything
  if (outer.bgImage !== "none") at(`wrapper paints a background-image (${outer.bgImage.slice(0, 48)})`);
  if (outer.bgColor !== "rgba(0, 0, 0, 0)") at(`wrapper has a background colour (${outer.bgColor})`);
  if (!outer.borderTop.startsWith("0px")) at(`wrapper has a border (${outer.borderTop})`);
  if (outer.boxShadow !== "none") at(`wrapper has a shadow (${outer.boxShadow})`);
  if (outer.backdropFilter && outer.backdropFilter !== "none")
    at(`wrapper blurs what is behind it (${outer.backdropFilter})`);

  // 2. the pill must still be solid, or the fix went too far
  if (!/^rgba\(15, 23, 42, 0\.9[0-9]\)$/.test(inner.bgColor))
    at(`pill is no longer solid rgba(15,23,42,~.96) — got ${inner.bgColor}`);

  // 3. the pill must still sit inside the wrapper (layout intact)
  const within =
    inner.rect.x >= outer.rect.x - 1 &&
    inner.rect.y >= outer.rect.y - 1 &&
    inner.rect.x + inner.rect.width <= outer.rect.x + outer.rect.width + 1 &&
    inner.rect.y + inner.rect.height <= outer.rect.y + outer.rect.height + 1;
  if (!within) at("pill escapes the wrapper's box — layout broke");

  // 4. content intact
  if (!/^[0-9][0-9,]*$/.test(String(r.count))) at(`site count missing/odd (${r.count})`);
  const visible = String(r.hudText).match(/([0-9][0-9,]*) visible/);
  if (!visible) at("the '/ N visible' half of the HUD is gone");
  else if (visible[1] !== r.count) at(`counts disagree — ${r.count} vs ${visible[1]} visible`);
  if (!r.hasGeolocate) at("geolocate button is missing");
  if (!r.hasPinProof) at("Pin proof chip is missing");
  if (!r.hasBtc) at("BTC ticker is missing");

  // 5. nothing else matched by the loose [class*="hud"] selector is painted
  if (r.strayHudPainted.length)
    at(`other hud elements are painted: ${r.strayHudPainted.join(", ")}`);

  // 6. the fix must not have stripped its siblings' jewel glass
  const unpaintedFamily = (r.hudFamily || []).filter((f) => !f.painted);
  if (unpaintedFamily.length)
    at(`jewel glass lost on: ${unpaintedFamily.map((f) => f.cls).join(", ")}`);

  // 7. no layout damage
  if (r.scrollOverflow > 0) at(`horizontal overflow of ${r.scrollOverflow}px`);
  if (!r.canvas || r.canvas.width < 100) at("map canvas did not render");
}

// In control mode the assertions must run against the re-measurement taken
// AFTER the old rule was injected (r.control), not the as-shipped one.
const measured = results.map((r) =>
  CONTROL ? { viewport: r.viewport, ok: r.ok && !!r.control, ...(r.control || {}), error: r.error } : r
);

for (const r of measured) checkViewport(r);

for (const r of measured) {
  const size = r.ok ? `${r.viewport.width}x${r.viewport.height}` : r.viewport;
  if (!r.ok) {
    console.log(`${size}: FAILED to load — ${r.error}`);
    continue;
  }
  const stray = r.strayHudPainted.length ? ` stray=${r.strayHudPainted.length}` : "";
  console.log(
    `${size}: wrapper[bg=${r.outer?.bgImage} shadow=${r.outer?.boxShadow} border=${r.outer?.borderTop.split(" ")[0]}] ` +
      `pill=${r.inner?.bgColor} count=${r.count} overflow=${r.scrollOverflow}${stray}`
  );
}
console.log(`\nscreenshots: ${outDir}`);

if (CONTROL) {
  // A check that cannot fail proves nothing: with the old rule re-injected the
  // assertions MUST fire, otherwise this verifier is not measuring anything.
  if (failures.length) {
    console.log(`\nCONTROL OK — the check detects the regression (${failures.length} assertion(s) fired with the old rule):`);
    for (const f of failures) console.log(`  • ${f}`);
  } else {
    console.log("\nCONTROL BROKEN — the check passed with the old rule injected, so it cannot detect the bar");
    process.exitCode = 1;
  }
} else if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`\nPASS — wrapper unpainted, pill solid, HUD content intact at ${results.length} viewports`);
}
