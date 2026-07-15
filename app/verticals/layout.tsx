import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Energy Verticals | Stranded Value',
  description: 'Stranded energy vertical models beyond methane — wind, waste heat, and more.',
  openGraph: { title: 'Stranded Energy Verticals', images: ['/images/3.jpg'] },
}

export default function VerticalsLayout({ children }: { children: React.ReactNode }) {
  return children
}