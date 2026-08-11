import { escapeHtml } from './html-escape'

export type MemoSite = {
  id: string
  name?: string
  province?: string
  score?: number
  emission?: number
}

export type InvestorMemoInput = {
  title?: string
  sites: MemoSite[]
  liveBtc: number
  askCad?: number
  thesis?: string
}

export function buildInvestorMemoMarkdown(input: InvestorMemoInput): string {
  const title = input.title || 'Stranded Value — Investor Memo'
  const thesis =
    input.thesis ||
    'Capture stranded methane with modular generation and Bitcoin mining offtake — climate abatement plus hard-money cash flow.'
  const lines = [
    `# ${title}`,
    '',
    `**Date:** ${new Date().toISOString().slice(0, 10)}  `,
    `**BTC reference:** $${input.liveBtc.toLocaleString()}  `,
    input.askCad != null ? `**Indicative ask:** C$${input.askCad.toLocaleString()}  ` : '',
    '',
    '## Thesis',
    thesis,
    '',
    '## Portfolio snapshot',
    `| Site | Province | Score | kg CH₄/day |`,
    `|------|----------|------:|-----------:|`,
    ...input.sites.map(
      s =>
        `| ${s.name || s.id} | ${s.province || '—'} | ${s.score ?? '—'} | ${s.emission != null ? Math.round(s.emission).toLocaleString() : '—'} |`,
    ),
    '',
    '## Use of proceeds (illustrative)',
    '1. Pilot deployments on top-quartile Stranded Score clusters',
    '2. Measurement, reporting, verification (MRV)',
    '3. Platform + data operations',
    '',
    '## Risks',
    '- BTC price and network difficulty',
    '- Gas composition / decline',
    '- Permitting and land access',
    '',
    '— stranded.giveabit.io · Safe Harbour · Not investment advice',
  ]
  return lines.filter(Boolean).join('\n')
}

export function buildInvestorMemoHtml(input: InvestorMemoInput): string {
  const md = buildInvestorMemoMarkdown(input)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(input.title || 'Investor Memo')}</title>
  <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:32px;line-height:1.5;color:#0f172a}
  pre{white-space:pre-wrap;font-family:inherit}</style></head>
  <body><pre>${escapeHtml(md)}</pre></body></html>`
}
