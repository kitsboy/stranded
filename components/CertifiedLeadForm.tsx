'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function CertifiedLeadForm() {
  const [form, setForm] = useState({ name: '', email: '', org: '', province: '', sites: '' })
  const [submitted, setSubmitted] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const leads = JSON.parse(localStorage.getItem('stranded-certified-leads') || '[]')
    leads.push({ ...form, at: new Date().toISOString() })
    localStorage.setItem('stranded-certified-leads', JSON.stringify(leads))
    setSubmitted(true)
    toast.success('Application received — Stranded Value Certified review queued')
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#34D399]/40 bg-[#34D399]/10 p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <div className="font-semibold text-[#34D399]">Stranded Value Certified — Application Submitted</div>
        <p className="text-sm text-gray-400 mt-2">We&apos;ll review your sites and respond within 5 business days.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#FF8C00]/30 bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] text-xs font-bold border border-[#34D399]/40">CERTIFIED</span>
        <span className="text-sm font-semibold">Stranded Value Certified Program</span>
      </div>
      {(['name', 'email', 'org', 'province', 'sites'] as const).map(field => (
        <input
          key={field}
          required={field !== 'sites'}
          placeholder={field === 'sites' ? 'Sites of interest (optional)' : field.charAt(0).toUpperCase() + field.slice(1)}
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          className="w-full bg-black/30 border border-white/15 rounded-lg px-4 py-2.5 text-sm"
        />
      ))}
      <button type="submit" className="w-full py-3 rounded-xl bg-[#FF8C00] text-black font-semibold hover:bg-[#ff9d33] transition">
        Apply for Certification
      </button>
    </form>
  )
}