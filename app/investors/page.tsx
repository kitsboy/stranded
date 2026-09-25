import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor & Partner Materials | Stranded Value',
  description: 'Board deck, diligence pack, and live pitch for Stranded Value — turning stranded methane into Bitcoin. Horizon Europe funding strategy, honest economics, open methodology.',
  alternates: { canonical: '/investors' },
}

const DILIGENCE = [
  {
    file: '/docs/investor-onepager.md',
    tag: 'INVESTOR',
    tagColor: 'bg-[#FF8C00] text-black',
    title: 'Investor / Partner One-Pager',
    desc: 'One-page full disclosure: problem, solution, stage, honest traction, model, risks, and the ask. For partners, capital, and grants.',
  },
  {
    file: '/docs/ask-sheet.md',
    tag: 'ASK',
    tagColor: 'bg-[#5BC0BE] text-black',
    title: 'Ask Sheet',
    desc: 'What we want help with, what success looks like, what we offer, and what we are explicitly not asking for. Use it in any conversation.',
  },
  {
    file: '/docs/architecture-onepager.md',
    tag: 'TECHNICAL',
    tagColor: 'bg-white/80 text-black',
    title: 'Technical Architecture One-Pager',
    desc: 'Stack, system map, deploy path, data & privacy posture, MVP boundary, and how a technical partner starts in 15 minutes.',
  },
]

export default function InvestorsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm mb-6">
          <div className="w-2 h-2 bg-[#FF8C00] rounded-full animate-pulse" />
          <span className="font-medium tracking-wider text-[#FF8C00]">INVESTOR &amp; PARTNER MATERIALS</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
          Stranded Energy.<br />
          <span className="text-[#FF8C00]">Bitcoin Access.</span>
        </h1>
        <p className="text-gray-400 max-w-2xl text-lg mb-6">
          Everything a board, investor, or partner needs to evaluate Stranded Value — the
          open platform that turns stranded methane into clean electricity and energy-backed
          Bitcoin. Real ECCC data, honest economics, open methodology.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pitch" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF8C00] font-semibold text-[#1e293b] transition hover:bg-[#FF8C00]/90">
            View Live Pitch
          </Link>
          <Link href="/map" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#5BC0BE]/50 text-[#5BC0BE] transition hover:bg-[#5BC0BE]/10">
            Explore the Platform
          </Link>
        </div>
      </div>

      {/* Featured: Board Deck */}
      <div className="mb-12 rounded-2xl border border-[#FF8C00]/30 bg-gradient-to-r from-[#FF8C00]/10 via-transparent to-[#5BC0BE]/10 p-7 md:p-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-3 py-1 text-xs font-semibold bg-[#FF8C00] text-black rounded">FUNDING · BOARD</span>
              <span className="text-[10px] text-gray-400 font-mono">stranded-eu-funding-board-deck.pdf</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-2">EU Funding Board Deck</h2>
            <p className="text-gray-300 leading-relaxed">
              A 6-sheet, board-grade presentation of the Horizon Europe funding strategy — the
              ask, the funding landscape, the consortium, and the €15M budget model. Ready for a
              funding board or board of directors.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="/docs/stranded-eu-funding-board-deck.pdf"
              download
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FF8C00] hover:bg-[#ff9d33] text-[#0b111f] font-semibold rounded-2xl transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" /></svg>
              Download PDF
            </a>
            <Link href="/pitch" className="inline-flex items-center justify-center gap-2 px-7 py-3 border border-white/20 hover:bg-white/5 rounded-2xl transition text-sm">
              View Live Pitch →
            </Link>
          </div>
        </div>
      </div>

      {/* Diligence pack */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold tracking-tighter mb-2">Diligence Pack</h2>
        <p className="text-gray-400 mb-6 max-w-2xl">
          The full disclosure set — honest stage, real economics, clear ask. Download any of
          these for your own diligence.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {DILIGENCE.map(d => (
            <div key={d.file} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded ${d.tagColor}`}>{d.tag}</span>
                <span className="text-[10px] text-gray-500 font-mono truncate">{d.file.split('/').pop()}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tighter mb-2">{d.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed flex-1 mb-4">{d.desc}</p>
              <a
                href={d.file}
                download
                className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-white/15 hover:bg-white/5 rounded-xl transition text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" /></svg>
                Download
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tighter mb-2">Start a conversation</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          Energy data partners, mining operators, and EU consortium / grant collaborators —
          we would welcome the introduction.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:hello@giveabit.io" className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#FF8C00] text-[#0b111f] font-semibold rounded-2xl hover:bg-[#ff9d33] transition">
            Contact Give A Bit
          </a>
          <a href="https://github.com/kitsboy/stranded" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-7 py-3 border border-white/20 hover:bg-white/5 rounded-2xl transition">
            View Source on GitHub
          </a>
        </div>
        <p className="mt-6 text-[10px] text-gray-600">
          Safe Harbour: educational / informational only. Not financial, legal, or investment advice. Bitcoin involves risk. DYOR.
        </p>
      </div>
    </div>
  )
}
