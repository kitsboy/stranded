import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saved Sites | Stranded Value',
  description: 'Bookmarked methane sites with export/import JSON and local folder tags.',
  openGraph: { title: 'Stranded Bookmarks', images: ['/images/3.jpg'] },
}

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children
}