import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Command Dashboard | Stranded Value',
  description: 'Live methane KPIs across 2,611 sites, plus the official map of 1,049 renewable plants and 276 remote communities.',
  openGraph: { title: 'Stranded Command Dashboard', images: ['/images/3.jpg'] },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}