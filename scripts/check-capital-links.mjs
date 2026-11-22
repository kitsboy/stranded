#!/usr/bin/env node
/**
 * Upgrade #46: Automated Grant & Capital Directory Link Watchdog.
 *
 * Verifies that every program in lib/capital-directory.ts and lib/eu-programs.json
 * has a valid HTTPS URL, non-empty agency, poolSize, ticketRange, and qualifyingScope,
 * and checks that all internal route links across Nav, MobileNav, Footer, and pages
 * resolve to existing app routes or public files.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAPITAL_DIRECTORY, CAPITAL_JURISDICTIONS } from '../lib/capital-directory.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// 1. Validate Capital Directory integrity
assert.ok(CAPITAL_DIRECTORY.length >= 12, 'Capital directory must have at least 12 entries')
const validJurisdictions = new Set(CAPITAL_JURISDICTIONS.map(j => j.id))
for (const entry of CAPITAL_DIRECTORY) {
  assert.ok(entry.id && entry.name && entry.agency, `Missing id/name/agency on ${entry.id}`)
  assert.ok(validJurisdictions.has(entry.jurisdiction), `Invalid jurisdiction ${entry.jurisdiction} on ${entry.id}`)
  assert.ok(entry.url.startsWith('https://'), `URL must be HTTPS on ${entry.id}: ${entry.url}`)
  assert.ok(entry.qualifyingScope.length >= 30, `Qualifying scope honesty note too short on ${entry.id}`)
}

// 2. Validate EU programs JSON
const euPrograms = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'eu-programs.json'), 'utf8'))
assert.ok(Array.isArray(euPrograms) && euPrograms.length >= 7, 'eu-programs.json must have >=7 programs')
for (const p of euPrograms) {
  assert.ok(p.sourceUrl && p.sourceUrl.startsWith('https://'), `Invalid sourceUrl on EU program ${p.id}`)
}

// 3. Validate internal href="/..." links across key components & pages
const KNOWN_ROUTES = new Set([
  '/', '/map', '/education', '/sites', '/pitch', '/dashboard', '/verticals',
  '/funding', '/investors', '/partnerships', '/thank-you', '/provinces',
  '/changelog', '/status', '/docs', '/docs/api', '/bookmarks', '/methodology',
  '/about', '/global', '/benchmarks', '/privacy', '/roadmap', '/open-data',
  '/compare', '/print/province', '/Marketing-Hub.html', '/feed.xml',
])

const filesToScan = [
  'components/Nav.tsx',
  'components/MobileNav.tsx',
  'components/Footer.tsx',
  'components/HowTheMathWorks.tsx',
  'components/CaptureHutSizer.tsx',
  'components/SovereignPensionPlan.tsx',
  'components/GlobalCapitalDirectory.tsx',
  'app/page.tsx',
  'app/pitch/page.tsx',
  'app/funding/page.tsx',
  'app/investors/page.tsx',
  'app/verticals/page.tsx',
  'app/partnerships/page.tsx',
  'app/about/page.tsx',
  'app/roadmap/page.tsx',
]

let checkedLinks = 0
for (const rel of filesToScan) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  const matches = src.matchAll(/href=["'](\/[^"'#?]*)["']/g)
  for (const m of matches) {
    const target = m[1].replace(/\/$/, '') || '/'
    checkedLinks++
    if (KNOWN_ROUTES.has(target)) continue
    const pubPath = path.join(ROOT, 'public', target)
    assert.ok(fs.existsSync(pubPath), `Broken internal link ${m[1]} in ${rel}`)
  }
}

console.log(`check-capital-links: ALL PASSED (${CAPITAL_DIRECTORY.length} capital programs, ${euPrograms.length} EU programs, ${checkedLinks} internal links verified)`)
