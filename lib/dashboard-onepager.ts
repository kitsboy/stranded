/**
 * Dashboard / diligence HTML one-pager (print → PDF).
 * Client-safe; no external deps.
 */
import { escapeHtml } from './html-escape'

export type OnePagerStats = {
  version?: string
  siteCount?: number
  provinceCount?: number
  generatedAt?: string
  avgScore?: number
  impact?: {
    co2eAvoided5PctTonnes?: number
    potentialDailyRevenueCad5Pct?: number
  }
  topSites?: { id?: string; name?: string; province?: string; score?: number; emissionKgDay?: number }[]
  topProvinces?: { name?: string; count?: number; pct?: number }[]
}

export type OnePagerOptions = {
  title?: string
  liveBtcUsd?: number
  thesis?: string
  askCad?: number
}

export function buildDashboardOnePagerHtml(stats: OnePagerStats, opts: OnePagerOptions = {}): string {
  const title = opts.title || 'Stranded Value — Portfolio One-Pager'
  const btc = opts.liveBtcUsd ?? 85_000
  const top = (stats.topSites || []).slice(0, 8)
  const provinces = (stats.topProvinces || []).slice(0, 6)
  const thesis =
    opts.thesis ||
    'Turn wasted methane into verifiable Bitcoin-powered wealth with zero grid impact — 2,611 ECCC-verified sites across Canada.'

  const rows = top
    .map(
      s =>
        `<tr>
          <td>${escapeHtml(s.name || s.id || '—')}</td>
          <td>${escapeHtml(s.province || '—')}</td>
          <td class="num">${s.score ?? '—'}</td>
          <td class="num">${s.emissionKgDay != null ? Math.round(s.emissionKgDay).toLocaleString() : '—'}</td>
        </tr>`,
    )
    .join('')

  const provRows = provinces
    .map(
      p =>
        `<tr>
          <td>${escapeHtml(p.name || '—')}</td>
          <td class="num">${p.count ?? '—'}</td>
          <td class="num">${p.pct != null ? `${p.pct}%` : '—'}</td>
        </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a; margin: 32px; max-width: 800px; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #c2410c; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #0d9488; margin: 24px 0 8px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
  .kpi b { display: block; font-size: 18px; }
  .kpi span { font-size: 10px; color: #64748b; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 6px 4px; text-align: left; }
  th { color: #64748b; font-size: 10px; text-transform: uppercase; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .thesis { background: #fff7ed; border-left: 3px solid #f97316; padding: 10px 12px; font-size: 13px; }
  .ask { margin-top: 20px; padding: 12px; background: #f0fdfa; border-radius: 10px; font-size: 13px; }
  footer { margin-top: 28px; font-size: 10px; color: #94a3b8; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">stranded.giveabit.io · v${escapeHtml(String(stats.version || '—'))} · BTC $${btc.toLocaleString()} · ${escapeHtml(stats.generatedAt || new Date().toISOString().slice(0, 10))}</p>
  <div class="thesis">${escapeHtml(thesis)}</div>
  <div class="kpis">
    <div class="kpi"><b>${(stats.siteCount ?? 2611).toLocaleString()}</b><span>Sites</span></div>
    <div class="kpi"><b>${stats.provinceCount ?? '—'}</b><span>Provinces</span></div>
    <div class="kpi"><b>${stats.avgScore ?? '—'}</b><span>Avg score</span></div>
    <div class="kpi"><b>${stats.impact?.co2eAvoided5PctTonnes != null ? Math.round(stats.impact.co2eAvoided5PctTonnes).toLocaleString() : '—'}</b><span>CO₂e @ 5% (t)</span></div>
  </div>
  ${opts.askCad != null ? `<div class="ask"><strong>Indicative ask:</strong> C$${opts.askCad.toLocaleString()} · structure TBD · Safe Harbour · Bitcoin-sovereign</div>` : ''}
  <h2>Top sites</h2>
  <table>
    <thead><tr><th>Site</th><th>Province</th><th class="num">Score</th><th class="num">kg CH₄/day</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">No top sites in export payload</td></tr>'}</tbody>
  </table>
  <h2>Province concentration</h2>
  <table>
    <thead><tr><th>Province</th><th class="num">Sites</th><th class="num">Share</th></tr></thead>
    <tbody>${provRows || '<tr><td colspan="3">—</td></tr>'}</tbody>
  </table>
  <footer>Data: Environment and Climate Change Canada (ECCC). Models are illustrative — not investment advice. Part of the Give A Bit family · Safe Harbour.</footer>
</body>
</html>`
}

export function openOnePagerPrint(html: string) {
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}
