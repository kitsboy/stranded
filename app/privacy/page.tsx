import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Privacy — Stranded Value',
  description: 'Privacy-first: local storage, no third-party trackers by default.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 prose prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]} />
      <h1 className="text-4xl font-bold tracking-tighter not-prose">Privacy</h1>
      <p className="text-gray-400 not-prose mb-8">Local-first by design. No ads. No third-party trackers in the product default.</p>

      <h2>What stays on your device</h2>
      <ul>
        <li>Mission portfolio, bookmarks, notes, filter presets, named profiles</li>
        <li>Site watch alerts (localStorage only)</li>
        <li>Optional Certified draft applications (localStorage only — not sent to us until you email/export)</li>
        <li>Optional local analytics event buffer (last ~100 events, not uploaded by default)</li>
        <li>Optional IndexedDB cache of the public GeoJSON for offline use</li>
        <li>Theme and language preferences</li>
      </ul>

      <h2>What we fetch</h2>
      <ul>
        <li>Public site data from this origin (<code>/data/*</code>)</li>
        <li>Optional live BTC prices from CoinGecko (browser → third party; fails soft if blocked)</li>
        <li>Map basemap tiles (OpenStreetMap / optional satellite imagery)</li>
      </ul>

      <h2>What we do not do (today)</h2>
      <ul>
        <li>No account system / OAuth</li>
        <li>No server-side portfolio sync</li>
        <li>No advertising pixels or analytics SaaS in the default build</li>
      </ul>

      <h2>Contact</h2>
      <p>Questions: <a href="mailto:hello@giveabit.io">hello@giveabit.io</a> · Parent: <a href="https://giveabit.io">giveabit.io</a></p>
      <p className="not-prose mt-6"><Link href="/methodology" className="text-[#5BC0BE] hover:underline">Methodology →</Link></p>
    </div>
  )
}
