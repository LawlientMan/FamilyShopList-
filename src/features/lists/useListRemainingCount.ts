// Live count of items still to buy in a named list (FR-10.1 "items remaining").
// Subscribes to the list's active items (done==false) and returns the count.
// Uses the same single-field-with-orderBy query as the items view, so it shares
// Firestore's automatic index — no extra index needed.

import { useMemo } from 'react'
import { orderBy, query, where } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection'
import { paths } from '../../lib/db'
import type { ShoppingItem } from '../../types'

export function useListRemainingCount(
  aliasId: string | null,
  listId: string | null,
): number {
  const q = useMemo(
    () =>
      aliasId && listId
        ? query(
            paths.listItems(aliasId, listId),
            where('done', '==', false),
            orderBy('updatedAt', 'desc'),
          )
        : null,
    [aliasId, listId],
  )
  const { data } = useCollection<ShoppingItem>(q)
  return data.length
}

export default useListRemainingCount
