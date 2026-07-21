import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Toaster } from 'sonner'
import GlobalCommand from '@/components/GlobalCommand'
import Providers from '@/components/Providers'
import JsonLd from '@/components/JsonLd'
import MobileCtaBar from '@/components/MobileCtaBar'
import OfflineIndicator from '@/components/OfflineIndicator'
import ErrorBoundary from '@/components/ErrorBoundary'

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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Stranded Value',
    url: 'https://stranded.giveabit.io',
    description: '2,611 stranded methane sites mapped with Bitcoin-powered ROI modeling',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
  }

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#243447" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="preconnect" href="https://api.coingecko.com" crossOrigin="anonymous" />
        {/* Umami (privacy-friendly analytics) — website f07bb222-…; host is suite Umami on THOR via analytics.giveabit.io */}
        <script
          defer
          src="https://analytics.giveabit.io/script.js"
          data-website-id="f07bb222-c151-4018-81d5-a021c0a0bbdb"
        />
        <JsonLd data={jsonLd} />
      </head>
      <body className="bg-[var(--bg-dark)] text-white antialiased flex flex-col min-h-screen">
        <Providers>
          <Nav />
          {/* pb clears sticky footer (+ mobile CTA row inside it) so page content is not clipped */}
          <main id="main-content" className="flex-1 max-md:pb-36 md:pb-0">
            <ErrorBoundary label="page">{children}</ErrorBoundary>
          </main>
          <Footer />
          <Toaster
            position="top-center"
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              className: 'stranded-toast',
              style: {
                background: 'rgba(36, 52, 71, 0.95)',
                border: '1px solid rgba(91, 192, 190, 0.3)',
                color: '#f1f5f9',
              },
            }}
          />
          <GlobalCommand />
          <MobileCtaBar />
          <OfflineIndicator />
        </Providers>
      </body>
    </html>
  )
}
