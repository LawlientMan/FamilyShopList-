import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon?: ReactNode
}

// Floating action button (FR-14): round "+" fixed bottom-right, sitting ABOVE
// the bottom navigation and clear of the iOS home indicator. It is constrained
// to the app's max-w-md column (same as the nav) and pinned to that column's
// right edge so it never drifts off-center on wide screens.
export function Fab({ label, icon, className, ...props }: FabProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md">
      <button
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          'pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 transition-colors hover:bg-primary-700 active:bg-primary-800',
          'right-[max(1rem,env(safe-area-inset-right))]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          className,
        )}
        {...props}
      >
        {icon ?? <Plus className="h-7 w-7" aria-hidden />}
      </button>
    </div>
  )
}

export default Fab
