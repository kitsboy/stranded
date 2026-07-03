import { EnrichedSite } from './sites'

const PORTFOLIO_KEY = 'stranded-mission-portfolio'
const PORTFOLIO_SHARE_KEY = 'stranded-mission-share'

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
    return JSON.parse(raw).map((s: { id: string }) => s.id)
  } catch { return [] }
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
    s.potentialDailyProfitCAD,
    liveBtc,
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function exportPortfolioPdfHtml(sites: EnrichedSite[], liveBtc: number): string {
  const totalEm = sites.reduce((s, x) => s + x.emission, 0)
  const totalPot = sites.reduce((s, x) => s + x.potentialDailyProfitCAD, 0)
  const rows = sites.map(s => `<tr><td>${s.properties.name}</td><td>${s.properties.province}</td><td>${s.emission.toLocaleString()}</td><td>${s.strandedScore}</td></tr>`).join('')
  return `<!DOCTYPE html><html><head><title>Stranded Mission Brief</title><style>body{font-family:system-ui;padding:40px;color:#1e293b}h1{color:#FF8C00}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #ccc;padding:8px;text-align:left}th{background:#243447;color:white}</style></head><body>
<h1>Stranded Value — Mission Brief</h1>
<p>Generated ${new Date().toLocaleString()} · BTC $${liveBtc.toLocaleString()} · ${sites.length} sites</p>
<p><strong>Total emission:</strong> ${totalEm.toLocaleString()} kg/day · <strong>Daily potential:</strong> C$${totalPot.toLocaleString()}</p>
<table><thead><tr><th>Site</th><th>Province</th><th>kg/day</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:30px;font-size:11px;color:#666">Not financial advice. Data: ECCC open dataset.</p>
</body></html>`
}