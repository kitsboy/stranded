'use client'

import {
  buildSummaryState,
  formatCount,
  formatKw,
  formatMoneyFiat,
  formatPayback,
} from '@/lib/cockpit'

/**
 * The build summary strip — the persistent "what am I building, right now" readout.
 *
 * WHY IT EXISTS: choosing an ASIC, a generator mix and a miner count used to
 * scatter the consequences (kW, CapEx, net/day, payback) over three different
 * panels, several screens apart. This strip keeps those four numbers attached to
 * the controls: on a phone it is sticky under the section tabs while the Build
 * section scrolls; on the docked desktop cockpit it sits at the top of the
 * panel, above the miner stack.
 *
 * HONESTY CONTRACT (this component deliberately owns no arithmetic):
 *   - every number is a value the panel already computed with `computeFleetModel`,
 *     so the strip, the cockpit, the ROI summary and the bank-pack export read
 *     the same assumptions, the same currency and the same net (revenue − power −
 *     maintenance — never a second "net" that quietly drops costs);
 *   - payback renders `N/A` when the model returns Infinity (no net), and the
 *     money format is the ROI summary's own formatter, so the two can never
 *     disagree by a rounding rule;
 *   - the hashprice assumption is labelled when it is the optimistic scenario,
 *     and the capacity note states the real constraint (gas ceiling / oversized
 *     install) instead of a prettier number;
 *   - nothing here multiplies methane by a generator count: gas is a site-wide
 *     budget in `lib/fleet-template.ts`, and the strip only reports power.
 *
 * Presentation only: no state, no effects, no animation (a strip that ticked or
 * re-laid-out on every keystroke would be exactly the jank this replaces).
 */
export type BuildSummaryProps = {
  /** `sheet` = phone bottom sheet (rendered inside the sticky tab strip); `docked` = desktop column. */
  variant: 'sheet' | 'docked'
  /** Miners the model powers (clamped to the gas ceiling). */
  miners: number
  /** Miners the user chose — may exceed the ceiling. */
  installedMiners: number
  ceilingMiners: number
  /** kW drawn at the operating point. */
  usedKw: number
  /** kW the installed generation can supply from site gas. */
  availableKw: number
  /** Total CapEx = hardware + generator + fixed setup. */
  capexFiat: number
  /** Model net per day: revenue − power − maintenance. */
  netPerDayFiat: number
  paybackDays: number
  currencySymbol: string
  fiatCode: string
  /** True when the per-TH/day assumption sits above the network-derived rate. */
  optimistic: boolean
  /** How far the assumption sits above/below the network-derived rate, in %. */
  hashpriceDiffPct: number
  /** Section-gating class from the panel (keeps one copy, hides outside Build). */
  className?: string
}

export default function BuildSummary({
  variant,
  miners,
  installedMiners,
  ceilingMiners,
  usedKw,
  availableKw,
  capexFiat,
  netPerDayFiat,
  paybackDays,
  currencySymbol,
  fiatCode,
  optimistic,
  hashpriceDiffPct,
  className = '',
}: BuildSummaryProps) {
  const s = buildSummaryState({
    installedMiners,
    poweredMiners: miners,
    ceilingMiners,
    usedKw,
    availableKw,
    paybackDays,
    netPerDayFiat,
  })

  const netText = s.netAvailable ? formatMoneyFiat(netPerDayFiat, currencySymbol) : 'N/A'
  const capexText = Number.isFinite(capexFiat) ? formatMoneyFiat(capexFiat, currencySymbol) : 'N/A'
  const paybackText = s.paybackAvailable ? formatPayback(paybackDays) : 'N/A'

  return (
    <section
      className={`build-summary build-summary--${variant}${className}`}
      data-testid="build-summary"
      data-variant={variant}
      role="group"
      aria-label="Live build summary"
    >
      <div className="build-summary-power">
        <div className="build-summary-power-head">
          <span className="build-summary-label">
            Electrical power ·{' '}
            <span className="build-summary-miners"><span className="tabular-nums" data-testid="build-summary-miners">{formatCount(miners)} miner{miners === 1 ? '' : 's'}</span></span>
          </span>
          <span className="build-summary-power-value tabular-nums" data-testid="build-summary-power">
            {formatKw(usedKw)} of {formatKw(availableKw)} kW
          </span>
        </div>
        {/* The meter and the two labels share one line: the strip stays short
            enough to leave the sheet's content usable on a 360px phone. */}
        <div className="build-summary-power-bar">
          <span className="build-summary-meter" aria-hidden>
            <span className="build-summary-meter-fill" style={{ width: `${s.powerPct}%` }} />
          </span>
          <span className="build-summary-chips">
            <span className="build-summary-chip" data-testid="build-summary-currency">{fiatCode}</span>
            {optimistic && (
              <span
                className="build-summary-chip build-summary-chip--warn"
                data-testid="build-summary-optimistic"
                title={`Revenue per TH/s/day sits ${Math.abs(Math.round(hashpriceDiffPct))}% above the network-derived hashprice. This is an optimistic scenario, not a neutral estimate.`}
              >
                optimistic scenario
              </span>
            )}
          </span>
        </div>
      </div>

      <dl className="build-summary-grid">
        <div className="build-summary-cell">
          <dt className="build-summary-label">Total CapEx</dt>
          <dd className="build-summary-value tabular-nums" data-testid="build-summary-capex">{capexText}</dd>
        </div>
        <div className="build-summary-cell">
          <dt className="build-summary-label">
            Net / day
            <span className="build-summary-hint" title="Model net: revenue − power − maintenance. Financing cost is shown separately as financed payback in Financials."> ⓘ</span>
          </dt>
          <dd
            className={`build-summary-value tabular-nums ${s.netAvailable && netPerDayFiat < 0 ? 'build-summary-value--bad' : ''}`}
            data-testid="build-summary-net"
          >
            {netText}
          </dd>
        </div>
        <div className="build-summary-cell">
          <dt className="build-summary-label">Payback</dt>
          <dd className="build-summary-value tabular-nums" data-testid="build-summary-payback">{paybackText}</dd>
        </div>
      </dl>

      <p className={`build-summary-note build-summary-note--${s.tone}`} data-testid="build-summary-note">
        {s.note}
      </p>
    </section>
  )
}
