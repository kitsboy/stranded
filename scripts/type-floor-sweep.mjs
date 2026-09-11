#!/usr/bin/env node
/**
 * sweep-type-floor.mjs — one-shot codemod for the mobile-legibility type floor.
 *
 *   text-[8px] / text-[9px] / text-[10px]  ->  text-micro  (11px, chart + map chrome)
 *                                          ->  text-label  (12px, everything readable)
 *
 * Conservative: only rewrites the exact utility token (with any responsive /
 * state prefix preserved), never touches other classes.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Map chrome + chart internals: fixed-size overlays and axis/legend text where
// 12px would re-open the overlap bugs the previous pass closed. 11px = the floor.
const MICRO = [
  'components/Map.tsx',
  'components/MapHud.tsx',
  'components/MapToolbar.tsx',
  'components/MapStatsBar.tsx',
  'components/MapFiltersPanel.tsx',
  'components/MapFilterSummary.tsx',
  'components/MapProvinceBars.tsx',
  'components/LayerControls.tsx',
  'components/ScoreLegend.tsx',
  'components/ScoreSparkline.tsx',
  'components/SavedMapViews.tsx',
  'components/FirstRunStrip.tsx',
  'components/OnboardingTour.tsx',
  'components/OfflineIndicator.tsx',
  'components/CommandPalette.tsx',
  'components/MinerStackCockpit.tsx',
  'components/MinerStackThumbBar.tsx',
  'components/RoiProjectionChart.tsx',
  'components/GasDeclineChart.tsx',
  'components/GeneratorDerateChart.tsx',
  'components/EducationCharts.tsx',
  'components/EducationHalvingTimeline.tsx',
  'components/MonteCarloPanel.tsx',
  'components/ScoreHistogram.tsx',
  'components/ConfidenceBandBar.tsx',
]

const files = execSync(
  "grep -rl 'text-\\[8px\\]\\|text-\\[9px\\]\\|text-\\[10px\\]\\|text-\\[11px\\]' --include=*.tsx --include=*.ts app components lib",
  { cwd: '/root/work/stranded', encoding: 'utf8' }
).trim().split('\n')

const RE = /text-\[(8|9|10|11)px\]/g
let changed = 0
const report = []
for (const f of files) {
  const p = `/root/work/stranded/${f}`
  const src = readFileSync(p, 'utf8')
  const target = MICRO.includes(f) ? 'text-micro' : 'text-label'
  let n = 0
  const out = src.replace(RE, () => { n++; return target })
  if (n) { writeFileSync(p, out); changed++; report.push(`${String(n).padStart(3)}  ${target === 'text-micro' ? 'micro(11)' : 'label(12)'}  ${f}`) }
}
console.log(`files rewritten: ${changed}\n`)
console.log(report.sort().join('\n'))
