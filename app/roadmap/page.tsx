import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Roadmap — Stranded Value',
  description: 'Public product roadmap: shipped client features and backend-dependent work.',
}

const SHIPPED_ROUND5 = [
  'Grant matcher quiz + funding pathway',
  'Bookmarks export/import JSON + folder tags',
  'Mission timeline CSV + score sparklines',
  'Province choropleth + filter preset URL hash share',
  'Compare page + province print one-pager',
  'Watch alert toasts + offline cache version badge',
  'Education halving slider + lazy charts',
  'Tadbuy / Sherpacarta integration hooks',
]

const SHIPPED_PRIOR = [
  'Stranded Score™ v3 + explainability',
  'Bank pack exports (CSV / TSV / MD / HTML / JSON)',
  'Map mission portfolio + share links',
  'Sensitivity tornado + peer sites',
  'Heatmap, presets, bookmarks, pitch, education',
  'Privacy-first local storage',
  'MapLibre native clusters + radius filter URL',
]

const NEXT_CLIENT = [
  'Full FR/i18n copy pass',
  'Live ECCC refresh webhook (still client cache first)',
  'More vertical models (curtailed wind / waste heat)',
  'Cloud-free portfolio QR at scale',
]

const NEEDS_BACKEND = [
  'Cloud portfolio sync + optional accounts',
  'Email / Telegram score alerts',
  'CF API token emergency deploys + staging',
  'Scheduled ECCC refresh + webhooks',
  'Partner embed tokens + rate-limited API',
]

export default function RoadmapPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Roadmap' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Roadmap</h1>
      <p className="text-gray-400 mb-2">Transparent plan. Client-first now; backends when Cam configures them.</p>
      <p className="text-xs text-[#5BC0BE] mb-8">v2.4.0 · Round 5 upgrades 151–200 shipped 2026-07-15</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#A78BFA] mb-3">Shipped — Round 5 (v2.4.0)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_ROUND5.map(i => <li key={i} className="flex gap-2"><span className="text-[#A78BFA]">✓</span>{i}</li>)}
        </ul>
        <Link href="/changelog" className="text-xs text-[#5BC0BE] hover:underline mt-2 inline-block">See CHANGELOG [2.4.0] for full list →</Link>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#34D399] mb-3">Shipped — Prior rounds</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_PRIOR.map(i => <li key={i} className="flex gap-2"><span className="text-[#34D399]">✓</span>{i}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#FF8C00] mb-3">Next (still client-only)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {NEXT_CLIENT.map(i => <li key={i} className="flex gap-2"><span className="text-[#FF8C00]">→</span>{i}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#5BC0BE] mb-3">Needs backend / config</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {NEEDS_BACKEND.map(i => <li key={i} className="flex gap-2"><span className="text-[#5BC0BE]">◎</span>{i}</li>)}
        </ul>
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/changelog" className="text-[#5BC0BE] hover:underline">Changelog</Link>
        <Link href="/status" className="text-[#5BC0BE] hover:underline">Status</Link>
        <Link href="/methodology" className="text-[#5BC0BE] hover:underline">Methodology</Link>
      </div>
    </div>
  )
}