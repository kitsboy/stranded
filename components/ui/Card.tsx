import { type HTMLAttributes, type ReactNode } from 'react'

type Variant = 'glass' | 'glass-strong'

const variantClass: Record<Variant, string> = {
  glass: 'glass',
  'glass-strong': 'glass-strong',
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant
  children: ReactNode
  lift?: boolean
}

export default function Card({
  variant = 'glass',
  lift = false,
  children,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`${variantClass[variant]} rounded-2xl ${lift ? 'glass-card-lift' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}