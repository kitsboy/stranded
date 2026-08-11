'use client'

import { useMemo, useState } from 'react'
import { amortizeLoan, exportAmortizationCsv } from '@/lib/amortization'
import { downloadBlob } from '@/lib/export-formats'

export default function AmortizationTable({
  defaultPrincipal = 2_000_000,
  className = '',
}: {
  defaultPrincipal?: number
  className?: string
}) {
  const [principal, setPrincipal] = useState(defaultPrincipal)
  const [rate, setRate] = useState(8)
  const [years, setYears] = useState(7)
  const result = useMemo(() => amortizeLoan(principal, rate, years), [principal, rate, years])

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`} data-testid="amortization-table">
      <h4 className="text-sm font-semibold text-[#5BC0BE] mb-3">Debt amortization</h4>
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <label className="block">
          <span className="text-gray-400">Principal CAD</span>
          <input
            type="number"
            value={principal}
            onChange={e => setPrincipal(+e.target.value)}
            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-gray-400">Rate %</span>
          <input
            type="number"
            value={rate}
            onChange={e => setRate(+e.target.value)}
            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-gray-400">Years</span>
          <input
            type="number"
            value={years}
            onChange={e => setYears(+e.target.value)}
            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1"
          />
        </label>
      </div>
      <p className="text-[11px] text-gray-400 mb-2">
        Annual payment <span className="font-mono text-white">C${result.annualPayment.toLocaleString()}</span>
        {' · '}
        Total interest <span className="font-mono text-amber-300">C${result.totalInterest.toLocaleString()}</span>
      </p>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10">
        <table className="w-full text-[10px]">
          <thead className="text-gray-400 sticky top-0 bg-[#0f172a]">
            <tr>
              <th className="p-1.5 text-left">Yr</th>
              <th className="p-1.5 text-right">Pay</th>
              <th className="p-1.5 text-right">Int</th>
              <th className="p-1.5 text-right">Prin</th>
              <th className="p-1.5 text-right">Bal</th>
            </tr>
          </thead>
          <tbody>
            {result.schedule.map(r => (
              <tr key={r.year} className="border-t border-white/5">
                <td className="p-1.5">{r.year}</td>
                <td className="p-1.5 text-right font-mono">{r.payment.toLocaleString()}</td>
                <td className="p-1.5 text-right font-mono">{r.interest.toLocaleString()}</td>
                <td className="p-1.5 text-right font-mono">{r.principal.toLocaleString()}</td>
                <td className="p-1.5 text-right font-mono">{r.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="mt-2 w-full rounded-lg border border-white/15 py-1.5 text-[11px] hover:bg-white/5"
        onClick={() => downloadBlob(exportAmortizationCsv(result.schedule), 'stranded-amortization.csv', 'text/csv')}
      >
        Download CSV
      </button>
    </div>
  )
}
