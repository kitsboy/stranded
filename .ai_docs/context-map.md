# Context Map — Stranded

> Last audited: 2026-08-11 (v2.10.0)

## Roles
- **M3 / Grok:** code only → push `main`
- **THOR / Kimi:** ops, vault, Docker, HQ — do not touch from M3

## Directory (high signal)

```
app/                 App Router pages (26 static routes)
components/          UI (Nav, Footer, Map, SiteDetailsPanel, dashboard/*, pitch/*)
lib/                 Pure helpers + scoring/ROI/exports (see project-summary)
public/data/         live-stats.json, geojson
public/images/       marketing art + giveabit-logo.png / giveabit-mark.png
docs/KIMI-HANDOFF.md Session handoffs (append at top)
.ai_docs/            Agent knowledge layer
scripts/             validate, live-stats, test-helpers, verify-pipeline
tests/e2e/           Playwright smoke
```

## Layout shell
- `app/layout.tsx` — Nav · main · Footer · Toaster · GlobalCommand · PwaInstallPrompt · StaleDataBanner
- Footer is **document flow** (`mt-auto`), never sticky
- Map page returns `null` for site Footer

## Deploy
- `npm run build` → `dist/` · CF Pages project `strandedbuild`
- trailingSlash: true in production static export
