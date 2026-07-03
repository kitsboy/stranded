import { readFileSync } from 'fs'
import { join } from 'path'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function ChangelogPage() {
  let content = '# Changelog\n\nSee git history for full details.'
  try {
    content = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf8')
  } catch { /* static build may not have file */ }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Changelog' }]} />
      <h1 className="text-3xl font-bold mb-6">Changelog</h1>
      <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">{content}</pre>
    </div>
  )
}