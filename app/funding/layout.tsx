import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Funding Pathway | Stranded Value',
  description: 'CETA-aligned grant matcher quiz and cleantech capital stack estimator for stranded methane projects.',
  openGraph: { title: 'Stranded Funding Pathway', images: ['/images/3.jpg'] },
}

export default function FundingLayout({ children }: { children: React.ReactNode }) {
  return children
}