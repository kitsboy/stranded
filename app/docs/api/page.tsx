import Breadcrumbs from '@/components/Breadcrumbs'
import Link from 'next/link'

export const metadata = {
  title: 'Data API | Stranded Value',
  description: 'Public data endpoints and GeoJSON schema for the 2,611-site ECCC dataset.',
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'API Docs' }]} />
      <h1 className="text-3xl font-bold mb-4">Data API & Schema</h1>
      <p className="text-gray-400 mb-8">Static JSON endpoints — no auth required. Updated on every build.</p>

      <div className="space-y-6 text-sm">
        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="font-semibold text-[#FF8C00] mb-2">GET /data/stranded-sites.geojson</h2>
          <p className="text-gray-400">2,611 FeatureCollection. Key properties:</p>
          <ul className="list-disc pl-5 mt-2 text-gray-300 space-y-1">
            <li><code>emission_rate_kg_day</code> — daily methane vent rate</li>
            <li><code>province</code>, <code>source_type</code>, <code>confidence</code></li>
            <li><code>ch4_tonnes_year</code>, <code>distance_to_grid_km</code></li>
            <li><code>ghgrp_id</code> — unique site identifier</li>
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="font-semibold text-[#5BC0BE] mb-2">GET /data/live-stats.json</h2>
          <p className="text-gray-400">Auto-generated aggregates: provinces, gensets, impact, top sites, value model.</p>
        </section>
        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="font-semibold mb-2">GET /status.json</h2>
          <p className="text-gray-400">Health check: version, build time, site count.</p>
        </section>
        <p className="text-gray-500">Source: <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" className="text-[#5BC0BE]">ECCC Open Data</a></p>
        <Link href="/map" className="inline-block text-[#FF8C00] hover:underline">Try it on the map →</Link>
      </div>
    </div>
  )
}