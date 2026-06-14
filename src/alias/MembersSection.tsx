import { useMemo, useState } from 'react'
import { query } from 'firebase/firestore'
import { RotateCcw, UserMinus, UserPlus, Users } from 'lucide-react'
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  ConfirmDialog,
  IconButton,
  Spinner,
} from '../components/ui'
import { useAuthUser } from '../auth/auth-context'
import { useCollection } from '../hooks/useCollection'
import { paths, reactivateMember, removeMember } from '../lib/db'
import { cn } from '../lib/cn'
import { InvitePanel } from './InvitePanel'
import type { Alias, Member } from '../types'

// Members management (FR-7/8/11) for the active space, plus the invite panel
// (FR-6). Owners can remove/invite-back; non-owners just see the roster.
export function MembersSection({ alias }: { alias: Alias }) {
  const { user } = useAuthUser()
  const isOwner = user?.uid === alias.ownerId

  const membersQuery = useMemo(() => query(paths.members(alias.id)), [alias.id])
  const { data: members, loading } = useCollection<Member & { id: string }>(
    membersQuery,
  )

  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [removing, setRemoving] = useState(false)

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        // Owner first, then active members, then removed; alphabetical within.
        const rank = (m: Member) =>
          m.role === 'owner' ? 0 : m.status === 'active' ? 1 : 2
        const r = rank(a) - rank(b)
        if (r !== 0) return r
        return (a.displayName ?? '').localeCompare(b.displayName ?? '')
      }),
    [members],
  )

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await removeMember(alias.id, removeTarget.uid)
      setRemoveTarget(null)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="rounded-card bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-700">
          <Users className="h-5 w-5 text-ink-400" />
          <span className="font-medium">Members</span>
        </div>
        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-6">
          <Spinner />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-ink-100">
          {sorted.map((m) => {
            const removed = m.status === 'removed'
            return (
              <li key={m.uid} className="flex items-center gap-3 py-2.5">
                <Avatar
                  name={m.displayName}
                  photoURL={m.photoURL}
                  size="sm"
                  className={removed ? 'opacity-50' : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate',
                      removed
                        ? 'text-ink-400 line-through'
                        : 'font-medium text-ink-900',
                    )}
                  >
                    {m.displayName ?? 'Member'}
                    {m.uid === user?.uid && (
                      <span className="text-ink-400"> (you)</span>
                    )}
                  </p>
                </div>
                {m.role === 'owner' ? (
                  <Badge tone="primary">Owner</Badge>
                ) : removed ? (
                  <Badge tone="neutral">Removed</Badge>
                ) : (
                  <Badge tone="neutral">Member</Badge>
                )}

                {/* Owner controls — never on the owner's own row. */}
                {isOwner && m.role !== 'owner' && (
                  removed ? (
                    <IconButton
                      label={`Invite ${m.displayName ?? 'member'} back`}
                      variant="subtle"
                      size="sm"
                      icon={<RotateCcw className="h-4 w-4" />}
                      onClick={() => void reactivateMember(alias.id, m.uid)}
                    />
                  ) : (
                    <IconButton
                      label={`Remove ${m.displayName ?? 'member'}`}
                      size="sm"
                      icon={<UserMinus className="h-4 w-4" />}
                      onClick={() => setRemoveTarget(m)}
                    />
                  )
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Invite panel (FR-6) — owner only */}
      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite member"
      >
        <InvitePanel alias={alias} />
      </BottomSheet>

      {/* Soft-remove confirmation (FR-8) */}
      <ConfirmDialog
        open={removeTarget !== null}
        title="Remove member?"
        message={`${
          removeTarget?.displayName ?? 'This member'
        } will lose access. Their items and authorship stay intact, and you can invite them back later.`}
        confirmLabel="Remove"
        destructive
        loading={removing}
        onConfirm={() => void handleRemove()}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}

export default MembersSection
