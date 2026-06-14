// Real-time subscriptions for a shopping-item collection (Quick list FR-9 and
// named Lists FR-10.3 reuse this verbatim — identical document shape).
//
// Active items (FR-B7): where done==false, ordered by updatedAt desc (newest top).
// Bought items (FR-B8): where done==true, ordered by boughtAt desc.
// Equality + orderBy on a different field needs composite indexes — see the
// quickItems / items entries in firestore.indexes.json.

import { useMemo } from 'react'
import { orderBy, query, where } from 'firebase/firestore'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection'
import type { ShoppingItem } from '../../types'

export interface ShoppingItemsState {
  active: ShoppingItem[]
  bought: ShoppingItem[]
  loading: boolean
  error: Error | undefined
}

// Pass a collection ref from `paths` (paths.quickItems(aliasId) or
// paths.listItems(aliasId, listId)), or `null` to pause (no active alias yet).
export function useShoppingItems(
  itemsRef: CollectionReference<DocumentData> | null,
): ShoppingItemsState {
  const activeQuery = useMemo(
    () =>
      itemsRef
        ? query(
            itemsRef,
            where('done', '==', false),
            orderBy('updatedAt', 'desc'),
          )
        : null,
    [itemsRef],
  )

  const boughtQuery = useMemo(
    () =>
      itemsRef
        ? query(
            itemsRef,
            where('done', '==', true),
            orderBy('boughtAt', 'desc'),
          )
        : null,
    [itemsRef],
  )

  const active = useCollection<ShoppingItem>(activeQuery)
  const bought = useCollection<ShoppingItem>(boughtQuery)

  return {
    active: active.data,
    bought: bought.data,
    loading: active.loading || bought.loading,
    error: active.error ?? bought.error,
  }
}

export default useShoppingItems
