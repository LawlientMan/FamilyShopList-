// Reusable image with a fixed aspect-ratio container (FR-12.4). The image is
// object-contain on a neutral background so it's never vertically cropped. When
// the URL is empty / blank / fails to load, a centered "no image" placeholder
// (lucide ImageOff) is shown instead.

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface ItemImageProps {
  src?: string | null
  alt?: string
  /** Container aspect / size classes (default aspect-[4/3] w-full). */
  className?: string
  /** Glyph size for the placeholder (default h-8 w-8). */
  iconClassName?: string
}

export function ItemImage({
  src,
  alt = '',
  className,
  iconClassName,
}: ItemImageProps) {
  const trimmed = src?.trim() || ''
  // Track WHICH src failed, not just a boolean, so changing the URL (e.g. the
  // user fixes a typo) automatically clears the error without an effect.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)

  const showPlaceholder = !trimmed || erroredSrc === trimmed

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-card bg-ink-100',
        // `cn` is a plain joiner (no tailwind-merge), so a caller's size classes
        // would otherwise CONFLICT with these defaults (e.g. w-16 vs w-full). Only
        // apply the default size when the caller doesn't pass its own.
        className ?? 'aspect-[4/3] w-full',
      )}
    >
      {showPlaceholder ? (
        <ImageOff
          className={cn('text-ink-300', iconClassName ?? 'h-8 w-8')}
          aria-label="No image"
        />
      ) : (
        <img
          src={trimmed}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setErroredSrc(trimmed)}
        />
      )}
    </div>
  )
}

export default ItemImage
