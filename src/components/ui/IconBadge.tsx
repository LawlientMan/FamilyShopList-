// Tinted icon badge shown next to list/wishlist names (FR-16). Renders the
// chosen icon in the chosen color over a faint same-hue background. Guards
// undefined icon/color (pre-v1.3 docs) with sensible defaults.

import { createElement } from 'react'
import { getIcon, DEFAULT_COLOR } from './iconSet'
import { cn } from '../../lib/cn'

export interface IconBadgeProps {
  icon?: string | null
  color?: string | null
  /** Tailwind size classes for the badge box (default h-10 w-10). */
  className?: string
  /** Tailwind size classes for the glyph (default h-5 w-5). */
  iconClassName?: string
}

export function IconBadge({
  icon,
  color,
  className,
  iconClassName,
}: IconBadgeProps) {
  const tint = color || DEFAULT_COLOR
  // Resolve + instantiate the lucide icon via createElement so we don't bind a
  // capitalized component to a local during render (react-hooks/static-components).
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        className,
      )}
      // Faint same-hue background; the glyph itself uses the full color.
      style={{ backgroundColor: `${tint}1a`, color: tint }}
    >
      {createElement(getIcon(icon), {
        className: cn('h-5 w-5', iconClassName),
      })}
    </span>
  )
}

export default IconBadge
