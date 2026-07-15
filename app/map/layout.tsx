import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stranded.giveabit.io'

export const metadata: Metadata = {
  title: 'Command Center Map | Stranded Value',
  description:
    'Interactive map of 2,611 verified stranded methane sites across Canada. Filter by province, emission, and Stranded Score. Build mission portfolios with live BTC ROI.',
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
      'Explore 2,611 verified methane sites with real-time filters, Stranded Score ROI, and mission portfolio tools.',
    url: `${siteUrl}/map`,
    type: 'website',
    images: [{ url: '/images/3.jpg', width: 1200, height: 630, alt: 'Stranded Command Center Map' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stranded Command Center Map',
    description: '2,611 verified sites · live filters · mission ROI · ECCC data',
    images: ['/images/3.jpg'],
  },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}