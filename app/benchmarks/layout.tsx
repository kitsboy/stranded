import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Benchmarks | Stranded Value',
  description: 'Global and regional benchmarks for stranded energy and methane capture economics.',
  openGraph: { title: 'Stranded Benchmarks', images: ['/images/3.jpg'] },
}

export default function BenchmarksLayout({ children }: { children: React.ReactNode }) {
  return children
}