import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'First Nations, Landowner Partnerships & Engineering Careers | Stranded Value',
  description: 'Indigenous equity co-ownership (742 overlapping sites), landowner royalties, and open Canadian / EU field engineering roles for stranded methane capture and Bitcoin infrastructure.',
  keywords: [
    'First Nations clean energy equity',
    'Indigenous sovereign wealth bitcoin',
    'Alberta flare gas landowner royalty',
    'genset field technician jobs Canada',
    'Bitcoin mining electrical engineer jobs',
    'CETA Global Talent Stream engineering',
  ],
  alternates: { canonical: '/partnerships' },
  openGraph: { title: 'Stranded Partnerships & Field Engineering Careers', images: ['/images/3.jpg'] },
}

export default function PartnershipsLayout({ children }: { children: React.ReactNode }) {
  return children
}