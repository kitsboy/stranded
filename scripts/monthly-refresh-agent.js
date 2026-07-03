#!/usr/bin/env node
/**
 * Monthly data refresh agent — run via cron or GitHub Actions schedule.
 * Refreshes live stats, syncs docs, validates dataset.
 */
const { execSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')

console.log('[monthly-agent] Starting Stranded data refresh…')
try {
  execSync('node scripts/refresh-eccc-data.js', { cwd: root, stdio: 'inherit' })
} catch {
  console.warn('[monthly-agent] ECCC refresh skipped (manual or network)')
}
execSync('node scripts/generate-live-stats.js', { cwd: root, stdio: 'inherit' })
execSync('node scripts/sync-docs.js', { cwd: root, stdio: 'inherit' })
execSync('node scripts/validate-data.js', { cwd: root, stdio: 'inherit' })
console.log('[monthly-agent] Done — commit & push to deploy updated stats')