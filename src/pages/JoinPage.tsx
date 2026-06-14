import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { Button, FullSpinner } from '../components/ui'
import { useAuthUser } from '../auth/auth-context'
import { useAlias } from '../alias/alias-context'
import { joinByCode, resolveInvite } from '../lib/db'
import type { Invite } from '../types'

// /join/:code — confirm and join a space by invite link (FR-6).
// Routing guarantees the user is signed in before this renders.
export default function JoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const { refresh, setActiveAliasId } = useAlias()

  const [invite, setInvite] = useState<Invite | null>(null)
  const [resolving, setResolving] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const inv = await resolveInvite(code)
        if (!active) return
        if (!inv) setError('This invite link is invalid or has expired.')
        setInvite(inv)
      } catch {
        if (active) setError('Could not load this invite.')
      } finally {
        if (active) setResolving(false)
      }
    })()
    return () => {
      active = false
    }
  }, [code])

  const handleJoin = async () => {
    if (!user || !invite) return
    setJoining(true)
    setError(null)
    try {
      const aliasId = await joinByCode(user, code)
      await refresh()
      setActiveAliasId(aliasId)
      navigate('/', { replace: true })
    } catch {
      setError('Could not join this space. Please try again.')
      setJoining(false)
    }
  }

  if (resolving) return <FullSpinner label="Loading invite" />

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 pt-safe pb-safe">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl2 bg-primary-100 text-primary-600">
          <UserPlus className="h-8 w-8" />
        </div>
        {invite ? (
          <>
            <h1 className="text-xl font-bold text-ink-900">
              Join “{invite.aliasName}”?
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              You'll be able to see and edit everything in this space.
            </p>
            <div className="mt-8 flex w-full gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/', { replace: true })}
                disabled={joining}
              >
                Not now
              </Button>
              <Button fullWidth loading={joining} onClick={handleJoin}>
                Join
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink-900">Invite not found</h1>
            <p className="mt-2 text-sm text-ink-500">
              {error ?? 'This invite link is invalid or has expired.'}
            </p>
            <Button className="mt-8" onClick={() => navigate('/', { replace: true })}>
              Go to app
            </Button>
          </>
        )}
        {invite && error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
