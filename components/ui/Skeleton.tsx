type SkeletonProps = {
  className?: string
  variant?: 'text' | 'block' | 'circle'
}

const variantClass: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'skeleton skeleton-text h-4 w-full',
  block: 'skeleton skeleton-block',
  circle: 'skeleton skeleton-circle',
}

export default function Skeleton({ className = '', variant = 'block' }: SkeletonProps) {
  return (
    <div
      className={`${variantClass[variant]} ${className}`.trim()}
      aria-hidden
    />
  )
}