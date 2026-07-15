import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Provincial Intelligence | Stranded Value',
  description: 'Province-level site counts, emissions, and printable executive one-pagers.',
  openGraph: { title: 'Stranded Provincial Intelligence', images: ['/images/3.jpg'] },
}

export default function ProvincesLayout({ children }: { children: React.ReactNode }) {
  return children
}