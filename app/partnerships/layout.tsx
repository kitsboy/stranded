import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partnerships | Stranded Value',
  description: 'First Nations and community partnership model for stranded methane capture and Bitcoin-powered remediation.',
  openGraph: { title: 'Stranded Partnerships', images: ['/images/3.jpg'] },
}

export default function PartnershipsLayout({ children }: { children: React.ReactNode }) {
  return children
}