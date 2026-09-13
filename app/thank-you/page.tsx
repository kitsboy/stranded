import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import { ButtonLink } from '@/components/ui/Button'

export const metadata = {
  title: 'Thank you — Stranded Value',
  description:
    'Your application or message reached the Stranded Value team. Here is what happens next, how to follow up, and the always-open fallback that never fails.',
}

export default function ThankYouPage() {
  return (
    <div className="page-container">
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Thank you' }]}
        title="Thank you."
        subtitle="Your application or message reached the Stranded Value team. Here is what happens next — and how to follow up whenever you like."
        actions={
          <>
            <ButtonLink href="/map" variant="primary" className="text-sm px-4 py-2">
              Explore the map
            </ButtonLink>
            <ButtonLink href="/partnerships" variant="secondary" className="text-sm px-4 py-2">
              Partnerships
            </ButtonLink>
          </>
        }
      />

      <div className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5 p-6">
          <h2 className="text-xl font-semibold mb-3 text-[#5BC0BE]">Application received</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Your application has been delivered to <strong className="text-white">hello@giveabit.io</strong>.
            The Stranded Value team has been notified and will get back to you — real people, no tickets.
            A copy is also saved in your browser under &ldquo;Stranded&nbsp;Value&nbsp;Certified&rdquo;.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold mb-3 text-[#FF8C00]">What happens next</h2>
          <ul className="space-y-3 text-sm text-gray-300">
            <li><strong className="text-white">1 · We review</strong> — a human triages your application against live site and fleet data.</li>
            <li><strong className="text-white">2 · We reply</strong> — expect a follow-up on the email you provided within a few days.</li>
            <li><strong className="text-white">3 · We build together</strong> — next step is a shortlist or MOU, depending on your category.</li>
          </ul>
          <p className="text-xs text-gray-400 mt-4">
            Optimistic scenarios are always labelled as such. No tracking pixels, no KYC — your data stays yours.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 items-start bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold mb-3 text-white">Follow up or keep exploring</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:hello@giveabit.io"
              className="px-5 py-2.5 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold hover:bg-[#FF8C00]/90"
            >
              Email the team →
            </a>
            <Link
              href="/funding"
              className="px-5 py-2.5 rounded-xl border border-[#5BC0BE]/40 text-[#5BC0BE] text-sm hover:bg-[#5BC0BE]/10"
            >
              Funding pathways
            </Link>
            <Link
              href="/open-data"
              className="px-5 py-2.5 rounded-xl border border-white/20 text-sm hover:bg-white/5"
            >
              Open data &amp; verify
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}