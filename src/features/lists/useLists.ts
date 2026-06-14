// Real-time subscription to the named lists of an alias (FR-10.1).
// Lists live at aliases/{aliasId}/lists, ordered newest-first by createdAt.

import { useMemo } from 'react'
import { orderBy, query } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection'
import { paths } from '../../lib/db'
import type { ShoppingList } from '../../types'

// Pass an aliasId, or null to pause (no active alias yet).
export function useLists(aliasId: string | null) {
  const q = useMemo(
    () =>
      aliasId
        ? query(paths.lists(aliasId), orderBy('createdAt', 'desc'))
        : null,
    [aliasId],
  )
  return useCollection<ShoppingList>(q)
}

export default useLists
