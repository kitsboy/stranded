'use client'

/**
 * PinProof — the proof surface behind a pin on the Stranded map.
 *
 * WHY IT EXISTS (t_fcf032ef, spec §1 of t_51410657)
 * ------------------------------------------------
 * Every pin is a row in one published file. That file carries one
 * OpenTimestamps receipt, and one Bitcoin block commits to it. So "is this pin
 * proven?" has a real answer — and a reader should be able to see it, feel it,
 * and check it, without ever learning what a merkle root is.
 *
 * The explainer itself is the family's shared component
 * (`components/trust/HowProofWorks.jsx`, ported byte-for-byte from
 * kitsboy/satohash) — this file only feeds it Stranded's warm copy and the
 * pin's provenance. The OTS anchor stays invisible; the confidence is felt.
 */
import { Download, ShieldCheck } from 'lucide-react'
import HowProofWorks from '@/components/trust/HowProofWorks'
import { PIN_FILE, pinProofStatus } from '@/lib/pin-proof'
import { usePinProof } from '@/components/trust/usePinProof'

/**
 * Stranded's copy for the shared explainer. Plain language, no jargon walls,
 * and it never promises more than the receipt does.
 */
const LABELS = {
  title: 'Is this pin proven?',
  subtitle: 'You do not have to take our word for it. Here is the whole check, in one minute.',
  stateConfirmedTitle: 'Anchored to Bitcoin',
  statePendingTitle: 'Waiting for Bitcoin',
  statePendingBody:
    'The proof exists — Bitcoin just has not committed to it yet. Bitcoin writes a block about every 10 minutes, and this usually settles within a few hours.',
  stateNotProvenTitle: 'Not proven',
  stateNotProvenBodyFallback:
    'We have no Bitcoin receipt for this dataset, so we are not going to claim one.',
  blockLabel: 'Bitcoin block',
  methodOwnNode: 'Checked against our own Bitcoin node — no third party was trusted.',
  methodExplorer:
    'Checked against a public Bitcoin explorer. Your own copy still proves this without anyone’s help.',
  methodUnknown: 'Checked against the Bitcoin chain.',
  selfTitle: 'Check it yourself',
  selfBody:
    'Download the dataset file and its proof file (.ots), then run any OpenTimestamps tool. No account, no API, nothing from us.',
  selfCommand: 'ots verify stranded-sites-REAL.geojson.ots',
  selfDownload: 'Download the proof (.ots)',
  selfTool: 'Get an OpenTimestamps tool',
  whatItProves: 'What this proves',
  whatItProvesBody:
    'That this exact file — every pin on this map, this one included — existed at or before that Bitcoin block. Nothing more: it does not say the numbers are right, only that we published them then and have not changed them since.',
  showSteps: 'Show me how',
  hideSteps: 'Hide',
}

const UNCHECKED_BODY =
  'This browser could not reach the Bitcoin checker just now, so we have not confirmed this build’s anchor from here. We would rather say that than show you a check nobody ran.'

const DIGEST_CHANGED_BODY =
  'This dataset was published again after the last Bitcoin check, so that receipt describes an older file. A fresh check has not completed yet — so we are not showing you the old one.'

function checkedLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

export default function PinProof({
  siteName = null,
  rowId = null,
  className = '',
}: {
  /** The pin the reader is looking at, named in the copy. */
  siteName?: string | null
  /** The row key inside the dataset, so the pin is findable in the file. */
  rowId?: string | null
  className?: string
}) {
  const proof = usePinProof()
  const { text } = pinProofStatus(proof)

  const labels = {
    ...LABELS,
    statePendingBody: proof.reason === 'chain_check_not_completed' || proof.reason === 'not_checked_yet'
      ? UNCHECKED_BODY
      : LABELS.statePendingBody,
    stateNotProvenBodyFallback: proof.reason === 'digest_changed_since_last_check'
      ? DIGEST_CHANGED_BODY
      : LABELS.stateNotProvenBodyFallback,
  }

  const download = proof.verdict?.ots_download_url || null
  const checked = checkedLabel(proof.checkedAt)
  const fromChain = proof.source === 'chain'

  return (
    <section className={`space-y-3 ${className}`} data-testid="pin-proof">
      <div>
        <p className="text-label text-gray-400" data-testid="pin-proof-scope">
          {siteName ? <>{siteName}{rowId ? ` (row ${rowId})` : ''} comes from </> : 'This pin comes from '}
          <span className="font-mono text-gray-300">{PIN_FILE}</span> — one published file whose digest
          Bitcoin commits to. The same anchor covers every pin on this map.
        </p>
        <p className="mt-1 text-micro" style={{ color: proof.state === 'confirmed' ? '#34D399' : '#FBBF24' }}>
          {text}
          {checked ? ` · last checked ${checked}` : ''}
        </p>
      </div>

      <HowProofWorks
        verdict={proof.verdict}
        state={proof.state}
        hash={proof.hash}
        labels={labels}
        variant="full"
      />

      {/* Wherever a verdict is shown, the .ots receipt is one tap away. */}
      {download ? (
        <a
          href={download}
          data-testid="pin-proof-ots"
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: 'rgba(184,137,58,0.5)', color: '#B8893A', background: 'rgba(184,137,58,0.10)' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={13} aria-hidden />
          Download this dataset’s proof (.ots)
        </a>
      ) : (
        <p className="text-micro text-gray-500" data-testid="pin-proof-no-ots">
          No receipt to download yet — there is no Bitcoin proof for this dataset to hand you.
        </p>
      )}

      <p className="flex items-start gap-2 text-micro text-gray-500" data-testid="pin-proof-source">
        <ShieldCheck size={12} aria-hidden className="mt-0.5 shrink-0" />
        {fromChain
          ? 'Verdict from a live chain check, made from your browser just now.'
          : proof.source === 'recorded' && checked
            ? `Verdict from the last completed chain check (${checked}), recorded for exactly this file digest. A live check re-runs on every visit.`
            : 'No chain check has completed for this build yet. Nothing is claimed on its behalf.'}
      </p>
    </section>
  )
}
