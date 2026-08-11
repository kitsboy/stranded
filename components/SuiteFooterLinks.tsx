'use client'

const LINKS = [
  { href: 'https://giveabit.io', label: 'Give A Bit' },
  { href: 'https://satohash.io', label: 'Satohash' },
  { href: 'https://hq.giveabit.io', label: 'HQ' },
  { href: 'https://api.satohash.io/health', label: 'Proof API' },
]

export default function SuiteFooterLinks({ className = '' }: { className?: string }) {
  return (
    <div className={className} data-testid="suite-footer-links">
      <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">GiveAbit suite</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {LINKS.map(l => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-400 hover:text-[#5BC0BE] transition"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </div>
  )
}
