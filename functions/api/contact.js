// Cloudflare Pages Function — certified-lead intake email via Formspree relay.
// PRIMARY delivery path for the certified-application form on stranded.giveabit.io.
//
// History: the form previously did window.location.href = 'mailto:hello@giveabit.io…'
// which is a silent dead-end on phones/desktops without a configured mail client
// (no error, no send, no trace — every mobile lead lost). Root-cause fix (Ziggy,
// t_b1d7613e): replace with this real endpoint, relayed server-side to the SAME
// Formspree form the family already uses (xpqgopvd), so there is exactly one
// delivery provider and the mailbox behind it is the family inbox.
//
// NOTE: Formspree's destination address is fixed on Formspree's side (its dashboard),
// so CONTACT_TO below is advisory metadata + a reply-to signal, not a runtime
// recipient override. See acceptance criterion 4 of the card.
//
// Delivery: Formspree form xpqgopvd (family inbox).

import { rateHeaders, sanitizeStr, isValidEmail } from '../lib/guard.js'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xpqgopvd'
const ALLOWED_ORIGIN = 'https://stranded.giveabit.io'
const CONTACT_TO = 'hello@giveabit.io'

const CATEGORIES = [
  'Site application',
  'Location info',
  'Job posting',
  'Capital or partnership',
  'Press',
  'Other',
]

function baseHeaders(rl) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-RateLimit-Limit': rl['X-RateLimit-Limit'],
    'X-RateLimit-Window': rl['X-RateLimit-Window'],
    'X-RateLimit-Remaining': rl['X-RateLimit-Remaining'],
    'X-RateLimit-Policy': rl['X-RateLimit-Policy'],
  }
}

export async function onRequestPost(context) {
  const { request } = context
  const rl = rateHeaders(request)
  const headers = baseHeaders(rl)
  if (!rl.allowed) {
    headers['Retry-After'] = rl['Retry-After']
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers })
  }

  // Honeypot — bots fill this; humans never see it. Silently "succeed".
  if (body._gotcha) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
  }

  const name = sanitizeStr(body.name, 120)
  const email = sanitizeStr(body.email, 254)
  const org = sanitizeStr(body.org, 200)
  const province = sanitizeStr(body.province, 120)
  const sites = sanitizeStr(body.sites, 500)
  const category = sanitizeStr(body.category, 40)
  const specify = sanitizeStr(body.specify, 200)
  const message = sanitizeStr(body.message, 4000)

  // Required fields. Sites optional; specify optional.
  if (!name || !email || !org || !province || !category) {
    return new Response(JSON.stringify({ error: 'All required fields must be filled' }), { status: 400, headers })
  }

  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers })
  }

  if (!CATEGORIES.includes(category)) {
    return new Response(JSON.stringify({ error: 'Invalid category' }), { status: 400, headers })
  }

  // Cam's spec: subject starts with the title "Stranded Energy" and carries the
  // category (+ optional "specify", e.g. a job-posting name or site name).
  // The Stranded title is the PREFIX, not the whole subject.
  const subject = specify
    ? `Stranded Energy — ${category}: ${specify}`
    : `Stranded Energy — ${category}`

  const bodyText = message ||
    `New certified lead from stranded.giveabit.io\n\n` +
    `Name: ${name}\nEmail: ${email}\nOrganization: ${org}\nProvince/region: ${province}\n` +
    `Sites of interest: ${sites || '—'}\nCategory: ${category}${specify ? ` (${specify})` : ''}`

  try {
    const relay = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name,
        email,
        org,
        province,
        sites,
        category,
        specify,
        subject,
        _subject: subject,
        message: bodyText,
        CONTACT_TO,
        _replyto: email,
      }),
    })
    const data = await relay.json().catch(() => ({}))
    if (!relay.ok || data.ok !== true) {
      throw new Error(`Formspree relay failed: ${relay.status}`)
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
  } catch (err) {
    // Never leak provider errors to the client.
    console.error('Contact relay error:', err)
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), { status: 502, headers })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
