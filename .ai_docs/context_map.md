# Context Map — Stranded

> Full project context for the **Stranded** Next.js static site on M3.
> Last audited: 2026-07-02

---

## Directory Structure

```
~/projects/stranded/
├── app/                          # Next.js App Router pages
│   ├── globals.css                Global Tailwind styles
│   ├── layout.tsx                 Root layout (HTML shell, Nav, Footer)
│   ├── page.tsx                   Home page / landing
│   ├── education/page.tsx         Education Center (simulators, quiz, viz)
│   ├── map/page.tsx               Command Center Map (MapLibre GL, 2,611 sites)
│   └── sites/page.tsx             All Sites explorer table
├── components/                    # Shared UI components
│   ├── CommandPalette.tsx         Global ⌘K command palette
│   ├── EducationModal.tsx         Education modal overlay
│   ├── Footer.tsx                 Site footer
│   ├── GlobalCommand.tsx          Global keyboard shortcut handler
│   ├── LayerControls.tsx          Map layer toggle controls
│   ├── Map.tsx                    MapLibre GL map component
│   ├── MissionPanel.tsx           Portfolio / mission builder panel
│   ├── Nav.tsx                    Top navigation bar
│   ├── PasswordGate.tsx           Password protection gate
│   └── SiteDetailsPanel.tsx       Per-site detail panel (generators, ROI)
├── lib/                           # Shared logic & data layer
│   └── sites.ts                   GENSET_DATA, computeGeneratorPower, ROI calcs
├── data/                          # Source data (never mutated)
│   ├── sites.json                 Site data (legacy)
│   └── stranded-sites-REAL.geojson  Master copy — 2,611 ECCC sites
├── types/                         # TypeScript type definitions
│   ├── geojson.d.ts               GeoJSON property types
│   └── site.ts                    Site & generator type definitions
├── public/                        # Static assets (served at /)
│   ├── _headers                   Cloudflare Pages custom headers
│   ├── _redirects                 Cloudflare Pages redirects (SPA handled by HashRouter)
│   ├── manifest.json              PWA manifest
│   ├── logo.png                   App icon
│   ├── Marketing-Hub.html         Self-contained marketing suite
│   ├── data/
│   │   ├── stranded-sites.geojson      Served GeoJSON (copy for web)
│   │   └── stranded-sites-REAL.geojson Backup copy
│   ├── docs/                      5 enhanced marketing documents
│   │   ├── 1-Executive-Summary-Enhanced.md
│   │   ├── 2-Marketing-One-Pager-Enhanced.md
│   │   ├── 3-Mission-Statement-Enhanced.md
│   │   ├── 4-Mission-Vision-Values-Enhanced.md
│   │   └── 5-Roadmap-Funding-Enhanced.md
│   └── images/                    14 marketing / educational images
├── scripts/                       # Utility scripts
│   └── validate-data.js           GeoJSON validation (count, score sanity)
├── docs/                          # Living project documentation
├── archive/                       # Archived / deprecated files
├── dist/                          # Static build output (gitignored)
├── .next/                         # Next.js dev cache (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── next.config.js                 Next.js config (static export, unoptimized images)
├── tailwind.config.ts             Tailwind config (midnight, orange, teal)
├── tsconfig.json                  TypeScript config (@/* path alias)
├── postcss.config.js              PostCSS config (Tailwind + Autoprefixer)
├── package.json                   Scripts & dependencies
├── deploy.sh                      Cloudflare Pages deploy script
├── .gitignore                     Git ignore rules
├── README.md                      Project README
├── AGENTS.md                      Agent instructions
├── GROK-SESSION-PROTOCOL.md       Grok session protocol
├── CONTRIBUTING.md                Contribution guide
├── CHANGELOG.md                   Changelog
├── SOURCE-OF-TRUTH.md             Single source of truth doc
├── EXEC-SUMMARY.md                Executive summary
├── MARKETING-ONELINER.md          Marketing one-liner
├── STATUS.md                      Current project status
├── LICENSE                        License file
├── SESSION-SUMMARY-2026-06-09.md  Session summary
├── SESSION-SUMMARY-2026-06-10.md  Session summary
└── next-env.d.ts                  Next.js env types
```

---

## Dependencies Table

| Package | Version | Role |
|---------|---------|------|
| `next` | 14.2.5 | React framework (App Router, static export) |
| `react` / `react-dom` | ^18 | UI library |
| `typescript` | ^5 | Type system |
| `tailwindcss` | ^3.4.10 | Utility-first CSS |
| `framer-motion` | ^12.40.0 | Animations / transitions |
| `maplibre-gl` | ^5.22.0 | Map rendering (self-hosted, no API key) |
| `leaflet` / `react-leaflet` | ^1.9.4 / ^4.2.1 | Fallback map component |
| `lucide-react` | ^0.577.0 | Icon library |
| `js-cookie` | ^3.0.5 | Cookie management |
| `qrcode.react` | ^4.2.0 | QR code generation |
| `sonner` | ^2.0.7 | Toast notifications |
| `eslint` / `eslint-config-next` | ^8 / 14.2.5 | Linting |
| `autoprefixer` / `postcss` | latest | CSS processing |

---

## Config Details

### next.config.js

```js
// Static export config — only activates when BUILD_STATIC=true or NODE_ENV=production
if (process.env.NODE_ENV === "production" || process.env.BUILD_STATIC === "true") {
  nextConfig.output = "export";
  nextConfig.distDir = "dist";
}
// images.unoptimized: true (always — required for static export)
```

- `BUILD_STATIC=true` env var controls static export mode
- Dev mode (no env var) uses standard `.next/` with full HMR
- Build output: `dist/` (NOT `.next/`)

### tsconfig.json

- Strict mode enabled
- Path alias: `@/*` → `./*`
- `moduleResolution: "bundler"`
- `jsx: "preserve"` (Next.js handles JSX)

### tailwind.config.ts

- Custom colors: `midnight (#1e293b)`, `orange (#FF8C00)`, `teal (#5BC0BE)`
- Content paths: `./app/`, `./components/`, `./pages/`

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `app/page.tsx` | Home / landing — stranded value flow + persona paths |
| `/map` | `app/map/page.tsx` | Command Center Map — 2,611 sites, filters, mission panel |
| `/education` | `app/education/page.tsx` | Education Center — simulators, quiz, viz, toolkit |
| `/sites` | `app/sites/page.tsx` | All Sites explorer — generator power + genset columns |
| `/Marketing-Hub.html` | Static HTML | Self-contained marketing suite in `public/` |

---

## Port & Server

- **Development**: port **3003** (`next dev -p 3003`)
- **Static preview**: port **3003** (`npx serve -p 3003 dist`)
- **Production**: https://stranded.giveabit.io (Cloudflare Pages)

---

## Build Output

```
dist/
├── index.html            Home page
├── map.html              Map page
├── education.html        Education page
├── sites.html            Sites page
├── 404.html              Custom 404
├── Marketing-Hub.html    Marketing suite
├── _next/static/         Next.js static assets (JS/CSS chunks)
├── data/                 GeoJSON data files
├── docs/                 Marketing documents
├── images/               Image assets
├── logo.png              App icon
├── manifest.json         PWA manifest
├── index.txt             SEO route listing
├── map.txt               SEO route listing
├── education.txt         SEO route listing
└── sites.txt             SEO route listing
```

---

## Data Validation Pipeline

1. **Source of truth**: `data/stranded-sites-REAL.geojson` (never mutated, 2,611 features)
2. **Web copy**: `public/data/stranded-sites.geojson` (served at `/data/stranded-sites.geojson`)
3. **Validation**: `scripts/validate-data.js` — checks site count (must be 2,611) + scores
4. **Client-side ROI**: `lib/sites.ts` — computes generator power, ASIC count, daily BTC, CapEx, methane loss, payback from emission rates

### Validation command

```bash
npm run validate
# or
node scripts/validate-data.js
```

### Validation checks

- Total features === 2,611
- Average Stranded Score (heuristic) computed
- Exits with code 1 on failure

---

## Key Facts

- **Stack**: Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
- **Build type**: Static export (`BUILD_STATIC=true next build`)
- **Dev port**: 3003
- **Build output**: `dist/`
- **Domain**: stranded.giveabit.io
- **GitHub**: github.com/kitsboy/stranded.git
- **Deploy**: Cloudflare Pages (manual: `./deploy.sh`, auto: from GitHub main)
- **Data**: 2,611 ECCC stranded methane emission sites with live BTC pricing
- **Maps**: MapLibre GL (primary) + Leaflet (react-leaflet, fallback)
- **PWA**: Yes (manifest.json with shortcuts to /map, /education, /sites)
- **Routing**: HashRouter on static export (see `_redirects`)
- **Auth**: PasswordGate component (simple gate, no backend)
