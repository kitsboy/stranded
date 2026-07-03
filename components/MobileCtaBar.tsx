'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileCtaBar() {
  const path = usePathname()
  if (path === '/map') return null

  return (
    <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 px-4 pb-2 no-print">
      <div className="flex gap-2">
        <Link href="/map" className="flex-1 text-center py-2.5 rounded-xl bg-[#FF8C00] text-black font-semibold text-sm">Open Map</Link>
        <Link href="/pitch" className="flex-1 text-center py-2.5 rounded-xl border border-[#5BC0BE]/50 text-[#5BC0BE] font-semibold text-sm">Pitch</Link>
      </div>
    </div>
  )
}