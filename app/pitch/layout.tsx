import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Pitch | Sovereign Wealth, Sound Money & Methane Abatement | Stranded Value',
  description: 'Live auto-updating pitch: 2,611 ECCC methane sites, codified 6-step generator + ASIC economics, Capture Hut BOMs, 10% Canadian Sovereign Bitcoin Pension Plan, and Two-SPV global capital stack.',
  keywords: [
    'sovereign wealth fund pitch',
    'sound money bitcoin treasury',
    'stranded methane investor deck',
    '10% flat bitcoin tax pension plan',
    'flare gas abatement ROI',
    'ASIC capture huts BOM',
    'CETA Horizon Europe energy grants',
    'Canadian energy sovereignty',
  ],
  alternates: { canonical: '/pitch' },
  openGraph: {
    title: 'Stranded Value — Live Investor, Policy & Sovereign Wealth Pitch',
    description: '2,611 mapped methane sites · Live Bitcoin blockchain pricing · 6-step math · Capture Huts · 10% Sovereign Pension.',
    images: ['/images/3.jpg'],
  },
}

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return children
}