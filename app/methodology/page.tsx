import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Methodology — Stranded Value',
  description: 'How Stranded Score™, ROI models, and ECCC data are computed.',
}

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 prose prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />
      <h1 className="text-4xl font-bold tracking-tighter not-prose">Methodology</h1>
      <p className="text-gray-400 not-prose mb-8">Transparent scoring, data lineage, and ROI assumptions.</p>

      <h2>Data source</h2>
      <p>All 2,611 sites come from <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer">ECCC verified methane reporting</a>. Stats regenerate on every build via <code>generate-live-stats.js</code>.</p>

      <h2>Stranded Score™ v3</h2>
      <p>Log-scaled emission is the primary driver. When ECCC does not publish grid distance or internet type, we infer proxies from source category (landfill, oil &amp; gas, power, etc.), province infrastructure, emission tier, data confidence, and reporting year. Scores span ~22–96 with meaningful elite (≥85) and high (≥65) tiers. Percentile badges compare each site to the full Canadian dataset.</p>

      <h2>ROI model</h2>
      <p>Advanced ROI applies H₂S derate, seasonal uptime by province, gas treatment, carbon credits, CETA-style incentives, fleet decline, and halving-adjusted BTC revenue. See <Link href="/education">Education</Link> for genset specs.</p>

      <h2>Updates</h2>
      <p>Live metrics: <Link href="/data/live-stats.json">live-stats.json</Link> · API docs: <Link href="/docs/api">/docs/api</Link> · Status: <Link href="/status">/status</Link></p>
    </div>
  )
}