// Real-time subscription to the wishlists of an alias (FR-12). Wishlists live at
// aliases/{aliasId}/wishlists, ordered newest-first by createdAt.

import { useMemo } from 'react'
import { orderBy, query } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection'
import { paths } from '../../lib/db'
import type { Wishlist } from '../../types'

// Pass an aliasId, or null to pause (no active alias yet).
export function useWishlists(aliasId: string | null) {
  const q = useMemo(
    () =>
      aliasId
        ? query(paths.wishlists(aliasId), orderBy('createdAt', 'desc'))
        : null,
    [aliasId],
  )
  return useCollection<Wishlist>(q)
}

export default useWishlists
