import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Sites | Stranded Value',
  description: 'Browse and filter 2,611 ECCC methane sites with Stranded Score and mission tools.',
  openGraph: { title: 'Stranded All Sites', images: ['/images/3.jpg'] },
}

export default function SitesLayout({ children }: { children: React.ReactNode }) {
  return children
}