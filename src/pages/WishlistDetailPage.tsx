import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Gift, Plus } from 'lucide-react'
import { useAlias } from '../alias/alias-context'
import { useAuthUser } from '../auth/auth-context'
import { paths } from '../lib/db'
import { addWishlistItem, updateWishlistItem } from '../lib/wishlists'
import type { WishlistItemInput } from '../lib/wishlists'
import {
  Button,
  EmptyState,
  FullSpinner,
  IconButton,
} from '../components/ui'
import {
  useWishlists,
  useWishlistItems,
  WishlistItemEditorSheet,
  WishlistItemRow,
} from '../features/wishlists'
import type { WishlistItem } from '../types'

// Screen 3 detail — items inside one wishlist (FR-12). Items are sorted by
// priority then name (FR-12.6). Provides a back button to the overview.
export default function WishlistDetailPage() {
  const { wishlistId } = useParams<{ wishlistId: string }>()
  const { activeAliasId, setSwitcherOpen } = useAlias()
  const { user } = useAuthUser()
  const navigate = useNavigate()

  // The wishlist's name (for the header) comes from the subscribed overview.
  const { data: wishlists } = useWishlists(activeAliasId)
  const wishlist = wishlists.find((w) => w.id === wishlistId)

  const { items, loading } = useWishlistItems(activeAliasId, wishlistId ?? null)

  const itemsRef = useMemo(
    () =>
      activeAliasId && wishlistId
        ? paths.wishlistItems(activeAliasId, wishlistId)
        : null,
    [activeAliasId, wishlistId],
  )

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<WishlistItem | null>(null)

  async function handleAdd(input: WishlistItemInput) {
    if (!itemsRef || !user) return
    await addWishlistItem(itemsRef, user, input)
  }

  async function handleEdit(input: WishlistItemInput) {
    if (!itemsRef || !editing) return
    await updateWishlistItem(itemsRef, editing.id, input)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center gap-1">
        <IconButton
          label="Back to wishlists"
          variant="ghost"
          icon={<ChevronLeft className="h-6 w-6" />}
          onClick={() => navigate('/wishlists')}
        />
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-ink-900">
          {wishlist?.name ?? 'Wishlist'}
        </h1>
        {activeAliasId && user && items.length > 0 && (
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAdding(true)}
          >
            Add item
          </Button>
        )}
      </div>

      {!activeAliasId || !user || !itemsRef ? (
        <EmptyState
          icon={<Gift className="h-6 w-6" />}
          title="No space selected"
          description="Create or join a space to start adding items."
          className="flex-1"
          action={
            <Button
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={() => setSwitcherOpen(true)}
            >
              Create a space
            </Button>
          }
        />
      ) : loading ? (
        <FullSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-6 w-6" />}
          title="No items yet"
          description="Add things you'd love — with links, an image, and a priority."
          className="flex-1"
          action={
            <Button
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={() => setAdding(true)}
            >
              Add item
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <WishlistItemRow
                itemsRef={itemsRef}
                item={item}
                onEdit={setEditing}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Add */}
      <WishlistItemEditorSheet
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={handleAdd}
      />

      {/* Edit */}
      <WishlistItemEditorSheet
        open={editing !== null}
        item={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
    </div>
  )
}
