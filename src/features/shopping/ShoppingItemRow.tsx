// A single shopping-item row, shared by the Quick list and named Lists.
//
// FR-B5: checking moves the item to the Bought section (sets boughtAt).
// FR-B6: unchecking a bought item restores it to the active list.
// FR-B9: shows the author's avatar (snapshot taken at add time).

import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import { Avatar, IconButton } from '../../components/ui'
import { cn } from '../../lib/cn'
import { deleteItem, setItemDone } from '../../lib/items'
import type { ShoppingItem } from '../../types'

export interface ShoppingItemRowProps {
  itemsRef: CollectionReference<DocumentData>
  item: ShoppingItem
}

function quantityLabel(item: ShoppingItem): string | null {
  const parts: string[] = []
  if (item.qty != null) parts.push(String(item.qty))
  if (item.unit) parts.push(item.unit)
  return parts.length ? parts.join(' ') : null
}

export function ShoppingItemRow({ itemsRef, item }: ShoppingItemRowProps) {
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (busy) return
    setBusy(true)
    try {
      await setItemDone(itemsRef, item.id, !item.done)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy) return
    setBusy(true)
    try {
      await deleteItem(itemsRef, item.id)
    } finally {
      // Component unmounts on delete; guard anyway.
      setBusy(false)
    }
  }

  const qty = quantityLabel(item)

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border border-ink-200 bg-white px-3 py-2.5 shadow-card',
        busy && 'opacity-60',
      )}
    >
      {/* Bought checkbox (FR-B5/B6) */}
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={item.done}
        aria-label={item.done ? 'Mark as not bought' : 'Mark as bought'}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          item.done
            ? 'border-primary-600 bg-primary-600 text-white'
            : 'border-ink-300 bg-white text-transparent hover:border-primary-500',
        )}
      >
        <Check className="h-4 w-4" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            item.done ? 'text-ink-400 line-through' : 'text-ink-900',
          )}
        >
          {item.name}
        </p>
        {qty && (
          <p className="text-xs text-ink-500">{qty}</p>
        )}
      </div>

      {/* Author avatar (FR-B9) */}
      <Avatar name={item.authorName} photoURL={item.authorPhoto} size="xs" />

      <IconButton
        label="Delete item"
        size="sm"
        icon={<Trash2 className="h-4 w-4" />}
        onClick={() => void remove()}
        disabled={busy}
      />
    </div>
  )
}

export default ShoppingItemRow
