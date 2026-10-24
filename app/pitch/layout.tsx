import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Pitch | Stranded Value',
  description: 'Live pitch: 2,611 methane sites, plus 1,049 renewable plants and 276 remote communities. Methane charts stay on the ECCC file. Miner math elsewhere only where power is recorded. Optimistic scenarios labelled.',
  openGraph: {
    title: 'Stranded Value — Live Pitch Deck',
    description: 'Auto-updating investor pitch with charts and real ECCC data.',
    images: ['/images/3.jpg'],
  },
}

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return children
}