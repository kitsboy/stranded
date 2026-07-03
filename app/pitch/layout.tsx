import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Pitch | Stranded Value',
  description: 'Live auto-updating pitch deck: 2,611 sites, province charts, climate impact, BTC revenue model.',
  openGraph: {
    title: 'Stranded Value — Live Pitch Deck',
    description: 'Auto-updating investor pitch with charts and real ECCC data.',
    images: ['/images/3.jpg'],
  },
}

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return children
}