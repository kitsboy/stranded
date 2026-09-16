/**
 * HowProofWorks — the family's one "How does this work?" proof explainer.
 *
 * WHY IT EXISTS (t_da054829, deliverable 2)
 * ----------------------------------------
 * Every offering makes existence-at-a-time claims (Satohash, Katoa, MotoPass,
 * SherpaCarta, Stranded, Tadbuy, HQ). Each one grew its own copy, its own
 * wording, and its own idea of what "verified" means. A user who has to learn a
 * different trust story on every site learns nothing.
 *
 * This component is the shared story, in plain language, with one honest state
 * machine:
 *
 *   pending      the proof exists, Bitcoin has not confirmed it yet
 *   confirmed    a real Bitcoin block commits to it (says HOW, and by whom)
 *   not-proven   it does not resolve — say so plainly, never soften it
 *
 * Portability rules (deliberate):
 *   * No i18n dependency, no icon dependency, no router, no fetch. Every string
 *     is overridable via `labels`, so a host site passes its own localized copy
 *     and keeps its own translation pipeline.
 *   * Colours come from the family design tokens (`var(--accent-gold)`,
 *     `var(--accent-success)`, `var(--border)`, `var(--text-primary)`, ...) so
 *     it inherits each offering's theme, in the family palette (paper/ink/brass
 *     with BTC orange).
 *   * It renders what the API actually returned. It never upgrades a verdict.
 *
 * @param {object}   props
 * @param {object}   [props.verdict]  a /api/verify response (preferred source of truth)
 * @param {'pending'|'confirmed'|'not-proven'} [props.state]  explicit state when there is no verdict
 * @param {string}   [props.hash]     the sha256 being discussed
 * @param {string}   [props.otsUrl]   download link for the .ots proof
 * @param {'full'|'compact'} [props.variant='full']
 * @param {object}   [props.labels]   override any string (see DEFAULT_LABELS)
 * @param {string}   [props.className]
 */
import { useCallback, useState } from 'react'

export const DEFAULT_LABELS = {
  title: 'How does this work?',
  subtitle: 'You do not have to trust us. Here is what to check, in one minute.',
  statePendingTitle: 'Waiting for Bitcoin',
  statePendingBody:
    'Your proof was recorded and sent to the public timestamp calendars. Bitcoin confirms roughly every 10 minutes, so this usually changes within a few hours.',
  stateConfirmedTitle: 'Anchored to Bitcoin',
  stateNotProvenTitle: 'Not proven',
  blockLabel: 'Bitcoin block',
  methodOwnNode: 'Checked against a Bitcoin node — no third party was trusted.',
  methodExplorer:
    'Checked against a public Bitcoin explorer. Your own copy still proves this without anyone\'s help.',
  methodUnknown: 'Chain-checked.',
  selfTitle: 'Check it yourself',
  selfBody:
    'Your proof file (.ots) plus any OpenTimestamps tool is enough. No account, no API, nothing from us.',
  selfCommand: 'ots verify yourfile.ots',
  selfDownload: 'Download the proof (.ots)',
  selfTool: 'Get an OpenTimestamps tool',
  whatItProves: 'What this proves',
  whatItProvesBody:
    'That this exact file existed at or before that Bitcoin block. Nothing more — it does not prove who made it or that it is true.',
  showSteps: 'Show me how',
  hideSteps: 'Hide'
}

const STATE_STYLES = {
  pending: { accent: 'var(--accent-gold, #B8893A)' },
  confirmed: { accent: 'var(--accent-success, #2F8F5B)' },
  'not-proven': { accent: 'var(--accent-alert, #C2410C)' }
}

const GLYPHS = {
  pending: 'M12 7v5l3 2',
  confirmed: 'M5 13l4 4L19 7',
  'not-proven': 'M6 6l12 12M18 6L6 18'
}

/** Derive the honest state from a verify response. Never soften a failure. */
export function stateFromVerdict (verdict) {
  if (!verdict) return 'pending'
  if (verdict.verified === true) return 'confirmed'
  if (verdict.reason === 'no_block_attestation' || verdict.status === 'pending') return 'pending'
  return 'not-proven'
}

export default function HowProofWorks ({
  verdict = null,
  state = null,
  hash = null,
  otsUrl = null,
  variant = 'full',
  labels = {},
  className = ''
}) {
  const [open, setOpen] = useState(variant === 'full')
  const t = { ...DEFAULT_LABELS, ...labels }

  const resolved = state || stateFromVerdict(verdict)
  const accent = (STATE_STYLES[resolved] || STATE_STYLES.pending).accent
  const glyph = (GLYPHS[resolved] || GLYPHS.pending)

  const method = verdict?.verified_method || null
  const blockHeight = verdict?.bitcoin_block_height || null
  const download = otsUrl || verdict?.ots_download_url || null

  const toggle = useCallback(() => setOpen((v) => !v), [])

  const title =
    resolved === 'confirmed' ? t.stateConfirmedTitle
      : resolved === 'not-proven' ? t.stateNotProvenTitle
        : t.statePendingTitle

  const body =
    resolved === 'confirmed'
      ? method === 'bitcoind' ? t.methodOwnNode : method === 'esplora' ? t.methodExplorer : t.methodUnknown
      : resolved === 'not-proven'
        ? (verdict?.explainer || t.stateNotProvenBodyFallback || 'This proof did not resolve against a Bitcoin block.')
        : t.statePendingBody

  return (
    <section
      data-testid="how-proof-works"
      data-proof-state={resolved}
      className={`rounded-2xl border p-4 sm:p-5 ${className}`}
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--accent-gold)' }}>
          {t.title}
        </p>
        <span
          role="status"
          data-testid="proof-state-badge"
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wider uppercase"
          style={{ borderColor: accent, color: accent }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path d={glyph} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {title}
        </span>
      </header>

      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>

      {resolved === 'confirmed' && blockHeight ? (
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {Number(blockHeight).toLocaleString()}
          </span>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: accent }}>
            {t.blockLabel}
          </span>
          {verdict?.block_time ? (
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {new Date(Number(verdict.block_time) * 1000).toISOString().slice(0, 10)}
            </span>
          ) : null}
        </p>
      ) : null}

      {hash ? (
        <p className="mt-2 break-all font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          {hash}
        </p>
      ) : null}

      {variant === 'full' ? (
        <>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="mt-3 min-h-[36px] rounded-full border px-3 text-[10px] font-black tracking-wider uppercase"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            {open ? t.hideSteps : t.showSteps}
          </button>

          {open ? (
            <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.subtitle}</p>

              <div>
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--accent-gold)' }}>
                  {t.selfTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.selfBody}</p>
                <code
                  data-testid="independent-verify-command"
                  className="mt-1 inline-block rounded-lg px-2 py-1 font-mono text-[11px]"
                  style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                >
                  {t.selfCommand}
                </code>
                {download ? (
                  <a
                    href={download}
                    data-testid="ots-download"
                    className="ml-2 inline-block text-[11px] font-black underline"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    {t.selfDownload}
                  </a>
                ) : null}
              </div>

              <div>
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--accent-gold)' }}>
                  {t.whatItProves}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.whatItProvesBody}</p>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
