import Link from 'next/link'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Roadmap — Stranded Value',
  description: 'Public product roadmap: shipped client features and backend-dependent work.',
}

const SHIPPED_V217 = [
  'Map Hover Popup Interactive Fix: 340ms hover bridge + clickable "Click to build it →" button inside pin & cluster popups',
  'Map 15 km Radius Cluster Builder + ⚛️ Nuclear SMR Corridor layer preset + Docked Desktop Section Tabs (Overview / Build / Financials / Evidence)',
  'Sovereign Pension Trust Modes (National, AB Heritage, BC Prosperity, ON Municipal, SK Resource, First Nations Trust) + Tax Regime Comparison + CPP/Norway GPFG benchmarks + #pension URL hash + Print Whitepaper PDF',
  'Capture Hut Engineering SVG Schematic + Waste-Heat Co-Gen Sizer (MMBtu/hr & greenhouse acres) + CH₄/H₂S Gas Composition Sliders + Used vs. Next-Gen ASIC Payback Matrix + Vendor RFQ Export (.MD/.CSV)',
  'Two-SPV Stackable Capital Calculator + Project Finance DSCR Stress Tester + Equipment Lease vs. CapEx Toggle + 1-Click Data Room Bundle Export',
  'Phase 3 Nuclear SMR + Grid Frequency-Response + 143 Remote Community Diesel-Displacement Simulator on /verticals',
  'Sankey Energy-to-Sats Flow Diagram + Excel-Formula Audit Sheet (.TSV) in HowTheMathWorks + Automated Capital Link Watchdog (scripts/check-capital-links.mjs)',
]

const SHIPPED_V216 = [
  'Codified 6-Step Math Walkthrough (HowTheMathWorks): kg CH₄/day → Nm³/day → average kW → ASIC ceiling → Capture Huts → Sats & 10% Pension',
  'Vendor-Neutral Methane Capture Huts & Gas Scrubber BOM Sizer (10ft Arctic Skid, 20ft Biogas Container, 40ft Air Hut, 40ft Immersion Pod)',
  'Sovereign Canadian Bitcoin Pension Plan Simulator (10% flat BTC production tax compact + 4-year halving schedule + Phase 3 Nuclear SMR toggle)',
  'Global Capital & Grants Directory (13+ verified programs across Canada Federal, Alberta ERA/AIOC, CleanBC/FNCEBF, ON/SK, USA IRA/DOE, EU Horizon/EUMER)',
  'Phase 3 Nuclear & Small Modular Reactor (SMR) Baseload vertical added alongside the verified 2,611-site Methane lead story',
  'Enriched Copy ROI Summary & Site Details Panel with turnkey Capture Hut BOM and 10% Sovereign Pension contribution line',
  'Updated Diligence Pack (investor-onepager.md, ask-sheet.md, architecture-onepager.md) to v2.16.0',
]

const SHIPPED_V28 = [
  'Dashboard command center elite batch (readiness gauge, capture slider, emission tiers)',
  'DashboardLiveTicker + province revenue leaders + confidence breakdown',
  'Home KPI strip + deploy readiness badge linked to dashboard',
  'Education sticky section nav + top-site deep link from live-stats',
  'Methodology / About / Verticals live-stats banners',
  'Changelog accordion sections parsed from CHANGELOG.md',
  'PWA stranded-v12',
]

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

const V29_BACKLOG = [
  'Full home + methodology i18n body copy',
  'Vertical-specific beta datasets (wind curtailment, waste heat ORC)',
  'Partner embed tokens + rate-limited public API',
  'Cloud portfolio sync with optional accounts',
  'Scheduled ECCC refresh webhook + staging deploys',
  'Email / Telegram score alerts',
]

const NEXT_CLIENT = [
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
            v2.17.0 · Top 25 Upgrades + Map Hover &amp; Cockpit Overhaul shipped 2026-11-22
          </span>
        }
      />

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#FF8C00] mb-3">Shipped — v2.17.0 (Top 25 Upgrades + Map Interactive Hover Fix + Full Knowledge Sync)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_V217.map(i => <li key={i} className="flex gap-2"><span className="text-[#FF8C00]">✓</span>{i}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#34D399] mb-3">Shipped — v2.16.0 (Public Pitch, Capture Huts, Global Capital &amp; Sovereign Pension)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_V216.map(i => <li key={i} className="flex gap-2"><span className="text-[#34D399]">✓</span>{i}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#FF8C00] mb-3">Shipped — v2.8.x (dashboard + marketing polish)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_V28.map(i => <li key={i} className="flex gap-2"><span className="text-[#FF8C00]">✓</span>{i}</li>)}
        </ul>
        <Link href="/changelog" className="link-animated text-xs mt-2 inline-block">See CHANGELOG [2.8.0]–[2.8.3] →</Link>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#A78BFA] mb-3">v2.9 backlog</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {V29_BACKLOG.map(i => <li key={i} className="flex gap-2"><span className="text-[#A78BFA]">→</span>{i}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#34D399] mb-3">Shipped — Round 6 (v2.5.0)</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {SHIPPED_ROUND6.map(i => <li key={i} className="flex gap-2"><span className="text-[#34D399]">✓</span>{i}</li>)}
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