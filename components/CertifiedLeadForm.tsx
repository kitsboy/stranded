'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { downloadBlob } from '@/lib/export-formats'

const DRAFT_KEY = 'stranded-certified-lead-draft'

const FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', required: true, autoComplete: 'name', placeholder: 'Jane Doe' },
  { key: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email', placeholder: 'you@company.com' },
  { key: 'org', label: 'Organization', type: 'text', required: true, autoComplete: 'organization', placeholder: 'Company or fund' },
  { key: 'province', label: 'Province / region', type: 'text', required: true, autoComplete: 'address-level1', placeholder: 'Alberta' },
  { key: 'sites', label: 'Sites of interest (optional)', type: 'text', required: false, autoComplete: 'off', placeholder: 'Site names or IDs' },
] as const

type FormState = Record<(typeof FIELDS)[number]['key'], string>

const empty: FormState = { name: '', email: '', org: '', province: '', sites: '' }

export default function CertifiedLeadForm() {
  const [form, setForm] = useState<FormState>(empty)
  const [submitted, setSubmitted] = useState(false)
  const [lastLead, setLastLead] = useState<Record<string, string> | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormState>
        setForm({ ...empty, ...parsed })
        setDraftSaved(true)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (submitted) return
    const hasContent = Object.values(form).some(v => v.trim())
    if (!hasContent) return
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    setDraftSaved(true)
  }, [form, submitted])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const lead = { ...form, at: new Date().toISOString(), source: 'stranded.giveabit.io' }
    try {
      const raw = localStorage.getItem('stranded-certified-leads')
      const leads = raw ? JSON.parse(raw) : []
      const list = Array.isArray(leads) ? leads : []
      list.push(lead)
      localStorage.setItem('stranded-certified-leads', JSON.stringify(list))
    } catch {
      localStorage.setItem('stranded-certified-leads', JSON.stringify([lead]))
    }
    setLastLead(lead)
    localStorage.removeItem(DRAFT_KEY)
    setDraftSaved(false)
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
      <div className="rounded-2xl border border-[#34D399]/40 bg-[#34D399]/10 p-6 text-center space-y-3" role="status">
        <div className="text-2xl mb-1" aria-hidden>✓</div>
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
          <button type="button" onClick={() => { setSubmitted(false); setForm(empty) }} className="px-4 py-2 rounded-xl border border-white/15 text-sm text-gray-400">
            New form
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#FF8C00]/30 bg-white/[0.03] p-6 space-y-4" noValidate={false}>
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">LOCAL ONLY</span>
        <span className="text-sm font-semibold">Stranded Value Certified — draft application</span>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Submissions stay on your device until you export or email them. No server-side intake yet — this is not a live certified intake form.
        {draftSaved && <span className="block mt-1 text-[#5BC0BE]">Draft autosaved locally.</span>}
      </p>
      {FIELDS.map(field => (
        <div key={field.key}>
          <label htmlFor={`lead-${field.key}`} className="block text-xs text-gray-400 mb-1">
            {field.label}{field.required ? '' : ''}
          </label>
          <input
            id={`lead-${field.key}`}
            name={field.key}
            required={field.required}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            value={form[field.key]}
            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            className="w-full bg-black/30 border border-white/15 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>
      ))}
      <button type="submit" className="w-full py-3 rounded-xl bg-[#FF8C00] text-black font-semibold hover:bg-[#ff9d33] transition">
        Save application locally
      </button>
    </form>
  )
}
