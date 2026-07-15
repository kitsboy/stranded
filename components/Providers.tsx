'use client'

import SwUpdateToast from './SwUpdateToast'
import HtmlLangSync from './HtmlLangSync'
import { BtcPriceProvider } from './BtcPriceProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BtcPriceProvider>
      <HtmlLangSync />
      {children}
      <SwUpdateToast />
    </BtcPriceProvider>
  )
}
