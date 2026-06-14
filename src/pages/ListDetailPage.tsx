import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ListTodo } from 'lucide-react'
import { useAlias } from '../alias/alias-context'
import { useAuthUser } from '../auth/auth-context'
import { paths } from '../lib/db'
import { EmptyState, IconButton } from '../components/ui'
import { ShoppingItemsView } from '../features/shopping'
import { useLists } from '../features/lists'

// Screen 2 detail — items inside one named list (FR-10.3). Reuses the exact
// shopping-item experience as the Quick list, scoped to lists/{listId}/items.
// Provides a back button to the lists overview.
export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const { activeAliasId } = useAlias()
  const { user } = useAuthUser()
  const navigate = useNavigate()

  // The list's name (for the header) comes from the already-subscribed lists.
  const { data: lists } = useLists(activeAliasId)
  const list = lists.find((l) => l.id === listId)

  const itemsRef = useMemo(
    () =>
      activeAliasId && listId
        ? paths.listItems(activeAliasId, listId)
        : null,
    [activeAliasId, listId],
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center gap-1">
        <IconButton
          label="Back to lists"
          variant="ghost"
          icon={<ChevronLeft className="h-6 w-6" />}
          onClick={() => navigate('/lists')}
        />
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-ink-900">
          {list?.name ?? 'List'}
        </h1>
      </div>

      {!activeAliasId || !user || !itemsRef ? (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="No space selected"
          description="Create or join a space from the switcher at the top to start adding items."
          className="flex-1"
        />
      ) : (
        <ShoppingItemsView
          itemsRef={itemsRef}
          aliasId={activeAliasId}
          user={user}
          emptyTitle="Nothing here yet"
          emptyDescription="Add items to this list. They'll show up here for everyone in your space."
        />
      )}
    </div>
  )
}
