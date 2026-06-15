// One row in the lists overview (FR-10.1). Tapping the card opens the list's
// items; the trailing button opens rename/delete actions (FR-10.2). The
// items-remaining count is live.

import { useNavigate } from 'react-router-dom'
import { ChevronRight, MoreVertical } from 'lucide-react'
import { IconBadge, IconButton } from '../../components/ui'
import { useListRemainingCount } from './useListRemainingCount'
import type { ShoppingList } from '../../types'

export interface ListCardProps {
  aliasId: string
  list: ShoppingList
  onActions: (list: ShoppingList) => void
}

export function ListCard({ aliasId, list, onActions }: ListCardProps) {
  const navigate = useNavigate()
  const remaining = useListRemainingCount(aliasId, list.id)

  return (
    <div className="flex items-center rounded-card bg-white shadow-card">
      <button
        type="button"
        onClick={() => navigate(`/lists/${list.id}`)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-card px-4 py-3 text-left hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <IconBadge icon={list.icon} color={list.color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink-900">
            {list.name}
          </span>
          <span className="block text-sm text-ink-500">
            {remaining === 0
              ? 'All done'
              : `${remaining} item${remaining === 1 ? '' : 's'} left`}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-300" aria-hidden />
      </button>
      <div className="pr-2">
        <IconButton
          label={`Actions for ${list.name}`}
          variant="ghost"
          icon={<MoreVertical className="h-5 w-5" />}
          onClick={() => onActions(list)}
        />
      </div>
    </div>
  )
}

export default ListCard
