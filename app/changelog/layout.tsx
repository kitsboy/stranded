import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog | Stranded Value',
  description: 'Release history and upgrade batches for the Stranded Value platform.',
  openGraph: { title: 'Stranded Changelog', images: ['/images/3.jpg'] },
}

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children
}