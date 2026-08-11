'use client'

import { useEffect, useState } from 'react'
import { applyDensityToDocument, getDensity, setDensity, type DensityMode } from '@/lib/density-mode'

export default function DensityToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<DensityMode>('comfortable')

  useEffect(() => {
    const m = getDensity()
    setMode(m)
    applyDensityToDocument(m)
  }, [])

  const toggle = () => {
    const next: DensityMode = mode === 'compact' ? 'comfortable' : 'compact'
    setDensity(next)
    setMode(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`px-2 py-1.5 rounded-lg border border-white/15 text-[10px] text-gray-400 hover:text-white hover:bg-white/5 transition ${className}`}
      title="Toggle UI density"
      aria-label={`Density: ${mode}`}
      data-testid="density-toggle"
    >
      {mode === 'compact' ? 'Compact' : 'Comfy'}
    </button>
  )
}
