import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Command Dashboard | Stranded Value',
  description: 'Live KPIs, top movers, and quick actions across 2,611 stranded methane sites.',
  openGraph: { title: 'Stranded Command Dashboard', images: ['/images/3.jpg'] },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}