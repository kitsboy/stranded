type SectionDividerProps = {
  label?: string
  className?: string
}

export default function SectionDivider({ label, className = '' }: SectionDividerProps) {
  if (label) {
    return (
      <div className={`section-divider section-divider--labeled ${className}`.trim()} role="separator">
        <span className="section-divider__line" aria-hidden />
        <span className="section-divider__label">{label}</span>
        <span className="section-divider__line" aria-hidden />
      </div>
    )
  }

  return <hr className={`section-divider ${className}`.trim()} role="separator" />
}