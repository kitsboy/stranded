/** Simple annual loan amortization schedule. */

export type AmortizationRow = {
  year: number
  payment: number
  interest: number
  principal: number
  balance: number
}

export type AmortizationResult = {
  schedule: AmortizationRow[]
  totalInterest: number
  annualPayment: number
}

/**
 * Fully amortizing loan with constant annual payments.
 * annualRatePct is nominal annual rate (e.g. 8 for 8%).
 */
export function amortizeLoan(
  principal: number,
  annualRatePct: number,
  years: number,
): AmortizationResult {
  const P = Number.isFinite(principal) ? Math.max(0, principal) : 0
  const n = Math.max(0, Math.round(years))
  const r = Number.isFinite(annualRatePct) ? annualRatePct / 100 : 0

  if (n === 0 || P === 0) {
    return { schedule: [], totalInterest: 0, annualPayment: 0 }
  }

  let annualPayment: number
  if (r === 0) annualPayment = P / n
  else annualPayment = (P * r) / (1 - (1 + r) ** -n)

  let balance = P
  const schedule: AmortizationRow[] = []
  let totalInterest = 0

  for (let year = 1; year <= n; year++) {
    const interest = balance * r
    let principalPaid = Math.min(balance, annualPayment - interest)
    let payment = principalPaid + interest
    if (year === n) {
      principalPaid = balance
      payment = interest + balance
    }
    balance = Math.max(0, balance - principalPaid)
    totalInterest += interest
    schedule.push({
      year,
      payment: Math.round(payment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    })
  }

  return {
    schedule,
    totalInterest: Math.round(totalInterest * 100) / 100,
    annualPayment: Math.round(annualPayment * 100) / 100,
  }
}

/** CSV export of amortization schedule. */
export function exportAmortizationCsv(schedule: AmortizationRow[]): string {
  const header = 'year,payment,interest,principal,balance'
  const rows = schedule.map(
    (r) => `${r.year},${r.payment},${r.interest},${r.principal},${r.balance}`,
  )
  return [header, ...rows].join('\n')
}
