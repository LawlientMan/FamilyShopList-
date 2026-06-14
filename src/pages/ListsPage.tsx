import { useState } from 'react'
import { ListTodo, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAlias } from '../alias/alias-context'
import { useAuthUser } from '../auth/auth-context'
import { createList, deleteList, renameList } from '../lib/db'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FullSpinner,
  BottomSheet,
} from '../components/ui'
import { ListCard, ListEditorSheet, useLists } from '../features/lists'
import type { ShoppingList } from '../types'

// Screen 2 — Named lists overview (FR-10.1/10.2). Shows the list of lists with
// live items-remaining counts, a "New list" action, and rename/delete per list.
// Tapping a list navigates to /lists/:listId (its items view).
export default function ListsPage() {
  const { activeAliasId } = useAlias()
  const { user } = useAuthUser()
  const { data: lists, loading } = useLists(activeAliasId)

  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<ShoppingList | null>(null)
  const [actionsFor, setActionsFor] = useState<ShoppingList | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShoppingList | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (!activeAliasId || !user) {
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="mb-3 text-xl font-bold text-ink-900">Lists</h1>
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="No space selected"
          description="Create or join a space from the switcher at the top to start adding lists."
          className="flex-1"
        />
      </div>
    )
  }

  async function handleCreate(name: string) {
    await createList(activeAliasId!, user!, name)
  }

  async function handleRename(name: string) {
    if (!renaming) return
    await renameList(activeAliasId!, renaming.id, name)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteList(activeAliasId!, deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Lists</h1>
        {lists.length > 0 && (
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreating(true)}
          >
            New list
          </Button>
        )}
      </div>

      {loading ? (
        <FullSpinner />
      ) : lists.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="No lists yet"
          description="Create named lists like New Year, Party, or the Cottage to keep things organized."
          className="flex-1"
          action={
            <Button
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={() => setCreating(true)}
            >
              New list
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {lists.map((list) => (
            <li key={list.id}>
              <ListCard
                aliasId={activeAliasId}
                list={list}
                onActions={setActionsFor}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Create */}
      <ListEditorSheet
        open={creating}
        mode="create"
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />

      {/* Rename */}
      <ListEditorSheet
        open={renaming !== null}
        mode="rename"
        initialName={renaming?.name}
        onClose={() => setRenaming(null)}
        onSubmit={handleRename}
      />

      {/* Per-list actions (FR-10.2) */}
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
            Rename
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
        title="Delete list?"
        message={`"${
          deleteTarget?.name ?? 'This list'
        }" and all of its items will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
