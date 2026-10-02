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
      linear-gradient(180deg, rgba(24,40,58,0.92), rgba(13,23,33,0.96)) !important;
    border: 1px solid rgba(91,192,190,0.22) !important;
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
        outer: before.outer,
        inner: before.inner,
        strayHudPainted: before.strayHudPainted,
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
console.log(JSON.stringify(results, null, 2));
