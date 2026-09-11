'use client'

import { useState, useEffect, useCallback } from 'react'
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

const CATEGORIES = [
  'Site application',
  'Location info',
  'Job posting',
  'Capital or partnership',
  'Press',
  'Other',
] as const

type FieldKey = (typeof FIELDS)[number]['key']
type FormState = Record<FieldKey, string>

const empty: FormState = { name: '', email: '', org: '', province: '', sites: '' }

const CONTACT_TO = 'hello@giveabit.io'

export default function CertifiedLeadForm() {
  const [form, setForm] = useState<FormState>(empty)
  const [category, setCategory] = useState('')
  const [specify, setSpecify] = useState('')
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [lastLead, setLastLead] = useState<Record<string, string> | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormState> & { category?: string; specify?: string }
        setForm({ ...empty, ...(parsed as Partial<FormState>) })
        if (parsed.category) setCategory(parsed.category)
        if (parsed.specify) setSpecify(parsed.specify)
        setDraftSaved(true)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (submitted || sending) return
    const hasContent = Object.values(form).some(v => v.trim()) || category || specify
    if (!hasContent) return
    const draft = { ...form, category, specify }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setDraftSaved(true)
  }, [form, category, specify, submitted, sending])

  // Subject matches Cam's spec: "Stranded Energy — <category>" (+ ": <specify>").
  const subject = specify
    ? `Stranded Energy — ${category}: ${specify}`
    : `Stranded Energy — ${category}`

  const buildBody = (lead: Record<string, string>) =>
    `Stranded Value Certified — local application (please review)\n\n` +
    `Name: ${lead.name}\nEmail: ${lead.email}\nOrg: ${lead.org}\nProvince: ${lead.province}\nSites: ${lead.sites || '—'}\nCategory: ${lead.category}${lead.specify ? ` (${lead.specify})` : ''}\nAt: ${lead.at}\n\n` +
    `(Sent via stranded.giveabit.io.)`

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_TO)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(`${CONTACT_TO} copied`)
    } catch {
      toast.error('Could not copy — tap the link below to open your email app.')
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSubmitError(null)
    const lead = { ...form, category, specify, at: new Date().toISOString(), source: 'stranded.giveabit.io' }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          org: form.org,
          province: form.province,
          sites: form.sites,
          category,
          specify,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok !== true) {
        throw new Error(data.error || `Delivery failed (${res.status})`)
      }
      // Keep a local copy as an extra safety net (never-lose-a-lead).
      try {
        const raw = localStorage.getItem('stranded-certified-leads')
        const list = raw ? JSON.parse(raw) : []
        const arr = Array.isArray(list) ? list : []
        arr.push(lead)
        localStorage.setItem('stranded-certified-leads', JSON.stringify(arr))
      } catch {
        localStorage.setItem('stranded-certified-leads', JSON.stringify([lead]))
      }
      setLastLead(lead)
      localStorage.removeItem(DRAFT_KEY)
      setDraftSaved(false)
      setSubmitted(true)
      toast.success('Application sent')
    } catch (err) {
      setLastLead(lead)
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setSubmitError(msg)
      toast.error('Could not send — use the email fallback below.')
    } finally {
      setSending(false)
    }
  }

  const exportJson = () => {
    if (!lastLead) return
    downloadBlob(JSON.stringify(lastLead, null, 2), `stranded-lead-${Date.now()}.json`, 'application/json')
    toast.success('Lead JSON downloaded')
  }

  const emailDraft = () => {
    if (!lastLead) return
    const body = encodeURIComponent(buildBody(lastLead))
    window.location.href = `mailto:${CONTACT_TO}?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  const setField = (key: FieldKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="rounded-2xl border border-[#FF8C00]/30 bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">LEAD FORM</span>
        <span className="text-sm font-semibold">Stranded Value Certified — application</span>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate={false}>
        {FIELDS.map(field => (
          <div key={field.key}>
            <label htmlFor={`lead-${field.key}`} className="block text-xs text-gray-400 mb-1">
              {field.label}{field.required ? ' *' : ''}
            </label>
            <input
              id={`lead-${field.key}`}
              name={field.key}
              required={field.required}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={setField(field.key)}
              className="w-full bg-black/30 border border-white/15 rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
        ))}

        <div>
          <label htmlFor="lead-category" className="block text-xs text-gray-400 mb-1">Category *</label>
          <select
            id="lead-category"
            name="category"
            required
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-black/30 border border-white/15 rounded-lg px-4 py-2.5 text-sm"
          >
            <option value="" disabled>Select a category…</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c} className="bg-black">{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lead-specify" className="block text-xs text-gray-400 mb-1">
            Specify (optional) — e.g. job title, site name
          </label>
          <input
            id="lead-specify"
            name="specify"
            type="text"
            autoComplete="off"
            placeholder="e.g. Site supervisor, Bighorn site"
            value={specify}
            onChange={e => setSpecify(e.target.value)}
            className="w-full bg-black/30 border border-white/15 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 rounded-xl bg-[#FF8C00] text-black font-semibold hover:bg-[#ff9d33] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending…' : 'Submit application'}
        </button>
      </form>

      {submitError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
          Could not send your application ({submitError}). Use the email fallback below — it never fails.
        </div>
      )}

      {submitted && (
        <div className="rounded-2xl border border-[#34D399]/40 bg-[#34D399]/10 p-6 text-center space-y-3" role="status">
          <div className="text-2xl mb-1" aria-hidden>✓</div>
          <div className="font-semibold text-[#34D399]">Application sent to {CONTACT_TO}</div>
          <p className="text-sm text-gray-400">
            The Stranded Value team has been notified. A copy is also saved in your browser.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button type="button" onClick={exportJson} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm hover:bg-white/15">
              Download JSON
            </button>
            <button type="button" onClick={() => { setSubmitted(false); setForm(empty); setCategory(''); setSpecify(''); setSubmitError(null) }} className="px-4 py-2 rounded-xl border border-white/15 text-sm text-gray-400">
              New form
            </button>
          </div>
        </div>
      )}

      {/* Always-visible fallback that cannot fail — works with zero network access. */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
        <div className="text-xs font-semibold text-gray-300">Never-lose-a-lead fallback</div>
        <p className="text-xs text-gray-400">
          If automatic delivery ever fails, email us directly. Your subject line will already be filled in.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyEmail}
            className="px-3 py-1.5 rounded-lg bg-[#5BC0BE]/20 border border-[#5BC0BE]/40 text-[#5BC0BE] text-xs font-semibold hover:bg-[#5BC0BE]/30"
          >
            {copied ? 'Copied ✓' : `Copy ${CONTACT_TO}`}
          </button>
          <a
            href={`mailto:${CONTACT_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildBody(lastLead || { name: form.name, email: form.email, org: form.org, province: form.province, sites: form.sites, category, specify, at: '' }))}`}
            className="px-3 py-1.5 rounded-lg bg-[#FF8C00] text-black text-xs font-semibold hover:bg-[#ff9d33]"
          >
            Open email → {CONTACT_TO}
          </a>
        </div>
        <div className="text-[11px] text-gray-500">
          Email: <span className="text-gray-300">{CONTACT_TO}</span> · Subject: <span className="text-gray-300">{subject || 'Stranded Energy — <category>'}</span>
        </div>
      </div>
    </div>
  )
}
