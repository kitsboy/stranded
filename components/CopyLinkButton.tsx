'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { toast } from 'sonner'

type CopyLinkButtonProps = {
  url: string
  label?: string
  className?: string
  successMessage?: string
  size?: 'sm' | 'md'
}

export default function CopyLinkButton({
  url,
  label = 'Copy link',
  className = '',
  successMessage = 'Link copied',
  size = 'sm',
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(successMessage, { description: url.length > 60 ? url.slice(0, 60) + '…' : url })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.info(url)
    }
  }

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5'

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1 rounded-lg border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10 transition ${sizeClass} ${className}`}
      aria-label={label}
    >
      {copied ? <Check size={12} /> : <Link2 size={12} />}
      {label}
    </button>
  )
}