'use client'

import { useLocale } from '@/lib/useLocale'
import type { MapStyleMode } from '@/components/Map'
import { RENEWABLE_CATS } from '@/lib/renewable-layers'
import { ATLAS_GROUPS, ATLAS_LAYERS, CER_SOURCE, type AtlasMark } from '@/lib/energy-atlas'

export type LayerPresetId = 'analysis' | 'satellite' | 'minimal'

export const LAYER_PRESETS: Record<LayerPresetId, { label: string; layers: Partial<LayerControlsProps['layers']> }> = {
  analysis: {
    label: 'Analysis',
    layers: { sites: true, grid: true, internet: true, heatmap: true, choropleth: false, satellite: false, terrain: false },
  },
  satellite: {
    label: 'Satellite',
    layers: { sites: true, satellite: true, terrain: true, grid: false, internet: false, heatmap: false, choropleth: false },
  },
  minimal: {
    label: 'Minimal',
    layers: { sites: true, grid: false, internet: false, satellite: false, terrain: false, heatmap: false, choropleth: false },
  },
}

function LayerCheck({
  testId,
  checked,
  onChange,
  accent,
  compact,
  children,
}: {
  testId: string
  checked: boolean
  onChange: () => void
  accent: string
  compact?: boolean
  children: string
}) {
  return (
    <label
      data-testid={testId}
      className={`flex items-center cursor-pointer group min-h-[44px] ${compact ? 'gap-2' : 'gap-3'}`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className={`w-4 h-4 shrink-0 ${accent}`} />
      <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-micro leading-tight' : 'text-sm'}`}>{children}</span>
    </label>
  )
}

interface LayerControlsProps {
  layers: {
    sites: boolean
    grid: boolean
    internet: boolean
    satellite?: boolean
    terrain?: boolean
    heatmap?: boolean
    choropleth?: boolean
  }
  onToggle: (layer: keyof LayerControlsProps['layers']) => void
  onApplyPreset?: (preset: LayerPresetId) => void
  heatmapOpacity?: number
  onHeatmapOpacityChange?: (v: number) => void
  terrainExaggeration?: number
  onTerrainExaggerationChange?: (v: number) => void
  mapStyle?: MapStyleMode
  onMapStyleChange?: (style: MapStyleMode) => void
  showSiteLabels?: boolean
  onSiteLabelsChange?: (v: boolean) => void
  performanceMode?: boolean
  onPerformanceModeChange?: (v: boolean) => void
  /** Tighter spacing for map corner overlay */
  compact?: boolean
  onCopyViewport?: () => void
  copyViewportLabel?: string
  overlays?: Record<string, boolean>
  overlayCounts?: Record<string, number>
  overlayNote?: string
  onToggleOverlay?: (id: string) => void
  atlas?: Record<string, boolean>
  onToggleAtlas?: (id: string) => void
  atlasOpacity?: number
  onAtlasOpacityChange?: (v: number) => void
}

function AtlasSwatch({ mark, swatch }: { mark: AtlasMark; swatch: string }) {
  if (mark === 'diamond') {
    return <span className="inline-block h-2.5 w-2.5 shrink-0 rotate-45 border-2" style={{ borderColor: swatch, background: swatch }} aria-hidden />
  }
  if (mark === 'square') {
    return <span className="inline-block h-2.5 w-2.5 shrink-0 border-2" style={{ borderColor: '#0f172a', background: swatch }} aria-hidden />
  }
  if (mark === 'triangle') {
    return (
      <span
        className="inline-block shrink-0"
        style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `9px solid ${swatch}` }}
        aria-hidden
      />
    )
  }
  return <span className="inline-block h-2.5 w-4 shrink-0 rounded-sm" style={{ background: swatch }} aria-hidden />
}

export default function LayerControls({
  layers,
  onToggle,
  onApplyPreset,
  heatmapOpacity = 0.75,
  onHeatmapOpacityChange,
  terrainExaggeration = 1,
  onTerrainExaggerationChange,
  mapStyle = 'dark',
  onMapStyleChange,
  showSiteLabels = false,
  onSiteLabelsChange,
  performanceMode = false,
  onPerformanceModeChange,
  compact = false,
  onCopyViewport,
  copyViewportLabel = 'Copy viewport JSON',
  overlays,
  overlayCounts,
  overlayNote,
  onToggleOverlay,
  atlas,
  onToggleAtlas,
  atlasOpacity = 0.62,
  onAtlasOpacityChange,
}: LayerControlsProps) {
  const { t } = useLocale()

  const styleButtons: { id: MapStyleMode; label: string }[] = [
    { id: 'standard', label: t('mapStyleStandard') },
    { id: 'dark', label: t('mapStyleDark') },
    { id: 'satellite', label: t('mapStyleSatellite') },
    { id: 'terrain', label: t('mapStyleTerrain') },
  ]

  return (
    <div
      className={`bg-[#1e293b]/95 backdrop-blur border border-[#5BC0BE]/30 rounded-xl shadow-lg no-print ${
        compact ? 'p-2.5 text-xs w-[17.5rem] max-w-full' : 'p-4 text-sm'
      }`}
      data-compact={compact || undefined}
    >
      <h3 className={`font-bold text-[#FF8C00] flex items-center gap-2 ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
        {t('mapLayers')} <span className="text-micro text-gray-400 font-normal">{t('mapLayersNote')}</span>
      </h3>

      {onMapStyleChange && (
        <div className={compact ? 'mb-2' : 'mb-3'}>
          <div className={`text-micro uppercase tracking-wider text-gray-400 ${compact ? 'mb-1' : 'mb-1.5'}`}>{t('mapStyleSwitcher')}</div>
          <div className="flex flex-wrap gap-1">
            {styleButtons.map(btn => (
              <button
                key={btn.id}
                type="button"
                onClick={() => onMapStyleChange(btn.id)}
                className={`text-micro px-2 py-0.5 rounded-full border ${
                  mapStyle === btn.id
                    ? 'border-[#FF8C00] text-[#FF8C00] bg-[#FF8C00]/10'
                    : 'border-white/15 hover:border-white/40'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {onApplyPreset && (
        <div className={`flex flex-wrap gap-1 ${compact ? 'mb-2' : 'mb-3'}`}>
          {(Object.keys(LAYER_PRESETS) as LayerPresetId[]).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => onApplyPreset(id)}
              className="text-micro px-2 py-0.5 rounded-full border border-white/15 hover:border-[#FF8C00]/40"
            >
              {LAYER_PRESETS[id].label}
            </button>
          ))}
        </div>
      )}

      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        <LayerCheck testId="layer-methane" checked={layers.sites} onChange={() => onToggle('sites')} accent="accent-[#FF8C00]" compact={compact}>
          {t('mapLayerMethaneSites')}
        </LayerCheck>

        {onToggleOverlay && (
          <div className={`border-t border-white/10 ${compact ? 'mt-2 pt-2' : 'mt-3 pt-3'}`} data-testid="energy-overlays">
            <div className="text-micro font-semibold text-[#5BC0BE]">{t('mapOverlayTitle')}</div>
            <p className="mt-1 text-micro leading-snug text-gray-500">{t('mapOverlayLegend')}</p>
            <div className="mt-1 space-y-0.5">
              {RENEWABLE_CATS.map(cat => {
                const count = overlayCounts?.[cat.id]
                const countLabel = overlayCounts ? ` (${count ?? 0})` : ''
                return (
                  <label
                    key={cat.id}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2"
                    data-testid={`overlay-${cat.id}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!overlays?.[cat.id]}
                      onChange={() => onToggleOverlay(cat.id)}
                      className="h-4 w-4 shrink-0"
                      style={{ accentColor: cat.color }}
                    />
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: cat.shape === 'plant' ? cat.color : 'transparent',
                        boxShadow: `inset 0 0 0 2px ${cat.color}`,
                      }}
                      aria-hidden
                    />
                    <span className="text-micro leading-tight text-gray-300">
                      {t(cat.labelKey)}
                      {countLabel}
                    </span>
                  </label>
                )
              })}
            </div>
            {overlayNote && <p className="mt-1 text-micro leading-snug text-gray-500">{overlayNote}</p>}
            {onToggleAtlas && ATLAS_GROUPS.map(group => {
              const rows = ATLAS_LAYERS.filter(layer => layer.group === group.id)
              const surfaceOn = group.id === 'surface' && rows.some(layer => atlas?.[layer.id])
              return (
                <div key={group.id} className="mt-2 border-t border-white/10 pt-2">
                  <div className="text-micro font-semibold uppercase tracking-wider text-[#5BC0BE]">{t(group.titleKey)}</div>
                  <p className="mt-1 text-micro leading-snug text-gray-500">{t(group.blurbKey)}</p>
                  <div className="mt-1">
                    {rows.map(layer => (
                      <label
                        key={layer.id}
                        className="flex min-h-[44px] cursor-pointer items-center gap-2"
                        data-testid={`atlas-${layer.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!atlas?.[layer.id]}
                          onChange={() => onToggleAtlas(layer.id)}
                          className="h-4 w-4 shrink-0"
                          style={{ accentColor: layer.mark === 'wash' ? '#5BC0BE' : layer.swatch }}
                        />
                        <AtlasSwatch mark={layer.mark} swatch={layer.swatch} />
                        <span className="text-micro leading-tight text-gray-300">
                          {t(layer.labelKey)}
                          {layer.count != null ? ` (${layer.count})` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                  {surfaceOn && onAtlasOpacityChange && (
                    <div className="mt-1 mb-1">
                      <label className="text-micro text-gray-400" htmlFor="atlas-opacity">
                        {t('mapAtlasOpacity')} {Math.round(atlasOpacity * 100)}%
                      </label>
                      <input
                        id="atlas-opacity"
                        data-testid="atlas-opacity"
                        type="range"
                        min={0.25}
                        max={0.9}
                        step={0.05}
                        value={atlasOpacity}
                        onChange={(e) => onAtlasOpacityChange(+e.target.value)}
                        className="w-full accent-[#5BC0BE]"
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {onToggleAtlas && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <a
                  href={CER_SOURCE.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="atlas-cer"
                  className="flex min-h-[44px] items-center text-micro leading-snug text-[#FF8C00] underline-offset-2 hover:underline"
                >
                  {t(CER_SOURCE.labelKey)}
                </a>
                <p className="text-micro leading-snug text-gray-500">{t('mapAtlasLimits')}</p>
              </div>
            )}
          </div>
        )}

        <LayerCheck testId="layer-grid" checked={layers.grid} onChange={() => onToggle('grid')} accent="accent-[#5BC0BE]" compact={compact}>
          {t('mapLayerPowerGrid')}
        </LayerCheck>
        <LayerCheck testId="layer-internet" checked={layers.internet} onChange={() => onToggle('internet')} accent="accent-blue-400" compact={compact}>
          {t('mapLayerInternet')}
        </LayerCheck>
        <LayerCheck testId="layer-satellite" checked={!!layers.satellite} onChange={() => onToggle('satellite')} accent="accent-purple-400" compact={compact}>
          {t('mapSatellite')}
        </LayerCheck>
        <LayerCheck testId="layer-terrain" checked={!!layers.terrain} onChange={() => onToggle('terrain')} accent="accent-emerald-400" compact={compact}>
          {t('mapTerrain')}
        </LayerCheck>
        <LayerCheck testId="layer-heatmap" checked={!!layers.heatmap} onChange={() => onToggle('heatmap')} accent="accent-rose-400" compact={compact}>
          {t('mapLayerHeatmap')}
        </LayerCheck>
        <LayerCheck testId="layer-choropleth" checked={!!layers.choropleth} onChange={() => onToggle('choropleth')} accent="accent-amber-400" compact={compact}>
          {t('mapLayerChoropleth')}
        </LayerCheck>
        {onSiteLabelsChange && (
          <LayerCheck testId="layer-labels" checked={showSiteLabels} onChange={() => onSiteLabelsChange(!showSiteLabels)} accent="accent-cyan-400" compact={compact}>
            {t('mapSiteLabels')}
          </LayerCheck>
        )}
        {onPerformanceModeChange && (
          <LayerCheck testId="layer-performance" checked={performanceMode} onChange={() => onPerformanceModeChange(!performanceMode)} accent="accent-slate-400" compact={compact}>
            {t('mapPerformanceMode')}
          </LayerCheck>
        )}
      </div>

      {layers.heatmap && onHeatmapOpacityChange && (
        <div className="mt-3">
          <label className="text-micro text-gray-400">Heatmap opacity {Math.round(heatmapOpacity * 100)}%</label>
          <input type="range" min={0.2} max={1} step={0.05} value={heatmapOpacity} onChange={e => onHeatmapOpacityChange(+e.target.value)} className="w-full accent-rose-400" />
        </div>
      )}
      {layers.terrain && onTerrainExaggerationChange && (
        <div className="mt-2">
          <label className="text-micro text-gray-400">Terrain exaggeration {terrainExaggeration.toFixed(1)}×</label>
          <input type="range" min={0.5} max={2} step={0.1} value={terrainExaggeration} onChange={e => onTerrainExaggerationChange(+e.target.value)} className="w-full accent-emerald-400" />
        </div>
      )}

      <div className={`border-t border-[#5BC0BE]/20 text-micro text-gray-400 ${compact ? 'mt-2 pt-2' : 'mt-4 pt-3'}`}>{t('mapLayerNote2')}</div>

      {onCopyViewport && (
        <details className="mt-2 group">
          <summary className="text-micro uppercase tracking-wider text-gray-600 cursor-pointer hover:text-gray-400 list-none [&::-webkit-details-marker]:hidden">
            Dev
          </summary>
          <button
            type="button"
            onClick={onCopyViewport}
            className="mt-2 w-full text-micro px-2 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-[#5BC0BE] hover:border-[#5BC0BE]/30 transition"
            data-testid="copy-viewport-json"
          >
            {copyViewportLabel}
          </button>
        </details>
      )}
    </div>
  )
}