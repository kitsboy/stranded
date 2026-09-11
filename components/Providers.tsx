'use client'

import SwUpdateToast from './SwUpdateToast'
import HtmlLangSync from './HtmlLangSync'
import ChunkLoadRecovery from './ChunkLoadRecovery'
import { BtcPriceProvider } from './BtcPriceProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BtcPriceProvider>
      <HtmlLangSync />
      <ChunkLoadRecovery />
      {children}
      <SwUpdateToast />
    </BtcPriceProvider>
  )
}
