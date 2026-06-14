import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

type Size = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  size?: Size
  className?: string
  label?: string
}

const sizes: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn('animate-spin text-primary-600', sizes[size], className)}
    />
  )
}

// Full-area centered spinner for loading states.
export function FullSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Spinner size="lg" label={label} />
    </div>
  )
}

export default Spinner
