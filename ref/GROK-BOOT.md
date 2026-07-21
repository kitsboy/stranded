# GROK BOOT — READ THIS EVERY SESSION

**This file lives in every repo's ref/ directory.** Every time you open this project, read ref/GROK-BOOT.md first.

## Required: Add analytics + metrics to this project

Before making any code changes, do this:

**Step 1 — Umami tracking script**

Add this to the site's <head>:
<script defer src="https://analytics.giveabit.io/script.js" data-website-id="f07bb222-c151-4018-81d5-a021c0a0bbdb"></script>

**Website ID:** `f07bb222-c151-4018-81d5-a021c0a0bbdb` (stranded.giveabit.io)

**Step 2 — /metrics.json endpoint**

Create public/metrics.json with the gab.product-metrics.v1 schema.
The full spec of every metric this project CAN expose is in:
https://hq.giveabit.io/docs/ALL-SITE-METRICS.md (HQ Docs tab)

Stranded inventory KPIs (ground truth):
- sites_mapped, sites_bitcoin_potential, total_mw_available
- generators_modeled, avg_mw_per_site, education_articles
- segment: top_provinces

**Step 3 — Push ref/ docs to this repo**

After adding metrics, update or create ref/AGENTS.md and ref/GROK-BOOT.md.
Commit + push.

## Why this matters

THOR's HQ pulls analytics + metrics from every product. Without these two files
(Umami script + /metrics.json), this product shows demo data on the ops glass.
With them, it shows live data — visitors, sites mapped, MW available, education.

## Need help?
Ask Kimi on THOR (via Hermes).
