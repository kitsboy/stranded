'use client'

import { integrationUrl } from '@/lib/integrations'

type Props = { siteId?: string }

/** Placeholder ad slot for Tadbuy ASIC marketplace — upgrade 192 */
export default function TadbuyAdHook({ siteId }: Props) {
  return (
    <div className="mb-3 rounded-xl border border-dashed border-[#FF8C00]/35 bg-[#FF8C00]/5 p-3 text-xs">
      <div className="text-[10px] uppercase tracking-wider text-[#FF8C00] mb-1">Sponsored placement · Tadbuy</div>
      <p className="text-gray-400 leading-snug mb-2">
        Need ASICs for this site cluster? Browse certified miners sized to your generator output.
      </p>
      <a
        href={integrationUrl('tadbuy', siteId)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[#FF8C00] font-medium hover:underline"
      >
        Shop miners at tadbuy.giveabit.io →
      </a>
    </div>
  )
}