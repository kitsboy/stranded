'use client'

import { useEffect, useState } from 'react'

const NOTES = [
  {
    id: 'hook',
    title: 'Hook',
    body: '2,611 verified methane sites. Fuel is free relative to grid power. Bitcoin is the offtake that does not need a pipeline.',
  },
  {
    id: 'problem',
    title: 'Problem',
    body: 'Stranded CH₄ is vented/flared — climate liability + wasted energy. Traditional midstream is slow and CapEx-heavy for small sites.',
  },
  {
    id: 'solution',
    title: 'Solution',
    body: 'Island microgrids: genset + ASICs. Zero grid impact. Mobile deployment. Measurable abatement + BTC treasury optionality.',
  },
  {
    id: 'data',
    title: 'Data moat',
    body: 'ECCC open dataset enriched with Stranded Score™, genset sizing, ROI, bank packs. Everything is verifiable and exportable.',
  },
  {
    id: 'ask',
    title: 'Ask',
    body: 'Pilot capital for top provincial clusters + product runway. SPV per cluster. Safe Harbour. Bitcoin-sovereign stack.',
  },
]

export default function PitchSpeakerNotes({ present = false }: { present?: boolean }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!present && !open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey || e.altKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (!open && !present) return
      if (e.key === 'ArrowRight' || e.key === ']') setIdx(i => Math.min(NOTES.length - 1, i + 1))
      if (e.key === 'ArrowLeft' || e.key === '[') setIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, present])

  if (!open && !present) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-4 right-4 z-[120] rounded-full border border-white/20 bg-[#0f172a]/90 px-3 py-2 text-[11px] text-gray-300 hover:text-white hover:border-[#5BC0BE]/50"
        data-testid="pitch-speaker-notes-toggle"
      >
        Speaker notes
      </button>
    )
  }

  if (!open && present) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-4 right-4 z-[120] rounded-full border border-[#FF8C00]/40 bg-black/70 px-3 py-2 text-[11px] text-[#FF8C00]"
      >
        Notes (N)
      </button>
    )
  }

  const note = NOTES[idx]

  return (
    <aside
      className="no-print fixed bottom-4 right-4 z-[120] w-[min(360px,92vw)] rounded-2xl border border-white/15 bg-[#0b111f]/95 p-4 shadow-2xl backdrop-blur"
      data-testid="pitch-speaker-notes"
      aria-label="Speaker notes"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest text-[#FF8C00]">Speaker · {idx + 1}/{NOTES.length}</span>
        <button type="button" className="text-xs text-gray-400 hover:text-white" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <h3 className="font-semibold text-[#5BC0BE] mb-1">{note.title}</h3>
      <p className="text-sm text-gray-300 leading-relaxed">{note.body}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
          disabled={idx === 0}
          onClick={() => setIdx(i => i - 1)}
        >
          Prev [
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
          disabled={idx >= NOTES.length - 1}
          onClick={() => setIdx(i => i + 1)}
        >
          Next ]
        </button>
      </div>
    </aside>
  )
}
