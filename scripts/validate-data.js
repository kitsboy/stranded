// Validation for canonical GeoJSON + Stranded Score™ v3 distribution
// Run with: node scripts/validate-data.js

const fs = require('fs')
const path = require('path')
const { computeStrandedScore } = require('../lib/scoring-shared.cjs')

const geo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'stranded-sites-REAL.geojson')))

const features = geo.features || []
console.log(`Total features: ${features.length}`)

if (features.length !== 2611) {
  console.error('ERROR: Expected 2611 sites')
  process.exit(1)
}

const scores = features.map(f => computeStrandedScore(f.properties))
const avg = scores.reduce((a, b) => a + b, 0) / scores.length
const max = Math.max(...scores)
const min = Math.min(...scores)
const ge80 = scores.filter(s => s >= 80).length
const ge85 = scores.filter(s => s >= 85).length

console.log(`Average Stranded Score: ${avg.toFixed(1)}`)
console.log(`Range: ${min.toFixed(1)} – ${max.toFixed(1)}`)
console.log(`Sites ≥80: ${ge80} · Sites ≥85: ${ge85}`)

if (max < 80) {
  console.error('ERROR: No site scored ≥80 — scoring formula may be broken')
  process.exit(1)
}
if (ge80 < 20) {
  console.error('ERROR: Too few high-score sites (expected ≥20 at ≥80)')
  process.exit(1)
}
if (avg < 40 || avg > 75) {
  console.error('ERROR: Average score out of expected range (40–75)')
  process.exit(1)
}

console.log('Data validation PASSED. 2611 sites. Scoring v3 looks sane.')
process.exit(0)