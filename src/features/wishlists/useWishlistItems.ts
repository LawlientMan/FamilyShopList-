// Real-time subscription to one wishlist's items (FR-12). Items are sorted
// client-side by priority (high -> med -> low) then name (FR-12.6), so no
// composite index is needed (DATA-MODEL.md).

import { useMemo } from 'react'
import { query } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection'
import { paths } from '../../lib/db'
import { sortWishlistItems } from '../../lib/wishlists'
import type { WishlistItem } from '../../types'

export function useWishlistItems(
  aliasId: string | null,
  wishlistId: string | null,
) {
  const q = useMemo(
    () =>
      aliasId && wishlistId
        ? query(paths.wishlistItems(aliasId, wishlistId))
        : null,
    [aliasId, wishlistId],
  )
  const { data, loading, error } = useCollection<WishlistItem>(q)
  const items = useMemo(() => sortWishlistItems(data), [data])
  return { items, loading, error }
}

export default useWishlistItems
