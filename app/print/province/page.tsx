'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadSites, EnrichedSite } from '@/lib/sites'
import { resolveProvinceName, provinceCode } from '@/lib/provinces'
import { useLocale } from '@/lib/useLocale'


function ProvincePrintContent() {
  const { t } = useLocale()
  const searchParams = useSearchParams()
  const provinceParam = searchParams.get('province') || searchParams.get('name') || ''
  const [sites, setSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(true)

  const provinceName = resolveProvinceName(provinceParam) || provinceParam

  useEffect(() => {
    loadSites().then(all => {
      setSites(all)
      setLoading(false)
      setTimeout(() => window.print(), 600)
    })
  }, [])

  const provinceSites = useMemo(() => {
    if (!provinceName) return []
    return sites
      .filter(s => s.properties.province === provinceName)
      .sort((a, b) => b.strandedScore - a.strandedScore)
  }, [sites, provinceName])

  const top5 = provinceSites.slice(0, 5)
  const totalEmission = provinceSites.reduce((a, s) => a + s.emission, 0)
  const avgScore = provinceSites.length
    ? +(provinceSites.reduce((a, s) => a + s.strandedScore, 0) / provinceSites.length).toFixed(1)
    : 0

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Preparing printable one-pager…</div>
  }

  if (!provinceName || !provinceSites.length) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-400">Province not found. Use <code>?province=AB</code> or full name.</p>
        <p className="text-xs text-gray-500 mt-2">Example: /print/province?province=Alberta</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 text-black bg-white min-h-screen print:p-6">
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      <header className="border-b-2 border-[#FF8C00] pb-4 mb-6" data-testid="print-province-header">
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Stranded Value · Executive One-Pager</div>
        <h1 className="text-3xl font-bold mt-1">{provinceName}</h1>
        <div className="text-sm text-gray-600 mt-1">
          {provinceCode(provinceName)} · {provinceSites.length.toLocaleString()} sites · avg score {avgScore}
        </div>
        <div className="text-[10px] text-gray-500 mt-2" data-testid="print-eccc-line">
          {t('printEcccLine')}
        </div>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-8 text-center">
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-[#FF8C00]">{provinceSites.length}</div>
          <div className="text-[10px] uppercase text-gray-500">Sites</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-[#5BC0BE]">{totalEmission.toLocaleString()}</div>
          <div className="text-[10px] uppercase text-gray-500">kg CH₄/day</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold">{avgScore}</div>
          <div className="text-[10px] uppercase text-gray-500">Avg Score</div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-[#FF8C00]">Top 5 Sites by Stranded Score™</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Site</th>
              <th className="py-2 pr-2 text-right">Score</th>
              <th className="py-2 text-right">kg/day</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-100">
                <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                <td className="py-2 pr-2">
                  <div className="font-medium">{s.properties.name || s.id}</div>
                  <div className="text-[10px] text-gray-500">{s.properties.source_type} · {s.properties.city || 'Remote'}</div>
                </td>
                <td className="py-2 pr-2 text-right font-mono font-bold text-[#FF8C00]">
                  {s.strandedScore}
                </td>
                <td className="py-2 text-right font-mono">{s.emission.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-10 pt-4 border-t border-gray-200 text-[10px] text-gray-500 leading-relaxed">
        Data: ECCC verified methane reporting. Stranded Score™, genset, and ROI fields are model enrichments by Stranded Value.
        Not investment advice. Generated {new Date().toLocaleDateString('en-CA')} · stranded.giveabit.io
      </footer>

      <button
        type="button"
        onClick={() => window.print()}
        className="no-print mt-6 px-4 py-2 rounded-lg bg-[#FF8C00] text-black text-sm font-semibold"
      >
        Print / Save PDF
      </button>
    </div>
  )
}

export default function ProvincePrintPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading…</div>}>
      <ProvincePrintContent />
    </Suspense>
  )
}