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

      <h2 className="text-lg font-semibold mt-8 mb-3">Static endpoint table</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-white/10 mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
              <th className="p-3">Route</th>
              <th className="p-3">Format</th>
              <th className="p-3">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {[
              ['/data/stranded-sites.geojson', 'GeoJSON', '2,611 site FeatureCollection (ECCC + coords)'],
              ['/data/live-stats.json', 'JSON', 'Build aggregates, top sites, impact, value model, version'],
              ['/data/sites.json', 'JSON', 'Legacy/summary site list (if present)'],
              ['/status.json', 'JSON', 'Health, version, site count, build metadata'],
              ['/manifest.json', 'JSON', 'PWA manifest and shortcuts'],
              ['/sitemap.xml', 'XML', 'Crawlable route index'],
              ['/robots.txt', 'text', 'Crawler rules'],
            ].map(([route, fmt, desc]) => (
              <tr key={route} className="border-b border-white/5">
                <td className="p-3"><a href={route} className="font-mono text-xs text-[#5BC0BE] hover:underline">{route}</a></td>
                <td className="p-3 text-xs text-gray-500">{fmt}</td>
                <td className="p-3 text-xs">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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