import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Open Data — Stranded Value',
  description: 'Public endpoints, ECCC lineage, and enrichment license notes.',
}

export default function OpenDataPage() {
  return (
    <div className="page-container prose prose-invert">
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

      <h2>GeoJSON schema (Feature properties)</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-white/10 my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
              <th className="p-3">Field</th>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {[
              ['ghgrp_id', 'string', 'ECCC facility identifier (primary key)'],
              ['name', 'string', 'Facility / site name'],
              ['company', 'string', 'Reporting organization'],
              ['province', 'string', 'Canadian province or territory'],
              ['city', 'string', 'Nearest municipality (if reported)'],
              ['emission_rate_kg_day', 'number', 'Daily methane vent rate (kg CH₄/day)'],
              ['ch4_tonnes_year', 'number', 'Annual methane (tonnes)'],
              ['source_type', 'string', 'Industrial category (oil_gas_extraction, landfill_waste, …)'],
              ['confidence', 'string', 'Data quality: high | medium | low'],
              ['reference_year', 'number', 'Reporting year from ECCC filing'],
              ['distance_to_grid_km', 'number?', 'Grid tie distance — often null (inferred in Score v3)'],
              ['internet_type', 'string?', 'Connectivity class — often null (inferred in Score v3)'],
              ['geometry.coordinates', '[lng, lat]', 'WGS84 point location'],
            ].map(([field, type, desc]) => (
              <tr key={field} className="border-b border-white/5">
                <td className="p-3 font-mono text-[#5BC0BE] text-xs">{field}</td>
                <td className="p-3 text-xs text-gray-500">{type}</td>
                <td className="p-3 text-xs">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Stranded enrichments (score, genset, ROI) are computed client-side and in <code>live-stats.json</code> aggregates — not in the raw GeoJSON export.</p>
      <p>See <Link href="/docs/api">API docs</Link> and <Link href="/methodology">methodology</Link> for score factors and inferred fields.</p>
    </div>
  )
}
