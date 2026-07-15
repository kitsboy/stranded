import { readFileSync } from 'fs'
import { join } from 'path'
import ChangelogView from './ChangelogView'

export default function ChangelogPage() {
  let content = '# Changelog\n\nSee git history for full details.'
  try {
    content = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf8')
  } catch { /* static build may not have file */ }

  return <ChangelogView initialContent={content} />
}