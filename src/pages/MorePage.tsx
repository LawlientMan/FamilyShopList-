import { LogOut } from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { useAuthUser } from '../auth/auth-context'
import { useAlias } from '../alias/alias-context'
import { MembersSection } from '../alias/MembersSection'

// "More" screen — profile, members management (FR-7/8/11), invites (FR-6),
// and sign out.
export default function MorePage() {
  const { user, logout } = useAuthUser()
  const { activeAlias } = useAlias()

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-3 text-xl font-bold text-ink-900">More</h1>

      <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card">
        <Avatar name={user?.displayName} photoURL={user?.photoURL} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">
            {user?.displayName ?? 'Signed in'}
          </p>
          <p className="truncate text-sm text-ink-500">{user?.email}</p>
        </div>
      </div>

      {activeAlias && (
        <div className="mt-4">
          <MembersSection alias={activeAlias} />
        </div>
      )}

      <Button
        className="mt-6"
        variant="secondary"
        fullWidth
        leftIcon={<LogOut className="h-4 w-4" />}
        onClick={() => void logout()}
      >
        Sign out
      </Button>
    </div>
  )
}
