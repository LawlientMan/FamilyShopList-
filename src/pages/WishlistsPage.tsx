import { useState } from 'react'
import { Gift, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAlias } from '../alias/alias-context'
import { useAuthUser } from '../auth/auth-context'
import { createWishlist, deleteWishlist, renameWishlist } from '../lib/wishlists'
import {
  BottomSheet,
  Button,
  ConfirmDialog,
  EmptyState,
  Fab,
  FullSpinner,
} from '../components/ui'
import {
  useWishlists,
  WishlistCard,
  WishlistEditorSheet,
} from '../features/wishlists'
import type { WishlistAppearance } from '../features/wishlists'
import type { Wishlist } from '../types'

// Screen 3 — Wishlists overview (FR-12/12.1). Shows the wishlists for the active
// alias with a live item count, a "New wishlist" action, and rename/delete per
// wishlist. Tapping a wishlist navigates to /wishlists/:wishlistId (its items).
export default function WishlistsPage() {
  const { activeAliasId, setSwitcherOpen } = useAlias()
  const { user } = useAuthUser()
  const { data: wishlists, loading } = useWishlists(activeAliasId)

  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<Wishlist | null>(null)
  const [actionsFor, setActionsFor] = useState<Wishlist | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Wishlist | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (!activeAliasId || !user) {
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="mb-3 text-xl font-bold text-ink-900">Wishlists</h1>
        <EmptyState
          icon={<Gift className="h-6 w-6" />}
          title="No space selected"
          description="Create or join a space to start adding wishlists."
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
      </div>
    )
  }

  async function handleCreate(name: string, appearance: WishlistAppearance) {
    await createWishlist(activeAliasId!, user!, name, appearance)
  }

  async function handleRename(name: string, appearance: WishlistAppearance) {
    if (!renaming) return
    await renameWishlist(activeAliasId!, renaming.id, name, appearance)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteWishlist(activeAliasId!, deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Wishlists</h1>
      </div>

      {loading ? (
        <FullSpinner />
      ) : wishlists.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-6 w-6" />}
          title="No wishlists yet"
          description="Create wishlists like Birthday or Christmas and add items with links, images, and priorities."
          className="flex-1"
          action={
            <Button
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={() => setCreating(true)}
            >
              New wishlist
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {wishlists.map((wishlist) => (
            <li key={wishlist.id}>
              <WishlistCard
                aliasId={activeAliasId}
                wishlist={wishlist}
                onActions={setActionsFor}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Create */}
      <WishlistEditorSheet
        open={creating}
        mode="create"
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />

      {/* Rename */}
      <WishlistEditorSheet
        open={renaming !== null}
        mode="rename"
        initialName={renaming?.name}
        initialIcon={renaming?.icon}
        initialColor={renaming?.color}
        onClose={() => setRenaming(null)}
        onSubmit={handleRename}
      />

      {/* Per-wishlist actions (FR-12.1) */}
      <BottomSheet
        open={actionsFor !== null}
        onClose={() => setActionsFor(null)}
        title={actionsFor?.name}
      >
        <div className="space-y-2">
          <Button
            fullWidth
            variant="secondary"
            leftIcon={<Pencil className="h-5 w-5" />}
            onClick={() => {
              setRenaming(actionsFor)
              setActionsFor(null)
            }}
          >
            Edit
          </Button>
          <Button
            fullWidth
            variant="danger"
            leftIcon={<Trash2 className="h-5 w-5" />}
            onClick={() => {
              setDeleteTarget(actionsFor)
              setActionsFor(null)
            }}
          >
            Delete
          </Button>
        </div>
      </BottomSheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete wishlist?"
        message={`"${
          deleteTarget?.name ?? 'This wishlist'
        }" and all of its items will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* FR-17: New wishlist via a floating "+" (replaces inline header button). */}
      <Fab label="New wishlist" onClick={() => setCreating(true)} />
    </div>
  )
}
