'use client'

import SwUpdateToast from './SwUpdateToast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SwUpdateToast />
    </>
  )
}