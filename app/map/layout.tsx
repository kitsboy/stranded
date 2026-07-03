import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Command Center Map | Stranded Value',
  description: 'Interactive map of 2,611 stranded methane sites with filters, ROI, and mission portfolio.',
  openGraph: { title: 'Stranded Command Center', images: ['/images/3.jpg'] },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}