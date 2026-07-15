'use client'

import { useMemo, useState } from 'react'
import { X, Download } from 'lucide-react'
import FocusTrap from './FocusTrap'
import ExportFormatPicker, { type ExportFormat } from './ExportFormatPicker'
import type { EnrichedSite } from '@/lib/sites'
import {
  bankPackCsv,
  bankPackMarkdown,
  bankPackTsv,
  bankPackHtml,
  bankPackJson,
} from '@/lib/bank-pack'
import { downloadBlob } from '@/lib/export-formats'

type BankPackPreviewProps = {
  sites: EnrichedSite[]
  allSites?: EnrichedSite[]
  liveBtcUsd?: number
  title?: string
  open: boolean
  onClose: () => void
  onExported?: (format: ExportFormat) => void
}

export default function BankPackPreview({
  sites,
  allSites = [],
  liveBtcUsd = 85000,
  title = 'Bank Pack',
  open,
  onClose,
  onExported,
}: BankPackPreviewProps) {
  const [format, setFormat] = useState<ExportFormat>('md')

  const preview = useMemo(() => {
    if (!sites.length) return ''
    if (format === 'csv') return bankPackCsv(sites, { liveBtcUsd }).split('\n').slice(0, 8).join('\n')
    if (format === 'tsv') return bankPackTsv(sites, { liveBtcUsd }).split('\n').slice(0, 8).join('\n')
    if (format === 'json') return JSON.stringify(bankPackJson(sites, { liveBtcUsd }), null, 2).slice(0, 1200)
    if (format === 'html') return bankPackHtml(sites, { liveBtcUsd, title }).replace(/<[^>]+>/g, ' ').slice(0, 900)
    return bankPackMarkdown(sites, allSites, { liveBtcUsd, title }).slice(0, 1200)
  }, [sites, allSites, liveBtcUsd, title, format])

  const exportPack = () => {
    const base = `stranded-bank-pack-${sites.length}`
    if (format === 'md') downloadBlob(bankPackMarkdown(sites, allSites, { liveBtcUsd, title }), `${base}.md`, 'text/markdown')
    else if (format === 'csv') downloadBlob(bankPackCsv(sites, { liveBtcUsd }), `${base}.csv`, 'text/csv')
    else if (format === 'tsv') downloadBlob(bankPackTsv(sites, { liveBtcUsd }), `${base}.tsv`, 'text/tab-separated-values')
    else if (format === 'html') {
      const w = window.open('', '_blank')
      if (w) { w.document.write(bankPackHtml(sites, { liveBtcUsd, title })); w.document.close(); w.print() }
    } else downloadBlob(JSON.stringify(bankPackJson(sites, { liveBtcUsd }), null, 2), `${base}.json`, 'application/json')
    onExported?.(format)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[260] bg-black/70 flex items-center justify-center p-4" onClick={onClose} role="presentation">
      <FocusTrap active onEscape={onClose} className="w-full max-w-lg">
        <div
          className="glass-strong rounded-2xl border border-white/10 overflow-hidden"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bank-pack-preview-title"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h2 id="bank-pack-preview-title" className="font-semibold">{title}</h2>
              <p className="text-[10px] text-gray-400">{sites.length} site{sites.length !== 1 ? 's' : ''} · preview before export</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close preview"><X size={18} /></button>
          </div>
          <div className="px-5 py-3 border-b border-white/10">
            <ExportFormatPicker value={format} onChange={setFormat} formats={['csv', 'json', 'md', 'html', 'tsv']} />
          </div>
          <pre className="px-5 py-4 text-[10px] text-gray-300 max-h-56 overflow-auto whitespace-pre-wrap font-mono bg-black/30">
            {preview || 'No sites selected.'}
            {preview.length >= 900 && '\n…'}
          </pre>
          <div className="px-5 py-4 flex justify-end gap-2 border-t border-white/10">
            <button type="button" onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-gray-400">
              Cancel
            </button>
            <button
              type="button"
              onClick={exportPack}
              disabled={!sites.length}
              className="text-xs px-4 py-1.5 rounded-lg bg-[#FF8C00] text-black font-semibold inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Download size={14} /> Export {format.toUpperCase()}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  )
}