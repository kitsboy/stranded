import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Toaster } from 'sonner'
import GlobalCommand from '@/components/GlobalCommand'

export const metadata: Metadata = {
  title: 'Stranded | Stranded Energy, Bitcoin Access | Stranded Value',
  description: '2,611 verified stranded energy sites. Discover, model, and fund Bitcoin-powered energy projects with our world-class intelligence platform. Real generators, per-site Value (CapEx + methane-loss ROI + financing), portfolio tools, education, and capital pathways. Methane today, full stranded energy ecosystem tomorrow.',
  icons: { icon: '/logo.png' },
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://stranded.giveabit.io'),
  openGraph: {
    title: 'Stranded | Stranded Energy, Bitcoin Access',
    description: 'Turn wasted energy into verifiable wealth. 2,611 sites, real generator models, honest per-site ROI (generator + ASIC + financing + methane loss), portfolio simulator, Stranded Value Education Center, and direct pathways to capital.',
    images: [{ url: '/images/3.jpg' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg-dark)] text-white antialiased flex flex-col min-h-screen">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="top-center" richColors closeButton />
        <GlobalCommand />
      </body>
    </html>
  )
}
