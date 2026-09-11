'use client'

import { Check, Plus, Trash2, Zap } from 'lucide-react'
import { GENSET_DATA } from '@/lib/sites'
import type { FleetTemplate, NamedFleetRecord } from '@/lib/fleet-template'
import { formatCount } from '@/lib/cockpit'

/** One-line promise per industry preset — what a landfill owner reads first. */
const PRESET_PROMISE: Record<string, string> = {
  'landfill-basic': 'Proven at Keele Valley — one genset, one switchgear skid.',
  'oilgas-modular': 'Modular skid, fast to permit, moves when the well does.',
  'wastewater-small': 'Small footprint — fits inside an existing plant fence.',
  'coalmine-large': 'Large capture for a mine-scale gas flow.',
  'pulp-power': 'Multi-genset — for sites that already make their own power.',
}

export type ShelfResult = {
  minerCount: number
  satsPerDay: number
  /** kW of gas the preset's gensets would install at this site. */
  ceilingKw: number
}

type Props = {
  presets: FleetTemplate[]
  saved: NamedFleetRecord[]
  activeId: string
  /** Preset recommended for the selected site's source type. */
  suggestedId?: string
  /** Live result of each template at the currently selected site. */
  resultFor: (template: FleetTemplate) => ShelfResult
  onApply: (template: FleetTemplate) => void
  onDeleteSaved?: (id: string) => void
  onSaveCurrent?: () => void
  saveOpen?: boolean
}

function gensetLabel(template: FleetTemplate): string {
  return (template.gensets || [])
    .filter(g => GENSET_DATA[g.gensetId] && (g.count || 0) > 0)
    .map(g => `${g.count}× ${GENSET_DATA[g.gensetId].name.replace(/^INNIO |^Caterpillar |^Cummins /, '')}`)
    .join(' + ') || 'no genset'
}

function TemplateCard({
  template,
  promise,
  result,
  active,
  mine,
  suggested,
  onApply,
  onDelete,
}: {
  template: FleetTemplate
  promise: string
  result: ShelfResult
  active: boolean
  mine?: boolean
  suggested?: boolean
  onApply: () => void
  onDelete?: () => void
}) {
  return (
    <div
      className={`relative snap-start shrink-0 w-[15rem] md:w-auto rounded-2xl border p-3 flex flex-col gap-2 transition ${
        active ? 'border-[#FF8C00]/70 bg-[#FF8C00]/10' : 'border-white/12 bg-black/25 hover:border-[#5BC0BE]/45'
      }`}
      data-testid={`fleet-preset-card-${template.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-white leading-tight truncate" title={template.name}>
            {template.name}
          </div>
          <div className="text-[10px] text-gray-400 leading-snug mt-0.5">{promise}</div>
        </div>
        {mine ? (
          <span className="shrink-0 rounded-full bg-[#5BC0BE]/20 border border-[#5BC0BE]/40 px-1.5 py-0.5 text-[9px] font-semibold text-[#5BC0BE]">
            yours
          </span>
        ) : suggested ? (
          <span className="shrink-0 rounded-full bg-[#FF8C00]/15 border border-[#FF8C00]/40 px-1.5 py-0.5 text-[9px] font-semibold text-[#FF8C00]">
            for this site type
          </span>
        ) : null}
      </div>

      <div className="rounded-xl bg-black/30 px-2 py-1.5">
        <div className="text-[9px] uppercase tracking-wider text-gray-500">At this site</div>
        <div className="text-[11px] text-white tabular-nums">
          {gensetLabel(template)} · {formatCount(result.ceilingKw)} kW gas
        </div>
        <div className="text-[11px] text-[#FF8C00] font-semibold tabular-nums">
          {formatCount(result.minerCount)} miners · {formatCount(result.satsPerDay)} sats/day
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-auto">
        <button
          type="button"
          onClick={onApply}
          aria-pressed={active}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
            active ? 'bg-[#FF8C00] text-black' : 'bg-[#5BC0BE]/15 border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/25'
          }`}
          data-testid={`fleet-preset-apply-${template.id}`}
        >
          {active ? <Check size={12} aria-hidden /> : <Zap size={12} aria-hidden />}
          {active ? 'Applied' : 'Apply'}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete template ${template.name}`}
            className="shrink-0 h-8 w-8 rounded-lg border border-white/15 text-gray-400 hover:border-red-400/60 hover:text-red-400"
            data-testid={`delete-named-fleet-${template.id}`}
          >
            <Trash2 className="mx-auto" size={13} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * The template shelf — presets and the user's own builds as cards side by side,
 * each showing the live result for the site that is currently selected.
 * Mobile: a horizontal snap-scroll row. Desktop: a grid that spends the width.
 */
export default function FleetTemplateShelf({
  presets,
  saved,
  activeId,
  suggestedId,
  resultFor,
  onApply,
  onDeleteSaved,
  onSaveCurrent,
  saveOpen = false,
}: Props) {
  return (
    <section className="mt-3" data-testid="fleet-template-shelf">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5BC0BE]">Start from a template</h3>
        {onSaveCurrent && !saveOpen && (
          <button
            type="button"
            onClick={onSaveCurrent}
            className="inline-flex items-center gap-1 rounded-full border border-[#FF8C00]/40 px-2 py-1 text-[10px] text-[#FF8C00] hover:bg-[#FF8C00]/10"
            data-testid="miner-stack-save-template"
          >
            <Plus size={11} aria-hidden /> Save this build
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 md:grid md:grid-cols-2 md:min-[1600px]:grid-cols-3 md:overflow-visible md:pb-0">
        {presets.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            promise={PRESET_PROMISE[template.id] || 'A known-good starting point for this kind of site.'}
            result={resultFor(template)}
            active={activeId === template.id}
            suggested={suggestedId === template.id && activeId !== template.id}
            onApply={() => onApply(template)}
          />
        ))}
        {saved.map(rec => (
          <TemplateCard
            key={rec.id}
            template={rec.template}
            promise={`saved ${new Date(rec.savedAt).toLocaleDateString()}`}
            result={resultFor(rec.template)}
            active={activeId === rec.id}
            mine
            onApply={() => onApply(rec.template)}
            onDelete={onDeleteSaved ? () => onDeleteSaved(rec.id) : undefined}
          />
        ))}
      </div>
    </section>
  )
}
