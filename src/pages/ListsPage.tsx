import { ListTodo } from 'lucide-react'
import { EmptyState } from '../components/ui'

// Screen 2 — Named lists (FR-10). Shows the list of lists; tapping opens items.
export default function ListsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-3 text-xl font-bold text-ink-900">Lists</h1>
      <EmptyState
        icon={<ListTodo className="h-6 w-6" />}
        title="No lists yet"
        description="Create named lists like New Year, Party, or the Cottage to keep things organized."
      />
    </div>
  )
}
