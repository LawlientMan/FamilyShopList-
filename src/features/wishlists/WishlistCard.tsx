// One row in the wishlists overview (FR-12). Tapping the card opens the
// wishlist's items; the trailing button opens rename/delete actions (FR-12.1).
// The item count is live.

import { useNavigate } from 'react-router-dom'
import { ChevronRight, Gift, MoreVertical } from 'lucide-react'
import { IconButton } from '../../components/ui'
import { useWishlistItemCount } from './useWishlistItemCount'
import type { Wishlist } from '../../types'

export interface WishlistCardProps {
  aliasId: string
  wishlist: Wishlist
  onActions: (wishlist: Wishlist) => void
}

export function WishlistCard({
  aliasId,
  wishlist,
  onActions,
}: WishlistCardProps) {
  const navigate = useNavigate()
  const count = useWishlistItemCount(aliasId, wishlist.id)

  return (
    <div className="flex items-center rounded-card bg-white shadow-card">
      <button
        type="button"
        onClick={() => navigate(`/wishlists/${wishlist.id}`)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-card px-4 py-3 text-left hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <Gift className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink-900">
            {wishlist.name}
          </span>
          <span className="block text-sm text-ink-500">
            {count === 0
              ? 'No items yet'
              : `${count} item${count === 1 ? '' : 's'}`}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-300" aria-hidden />
      </button>
      <div className="pr-2">
        <IconButton
          label={`Actions for ${wishlist.name}`}
          variant="ghost"
          icon={<MoreVertical className="h-5 w-5" />}
          onClick={() => onActions(wishlist)}
        />
      </div>
    </div>
  )
}

export default WishlistCard
