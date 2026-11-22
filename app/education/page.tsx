import dynamic from 'next/dynamic'

const EducationContent = dynamic(() => import('@/components/EducationContent'), {
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-gray-400">
      Loading Education Center…
    </div>
  ),
})

export const metadata = {
  title: 'Education Center | Sound Money, Methane GWP & Per-ASIC ROI | Stranded Value',
  description: 'Learn how stranded methane (GWP 28–80× CO₂), reciprocating generators, Arctic Capture Huts, and Bitcoin sound money combine into verifiable climate abatement and sovereign wealth.',
  keywords: [
    'what is stranded energy',
    'methane GWP 28x 80x calculator',
    'sound money energy backing',
    'sovereign wealth fund bitcoin',
    'INNIO Jenbacher J316 bitcoin mining',
    'off-grid flare gas abatement education',
  ],
  alternates: { canonical: '/education' },
  openGraph: { title: 'Stranded Value Education Center — Molecules to Sound Money', images: ['/images/3.jpg'] },
}

export default function EducationPage() {
  return <EducationContent />
}