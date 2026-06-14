import { useState } from 'react'
import { cn } from '../../lib/cn'

type Size = 'xs' | 'sm' | 'md' | 'lg'

export interface AvatarProps {
  name?: string | null
  photoURL?: string | null
  size?: Size
  className?: string
}

const sizes: Record<Size, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

// Shows the user photo when available, otherwise their initials. Used to
// render item authorship (FR-B9).
export function Avatar({ name, photoURL, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const showImg = photoURL && !failed

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-700',
        sizes[size],
        className,
      )}
      aria-label={name ?? 'User'}
      title={name ?? undefined}
    >
      {showImg ? (
        <img
          src={photoURL}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export default Avatar
