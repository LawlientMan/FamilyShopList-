// Full shopping-items experience for one collection — the reusable building
// block for Screen 1 (Quick list, FR-9) and Screen 2 item views (FR-10.3).
// Drop it in with a collection ref from `paths` and the active alias id.
//
// Composes: a floating "+" button (FR-14) that opens the slide-in Add-item
// screen (FR-B1), the live active list (FR-B7), a collapsible Bought section
// (FR-B5/B8), per-item edit/delete (FR-13), empty state, and a real-time
// Firestore subscription.

import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { EmptyState, Fab, FullSpinner } from '../../components/ui'
import { AddItemScreen } from './AddItemScreen'
import { BoughtSection } from './BoughtSection'
import { ShoppingItemRow } from './ShoppingItemRow'
import { useShoppingItems } from './useShoppingItems'
import type { ShoppingItem } from '../../types'

export interface ShoppingItemsViewProps {
  itemsRef: CollectionReference<DocumentData>
  aliasId: string
  user: FirebaseUser
  /** Shown when there are no items at all. */
  emptyTitle?: string
  emptyDescription?: string
}

export function ShoppingItemsView({
  itemsRef,
  aliasId,
  user,
  emptyTitle = 'Nothing here yet',
  emptyDescription = "Add the things you need. They'll show up here for everyone in your space.",
}: ShoppingItemsViewProps) {
  const { active, bought, loading } = useShoppingItems(itemsRef)

  // Add-item screen state. `editItem` set => the screen opens in edit mode.
  const [screenOpen, setScreenOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ShoppingItem | null>(null)

  const openAdd = () => {
    setEditTarget(null)
    setScreenOpen(true)
  }
  const openEdit = (item: ShoppingItem) => {
    setEditTarget(item)
    setScreenOpen(true)
  }
  const close = () => setScreenOpen(false)

  if (loading) return <FullSpinner />

  const isEmpty = active.length === 0 && bought.length === 0

  return (
    <div className="flex flex-1 flex-col">
      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBasket className="h-6 w-6" />}
          title={emptyTitle}
          description={emptyDescription}
          className="flex-1"
        />
      ) : (
        <div className="space-y-2">
          {active.map((item) => (
            <ShoppingItemRow
              key={item.id}
              itemsRef={itemsRef}
              item={item}
              onEdit={openEdit}
            />
          ))}
          <BoughtSection
            itemsRef={itemsRef}
            items={bought}
            onEdit={openEdit}
          />
        </div>
      )}

      {/* FR-14: floating "+" opens the slide-in add screen. */}
      <Fab label="Add item" onClick={openAdd} />

      <AddItemScreen
        open={screenOpen}
        onClose={close}
        itemsRef={itemsRef}
        aliasId={aliasId}
        user={user}
        editItem={editTarget}
      />
    </div>
  )
}

export default ShoppingItemsView
