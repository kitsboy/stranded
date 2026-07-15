import Link from 'next/link'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Roadmap — Stranded Value',
  description: 'Public product roadmap: shipped client features and backend-dependent work.',
}

const SHIPPED_ROUND6 = [
  'i18n 241 keys — pitch, map, education headings, errors',
  'Html lang sync + theme-color + apple touch icons',
  'PWA stranded-v6 + improved SW update toast',
  'Onboarding tour + geolocate HUD + site-search lib',
  'Mission templates + performance timing stub',
  'E2E onboarding / geolocate / recent sites',
]

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
  'Full page i18n (home body, site panel, methodology)',
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
    <div className="page-container">
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Roadmap' }]}
        title="Roadmap"
        subtitle="Transparent plan. Client-first now; backends when Cam configures them."
        badge={
          <span className="inline-block text-xs text-[#5BC0BE] px-2 py-0.5 rounded-full border border-[#5BC0BE]/30 bg-[#5BC0BE]/10">
            v2.5.0 · Round 6 upgrades 276–300 shipped 2026-07-15
          </span>
        }
      />

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#FF8C00] mb-3">Shipped — Round 6 (v2.5.0)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_ROUND6.map(i => <li key={i} className="flex gap-2"><span className="text-[#FF8C00]">✓</span>{i}</li>)}
        </ul>
        <Link href="/changelog" className="link-animated text-xs mt-2 inline-block">See CHANGELOG [2.5.0] for full list →</Link>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#A78BFA] mb-3">Shipped — Round 5 (v2.4.0)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_ROUND5.map(i => <li key={i} className="flex gap-2"><span className="text-[#A78BFA]">✓</span>{i}</li>)}
        </ul>
        <Link href="/changelog" className="link-animated text-xs mt-2 inline-block">See CHANGELOG [2.4.0] for full list →</Link>
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
        <Link href="/changelog" className="link-animated">Changelog</Link>
        <Link href="/status" className="link-animated">Status</Link>
        <Link href="/methodology" className="link-animated">Methodology</Link>
      </div>
    </div>
  )
}