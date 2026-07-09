import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Roadmap — Stranded Value',
  description: 'Public product roadmap: shipped client features and backend-dependent work.',
}

const SHIPPED = [
  'Stranded Score™ v3 + explainability',
  'Bank pack exports (CSV / TSV / MD / HTML / JSON)',
  'Map mission portfolio + share links',
  'Sensitivity tornado + peer sites',
  'Heatmap, presets, bookmarks, pitch, education',
  'Privacy-first local storage',
]

const NEXT_CLIENT = [
  'Deeper FR/i18n copy',
  'More vertical models (curtailed wind / waste heat)',
  'Province executive PDF one-pagers',
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
      <p className="text-gray-400 mb-8">Transparent plan. Client-first now; backends when Cam configures them.</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#34D399] mb-3">Shipped</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED.map(i => <li key={i} className="flex gap-2"><span className="text-[#34D399]">✓</span>{i}</li>)}
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
