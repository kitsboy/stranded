/**
 * Bank pack builders — multi-format diligence packages (client-only, no SaaS).
 * CSV / Markdown / HTML / TSV for Excel (opens as spreadsheet without xlsx dep).
 */
import { EnrichedSite } from './sites'
import { explainStrandedScore, scoreTier } from './scoring'
import { computeAdvancedRoi } from './roi-model'
import { findPeerSites } from './peers'
import { sensitivityTornado } from './sensitivity'

export type BankPackOptions = {
  liveBtcUsd?: number
  title?: string
}

function esc(s: string) {
  return `"${String(s ?? '').replace(/"/g, '""')}"`
}

/** Tab-separated values — opens cleanly in Excel / Numbers without a library */
export function bankPackTsv(sites: EnrichedSite[], opts: BankPackOptions = {}): string {
  const btc = opts.liveBtcUsd ?? 85000
  const headers = [
    'id', 'name', 'province', 'city', 'source_type', 'confidence', 'reference_year',
    'emission_kg_day', 'ch4_tonnes_year', 'stranded_score', 'score_tier',
    'genset_kw', 'recommended_genset', 'potential_daily_cad', 'lcoe_usd_kwh',
    'carbon_credit_usd_yr', 'incentive_usd', 'jobs_fte', 'btc_price_usd',
    'grid_km', 'grid_inferred', 'score_emission_pts', 'score_proximity_pts',
  ]
  const rows = sites.map(s => {
    const p = s.properties
    const ex = explainStrandedScore(s)
    const roi = computeAdvancedRoi(s, (s.recommendedGenset as any) || 'jenbacher316', { liveBtcUsd: btc })
    const emF = ex.factors.find(f => f.id === 'emission')
    const prF = ex.factors.find(f => f.id === 'proximity')
    return [
      s.id,
      p.name || '',
      p.province || '',
      p.city || '',
      p.source_type || '',
      p.confidence || '',
      p.reference_year || '',
      s.emission,
      p.ch4_tonnes_year || '',
      s.strandedScore,
      scoreTier(s.strandedScore),
      s.maxGeneratorPowerKW || 0,
      s.recommendedGenset || '',
      s.potentialDailyProfitCAD,
      roi.lcoeUsdPerKwh,
      roi.carbonRevenueUsd,
      roi.incentiveGrantUsd,
      roi.jobs.total,
      btc,
      ex.factors.find(f => f.id === 'proximity')?.detail || '',
      prF?.inferred ? 'yes' : 'no',
      emF?.points ?? '',
      prF?.points ?? '',
    ].map(v => String(v).replace(/\t/g, ' ')).join('\t')
  })
  return [headers.join('\t'), ...rows].join('\n')
}

export function bankPackCsv(sites: EnrichedSite[], opts: BankPackOptions = {}): string {
  const btc = opts.liveBtcUsd ?? 85000
  const headers = [
    'id', 'name', 'province', 'source_type', 'emission_kg_day', 'stranded_score',
    'score_tier', 'genset_kw', 'potential_daily_cad', 'lcoe_usd_kwh',
    'carbon_usd_yr', 'jobs_fte', 'btc_usd',
  ]
  const rows = sites.map(s => {
    const roi = computeAdvancedRoi(s, (s.recommendedGenset as any) || 'jenbacher316', { liveBtcUsd: btc })
    return [
      s.id,
      esc(s.properties.name || ''),
      esc(s.properties.province || ''),
      esc(s.properties.source_type || ''),
      s.emission,
      s.strandedScore,
      scoreTier(s.strandedScore),
      s.maxGeneratorPowerKW || 0,
      s.potentialDailyProfitCAD,
      roi.lcoeUsdPerKwh,
      roi.carbonRevenueUsd,
      roi.jobs.total,
      btc,
    ].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

/** Full diligence brief (Markdown) — site or portfolio */
export function bankPackMarkdown(
  sites: EnrichedSite[],
  allSites: EnrichedSite[] = [],
  opts: BankPackOptions = {}
): string {
  const btc = opts.liveBtcUsd ?? 85000
  const title = opts.title || (sites.length === 1 ? 'Site Bank Pack' : 'Mission Bank Pack')
  const totalEm = sites.reduce((a, s) => a + s.emission, 0)
  const totalPot = sites.reduce((a, s) => a + s.potentialDailyProfitCAD, 0)
  const avgScore = sites.length
    ? Math.round((sites.reduce((a, s) => a + s.strandedScore, 0) / sites.length) * 10) / 10
    : 0

  const lines: string[] = [
    `# Stranded Value — ${title}`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `BTC reference: $${btc.toLocaleString()} USD`,
    `Sites: ${sites.length} · Total CH₄: ${totalEm.toLocaleString()} kg/day · Avg score: ${avgScore}`,
    `Model daily potential (portfolio): C$${totalPot.toLocaleString()}`,
    ``,
    `> Not financial advice. ECCC open data + Stranded Score™ v3 model. Independent verification required.`,
    ``,
  ]

  for (const s of sites) {
    const p = s.properties
    const ex = explainStrandedScore(s)
    const roi = computeAdvancedRoi(s, (s.recommendedGenset as any) || 'jenbacher316', { liveBtcUsd: btc })
    const peers = allSites.length ? findPeerSites(s, allSites, 5) : []
    const sens = sensitivityTornado(s, btc)

    lines.push(`## ${p.name || s.id}`)
    lines.push(``)
    lines.push(`| Field | Value |`)
    lines.push(`|---|---|`)
    lines.push(`| ID | ${s.id} |`)
    lines.push(`| Province | ${p.province || '—'} |`)
    lines.push(`| Source | ${p.source_type || '—'} |`)
    lines.push(`| Emission | ${s.emission.toLocaleString()} kg/day |`)
    lines.push(`| Stranded Score | **${s.strandedScore}** (${scoreTier(s.strandedScore)}) |`)
    lines.push(`| Generator kW | ${s.maxGeneratorPowerKW || '—'} (${s.recommendedGenset || 'n/a'}) |`)
    lines.push(`| LCOE | $${roi.lcoeUsdPerKwh}/kWh |`)
    lines.push(`| Carbon credits (model) | $${roi.carbonRevenueUsd.toLocaleString()}/yr |`)
    lines.push(`| Incentives (model) | $${roi.incentiveGrantUsd.toLocaleString()} |`)
    lines.push(`| Jobs (model) | ${roi.jobs.total} FTE |`)
    lines.push(``)
    lines.push(`### Why this score`)
    for (const f of ex.factors) {
      lines.push(`- **${f.label}** (+${f.points}): ${f.detail}${f.inferred ? ' _(inferred)_' : ''}`)
    }
    for (const n of ex.notes) lines.push(`- _Note:_ ${n}`)
    lines.push(``)
    if (sens.length) {
      lines.push(`### Sensitivity (relative impact on daily profit index)`)
      for (const row of sens) {
        lines.push(`- ${row.param}: low ${row.lowImpact.toFixed(2)} → base 1.00 → high ${row.highImpact.toFixed(2)}`)
      }
      lines.push(``)
    }
    if (peers.length) {
      lines.push(`### Peer sites (same province + source)`)
      for (const peer of peers) {
        lines.push(`- ${peer.properties.name} — score ${peer.strandedScore}, ${peer.emission.toLocaleString()} kg/d`)
      }
      lines.push(``)
    }
  }

  lines.push(`---`)
  lines.push(`*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*`)
  lines.push(`*Data: Environment and Climate Change Canada (ECCC) GHGRP open dataset.*`)
  return lines.join('\n')
}

export function bankPackHtml(sites: EnrichedSite[], opts: BankPackOptions = {}): string {
  const mdish = bankPackMarkdown(sites, [], opts)
  // Simple HTML shell for print/PDF
  const body = mdish
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^\| (.*) \|$/gm, '')
    .replace(/^\- (.*)$/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Stranded Bank Pack</title>
<style>body{font-family:system-ui,sans-serif;padding:32px;color:#1e293b;max-width:900px;margin:auto}
h1{color:#FF8C00}h2{color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
li{margin:4px 0} .note{font-size:11px;color:#64748b;margin-top:40px}</style></head>
<body>${body}
<p class="note">Not financial advice. Print via browser → Save as PDF.</p>
</body></html>`
}

export function bankPackJson(sites: EnrichedSite[], opts: BankPackOptions = {}) {
  const btc = opts.liveBtcUsd ?? 85000
  return {
    generatedAt: new Date().toISOString(),
    version: 'bank-pack-1',
    liveBtcUsd: btc,
    siteCount: sites.length,
    sites: sites.map(s => {
      const ex = explainStrandedScore(s)
      const roi = computeAdvancedRoi(s, (s.recommendedGenset as any) || 'jenbacher316', { liveBtcUsd: btc })
      return {
        id: s.id,
        name: s.properties.name,
        province: s.properties.province,
        emission: s.emission,
        score: s.strandedScore,
        tier: scoreTier(s.strandedScore),
        explain: ex,
        roi: {
          lcoeUsdPerKwh: roi.lcoeUsdPerKwh,
          carbonRevenueUsd: roi.carbonRevenueUsd,
          incentiveGrantUsd: roi.incentiveGrantUsd,
          jobs: roi.jobs,
          powerKW: roi.powerKW,
        },
        sensitivity: sensitivityTornado(s, btc),
      }
    }),
  }
}
