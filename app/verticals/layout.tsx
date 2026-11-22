import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Energy Verticals | Methane, Curtailed Wind/Solar, Waste Heat & Nuclear SMR | Stranded Value',
  description: 'From 2,611 verified ECCC methane sites today to curtailed wind & solar, remote hydro, industrial waste heat, and Phase 3 Nuclear Small Modular Reactor (SMR) baseload.',
  keywords: [
    'nuclear SMR bitcoin mining',
    'Darlington BWRX-300 SMR load following',
    'curtailed wind and solar monetization',
    'remote Arctic diesel displacement',
    'industrial waste heat co-generation',
    'stranded methane capture',
  ],
  alternates: { canonical: '/verticals' },
  openGraph: { title: 'Stranded Energy Verticals — Methane to Nuclear SMR', images: ['/images/3.jpg'] },
}

export default function VerticalsLayout({ children }: { children: React.ReactNode }) {
  return children
}