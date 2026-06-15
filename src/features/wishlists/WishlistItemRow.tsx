// One wishlist item row (FR-12). Shows a priority badge, the name, an optional
// thumbnail (FR-12.4), an optional description (FR-12.8), link chips for each
// URL, and the author avatar (FR-B9). Tapping edit opens the editor; the
// trailing button deletes.

import { useState } from 'react'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import { Avatar, Badge, IconButton, ItemImage } from '../../components/ui'
import { deleteWishlistItem } from '../../lib/wishlists'
import type { Priority, WishlistItem } from '../../types'

export interface WishlistItemRowProps {
  itemsRef: CollectionReference<DocumentData>
  item: WishlistItem
  onEdit: (item: WishlistItem) => void
}

const PRIORITY_TONE: Record<Priority, 'high' | 'med' | 'low'> = {
  high: 'high',
  med: 'med',
  low: 'low',
}
const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High',
  med: 'Medium',
  low: 'Low',
}

// A readable host label for a URL chip (falls back to the raw string).
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function WishlistItemRow({
  itemsRef,
  item,
  onEdit,
}: WishlistItemRowProps) {
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (busy) return
    setBusy(true)
    try {
      await deleteWishlistItem(itemsRef, item.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-card border border-ink-200 bg-white p-3 shadow-card">
      <div className="flex gap-3">
        {/* FR-12.4: thumbnail with object-contain + "no image" fallback. */}
        <ItemImage
          src={item.imageUrl}
          alt={item.name}
          className="aspect-square h-16 w-16 shrink-0"
          iconClassName="h-5 w-5"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">
                {item.name}
              </p>
              {/* FR-12.8: description shown when present (clamped to 2 lines). */}
              {item.description && (
                <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs text-ink-500">
                  {item.description}
                </p>
              )}
            </div>
            <Badge tone={PRIORITY_TONE[item.priority]}>
              {PRIORITY_LABEL[item.priority]}
            </Badge>
          </div>

          {/* FR-12.3: link chips */}
          {item.urls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700 hover:bg-ink-200"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{hostLabel(url)}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <Avatar name={item.authorName} photoURL={item.authorPhoto} size="xs" />
        <div className="flex items-center gap-1">
          <IconButton
            label="Edit item"
            size="sm"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => onEdit(item)}
            disabled={busy}
          />
          <IconButton
            label="Delete item"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => void remove()}
            disabled={busy}
          />
        </div>
      </div>
    </div>
  )
}

export default WishlistItemRow
