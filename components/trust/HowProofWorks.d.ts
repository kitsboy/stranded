/**
 * Type-only companion for the ported `HowProofWorks.jsx` (t_fcf032ef).
 *
 * The implementation is deliberately kept byte-identical to the family source
 * at kitsboy/satohash (src/components/trust/HowProofWorks.jsx) — no reinvented
 * logic, no drift. This file only gives TypeScript consumers the props that the
 * JSDoc in the JSX describes, so `tsc` can check callers without touching the
 * shared component itself.
 */
import type { ReactNode } from 'react'

export type ProofVerdictLike = {
  verified?: boolean
  verified_method?: string | null
  bitcoin_block_height?: number | null
  block_time?: number | null
  ots_download_url?: string | null
  explainer?: string | null
  reason?: string | null
  status?: string | null
}

export type ProofState = 'pending' | 'confirmed' | 'not-proven'

export type HowProofWorksLabels = {
  title?: string
  subtitle?: string
  statePendingTitle?: string
  statePendingBody?: string
  stateConfirmedTitle?: string
  stateNotProvenTitle?: string
  stateNotProvenBodyFallback?: string
  blockLabel?: string
  methodOwnNode?: string
  methodExplorer?: string
  methodUnknown?: string
  selfTitle?: string
  selfBody?: string
  selfCommand?: string
  selfDownload?: string
  selfTool?: string
  whatItProves?: string
  whatItProvesBody?: string
  showSteps?: string
  hideSteps?: string
}

export const DEFAULT_LABELS: Required<HowProofWorksLabels>

export function stateFromVerdict(verdict: ProofVerdictLike | null | undefined): ProofState

declare const HowProofWorks: (props: {
  verdict?: ProofVerdictLike | null
  state?: ProofState | null
  hash?: string | null
  otsUrl?: string | null
  variant?: 'full' | 'compact'
  labels?: HowProofWorksLabels
  className?: string
}) => ReactNode

export default HowProofWorks
