// Full shopping-items experience for one collection — the reusable building
// block for Screen 1 (Quick list, FR-9) and Screen 2 item views (FR-10.3).
// Drop it in with a collection ref from `paths` and the active alias id.
//
// Composes: add form (FR-B1..B4) + live active list (FR-B7) + collapsible
// Bought section (FR-B5/B8) + empty state + real-time Firestore subscription.

import { ShoppingBasket } from 'lucide-react'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { EmptyState, FullSpinner } from '../../components/ui'
import { AddItemForm } from './AddItemForm'
import { BoughtSection } from './BoughtSection'
import { ShoppingItemRow } from './ShoppingItemRow'
import { useShoppingItems } from './useShoppingItems'

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

  if (loading) return <FullSpinner />

  const isEmpty = active.length === 0 && bought.length === 0

  return (
    <div className="flex flex-1 flex-col">
      <AddItemForm itemsRef={itemsRef} aliasId={aliasId} user={user} />

      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBasket className="h-6 w-6" />}
          title={emptyTitle}
          description={emptyDescription}
          className="flex-1"
        />
      ) : (
        <div className="mt-4 space-y-2">
          {active.map((item) => (
            <ShoppingItemRow key={item.id} itemsRef={itemsRef} item={item} />
          ))}
          <BoughtSection itemsRef={itemsRef} items={bought} />
        </div>
      )}
    </div>
  )
}

export default ShoppingItemsView
