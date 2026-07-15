#!/usr/bin/env node
import { chromium } from '@playwright/test'

const BASE = process.env.AUDIT_BASE_URL || 'https://stranded.giveabit.io'
const ROUTES = [
  '/', '/map', '/pitch', '/education', '/dashboard', '/funding', '/partnerships',
  '/verticals', '/bookmarks', '/sites', '/compare?a=G10161&b=G12147',
  '/changelog', '/methodology', '/provinces?name=Alberta',
]

const browser = await chromium.launch()
const page = await browser.newPage()
const crashes = []

for (const route of ROUTES) {
  const pageErrors = []
  const onErr = e => pageErrors.push(e.message)
  page.on('pageerror', onErr)
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)
    const appErr = await page.getByText(/Application error|client-side exception|Something went wrong/i).count()
    if (appErr > 0 || pageErrors.length) {
      crashes.push({ route, pageErrors, appErr })
    } else {
      process.stdout.write(`✓ ${route}\n`)
    }
  } catch (e) {
    crashes.push({ route, nav: e.message })
  }
  page.removeListener('pageerror', onErr)
}

await browser.close()
if (crashes.length) {
  console.error('\nCRASHES:', JSON.stringify(crashes, null, 2))
  process.exit(1)
}
console.log('No uncaught exceptions')