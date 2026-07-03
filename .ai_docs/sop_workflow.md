# SOP — Stranded Project

> Standard Operating Procedures for the **Stranded** Next.js static site.
> Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
> Build output: Static export to `dist/` (not `.next/`)
> Port: **3003**

---

## 1. Install Dependencies

```bash
npm install
```

> `node_modules` is present; re-run after pulling new deps or switching branches.

---

## 2. Development Server

```bash
npm run dev
```

- Starts `next dev -p 3003`
- Uses **normal `.next/`** cache (NOT static export) — full HMR & CSS hot reload
- Open: http://localhost:3003
- Clean ritual if CSS/HMR issues appear:
  ```bash
  rm -rf .next dist node_modules/.cache
  npm run dev
  ```

---

## 3. Build (Static Export)

```bash
npm run build
```

- Runs `BUILD_STATIC=true next build`
- **next.config.js** detects `BUILD_STATIC=true` and sets:
  ```js
  output: "export"
  distDir: "dist"
  ```
- Output goes to `dist/` **not** `.next/`
- Images are **unoptimized** (`images.unoptimized: true`) — static export compatible
- All routes become static `.html` files in `dist/`

---

## 4. Serve Static Build (Preview)

```bash
npm run start
```

- Runs `npx serve -p 3003 dist`
- Serves the pre-built static site from `dist/` on port 3003
- Requires `npm run build` to have been run first

---

## 5. Full Preview (Build + Start)

```bash
npm run preview
```

- Runs build then start in sequence
- Combined shortcut

---

## 6. Validate Data

```bash
npm run validate
```

- Runs `node scripts/validate-data.js`
- Checks that `data/stranded-sites-REAL.geojson` contains **exactly 2,611** site features
- Computes average Stranded Score (heuristic)
- Fails with exit code 1 if site count is wrong

---

## 7. Run Tests (Same as Validate)

```bash
npm run test
```

- Currently an alias for `npm run validate`

---

## 8. Lint

```bash
npm run lint
```

- Runs `next lint` (ESLint via Next.js config)

---

## 9. Deploy

```bash
./deploy.sh
```

- Installs deps, cleans caches, builds static export, deploys to Cloudflare Pages
- Target: **https://stranded.giveabit.io**
- Deployment: `wrangler pages deploy ./dist --project-name=stranded`
- Also auto-deploys from GitHub main branch (Cloudflare Pages integration)

---

## Key Differences from Vite Projects

| Aspect | Stranded (Next.js) | Vite project |
|--------|-------------------|-------------|
| Dev command | `next dev -p 3003` | `vite` or `npm run dev` |
| Dev port | 3003 | 5173 (default) |
| Build command | `BUILD_STATIC=true next build` | `vite build` |
| Build output dir | `dist/` | `dist/` |
| Static export | `output: "export"` in next.config.js | Built-in (always static) |
| Server for preview | `npx serve -p 3003 dist` | `vite preview` |
| Route structure | App Router (`app/` dir, file-based) | `pages/` or `src/pages/` |
| Image optimization | `images.unoptimized: true` required | Not applicable |

---

## Troubleshooting

- **Blank page / CSS 404 in dev**: Delete `.next/` + `dist/` and re-run `npm run dev`
- **Build fails**: Verify `BUILD_STATIC=true` is set in env or next.config.js catches it
- **Static export route missing**: Each route under `app/` becomes `route-name.html` in `dist/`
- **GeoJSON not loading**: Check `public/data/stranded-sites.geojson` exists
