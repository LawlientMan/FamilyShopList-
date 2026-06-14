import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'primary' | 'high' | 'med' | 'low' | 'danger'

export interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-600',
  primary: 'bg-primary-100 text-primary-700',
  high: 'bg-red-100 text-red-700',
  med: 'bg-amber-100 text-amber-700',
  low: 'bg-ink-100 text-ink-600',
  danger: 'bg-red-100 text-red-700',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export default Badge
