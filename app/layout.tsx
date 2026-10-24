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
import PwaInstallPrompt from '@/components/PwaInstallPrompt'
import StaleDataBanner from '@/components/StaleDataBanner'
import TooltipBinder from '@/components/TooltipBinder'

export const metadata: Metadata = {
  title: 'Stranded | Stranded Energy, Bitcoin Access | Stranded Value',
  description: '2,611 mapped methane sites, plus 1,049 renewable plants and 276 remote communities. Waste-methane mining has no grid draw. A miner build elsewhere is sized only where the file records real power. Optimistic scenarios stay labelled.',
  icons: { icon: ['/favicon.svg', '/favicon-32x32.png', '/favicon-16x16.png'], apple: ['/apple-touch-icon.png'] },
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://stranded.giveabit.io'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      'x-default': '/',
    },
    types: {
      'application/rss+xml': '/feed.xml',
      'application/feed+json': '/feed.json',
    },
  },
  openGraph: {
    title: 'Stranded | Stranded Energy, Bitcoin Access',
    description: '2,611 methane sites, 1,049 renewable plants, and 276 remote communities. Honest miner math where the file records power. Optimistic hashprice stays labelled.',
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
    description: '2,611 methane sites, 1,049 renewable plants, and 276 remote communities, with Bitcoin miner math only where power is recorded',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
  }

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#243447" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
          <TooltipBinder />
          <StaleDataBanner />
          <main id="main-content" className="flex-1">
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
          <PwaInstallPrompt />
        </Providers>
      </body>
    </html>
  )
}
