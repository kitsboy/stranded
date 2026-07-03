'use client'

import { GENSET_DATA, GensetId } from '@/lib/sites'

const IDS = Object.keys(GENSET_DATA) as GensetId[]

export default function GensetComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm text-left">
        <thead className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-white/10">
          <tr>
            <th className="p-3">Genset</th>
            <th className="p-3">Power</th>
            <th className="p-3">Eff.</th>
            <th className="p-3">CH₄ Nm³/h</th>
            <th className="p-3">CAPEX/kW</th>
            <th className="p-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {IDS.map(id => {
            const g = GENSET_DATA[id]
            return (
              <tr key={id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="p-3 font-medium text-white">{g.name}</td>
                <td className="p-3 font-mono text-[#5BC0BE]">{g.powerKW} kW</td>
                <td className="p-3">{(g.eff * 100).toFixed(1)}%</td>
                <td className="p-3 font-mono">{g.methaneNm3h}</td>
                <td className="p-3 font-mono">${g.capexPerKW}</td>
                <td className="p-3 text-gray-400 text-xs">{g.notes}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}