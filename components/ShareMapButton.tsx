'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { buildMapShareUrl, type MapUrlState } from '@/lib/map-url-state'
import { toast } from 'sonner'

type Props = {
  state: MapUrlState
  className?: string
  label?: string
}

export default function ShareMapButton({ state, className = '', label = 'Share view' }: Props) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'
    const url = buildMapShareUrl(state, origin)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Stranded map view', url })
        return
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Map link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-gray-300 hover:text-white hover:border-[#5BC0BE]/40 transition ${className}`}
      data-testid="share-map-button"
    >
      {copied ? <Check size={12} className="text-[#34D399]" /> : <Link2 size={12} />}
      {copied ? 'Copied' : label}
    </button>
  )
}
