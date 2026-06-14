import { LogOut, Users } from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { useAuthUser } from '../auth/auth-context'
import { useAlias } from '../alias/alias-context'

// "More" screen — profile, members management entry point, sign out.
// Member management UI (FR-7/8) is built by the alias feature agent.
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
        <div className="mt-4 rounded-card bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 text-ink-700">
            <Users className="h-5 w-5 text-ink-400" />
            <span className="text-sm">
              Members of <span className="font-medium">{activeAlias.name}</span>{' '}
              will appear here.
            </span>
          </div>
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
