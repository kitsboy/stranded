import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
}

type BaseProps = {
  variant?: Variant
  children: ReactNode
  className?: string
}

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never
  }

type LinkButtonProps = BaseProps & {
  href: string
}

function cn(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', children, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(variantClass[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
})

export function ButtonLink({ variant = 'primary', children, className, href }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(variantClass[variant], className)}>
      {children}
    </Link>
  )
}