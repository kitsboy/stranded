/**
 * Official surfaces, infrastructure point records, and province shades.
 * Drawn under or beside the methane pins. Nothing here is a guessed location.
 */

import { ATLAS_RASTER_TILES } from '@/lib/map-csp'
import { renewableChoroplethGeojson, type ProvinceRings } from '@/lib/province-choropleth'
import { escapeHtml } from '@/lib/renewable-layers'

export type AtlasLayerId =
  | 'solar-ghi'
  | 'solar-dni'
  | 'hydrokinetic-water'
  | 'hydrokinetic-possible'
  | 'transmission'
  | 'gas-pipeline'
  | 'liquids-pipeline'
  | 'statcan-gen'
  | 'statcan-cap'
  | 'pv-potential'

export type AtlasGroup = 'surface' | 'infra' | 'shade'
export type AtlasMark = 'wash' | 'diamond' | 'square' | 'triangle'

export type AtlasLayer = {
  id: AtlasLayerId
  group: AtlasGroup
  labelKey: string
  hintKey: string
  swatch: string
  mark: AtlasMark
  /** Present when the count is a real feature or polygon count from the official file. */
  count?: number
  tiles?: string
}

export const INFRA_DATA_URL = '/data/nacei-infrastructure.geojson'
export const PV_DATA_URL = '/data/pv-province.json'
export const HYDRO_DATA_URL = '/data/hydrokinetic.geojson'

export const CER_SOURCE = {
  href: 'https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/market-snapshots/index.html',
  labelKey: 'mapAtlasCer',
} as const

export const ATLAS_LAYERS: AtlasLayer[] = [
  {
    id: 'solar-ghi',
    group: 'surface',
    labelKey: 'mapAtlasGhi',
    hintKey: 'mapAtlasHintGhi',
    swatch: 'linear-gradient(90deg,#7c4a12,#e8c56b,#f8f1c8)',
    mark: 'wash',
    tiles: ATLAS_RASTER_TILES['solar-ghi'],
  },
  {
    id: 'solar-dni',
    group: 'surface',
    labelKey: 'mapAtlasDni',
    hintKey: 'mapAtlasHintDni',
    swatch: 'linear-gradient(90deg,#9a3412,#fb923c,#fde68a)',
    mark: 'wash',
    tiles: ATLAS_RASTER_TILES['solar-dni'],
  },
  {
    id: 'hydrokinetic-water',
    group: 'surface',
    labelKey: 'mapAtlasHydroWater',
    hintKey: 'mapAtlasHintHydro',
    swatch: '#005ce6',
    mark: 'wash',
    count: 81,
  },
  {
    id: 'hydrokinetic-possible',
    group: 'surface',
    labelKey: 'mapAtlasHydroPossible',
    hintKey: 'mapAtlasHintHydroMaybe',
    swatch: '#38bdf8',
    mark: 'wash',
    count: 59,
  },
  {
    id: 'transmission',
    group: 'infra',
    labelKey: 'mapAtlasTx',
    hintKey: 'mapAtlasHintPoint',
    swatch: '#6d28d9',
    mark: 'diamond',
    count: 28,
  },
  {
    id: 'gas-pipeline',
    group: 'infra',
    labelKey: 'mapAtlasGas',
    hintKey: 'mapAtlasHintPoint',
    swatch: '#0891b2',
    mark: 'square',
    count: 28,
  },
  {
    id: 'liquids-pipeline',
    group: 'infra',
    labelKey: 'mapAtlasLiquids',
    hintKey: 'mapAtlasHintPoint',
    swatch: '#c026d3',
    mark: 'triangle',
    count: 21,
  },
  {
    id: 'statcan-gen',
    group: 'shade',
    labelKey: 'mapAtlasGen',
    hintKey: 'mapAtlasHintGen',
    swatch: '#0d9488',
    mark: 'wash',
  },
  {
    id: 'statcan-cap',
    group: 'shade',
    labelKey: 'mapAtlasCap',
    hintKey: 'mapAtlasHintCap',
    swatch: '#d97706',
    mark: 'wash',
  },
  {
    id: 'pv-potential',
    group: 'shade',
    labelKey: 'mapAtlasPv',
    hintKey: 'mapAtlasHintPv',
    swatch: '#eab308',
    mark: 'wash',
  },
]

export const ATLAS_GROUPS: { id: AtlasGroup; titleKey: string; blurbKey: string }[] = [
  { id: 'surface', titleKey: 'mapAtlasSurfaces', blurbKey: 'mapAtlasSurfacesBlurb' },
  { id: 'infra', titleKey: 'mapAtlasInfra', blurbKey: 'mapAtlasInfraBlurb' },
  { id: 'shade', titleKey: 'mapAtlasShades', blurbKey: 'mapAtlasShadesBlurb' },
]

export function emptyAtlasState(): Record<AtlasLayerId, boolean> {
  return {
    'solar-ghi': false,
    'solar-dni': false,
    'hydrokinetic-water': false,
    'hydrokinetic-possible': false,
    transmission: false,
    'gas-pipeline': false,
    'liquids-pipeline': false,
    'statcan-gen': false,
    'statcan-cap': false,
    'pv-potential': false,
  }
}

export function atlasLayerId(id: string): string {
  return `atlas-${id}`
}

export type StatcanProvinceRow = {
  generationMWh?: Record<string, number>
  capacityMW?: Record<string, number>
}

/** Renewable slice of a Statistics Canada province row. Capacity keeps geothermal MW. */
export function statcanRenewableTotal(row: StatcanProvinceRow | undefined, mode: 'gen' | 'cap'): number {
  const bag = mode === 'gen' ? row?.generationMWh : row?.capacityMW
  if (!bag) return 0
  const keys = mode === 'gen'
    ? ['hydro', 'wind', 'solar', 'biomass', 'tidal']
    : ['hydro', 'wind', 'solar', 'biomass', 'tidal', 'geothermal']
  return keys.reduce((sum, key) => sum + (Number(bag[key]) || 0), 0)
}

export function pvProvinceTotals(doc: {
  provinces?: Record<string, { meanKwhPerKwp?: number; municipalities?: number }>
} | null | undefined): { totals: Record<string, number>; municipalities: Record<string, number> } {
  const totals: Record<string, number> = {}
  const municipalities: Record<string, number> = {}
  for (const [name, row] of Object.entries(doc?.provinces || {})) {
    const mean = Number(row?.meanKwhPerKwp)
    if (!Number.isFinite(mean)) continue
    totals[name] = mean
    municipalities[name] = Number(row?.municipalities) || 0
  }
  return { totals, municipalities }
}

const SHADE_PAINT: Record<string, [string, string]> = {
  'statcan-gen': ['rgba(45,212,191,0.12)', 'rgba(13,148,136,0.55)'],
  'statcan-cap': ['rgba(251,191,36,0.12)', 'rgba(180,83,9,0.58)'],
  'pv-potential': ['rgba(253,224,71,0.12)', 'rgba(202,138,4,0.52)'],
}

export function shadeFillPaint(id: string): [string, string] {
  return SHADE_PAINT[id] || ['rgba(148,163,184,0.05)', 'rgba(148,163,184,0.28)']
}

export function provinceShadeGeojson(
  totals: Record<string, number>,
  extra?: Record<string, Record<string, unknown>>,
  boundaries?: Record<string, ProvinceRings> | null,
): GeoJSON.FeatureCollection {
  const base = renewableChoroplethGeojson(totals, boundaries)
  return {
    type: 'FeatureCollection',
    features: base.features.map((feature) => {
      const name = String(feature.properties?.name || '')
      return {
        ...feature,
        properties: {
          ...(feature.properties || {}),
          kind: 'shade',
          ...(extra?.[name] || {}),
        },
      }
    }),
  }
}

function row(label: string, value: unknown): string {
  const text = value == null ? '' : String(value).trim()
  if (!text) return ''
  return `<div class="text-micro text-gray-300">${escapeHtml(label)}: ${escapeHtml(text)}</div>`
}

function fmtNum(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

/** Short hover. The click card is the full popup, so the two cannot stack as twin cards. */
export function atlasTeaserHtml(props: Record<string, unknown> | null | undefined): string {
  const p = props || {}
  if (p.kind === 'water' || p.kind === 'possible') {
    const river = escapeHtml(p.river || 'Unnamed river')
    return `<div class="text-xs font-semibold truncate max-w-[210px]">${river}</div><div class="text-micro text-gray-300 mt-0.5">No kilowatts in this assessment</div>`
  }
  if (p.kind === 'shade') {
    const name = escapeHtml(p.name || 'Province')
    return `<div class="text-xs font-semibold truncate max-w-[210px]">${name}</div><div class="text-micro text-gray-300 mt-0.5">Province total, not a plant pin</div>`
  }
  const name = escapeHtml(p.name || 'Infrastructure')
  return `<div class="text-xs font-semibold truncate max-w-[210px]">${name}</div><div class="text-micro text-gray-300 mt-0.5">Not a generation site</div>`
}

/** Hover / click card for an infrastructure point or a province shade. */
export function atlasPopupHtml(props: Record<string, unknown> | null | undefined): string {
  const p = props || {}
  if (p.kind === 'water' || p.kind === 'possible') {
    const river = escapeHtml(p.river || 'Unnamed river')
    const klass = p.kind === 'water' ? 'Open water' : 'Possible open water'
    return [
      `<div class="text-xs font-semibold max-w-[240px]">${river}</div>`,
      `<div class="text-micro text-gray-300 mt-0.5">${klass}</div>`,
      row('Community', p.community),
      `<div class="text-micro text-gray-400 mt-1">Official open-water polygon. The community is named on the polygon. It is not a second pin. Ice is not painted.</div>`,
      `<div class="text-micro text-gray-400 mt-1">This assessment does not publish kilowatts for the polygon, so no miner build is sized.</div>`,
      `<div class="text-micro mt-1"><a href="https://open.canada.ca/data/en/dataset/b102925f-aa0c-41ad-9cc6-979072fc4871" target="_blank" rel="noopener noreferrer" style="color:#FF8C00">Hydrokinetic assessment</a></div>`,
    ].join('')
  }

  if (p.kind === 'shade') {
    const name = escapeHtml(p.name || 'Province')
    const value = fmtNum(p.value)
    const unit = escapeHtml(p.unit || '')
    return [
      `<div class="text-xs font-semibold max-w-[240px]">${name}</div>`,
      value ? `<div class="text-micro text-gray-300 mt-0.5">${escapeHtml(value)}${unit ? ` ${unit}` : ''}</div>` : '',
      p.detail ? `<div class="text-micro text-gray-400 mt-1">${escapeHtml(p.detail)}</div>` : '',
      `<div class="text-micro text-gray-500 mt-1">${p.boundary === 'cartographic'
        ? '2021 Census cartographic boundary, generalized by the Statistics Canada map service.'
        : 'Province box, not a legal boundary.'}</div>`,
      `<div class="text-micro text-gray-400 mt-1">A province total is not a plant, so no miner build is sized on the shade.</div>`,
    ].filter(Boolean).join('')
  }

  const layer = ATLAS_LAYERS.find((item) => item.id === p.kind)
  const color = layer?.swatch || '#e2e8f0'
  const name = escapeHtml(p.name || 'Unnamed line')
  const route = [p.from, p.to].map((part) => String(part || '').trim()).filter(Boolean).join(' → ')
  const abroad = String(p.toCountry || '').trim()
  const routeText = route && abroad && abroad !== 'Canada' ? `${route} (${abroad})` : route
  const voltage = String(p.voltageKv || '').trim()
  const diameter = String(p.diameterMm || '').trim()
  return [
    `<div class="text-xs font-semibold max-w-[240px]" style="color:${escapeHtml(color)}">${name}</div>`,
    `<div class="text-micro text-gray-300 mt-0.5">${escapeHtml(layer ? layer.id.replace('-', ' ') : 'Infrastructure')} · point record</div>`,
    row('Owner', p.owner),
    row('Province', p.province),
    routeText ? row('Recorded from / to', routeText) : '',
    voltage ? row('Voltage', `${voltage} kV`) : '',
    diameter ? row('Diameter', `${diameter} mm`) : '',
    row('Product', p.product),
    row('Reference period', p.period),
    row('Filing source', p.source),
    `<div class="text-micro text-gray-400 mt-1">Official point for this line. The corridor is not in the file, so the route is not drawn. Not a generation site, so no miner build is sized here.</div>`,
    `<div class="text-micro mt-1"><a href="https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674" target="_blank" rel="noopener noreferrer" style="color:#FF8C00">NACEI infrastructure</a></div>`,
  ].filter(Boolean).join('')
}

/** One guided view: methane pins, solar plants, and solar GHI, framed on southern Alberta. */
export const SOUTHERN_ALBERTA_PRESET = {
  id: 'southern-alberta' as const,
  label: 'Southern Alberta',
  layers: {
    sites: true,
    grid: false,
    internet: false,
    satellite: false,
    terrain: false,
    heatmap: false,
    choropleth: false,
  },
  overlays: { solar: true },
  atlas: { 'solar-ghi': true },
  /** Border to just north of Calgary, Rockies to Medicine Hat. */
  fly: { lat: 50.2, lng: -112.9, zoom: 6.2 },
}

const PROVINCE_ALIAS: Record<string, string> = {
  AB: 'Alberta',
  Alberta: 'Alberta',
  BC: 'British Columbia',
  'British Columbia': 'British Columbia',
  MB: 'Manitoba',
  Manitoba: 'Manitoba',
  NB: 'New Brunswick',
  'New Brunswick': 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  'Newfoundland and Labrador': 'Newfoundland and Labrador',
  NT: 'Northwest Territories',
  'Northwest Territories': 'Northwest Territories',
  NU: 'Nunavut',
  Nunavut: 'Nunavut',
  NS: 'Nova Scotia',
  'Nova Scotia': 'Nova Scotia',
  ON: 'Ontario',
  Ontario: 'Ontario',
  PE: 'Prince Edward Island',
  PEI: 'Prince Edward Island',
  'Prince Edward Island': 'Prince Edward Island',
  QC: 'Quebec',
  Quebec: 'Quebec',
  Québec: 'Quebec',
  SK: 'Saskatchewan',
  Saskatchewan: 'Saskatchewan',
  YT: 'Yukon',
  Yukon: 'Yukon',
  'Yukon Territory': 'Yukon',
}

/** Plant-file province strings and StatCan table names do not match. */
export function canonicalProvince(name: unknown): string {
  const raw = String(name ?? '').trim()
  return PROVINCE_ALIAS[raw] || ''
}

export type InfraSearchHit = {
  id: string
  name: string
  owner: string
  kind: string
  from: string
  to: string
  lng: number
  lat: number
}

/** Match owner, line name, or the recorded from / to. Empty and one-letter queries match nothing. */
export function searchInfrastructure(
  features: Array<{ geometry?: { type?: string; coordinates?: unknown } | null; properties?: Record<string, unknown> | null }>,
  query: string,
  limit = 6,
): InfraSearchHit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const hits: InfraSearchHit[] = []
  for (const feature of features) {
    const coords = feature.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates)
      ? feature.geometry.coordinates
      : null
    if (!coords) continue
    const p = feature.properties || {}
    const name = String(p.name || '')
    const owner = String(p.owner || '')
    const from = String(p.from || '')
    const to = String(p.to || '')
    const hay = `${name} ${owner} ${from} ${to}`.toLowerCase()
    if (!hay.includes(q)) continue
    const lng = Number(coords[0])
    const lat = Number(coords[1])
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue
    hits.push({ id: String(p.id || ''), name, owner, kind: String(p.kind || ''), from, to, lng, lat })
  }
  hits.sort((a, b) => {
    const rank = (hit: InfraSearchHit) => (hit.owner.toLowerCase().includes(q) ? 0 : 1)
    const byOwner = rank(a) - rank(b)
    if (byOwner !== 0) return byOwner
    return a.name.localeCompare(b.name)
  })
  return hits.slice(0, limit)
}
