'use client'

import SwUpdateToast from './SwUpdateToast'
import { BtcPriceProvider } from './BtcPriceProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BtcPriceProvider>
      {children}
      <SwUpdateToast />
    </BtcPriceProvider>
  )
}
