import { useMemo } from 'react'
import { Plus, Zap } from 'lucide-react'
import { useAlias } from '../alias/alias-context'
import { useAuthUser } from '../auth/auth-context'
import { paths } from '../lib/db'
import { Button, EmptyState } from '../components/ui'
import { ShoppingItemsView } from '../features/shopping'

// Screen 1 — Quick list (FR-9). One flat shared list per space.
// Item behavior (FR-B1..B9) is provided by the reusable shopping feature.
export default function QuickListPage() {
  const { activeAliasId, setSwitcherOpen } = useAlias()
  const { user } = useAuthUser()

  // Memoize the collection ref so the items view's queries stay stable.
  const itemsRef = useMemo(
    () => (activeAliasId ? paths.quickItems(activeAliasId) : null),
    [activeAliasId],
  )

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-3 text-xl font-bold text-ink-900">Quick list</h1>

      {!activeAliasId || !user || !itemsRef ? (
        <EmptyState
          icon={<Zap className="h-6 w-6" />}
          title="No space selected"
          description="Create or join a space to start adding items. Everything you add is shared with your space."
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
      ) : (
        <ShoppingItemsView
          itemsRef={itemsRef}
          aliasId={activeAliasId}
          user={user}
          emptyTitle="Nothing here yet"
          emptyDescription="Add the things you need to grab right now. They'll show up here for everyone in your space."
        />
      )}
    </div>
  )
}
