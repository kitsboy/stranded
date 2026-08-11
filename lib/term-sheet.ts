/**
 * Lightweight term-sheet sketch for diligence packs (not legal advice).
 */

export type TermSheetInput = {
  projectName: string
  province?: string
  siteCount: number
  totalCapexCad: number
  equityPct?: number
  debtPct?: number
  targetIrrPct?: number
  holdYears?: number
  annualRevenueCad?: number
  co2eTonnesYear?: number
  notes?: string
}

export type TermSheetSketch = {
  equityCad: number
  debtCad: number
  simplePaybackYears: number | null
  revenueToCapex: number | null
  markdown: string
}

export function sketchTermSheet(input: TermSheetInput): TermSheetSketch {
  const equityPct = input.equityPct ?? 40
  const debtPct = input.debtPct ?? 60
  const equityCad = Math.round(input.totalCapexCad * (equityPct / 100))
  const debtCad = Math.round(input.totalCapexCad * (debtPct / 100))
  const annual = input.annualRevenueCad ?? 0
  const simplePaybackYears =
    annual > 0 && input.totalCapexCad > 0 ? Math.round((input.totalCapexCad / annual) * 10) / 10 : null
  const revenueToCapex =
    input.totalCapexCad > 0 && annual > 0 ? Math.round((annual / input.totalCapexCad) * 1000) / 1000 : null

  const md = [
    `# Term sheet sketch — ${input.projectName}`,
    '',
    `> Illustrative only. Not an offer. Not legal or investment advice.`,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Sites | ${input.siteCount} |`,
    `| Province focus | ${input.province || 'Multi-province'} |`,
    `| Total CapEx (CAD) | ${input.totalCapexCad.toLocaleString()} |`,
    `| Equity (${equityPct}%) | ${equityCad.toLocaleString()} |`,
    `| Debt (${debtPct}%) | ${debtCad.toLocaleString()} |`,
    `| Target IRR | ${input.targetIrrPct ?? 18}% |`,
    `| Hold period | ${input.holdYears ?? 7} years |`,
    `| Annual revenue (model) | ${annual ? annual.toLocaleString() : '—'} |`,
    `| Simple payback | ${simplePaybackYears != null ? `${simplePaybackYears} yr` : '—'} |`,
    `| Rev / CapEx | ${revenueToCapex != null ? revenueToCapex : '—'} |`,
    `| CO₂e abated / yr | ${input.co2eTonnesYear != null ? input.co2eTonnesYear.toLocaleString() : '—'} t |`,
    '',
    '## Structure notes',
    '- SPV per cluster or province preferred',
    '- Generator + ASIC CapEx staged on FID milestones',
    '- Methane MRV via ECCC-aligned measurement where available',
    '- Bitcoin treasury policy optional at SPV level',
    '',
    input.notes ? `## Notes\n${input.notes}\n` : '',
    '— Stranded Value · stranded.giveabit.io · Safe Harbour',
  ]
    .filter(Boolean)
    .join('\n')

  return { equityCad, debtCad, simplePaybackYears, revenueToCapex, markdown: md }
}
