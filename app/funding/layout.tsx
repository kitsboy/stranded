import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Global Funding, Grants & Two-SPV Capital Stack | Stranded Value',
  description: '16+ verified funding programs across Canada (30% Clean Tech ITC, CIB, BDC), Alberta (ERA, AIOC, TIER), BC (CleanBC, FNCEBF), USA (IRA 48E, DOE), and Europe (Horizon Cluster 5, EIC, EUMER 2027).',
  keywords: [
    'stranded energy grants Canada',
    'Clean Tech ITC 30% Canada',
    'Emissions Reduction Alberta ERA',
    'Alberta Indigenous Opportunities Corporation AIOC',
    'CleanBC Industry Fund',
    'Horizon Europe Cluster 5 Canada',
    'EU Methane Regulation EUMER 2027',
    'Two-SPV project finance bitcoin mining',
    'sovereign wealth fund infrastructure debt',
  ],
  alternates: { canonical: '/funding' },
  openGraph: { title: 'Stranded Value — Global Grants & Two-SPV Capital Stack', images: ['/images/3.jpg'] },
}

export default function FundingLayout({ children }: { children: React.ReactNode }) {
  return children
}