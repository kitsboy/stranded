'use client'

import { buildCaseStudyMarkdown, buildCaseStudyHtml, type CaseStudySite } from '@/lib/case-study'
import { downloadBlob } from '@/lib/export-formats'
import { toast } from 'sonner'

export default function CaseStudyExport({ site, liveBtc = 85_000 }: { site: CaseStudySite; liveBtc?: number }) {
  const md = () => {
    downloadBlob(buildCaseStudyMarkdown(site, liveBtc), `case-study-${site.id}.md`, 'text/markdown')
    toast.success('Case study downloaded')
  }
  const html = () => {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(buildCaseStudyHtml(site, liveBtc))
      w.document.close()
    }
  }

  return (
    <div className="flex gap-2" data-testid="case-study-export">
      <button type="button" onClick={md} className="flex-1 rounded-lg border border-white/15 py-1.5 text-[11px] hover:bg-white/5">
        Case study .md
      </button>
      <button type="button" onClick={html} className="flex-1 rounded-lg border border-[#5BC0BE]/30 py-1.5 text-[11px] text-[#5BC0BE] hover:bg-[#5BC0BE]/10">
        Case study HTML
      </button>
    </div>
  )
}
