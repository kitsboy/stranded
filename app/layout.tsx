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
  title: 'Stranded Value | Sovereign Wealth, Sound Money & Stranded Methane Bitcoin Mining',
  description: '2,611 mapped Canadian methane sites, plus 1,049 renewable plants and 207 remote communities. Turn vented & flared methane into sound money, clean off-grid Bitcoin, and a 10% Canadian Sovereign Wealth & Pension Fund with zero grid draw.',
  keywords: [
    'sovereign wealth fund',
    'sound money',
    'hard money',
    'strategic bitcoin reserve',
    'Canadian Bitcoin pension plan',
    'Alberta Heritage Savings Trust Fund',
    'Norway sovereign wealth model',
    'stranded energy',
    'methane abatement',
    'flare gas bitcoin mining',
    'landfill gas to energy',
    'GHG emissions reduction',
    'GWP 28x 80x methane destruction',
    'off-grid reciprocating generators',
    'ASIC mining capture huts',
    'energy sovereignty',
    'free market environmentalism',
    'Indigenous clean energy equity',
    'CETA Horizon Europe cleantech grants',
    'Clean Tech ITC 30%',
    'Nuclear SMR baseload',
  ],
  icons: { icon: ['/favicon.svg', '/favicon-32x32.png', '/favicon-16x16.png'], apple: ['/apple-touch-icon.png'] },
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://stranded.giveabit.io'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      fr: '/',
      de: '/',
      es: '/',
      'x-default': '/',
    },
    types: {
      'application/rss+xml': '/feed.xml',
      'application/feed+json': '/feed.json',
    },
  },
  openGraph: {
    title: 'Stranded Value | Sound Money, Sovereign Wealth & Methane Abatement',
    description: '2,611 ECCC methane sites, 1,049 renewable plants, and 207 remote communities. Turn wasted methane into sound money and a 10% Canadian Sovereign Bitcoin Pension with zero grid draw.',
    images: [{ url: '/images/3.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stranded Value | Sound Money, Sovereign Wealth & Methane Abatement',
    description: '2,611 mapped Canadian methane sites · Turn waste gas into Sound Money & a 10% Sovereign Pension · Zero grid draw.',
    images: ['/images/3.jpg'],
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
    description: '2,611 methane sites, 1,049 renewable plants, and 207 remote communities, with Bitcoin miner math only where power is recorded',
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
