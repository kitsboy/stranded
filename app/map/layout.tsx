import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stranded.giveabit.io'

export const metadata: Metadata = {
  title: 'Command Center Map | Stranded Value',
  description:
    'Interactive map of 2,611 methane sites, 1,049 renewable plants, and 276 remote communities across Canada. Filter methane by province, emission, and Stranded Score. Size a miner build only where the file records power.',
  keywords: [
    'stranded methane map',
    'Canada GHGRP',
    'ECCC emissions',
    'Bitcoin mining ROI',
    'methane capture sites',
    'Stranded Score',
    'mission portfolio',
  ],
  alternates: { canonical: '/map' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Stranded Command Center — Live Map',
    description:
      'Explore 2,611 methane sites (2,588 with reported CH₄, 675 high-confidence), plus 1,049 renewable plants and 276 remote communities. Miner math only where power is recorded.',
    url: `${siteUrl}/map`,
    type: 'website',
    images: [{ url: '/images/3.jpg', width: 1200, height: 630, alt: 'Stranded Command Center Map' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stranded Command Center Map',
    description: '2,611 methane sites · 1,049 plants · 276 remote communities · miner math only where power is recorded',
    images: ['/images/3.jpg'],
  },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}