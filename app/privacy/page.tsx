import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import pkg from '@/package.json'

export const metadata = {
  title: 'Privacy — Stranded Value',
  description: 'Privacy-first: local storage, no third-party trackers by default.',
}

export default function PrivacyPage() {
  return (
    <div className="page-container prose prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]} />
      <h1 className="text-4xl font-bold tracking-tighter not-prose">Privacy</h1>
      <p className="text-gray-400 not-prose mb-2">Local-first by design. No ads. No third-party trackers in the product default.</p>
      <p className="text-gray-500 not-prose text-sm mb-8">
        Last updated: v{pkg.version} · {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

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

      <h2>Data retention (local)</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-white/10 my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
              <th className="p-3">Data type</th>
              <th className="p-3">Storage</th>
              <th className="p-3">Retention</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {[
              ['Mission portfolio', 'localStorage', 'Until you clear site data or export'],
              ['Bookmarks & notes', 'localStorage', 'Until you remove or clear browser storage'],
              ['Filter presets & profiles', 'localStorage', 'Until cleared (max 8 presets)'],
              ['Analytics event buffer', 'localStorage', 'Last ~100 events, never uploaded by default'],
              ['GeoJSON offline cache', 'IndexedDB', 'Until cache clear or SW update'],
              ['Theme & language', 'localStorage', 'Persistent per browser'],
              ['Certified lead drafts', 'localStorage', 'Until you delete or email/export'],
              ['Server logs / accounts', 'N/A', 'No accounts — we do not store portfolios server-side'],
            ].map(([type, storage, retention]) => (
              <tr key={type} className="border-b border-white/5">
                <td className="p-3">{type}</td>
                <td className="p-3 font-mono text-xs text-[#5BC0BE]">{storage}</td>
                <td className="p-3 text-xs text-gray-400">{retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
