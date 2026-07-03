# stranded — Context Map

## Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Maps | MapLibre GL |
| Animations | Framer Motion |
| Data | GeoJSON + static JSON |

## Ports
| Service | Port |
|---------|------|
| Next.js dev server | 3003 |

## Architecture
- Static export via `BUILD_STATIC=true npm run build` → `dist/`
- Fully client-side — no server runtime
- Next.js App Router (`app/`) for routing
- MapLibre GL for interactive site maps
- GeoJSON datasets enriched with generator sizing & per-site ROI

## Dataset
| Data | Records | Source |
|------|---------|--------|
| ECCC methane-emitting sites | 2,611 | Open Canada Data |

## Core Thesis
Stranded methane → generator power → Bitcoin mining → value creation
Climate + capital + community wealth through Bitcoin mining of wasted energy.

## Research
EU Horizon Europe active (Pillar II Cluster 5).
See `docs/` for EU funding research documents.

## Key Files
| Path | Purpose |
|------|---------|
| app/ | Next.js App Router pages |
| components/ | React components |
| docs/ | Project documentation |
| deploy.sh | Deployment automation script |
| next.config.js | Next.js config (static export) |

## Hosting
Cloudflare Pages — auto-deploy from git push
Custom domain: stranded.giveabit.io
