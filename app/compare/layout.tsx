import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Sites | Stranded Value',
  description: 'Side-by-side Stranded Score and ROI comparison for two methane sites.',
  openGraph: { title: 'Stranded Site Compare', images: ['/images/3.jpg'] },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}