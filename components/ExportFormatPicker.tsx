'use client'

export type ExportFormat = 'csv' | 'json' | 'md' | 'html' | 'tsv'

const FORMATS: { id: ExportFormat; label: string; hint?: string }[] = [
  { id: 'csv', label: 'CSV' },
  { id: 'json', label: 'JSON' },
  { id: 'md', label: 'Markdown' },
  { id: 'html', label: 'HTML / PDF' },
  { id: 'tsv', label: 'TSV' },
]

type ExportFormatPickerProps = {
  value?: ExportFormat
  onChange?: (fmt: ExportFormat) => void
  onSelect?: (fmt: ExportFormat) => void
  formats?: ExportFormat[]
  className?: string
  size?: 'sm' | 'md'
}

export default function ExportFormatPicker({
  value,
  onChange,
  onSelect,
  formats = ['csv', 'json', 'md', 'html'],
  className = '',
  size = 'sm',
}: ExportFormatPickerProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5'
  const list = FORMATS.filter(f => formats.includes(f.id))

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="group" aria-label="Export format">
      {list.map(fmt => {
        const active = value === fmt.id
        return (
          <button
            key={fmt.id}
            type="button"
            onClick={() => {
              onChange?.(fmt.id)
              onSelect?.(fmt.id)
            }}
            className={`rounded border transition ${sizeClass} ${
              active
                ? 'border-[#FF8C00] bg-[#FF8C00]/15 text-[#FF8C00]'
                : 'border-white/15 hover:border-[#FF8C00]/40 text-gray-300'
            }`}
            aria-pressed={active}
          >
            {fmt.label}
          </button>
        )
      })}
    </div>
  )
}