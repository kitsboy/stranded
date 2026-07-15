import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import AboutLiveMeta from '@/components/AboutLiveMeta'

export const metadata = {
  title: 'About — Stranded Canada',
  description: 'Turning wasted methane into Bitcoin-powered environmental remediation.',
}

export default function AboutPage() {
  return (
    <div className="page-container">
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
        title="About Stranded"
        subtitle="Turning wasted methane into Bitcoin-powered environmental remediation across 2,611 verified Canadian sites."
        actions={
          <>
            <ButtonLink href="/pitch" variant="primary" className="text-sm px-4 py-2">
              View pitch
            </ButtonLink>
            <ButtonLink href="/map" variant="secondary" className="text-sm px-4 py-2">
              Explore map
            </ButtonLink>
          </>
        }
      />

      <AboutLiveMeta />

      <p className="text-lg text-gray-300 leading-relaxed mb-6">
        Stranded Canada turns wasted methane emissions into Bitcoin-powered environmental remediation.
        By mapping 2,611 real sites and showing precise per-site mining ROI, we make sovereign,
        feel-good giving simple — turning pollution into productive off-grid Bitcoin under Give A Bit&apos;s Safe Harbour framework.
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        <a href="https://giveabit.io" className="btn-ghost text-sm px-4 py-2">
          Give A Bit →
        </a>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold mb-3 text-[#5BC0BE]">Contribute & How to Help</h2>
        <ul className="space-y-3 text-sm text-gray-300">
          <li><strong className="text-white">Operators & miners</strong> — star sites, build mission portfolios, export bank packs for diligence.</li>
          <li><strong className="text-white">Researchers</strong> — use open GeoJSON + methodology; cite ECCC source; report data gaps via GitHub issues.</li>
          <li><strong className="text-white">Communities</strong> — partnership pathway at <Link href="/partnerships" className="link-animated">/partnerships</Link>; funding quiz at <Link href="/funding" className="link-animated">/funding</Link>.</li>
          <li><strong className="text-white">Developers</strong> — repo is open at <a href="https://github.com/kitsboy/stranded" className="link-animated text-[#FF8C00]">github.com/kitsboy/stranded</a>; run <code className="text-xs bg-black/30 px-1 rounded">npm run validate</code> before PRs.</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">Stranded is client-first: bookmarks, missions, and alerts stay on your device unless you choose to share export files.</p>
      </section>
    </div>
  )
}