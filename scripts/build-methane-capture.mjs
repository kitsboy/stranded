/**
 * Build public/data/methane-capture.json from the federal GHGRP file.
 * One row per site that reports methane, largest first.
 * A vent or flare figure is kept only when flux_scope is "fugitive".
 * Sites without that split are not marked as vented.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const geo = JSON.parse(fs.readFileSync(path.join(root, 'public/data/stranded-sites-REAL.geojson'), 'utf8'))
const rows = []
for (const feature of geo.features || []) {
  const p = feature.properties || {}
  const kg = Number(p.emission_rate_kg_day)
  if (!(kg > 0)) continue
  const split = p.flux_scope === 'fugitive'
    && (Number.isFinite(Number(p.ch4_vented_kg_day)) || Number.isFinite(Number(p.ch4_flared_kg_day)))
  const vented = split && Number.isFinite(Number(p.ch4_vented_kg_day)) ? Number(p.ch4_vented_kg_day) : null
  const flared = split && Number.isFinite(Number(p.ch4_flared_kg_day)) ? Number(p.ch4_flared_kg_day) : null
  rows.push({
    kg: Math.round(kg * 100) / 100,
    vented: vented == null ? null : Math.round(vented * 100) / 100,
    flared: flared == null ? null : Math.round(flared * 100) / 100,
    split,
  })
}
rows.sort((a, b) => b.kg - a.kg)
const out = {
  schema: 'gab.stranded.methane-capture.v1',
  generatedAt: new Date().toISOString(),
  source: 'Environment and Climate Change Canada — Greenhouse Gas Reporting Program',
  sourceUrl: 'https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823',
  newestReferenceYear: geo.metadata?.newest_reference_year ?? null,
  siteCount: (geo.features || []).length,
  sitesWithMethane: rows.length,
  note: 'Rows are reported methane, largest first. vented and flared are set only when flux_scope is fugitive. A missing split is not zero venting.',
  rows,
}
const dest = path.join(root, 'public/data/methane-capture.json')
fs.writeFileSync(dest, JSON.stringify(out))
console.log(`wrote ${rows.length} methane rows to ${dest}`)
