import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'ghost' | 'solid' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required for accessibility — describes the action. */
  label: string
  icon: ReactNode
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center rounded-full transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  ghost: 'text-ink-600 hover:bg-ink-100 active:bg-ink-200',
  subtle: 'bg-ink-100 text-ink-700 hover:bg-ink-200',
  solid: 'bg-primary-600 text-white hover:bg-primary-700',
}

// sm is 40px so per-item actions still clear the ~44px touch-target guidance
// on Pixel 7 / iPhone 11 (NFR-4); the icon glyph stays small via its own class.
const sizes: Record<Size, string> = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
    </button>
  )
}

export default IconButton
