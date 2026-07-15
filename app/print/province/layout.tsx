import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Province One-Pager | Stranded Value',
  description: 'Printable executive summary for a Canadian province stranded methane portfolio.',
  robots: { index: false, follow: true },
}

export default function ProvincePrintLayout({ children }: { children: React.ReactNode }) {
  return children
}