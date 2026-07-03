#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const BASE = 'https://stranded.giveabit.io'
const routes = ['/', '/map', '/education', '/sites', '/pitch', '/dashboard', '/verticals', '/funding', '/partnerships', '/provinces', '/changelog', '/status', '/docs/api', '/bookmarks', '/methodology', '/about', '/global', '/benchmarks', '/Marketing-Hub.html']

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${BASE}${r}</loc><changefreq>weekly</changefreq><priority>${r === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`

fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), xml)
console.log('✓ sitemap.xml generated')