/**
 * Official surfaces, infrastructure point records, and province shades.
 * Drawn under or beside the methane pins. Nothing here is a guessed location.
 */

import { ATLAS_RASTER_TILES } from '@/lib/map-csp'
import { renewableChoroplethGeojson } from '@/lib/province-choropleth'
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
    tiles: ATLAS_RASTER_TILES['hydrokinetic-water'],
  },
  {
    id: 'hydrokinetic-possible',
    group: 'surface',
    labelKey: 'mapAtlasHydroPossible',
    hintKey: 'mapAtlasHintHydroMaybe',
    swatch: '#38bdf8',
    mark: 'wash',
    count: 59,
    tiles: ATLAS_RASTER_TILES['hydrokinetic-possible'],
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
  'statcan-gen': ['rgba(45,212,191,0.06)', 'rgba(13,148,136,0.40)'],
  'statcan-cap': ['rgba(251,191,36,0.06)', 'rgba(217,119,6,0.38)'],
  'pv-potential': ['rgba(253,224,71,0.06)', 'rgba(202,138,4,0.36)'],
}

export function shadeFillPaint(id: string): [string, string] {
  return SHADE_PAINT[id] || ['rgba(148,163,184,0.05)', 'rgba(148,163,184,0.28)']
}

export function provinceShadeGeojson(
  totals: Record<string, number>,
  extra?: Record<string, Record<string, unknown>>,
): GeoJSON.FeatureCollection {
  const base = renewableChoroplethGeojson(totals)
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

/** Hover / click card for an infrastructure point or a province shade. */
export function atlasPopupHtml(props: Record<string, unknown> | null | undefined): string {
  const p = props || {}
  if (p.kind === 'shade') {
    const name = escapeHtml(p.name || 'Province')
    const value = fmtNum(p.value)
    const unit = escapeHtml(p.unit || '')
    return [
      `<div class="text-xs font-semibold max-w-[240px]">${name}</div>`,
      value ? `<div class="text-micro text-gray-300 mt-0.5">${escapeHtml(value)}${unit ? ` ${unit}` : ''}</div>` : '',
      p.detail ? `<div class="text-micro text-gray-400 mt-1">${escapeHtml(p.detail)}</div>` : '',
      `<div class="text-micro text-gray-500 mt-1">Province box, not a legal boundary.</div>`,
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
    `<div class="text-micro text-gray-400 mt-1">Official point for this line. The corridor is not in the file, so the route is not drawn.</div>`,
    `<div class="text-micro mt-1"><a href="https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674" target="_blank" rel="noopener noreferrer" style="color:#FF8C00">NACEI infrastructure</a></div>`,
  ].filter(Boolean).join('')
}
