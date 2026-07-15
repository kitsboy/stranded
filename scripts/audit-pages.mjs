#!/usr/bin/env node
/**
 * Visit all static routes and collect console/page errors.
 */
import { chromium } from '@playwright/test'

const BASE = process.env.AUDIT_BASE_URL || 'https://stranded.giveabit.io'

const ROUTES = [
  '/',
  '/map',
  '/pitch',
  '/education',
  '/dashboard',
  '/provinces',
  '/status',
  '/docs/api',
  '/bookmarks',
  '/methodology',
  '/about',
  '/global',
  '/benchmarks',
  '/privacy',
  '/roadmap',
  '/open-data',
  '/sites',
  '/compare?a=G10161&b=G12147',
  '/print/province?province=Alberta',
  '/funding',
  '/partnerships',
  '/verticals',
  '/changelog',
  '/map?site=G10161',
  '/pitch?present=1',
  '/pitch?embed=2',
]

const browser = await chromium.launch()
const page = await browser.newPage()
const failures = []

for (const route of ROUTES) {
  const errors = []
  const onConsole = msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  }
  const onPageError = err => errors.push(`pageerror: ${err.message}`)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  try {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 45000 })
    const status = res?.status() ?? 0
    const body = await page.locator('body').innerText().catch(() => '')
    const isNextError = body.includes('Application error') || body.includes('client-side exception')
    const is404 = status === 404 || body.includes('404') && body.length < 500
    if (status >= 400 || isNextError || errors.length) {
      failures.push({ route, status, errors: [...errors], isNextError, snippet: body.slice(0, 200) })
    } else {
      process.stdout.write(`✓ ${route}\n`)
    }
  } catch (e) {
    failures.push({ route, errors: [...errors, `nav: ${e.message}`] })
  }
  page.removeListener('console', onConsole)
  page.removeListener('pageerror', onPageError)
}

await browser.close()

if (failures.length) {
  console.error('\n=== FAILURES ===')
  for (const f of failures) {
    console.error(JSON.stringify(f, null, 2))
  }
  process.exit(1)
}
console.log('\nAll routes OK')