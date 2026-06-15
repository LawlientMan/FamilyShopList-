// Collapsible "Bought (n)" section, shared by the Quick list and named Lists.
//
// FR-B5: bought items live here, collapsed by default.
// FR-B8: items are already sorted by boughtAt desc by the query upstream.
// Includes a "Clear bought" action that deletes all bought items.

import { useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import { Button } from '../../components/ui'
import { cn } from '../../lib/cn'
import { deleteItem } from '../../lib/items'
import type { ShoppingItem } from '../../types'
import { ShoppingItemRow } from './ShoppingItemRow'

export interface BoughtSectionProps {
  itemsRef: CollectionReference<DocumentData>
  items: ShoppingItem[]
  /** Open the edit screen for a bought item (FR-13). */
  onEdit?: (item: ShoppingItem) => void
}

export function BoughtSection({ itemsRef, items, onEdit }: BoughtSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [clearing, setClearing] = useState(false)

  if (items.length === 0) return null

  async function clearAll() {
    if (clearing) return
    setClearing(true)
    try {
      await Promise.all(items.map((i) => deleteItem(itemsRef, i.id)))
    } finally {
      setClearing(false)
    }
  }

  return (
    <section className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-card px-1 py-2 text-left"
      >
        <span className="text-sm font-semibold text-ink-600">
          Bought ({items.length})
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-ink-400 transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="space-y-2">
          {items.map((item) => (
            <ShoppingItemRow
              key={item.id}
              itemsRef={itemsRef}
              item={item}
              onEdit={onEdit}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4" />}
            loading={clearing}
            onClick={() => void clearAll()}
            className="text-ink-500"
          >
            Clear bought
          </Button>
        </div>
      )}
    </section>
  )
}

export default BoughtSection
