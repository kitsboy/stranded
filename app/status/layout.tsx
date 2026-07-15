import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Status | Stranded Value',
  description: 'Platform status, version, and live dataset health for Stranded Value.',
  openGraph: { title: 'Stranded Status', images: ['/images/3.jpg'] },
}

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children
}