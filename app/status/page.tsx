'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function StatusPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch('/status.json').then(r => r.json()).then(setHealth).catch(() => setHealth({ status: 'unknown' }))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Status' }]} />
      <h1 className="text-3xl font-bold mb-4">Platform Status</h1>
      <div className="rounded-2xl border border-[#34D399]/30 bg-[#34D399]/10 p-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#34D399] animate-pulse" />
          <span className="font-semibold text-[#34D399]">Operational</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">https://stranded.giveabit.io</p>
      </div>
      {health && (
        <pre className="text-xs bg-black/30 p-4 rounded-xl overflow-auto text-gray-300">{JSON.stringify(health, null, 2)}</pre>
      )}
      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/dashboard" className="text-[#5BC0BE] hover:underline">Dashboard</Link>
        <Link href="/docs/api" className="text-[#5BC0BE] hover:underline">API Docs</Link>
      </div>
    </div>
  )
}