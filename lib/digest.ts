export type DigestStats = {
  siteCount?: number
  version?: string
  generatedAt?: string
  topProvinces?: { name?: string; count?: number; pct?: number }[]
  topSites?: { name?: string; province?: string; score?: number }[]
  avgScore?: number
}

export function buildWeeklyDigestMarkdown(stats: DigestStats): string {
  const date = new Date().toISOString().slice(0, 10)
  const provinces = (stats.topProvinces || []).slice(0, 5)
  const sites = (stats.topSites || []).slice(0, 5)
  return [
    `# Stranded Value — Weekly Digest`,
    `**Week of** ${date} · platform v${stats.version || '—'}`,
    '',
    '## Snapshot',
    `- Sites in dataset: **${(stats.siteCount ?? 2611).toLocaleString()}**`,
    `- Avg Stranded Score: **${stats.avgScore ?? '—'}**`,
    `- Stats generated: ${stats.generatedAt || '—'}`,
    '',
    '## Top provinces',
    ...provinces.map((p, i) => `${i + 1}. ${p.name || '—'} — ${p.count ?? '—'} sites${p.pct != null ? ` (${p.pct}%)` : ''}`),
    '',
    '## Watchlist sites',
    ...sites.map((s, i) => `${i + 1}. ${s.name || '—'} (${s.province || '—'}) · score ${s.score ?? '—'}`),
    '',
    '## What to do this week',
    '1. Open the map with your province filter',
    '2. Build a mission of 5–15 sites',
    '3. Export a bank pack for diligence',
    '',
    'https://stranded.giveabit.io · Safe Harbour',
  ].join('\n')
}
