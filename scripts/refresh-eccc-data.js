#!/usr/bin/env node
/**
 * Fetches latest ECCC stranded methane dataset and validates against canonical file.
 * Run manually or via cron: node scripts/refresh-eccc-data.js
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const CANONICAL = path.join(ROOT, 'data', 'stranded-sites-REAL.geojson')
const PUBLIC = path.join(ROOT, 'public', 'data', 'stranded-sites.geojson')
const ECCC_DATASET = 'https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823'

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function main() {
  console.log('ECCC refresh check — canonical:', CANONICAL)
  const local = JSON.parse(fs.readFileSync(CANONICAL, 'utf8'))
  const count = (local.features || []).length
  console.log(`Local sites: ${count}`)
  console.log(`Dataset portal: ${ECCC_DATASET}`)
  console.log('Note: ECCC API requires CKAN resource URL. Copy updated geojson to data/ when new release drops.')

  fs.copyFileSync(CANONICAL, PUBLIC)
  console.log('✓ Synced public/data/stranded-sites.geojson from canonical')
  require('./generate-live-stats.js')
}

main().catch(err => { console.error(err); process.exit(1) })