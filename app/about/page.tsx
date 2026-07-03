import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'About — Stranded Canada',
  description: 'Turning wasted methane into Bitcoin-powered environmental remediation.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-4">About Stranded</h1>
      <p className="text-lg text-gray-300 leading-relaxed mb-6">
        Stranded Canada turns wasted methane emissions into Bitcoin-powered environmental remediation.
        By mapping 2,611 real sites and showing precise per-site mining ROI, we make sovereign,
        feel-good giving simple — turning pollution into productive off-grid Bitcoin under Give A Bit&apos;s Safe Harbour framework.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/pitch" className="px-4 py-2 rounded-xl bg-[#FF8C00] text-black font-medium">View pitch</Link>
        <Link href="/map" className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5">Explore map</Link>
        <a href="https://giveabit.io" className="px-4 py-2 rounded-xl border border-[#5BC0BE]/40 text-[#5BC0BE]">Give A Bit</a>
      </div>
    </div>
  )
}