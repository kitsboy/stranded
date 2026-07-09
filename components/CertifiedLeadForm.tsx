'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { downloadBlob } from '@/lib/export-formats'

export default function CertifiedLeadForm() {
  const [form, setForm] = useState({ name: '', email: '', org: '', province: '', sites: '' })
  const [submitted, setSubmitted] = useState(false)
  const [lastLead, setLastLead] = useState<Record<string, string> | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const lead = { ...form, at: new Date().toISOString(), source: 'stranded.giveabit.io' }
    const leads = JSON.parse(localStorage.getItem('stranded-certified-leads') || '[]')
    leads.push(lead)
    localStorage.setItem('stranded-certified-leads', JSON.stringify(leads))
    setLastLead(lead)
    setSubmitted(true)
    toast.success('Saved on this device only', {
      description: 'Export JSON or open email draft — we are not notified automatically.',
    })
  }

  const exportJson = () => {
    if (!lastLead) return
    downloadBlob(JSON.stringify(lastLead, null, 2), `stranded-lead-${Date.now()}.json`, 'application/json')
    toast.success('Lead JSON downloaded')
  }

  const emailDraft = () => {
    if (!lastLead) return
    const body = encodeURIComponent(
      `Stranded Value Certified — local application (please review)\n\n` +
      `Name: ${lastLead.name}\nEmail: ${lastLead.email}\nOrg: ${lastLead.org}\nProvince: ${lastLead.province}\nSites: ${lastLead.sites || '—'}\nAt: ${lastLead.at}\n\n` +
      `(This draft was generated on the applicant's browser. Attach exported JSON if needed.)`
    )
    window.location.href = `mailto:hello@giveabit.io?subject=${encodeURIComponent('Stranded Value Certified application')}&body=${body}`
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#34D399]/40 bg-[#34D399]/10 p-6 text-center space-y-3">
        <div className="text-2xl mb-1">✓</div>
        <div className="font-semibold text-[#34D399]">Saved on this device</div>
        <p className="text-sm text-gray-400">
          Your application is stored in <strong className="text-gray-300">browser localStorage only</strong>.
          Nobody is notified until you export the file or send the email draft below.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <button type="button" onClick={exportJson} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm hover:bg-white/15">
            Download JSON
          </button>
          <button type="button" onClick={emailDraft} className="px-4 py-2 rounded-xl bg-[#FF8C00] text-black font-semibold text-sm hover:bg-[#ff9d33]">
            Open email draft
          </button>
          <button type="button" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', org: '', province: '', sites: '' }) }} className="px-4 py-2 rounded-xl border border-white/15 text-sm text-gray-400">
            New form
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#FF8C00]/30 bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] text-xs font-bold border border-[#34D399]/40">CERTIFIED</span>
        <span className="text-sm font-semibold">Stranded Value Certified Program</span>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Submissions stay on your device until you export or email them. No server-side intake yet.
      </p>
      {(['name', 'email', 'org', 'province', 'sites'] as const).map(field => (
        <input
          key={field}
          required={field !== 'sites'}
          type={field === 'email' ? 'email' : 'text'}
          placeholder={field === 'sites' ? 'Sites of interest (optional)' : field.charAt(0).toUpperCase() + field.slice(1)}
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          className="w-full bg-black/30 border border-white/15 rounded-lg px-4 py-2.5 text-sm"
        />
      ))}
      <button type="submit" className="w-full py-3 rounded-xl bg-[#FF8C00] text-black font-semibold hover:bg-[#ff9d33] transition">
        Save application locally
      </button>
    </form>
  )
}
