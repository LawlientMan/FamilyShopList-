import { Zap } from 'lucide-react'
import { EmptyState } from '../components/ui'

// Screen 1 — Quick list (FR-9). One flat shared list per space.
// Items behavior (FR-B1..B9) is implemented by the items feature agent.
export default function QuickListPage() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-3 text-xl font-bold text-ink-900">Quick list</h1>
      <EmptyState
        icon={<Zap className="h-6 w-6" />}
        title="Nothing here yet"
        description="Add the things you need to grab right now. They'll show up here for everyone in your space."
      />
    </div>
  )
}
