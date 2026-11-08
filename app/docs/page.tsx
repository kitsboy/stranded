import Link from 'next/link'
import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'

export const metadata: Metadata = {
  title: 'Docs — Stranded Value',
  description: 'Current sources and counts for the methane map, the 2025 energy tables, and the live bitcoin story. Updated 7 Nov 2026.',
}

const READ = [
  { href: '/methodology', title: 'Methodology', body: 'How the score, the generator rule, and the two older hashprice rates are calculated.' },
  { href: '/open-data', title: 'Open data', body: 'File list, SHA-256 checks, and the Bitcoin timestamp on the methane file.' },
  { href: '/docs/DATA-SOURCES-RENEWABLES.md', title: 'Energy sources', body: 'Plants, remote communities, shades, and what each layer is allowed to claim.' },
  { href: '/docs/api', title: 'Data API', body: 'The public JSON files and the map query parameters.' },
  { href: '/changelog', title: 'Changelog', body: 'What shipped. The 7 Nov 2026 docs note sits above the 4 Nov data refresh.' },
  { href: '/status', title: 'Status', body: 'Whether the live statistics file is loading.' },
]

const FILES = [
  { href: '/data/live-stats.json', title: 'live-stats.json', body: 'Methane totals from the last statistics build. Version 2.15.0.' },
  { href: '/data/methane-capture.json', title: 'methane-capture.json', body: 'Reported methane, largest sites first, with a vent and flare figure only where Ottawa published one.' },
  { href: '/data/statcan-renewables.json', title: 'statcan-renewables.json', body: '2025 generation and 2025 capacity. Pulled 4 Nov 2026.' },
  { href: '/data/dataset-manifest.json', title: 'dataset-manifest.json', body: 'Digests for the methane file and the proof block.' },
  { href: '/data/stranded-sites.geojson', title: 'stranded-sites.geojson', body: 'The 2,611 mapped facilities.' },
]

export default function DocsPage() {
  return (
    <div className="page-container">
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Docs' }]}
        title="Docs"
        subtitle="Current as of 7 Nov 2026. These are the pages and files a visitor can check. The methodology is the constraint. The marketing downloads are the pitch."
      />

      <section className="mb-10 max-w-3xl text-base leading-relaxed text-gray-300">
        <h2 className="text-xl font-semibold text-white">What we will say out loud</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>2,611 mapped facilities from Environment and Climate Change Canada. 2,588 have a reported methane figure. 675 are high-confidence. The newest filing year in the file is 2024. Some facilities last reported earlier.</li>
          <li>Reported methane is not the same as gas released unburned. A vent or flare number is kept only where the filing published a fugitive split. Many landfills have no split.</li>
          <li>The home story takes the biggest reports first. Electricity uses the Jenbacher-class rule at 90% of listed power, averaged over the day. Bitcoin uses the public chain that day. If that check fails, the bitcoin line stays blank.</li>
          <li>1,049 renewable plants, mostly August 2017. The capacity factor uses 2025 generation divided by 2025 capacity. Biomass has no 2025 capacity type, so no payback. Geothermal plants in the file: 0. Alberta’s 6 MW is a province total.</li>
          <li>207 remote communities from the 2025 database. 111 have annual megawatt-hours and can be sized. 96 do not, and stay unsized.</li>
          <li>Older payback cards still use 0.0000009 bitcoin per terahash per day. That rate is labelled optimistic. The home story does not use it.</li>
        </ul>
        <p className="mt-4">
          The methane file’s proof is on the <Link href="/open-data#verify" className="text-[#5BC0BE] underline">open-data page</Link>.
          That proof covers the methane GeoJSON. It does not cover the plant file or the remote-community file.
        </p>
      </section>

      <section className="mb-10 max-w-3xl text-base leading-relaxed text-gray-300">
        <h2 className="text-xl font-semibold text-white">Financing screen</h2>
        <p className="mt-3">
          A planning note written 7 Nov 2026 records a screen from the 4 Nov 2026 public-chain window.
          It lives in the repository as <span className="text-white">docs/FINANCING-SCREEN.md</span>.
          {' '}
          <a href="https://github.com/kitsboy/stranded/blob/main/docs/FINANCING-SCREEN.md" className="text-[#5BC0BE] underline">Read it on GitHub</a>.
          It is not a calculator on this site.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Reported methane stays in the model. Machine counts come from the generator rule and the watts on the machine card. The optimistic bitcoin rate stays labelled.</li>
          <li>The hardware dollar is the planning price already on that card. Listings checked the same day named a different terahash figure, so they are not written onto the card.</li>
          <li>The small example is published vented gas at one 2024 pipeline filing in Ontario. The larger example is the biggest 10% of reported methane. A year of that larger example is a small slice of the Canada Pension Plan fund. The screen does not fund the pension.</li>
          <li>Program boxes on the funding page are a quiz. A request uses the program’s own guide.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Read</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {READ.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block min-h-[44px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#5BC0BE]/50">
                <span className="font-semibold text-white">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-gray-400">{item.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Files</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {FILES.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="block min-h-[44px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#FF8C00]/50">
                <span className="font-semibold text-white">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-gray-400">{item.body}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
