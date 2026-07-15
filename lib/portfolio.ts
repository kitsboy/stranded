import { EnrichedSite } from './sites'
import { escapeHtml } from './html-escape'

const PORTFOLIO_KEY = 'stranded-mission-portfolio'
const PORTFOLIO_SHARE_KEY = 'stranded-mission-share'

/** Scale enrichment-time CAD potential (pegged at $85k BTC) to a live price. */
export function scalePotentialCad(baseCad: number, liveBtc = 85000, baseBtc = 85000): number {
  if (!baseBtc || !isFinite(liveBtc)) return baseCad
  return Math.round(baseCad * (liveBtc / baseBtc))
}

export function portfolioDailyPotentialCad(sites: EnrichedSite[], liveBtc = 85000): number {
  return sites.reduce((sum, s) => sum + scalePotentialCad(s.potentialDailyProfitCAD, liveBtc), 0)
}

export function savePortfolio(sites: EnrichedSite[]) {
  if (typeof window === 'undefined') return
  const minimal = sites.map(s => ({ id: s.id, name: s.properties.name, province: s.properties.province, score: s.strandedScore, emission: s.emission }))
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(minimal))
}

export function loadPortfolioIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((s: { id: string }) => s.id).filter(Boolean)
  } catch { return [] }
}

export type MissionMinimal = {
  id: string
  name?: string
  province?: string
  score?: number
  emission?: number
}

export function loadPortfolioMinimal(): MissionMinimal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

/** Append sites to local mission portfolio. Returns how many were newly added. */
export function addSitesToMission(sites: EnrichedSite[]): number {
  if (typeof window === 'undefined' || !sites.length) return 0
  const existing = loadPortfolioMinimal()
  const ids = new Set(existing.map(s => s.id))
  let added = 0
  for (const s of sites) {
    if (!s?.id || ids.has(s.id)) continue
    existing.push({
      id: s.id,
      name: s.properties?.name,
      province: s.properties?.province,
      score: s.strandedScore,
      emission: s.emission,
    })
    ids.add(s.id)
    added++
  }
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(existing))
  return added
}

export function addSiteIdsToMission(ids: string[], lookup: EnrichedSite[]): number {
  const map = new Map(lookup.map(s => [s.id, s]))
  const sites = ids.map(id => map.get(id)).filter(Boolean) as EnrichedSite[]
  return addSitesToMission(sites)
}

export function encodePortfolioShare(sites: EnrichedSite[]): string {
  const ids = sites.map(s => s.id).join(',')
  const payload = btoa(ids).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  if (typeof window !== 'undefined') {
    localStorage.setItem(PORTFOLIO_SHARE_KEY, payload)
  }
  return payload
}

export function decodePortfolioShare(token: string): string[] {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const ids = atob(padded)
    return ids.split(',').filter(Boolean)
  } catch { return [] }
}

export function portfolioShareUrl(sites: EnrichedSite[]): string {
  const token = encodePortfolioShare(sites)
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'
  return `${base}/map?mission=${token}`
}

export function exportPortfolioCsv(sites: EnrichedSite[], liveBtc = 85000): string {
  const headers = ['id', 'name', 'province', 'emission_kg_day', 'stranded_score', 'genset_kw', 'potential_daily_cad', 'btc_price']
  const rows = sites.map(s => [
    s.id,
    `"${(s.properties.name || '').replace(/"/g, '""')}"`,
    s.properties.province,
    s.emission,
    s.strandedScore,
    s.maxGeneratorPowerKW || 0,
    scalePotentialCad(s.potentialDailyProfitCAD, liveBtc),
    liveBtc,
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function exportPortfolioPdfHtml(sites: EnrichedSite[], liveBtc: number): string {
  const totalEm = sites.reduce((s, x) => s + x.emission, 0)
  const totalPot = portfolioDailyPotentialCad(sites, liveBtc)
  const rows = sites.map(s =>
    `<tr><td>${escapeHtml(s.properties.name)}</td><td>${escapeHtml(s.properties.province)}</td><td>${escapeHtml(s.emission.toLocaleString())}</td><td>${escapeHtml(s.strandedScore)}</td></tr>`
  ).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Stranded Mission Brief</title><style>body{font-family:system-ui;padding:40px;color:#1e293b}h1{color:#FF8C00}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #ccc;padding:8px;text-align:left}th{background:#243447;color:white}</style></head><body>
<h1>Stranded Value — Mission Brief</h1>
<p>Generated ${escapeHtml(new Date().toLocaleString())} · BTC $${escapeHtml(liveBtc.toLocaleString())} · ${sites.length} sites</p>
<p><strong>Total emission:</strong> ${escapeHtml(totalEm.toLocaleString())} kg/day · <strong>Daily potential:</strong> C$${escapeHtml(totalPot.toLocaleString())}</p>
<table><thead><tr><th>Site</th><th>Province</th><th>kg/day</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:30px;font-size:11px;color:#666">Not financial advice. Data: ECCC open dataset.</p>
</body></html>`
}