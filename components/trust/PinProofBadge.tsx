'use client'

/**
 * PinProofBadge — every pin's OTS-backed proof state, in one chip.
 *
 * The whole map is covered by one Bitcoin-anchored file, so this chip is the
 * pin status for all 2,611 pins: anchored (and to which block, checked how), or
 * honestly "waiting" / "not proven". It never says more than the last completed
 * check supports.
 */
import { Pin } from 'lucide-react'
import { pinProofStatus } from '@/lib/pin-proof'
import { usePinProof } from '@/components/trust/usePinProof'

const TONES: Record<'good' | 'wait' | 'bad', { text: string; border: string; bg: string }> = {
  good: { text: '#34D399', border: 'rgba(52,211,153,0.4)', bg: 'rgba(52,211,153,0.10)' },
  wait: { text: '#FBBF24', border: 'rgba(251,191,36,0.4)', bg: 'rgba(251,191,36,0.10)' },
  bad: { text: '#F87171', border: 'rgba(248,113,113,0.4)', bg: 'rgba(248,113,113,0.10)' },
}

export default function PinProofBadge({
  className = '',
  label = 'Pin proof',
}: {
  className?: string
  /** Prefix shown before the state, so a reader knows what is being described. */
  label?: string
}) {
  const proof = usePinProof()
  const { text, tone } = pinProofStatus(proof)
  const c = TONES[tone]

  return (
    <span
      data-testid="pin-proof-badge"
      data-pin-proof={proof.state}
      title={
        proof.state === 'confirmed'
          ? `Every pin on this map sits in one published file whose digest Bitcoin commits to. ${text}.`
          : text
      }
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-micro font-medium shrink-0 ${className}`}
      style={{ color: c.text, borderColor: c.border, background: c.bg }}
    >
      <Pin size={11} aria-hidden />
      <span className="hidden sm:inline text-gray-400">{label}</span>
      <span data-testid="pin-proof-badge-text">{text}</span>
    </span>
  )
}
