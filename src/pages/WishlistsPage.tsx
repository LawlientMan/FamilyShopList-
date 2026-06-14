import { Gift } from 'lucide-react'
import { EmptyState } from '../components/ui'

// Screen 3 — Wishlists (FR-12). Shows the list of wishlists; tapping opens items.
export default function WishlistsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-3 text-xl font-bold text-ink-900">Wishlists</h1>
      <EmptyState
        icon={<Gift className="h-6 w-6" />}
        title="No wishlists yet"
        description="Create wishlists and add items with links, images, and priorities."
      />
    </div>
  )
}
