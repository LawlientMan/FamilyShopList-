import { useMemo, useState } from 'react'
import { ChevronDown, Gift, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useAlias } from '../alias/alias-context'
import { useAuthUser } from '../auth/auth-context'
import {
  createWishlist,
  deleteWishlist,
  deleteWishlistForever,
  renameWishlist,
  restoreWishlist,
} from '../lib/wishlists'
import {
  BottomSheet,
  Button,
  ConfirmDialog,
  EmptyState,
  Fab,
  FullSpinner,
  IconButton,
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

  // Split active vs. soft-deleted (FR-18). Absent deletedAt = active (pre-v1.4).
  const activeWishlists = useMemo(
    () => wishlists.filter((w) => w.deletedAt == null),
    [wishlists],
  )
  const deletedWishlists = useMemo(
    () => wishlists.filter((w) => w.deletedAt != null),
    [wishlists],
  )

  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<Wishlist | null>(null)
  const [actionsFor, setActionsFor] = useState<Wishlist | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Wishlist | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Trash (FR-18): collapsible "Deleted" section + permanent delete (no name
  // typing — a plain ConfirmDialog, per FR-18 for wishlists).
  const [trashOpen, setTrashOpen] = useState(false)
  const [foreverTarget, setForeverTarget] = useState<Wishlist | null>(null)
  const [deletingForever, setDeletingForever] = useState(false)

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
      // Soft-delete (FR-18): moves to the "Deleted" section, restorable.
      await deleteWishlist(activeAliasId!, deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestore(wishlist: Wishlist) {
    await restoreWishlist(activeAliasId!, wishlist.id)
  }

  async function handleDeleteForever() {
    if (!foreverTarget) return
    setDeletingForever(true)
    try {
      await deleteWishlistForever(activeAliasId!, foreverTarget.id)
      setForeverTarget(null)
    } finally {
      setDeletingForever(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Wishlists</h1>
      </div>

      {loading ? (
        <FullSpinner />
      ) : activeWishlists.length === 0 && deletedWishlists.length === 0 ? (
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
        <>
          {activeWishlists.length === 0 ? (
            <EmptyState
              icon={<Gift className="h-6 w-6" />}
              title="No wishlists yet"
              description="Create a wishlist, or restore one from Deleted below."
            />
          ) : (
            <ul className="space-y-2">
              {activeWishlists.map((wishlist) => (
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

          {/* Trash (FR-18): collapsible "Deleted" — restore or delete forever.
              Hidden entirely when nothing is soft-deleted. */}
          {deletedWishlists.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setTrashOpen((v) => !v)}
                className="flex w-full items-center gap-1.5 py-2 text-sm font-semibold text-ink-500"
              >
                <ChevronDown
                  className={
                    'h-4 w-4 transition-transform ' +
                    (trashOpen ? '' : '-rotate-90')
                  }
                />
                Deleted ({deletedWishlists.length})
              </button>
              {trashOpen && (
                <ul className="mt-1 space-y-1">
                  {deletedWishlists.map((wishlist) => (
                    <li
                      key={wishlist.id}
                      className="flex items-center gap-0.5 rounded-card border border-ink-100 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-base text-ink-500">
                        {wishlist.name}
                      </span>
                      <IconButton
                        label={`Restore ${wishlist.name}`}
                        size="sm"
                        icon={<RotateCcw className="h-4 w-4" />}
                        onClick={() => void handleRestore(wishlist)}
                        className="text-ink-500"
                      />
                      <IconButton
                        label={`Delete ${wishlist.name} forever`}
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => setForeverTarget(wishlist)}
                        className="text-red-500"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
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

      {/* Delete confirmation — soft-delete to trash (FR-18) */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete wishlist?"
        message={`"${
          deleteTarget?.name ?? 'This wishlist'
        }" will move to Deleted. You can restore it later, or delete it forever from there.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Permanent delete — plain confirm, NO name typing (FR-18 for wishlists) */}
      <ConfirmDialog
        open={foreverTarget !== null}
        title="Delete forever?"
        message={`"${
          foreverTarget?.name ?? 'This wishlist'
        }" and all of its items will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete forever"
        destructive
        loading={deletingForever}
        onConfirm={() => void handleDeleteForever()}
        onCancel={() => setForeverTarget(null)}
      />

      {/* FR-17: New wishlist via a floating "+" (replaces inline header button). */}
      <Fab label="New wishlist" onClick={() => setCreating(true)} />
    </div>
  )
}
