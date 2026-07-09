import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Open Data — Stranded Value',
  description: 'Public endpoints, ECCC lineage, and enrichment license notes.',
}

export default function OpenDataPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 prose prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Open Data' }]} />
      <h1 className="text-4xl font-bold tracking-tighter not-prose">Open Data</h1>
      <p className="text-gray-400 not-prose mb-8">Public static endpoints. No auth. Updated on every production build.</p>

      <h2>Endpoints</h2>
      <ul>
        <li><a href="/data/stranded-sites.geojson"><code>/data/stranded-sites.geojson</code></a> — 2,611 FeatureCollection</li>
        <li><a href="/data/live-stats.json"><code>/data/live-stats.json</code></a> — aggregates, top sites, value model</li>
        <li><a href="/status.json"><code>/status.json</code></a> — health + version</li>
      </ul>

      <h2>Source lineage</h2>
      <p>
        Facility methane reporting: <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer">ECCC open dataset</a>.
        Stranded Score™, genset recommendations, and ROI fields are <strong>model enrichments</strong> by Stranded Value — not government numbers.
      </p>

      <h2>Reuse</h2>
      <p>
        You may use the public JSON for research and non-commercial exploration with attribution:
        “Data: ECCC; enrichments: Stranded Value (stranded.giveabit.io)”.
        Commercial redistribution of the enriched pack: contact <a href="mailto:hello@giveabit.io">hello@giveabit.io</a>.
      </p>

      <h2>Schema notes</h2>
      <p>See <Link href="/docs/api">API docs</Link> and <Link href="/methodology">methodology</Link> for score factors and inferred fields.</p>
    </div>
  )
}
