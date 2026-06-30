# Stranded — DEPLOYMENT

> Updated: 2026-06 (current with Stranded Value, generator models + full per-site Value/ROI piping from real 2611 geojson, home flow + personas, lighter design #243447, Marketing Hub + full docs cleanup)

## ✅ CURRENT STATUS: Next.js Static + GitHub → Cloudflare Pages

**GitHub Repo (Source of Truth):** https://github.com/kitsboy/stranded (renamed from stranded-canada — see rename instructions below)  
**Branch:** `main`  
**Last Major Updates (this cycle):** Full generator integration + per-site Value (lib/sites.ts + education explorer + SiteDetailsPanel + Mission), Stranded Value rebrand + "Stranded Energy, Bitcoin Access", home business flow + persona cards, education 2.0 (sims/configurator/chemistry/quiz/toolkit), global lighter backgrounds + design polish, all docs + 5 marketing .md + Marketing-Hub.html updated and cleaned.

---

## DEPLOYMENT (Current: Next.js Static Export to Cloudflare Pages)

**Preferred: Cloudflare Pages (auto-deploy from GitHub main on every push)**
- **Future Production URL:** https://stranded.giveabit.io
- **Build:** `npm run build` (next.config.js: `output: 'export'`, `distDir: 'dist'`)
- **Preview locally:** `npx serve -p 3003 dist` (or `python3 -m http.server 3003 --directory dist`)
- CF Pages auto-builds + deploys the `dist/` contents. Point DNS for stranded.giveabit.io (or subdomain) to the Pages project. Static only — no runtime/server needed.

**Local Dev (CURRENT — port from package.json):**
```bash
npm install

# Strong clean (do this when you see ENOENT cache errors, missing CSS, or chunk 404s)
rm -rf .next dist node_modules/.cache
npm run dev           # http://localhost:3003
```

**Important change:** `next dev` now runs with a normal development setup (no `output: 'export'`). This eliminates the webpack cache conflicts with `dist/`. Production builds (`npm run build`) still produce the static `dist/` folder.
- /map : Command Center (filters + full generator/ROI in details)
- /education : Education Center (rich simulators + per-site Value explorer on real data)
- /Marketing-Hub.html : Marketing suite (self-contained)

**Notes:**
- Old Umbrel / tools.giveabit.io / nginx / Cloudflare Tunnel / password-gate setups are **fully deprecated**. No remnants in active code or docs.
- Always clean `.next dist` before dev after builds or ^C sessions.
- The GitHub repository was renamed from `stranded-canada` to `stranded` (to match current branding while keeping full history and the existing Cloudflare auto-deploy pipeline). Cloudflare Pages connection must be updated in the dashboard after the GitHub rename (detailed steps below). Branding and URLs are "Stranded" / "stranded.giveabit.io".

---

## REPO INFO & COMMANDS (Current)

```bash
git clone https://github.com/kitsboy/stranded.git
cd stranded
npm install

# Dev (use stronger clean when you see ENOENT / missing CSS / chunk errors)
rm -rf .next dist node_modules/.cache
npm run dev     # http://localhost:3003

# Build static (for CF Pages)
npm run build

# Preview the built static site locally
npm run preview
# or: npx serve -p 3003 dist
# or: python3 -m http.server 3003 --directory dist
```

**Key Files (Current Structure):**
- app/ (app router only: layout, page (home flow+personas), /map, /education (sims+explorer+quiz+toolkit), /sites; globals.css)
- lib/sites.ts (GENSET_DATA 6+ models, computeGeneratorPower, recommendGenset, enrichSite, loadSites/fetch 2611 geojson, computeSiteValue pipeline)
- components/ (Nav with logo "Stranded"+"Value", Footer w/ Marketing Hub link, SiteDetailsPanel (genset select + financing + full Value), MissionPanel (aggregates incl. generator power), Map, etc.)
- public/data/stranded-sites-REAL.geojson + .geojson (source of truth; emission_rate_kg_day + province + source_type + ... fully used)
- public/Marketing-Hub.html (standalone hub with 5 docs, lighter design, charts, visuals)
- docs/ (SOURCE-OF-TRUTH, DEPLOYMENT, DOCUMENTATION, Marketing/ 5 .md + hub copy; historical flagged)
- next.config.js (static export only on build), package.json (name: "stranded", dev on :3003)

---

## Renaming the GitHub Repo (stranded-canada → stranded) While Keeping Cloudflare Auto-Deploy

**Goal:** Rename the GitHub repository to `stranded` (clean branding, no "Canada") while keeping the existing Cloudflare Pages connection, custom domain `stranded.giveabit.io`, commit history, and "push to deploy" workflow.

**Recommended approach (do this — better than starting a brand new repo):**

1. **On GitHub.com (before or after code changes):**
   - Go to https://github.com/kitsboy/stranded-canada
   - Settings (top right) → General → Rename repository
   - Change name from `stranded-canada` to `stranded`
   - Save. GitHub will set up redirects for old links.

2. **Update your local clone (run these commands):**
   ```bash
   git remote set-url origin https://github.com/kitsboy/stranded.git
   git remote -v          # verify it now points to /stranded
   git fetch origin
   git pull origin main
   ```

3. **Commit the rename-related doc/script updates** (we've already updated package.json, deploy.sh, and all active docs in this session):
   ```bash
   git add .
   git commit -m "chore: rename project from stranded-canada to stranded (branding + Cloudflare continuity)"
   git push origin main
   ```

4. **Update Cloudflare Pages (critical step to keep auto-deploy working):**
   - Go to your Cloudflare dashboard → Pages → your project (the one with custom domain `stranded.giveabit.io`).
   - Settings → Git integration (or "Build settings").
   - If it still references the old repo name, click to **Reconnect GitHub account / repository** and select the newly renamed `kitsboy/stranded` repo.
   - Confirm build settings remain:
     - Build command: `npm run build` (or `BUILD_STATIC=true next build`)
     - Build output directory: `dist`
   - The custom domain `stranded.giveabit.io` should stay attached automatically.
   - (Optional but recommended) In the Pages project settings, rename the project itself from "stranded-canada" to "stranded" for consistency. This does not change the live URL.

5. **Test the pipeline:**
   - Make a small change + push to main.
   - Watch Cloudflare Pages deploy logs. It should build from the new repo name and deploy to stranded.giveabit.io.

**Why this is better than starting a new Cloudflare push / new repo:**
- Preserves full git history, issues/PRs (if any), and the existing Cloudflare Pages project + custom domain configuration.
- Minimal downtime for the live site.
- The "push to main = auto deploy to stranded.giveabit.io" workflow continues with only the one-time dashboard reconnect.

**If something goes wrong with the reconnect:** You can always create a new Pages project pointing at the (now renamed) `stranded` repo and re-add the custom domain `stranded.giveabit.io` — but renaming the existing one is usually seamless.

After the rename + push, the KIMI handoff files in `docs/` should be refreshed with the new repo name (https://github.com/kitsboy/stranded) so Kimi/Hermes stay in sync.

All Value/ROI calcs are real, dynamic, and tied to the live 2611-site dataset + generator specs + live BTC + financing.
