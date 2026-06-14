// Live count of items in a wishlist, for the overview cards (FR-12). Subscribes
// to the wishlist's items subcollection and returns the count.

import { useMemo } from 'react'
import { query } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection'
import { paths } from '../../lib/db'
import type { WishlistItem } from '../../types'

export function useWishlistItemCount(
  aliasId: string | null,
  wishlistId: string | null,
): number {
  const q = useMemo(
    () =>
      aliasId && wishlistId
        ? query(paths.wishlistItems(aliasId, wishlistId))
        : null,
    [aliasId, wishlistId],
  )
  const { data } = useCollection<WishlistItem>(q)
  return data.length
}

export default useWishlistItemCount
