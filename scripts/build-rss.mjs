#!/usr/bin/env node
/**
 * Write public/feed.xml from the top of CHANGELOG.md (already a public page).
 * Caps at 12. Skips a heading that is not a version.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://stranded.giveabit.io'
const md = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')
const parts = md.split(/^## /m).slice(1)
const items = []
for (const part of parts) {
  const line = part.split('\n')[0].trim()
  const ver = line.match(/^\[([^\]]+)\]\s*[—–-]\s*(\d{4}-\d{2}-\d{2})(?:\s*·\s*(.+))?$/)
  if (!ver) continue
  const [, version, day, rawTitle] = ver
  const title = (rawTitle || 'Update').trim()
  const body = part.split('\n').slice(1).map((l) => l.replace(/^- /, '').trim()).filter(Boolean).slice(0, 2).join(' ')
  items.push({ version, day, title, body })
  if (items.length >= 12) break
}
if (items.length < 1) {
  console.error('no changelog entries parsed')
  process.exit(1)
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const xmlItems = items.map((it) => `    <item>
      <title>${esc(it.version + ' — ' + it.title)}</title>
      <link>${SITE}/changelog</link>
      <guid isPermaLink="false">${SITE}/changelog#${esc(it.version)}</guid>
      <pubDate>${new Date(it.day + 'T12:00:00Z').toUTCString()}</pubDate>
      <description>${esc(it.body)}</description>
    </item>`).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Stranded — what changed</title>
    <link>${SITE}/changelog</link>
    <description>Public changelog for the Stranded map. Own notes only. Sibling news is not mixed in.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlItems}
  </channel>
</rss>
`
writeFileSync(join(ROOT, 'public', 'feed.xml'), xml)
console.log(`feed.xml ${items.length} items`)
