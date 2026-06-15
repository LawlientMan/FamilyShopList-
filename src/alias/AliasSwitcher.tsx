import { useEffect, useState } from 'react'
import { Check, LogIn, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  BottomSheet,
  Button,
  ConfirmDialog,
  IconButton,
  TextInput,
} from '../components/ui'
import { useAuthUser } from '../auth/auth-context'
import { useAlias } from './alias-context'
import {
  getUser,
  createAlias,
  deleteAlias,
  joinByCode,
  renameAlias,
} from '../lib/db'
import { cn } from '../lib/cn'
import type { Alias } from '../types'

type Mode = 'list' | 'create' | 'join'

// Header space switcher (FR-3/4/5/6): list active spaces, switch, set default,
// create a new space, or join one by code.
export function AliasSwitcher({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { user } = useAuthUser()
  const { aliases, activeAliasId, setActiveAliasId, makeDefault, refresh } =
    useAlias()

  const [mode, setMode] = useState<Mode>('list')
  const [defaultAliasId, setDefaultAliasIdState] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Owner CRUD on a space (FR-13).
  const [renameTarget, setRenameTarget] = useState<Alias | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Alias | null>(null)
  const [crudBusy, setCrudBusy] = useState(false)

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim() || crudBusy) return
    setCrudBusy(true)
    try {
      await renameAlias(renameTarget, renameValue.trim())
      await refresh()
      setRenameTarget(null)
    } finally {
      setCrudBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || crudBusy) return
    setCrudBusy(true)
    try {
      await deleteAlias(deleteTarget)
      // Drop it locally and let refresh re-pick an active alias (provider falls
      // back to default/first remaining membership).
      await refresh()
      setDeleteTarget(null)
    } finally {
      setCrudBusy(false)
    }
  }

  // Load the persisted launch-default (FR-5) whenever the sheet opens.
  useEffect(() => {
    if (!open || !user) return
    let active = true
    void getUser(user.uid).then((u) => {
      if (active) setDefaultAliasIdState(u?.defaultAliasId ?? null)
    })
    return () => {
      active = false
    }
  }, [open, user])

  const close = () => {
    setMode('list')
    setName('')
    setCode('')
    setError(null)
    onClose()
  }

  const handleSwitch = (id: string) => {
    setActiveAliasId(id)
    close()
  }

  const handleMakeDefault = async (id: string) => {
    setDefaultAliasIdState(id)
    await makeDefault(id)
  }

  const handleCreate = async () => {
    if (!user || !name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const id = await createAlias(user, name.trim())
      await refresh()
      setActiveAliasId(id)
      close()
    } catch (e) {
      console.error('createAlias failed', e)
      setError('Could not create the space. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!user || !code.trim()) return
    setBusy(true)
    setError(null)
    try {
      const id = await joinByCode(user, code.trim().toUpperCase())
      await refresh()
      setActiveAliasId(id)
      close()
    } catch {
      setError('Invalid or expired code. Check it and try again.')
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'create'
      ? 'Create a space'
      : mode === 'join'
        ? 'Join a space'
        : 'Switch space'

  return (
    <>
    <BottomSheet open={open} onClose={close} title={title}>
      {mode === 'list' && (
        <div className="flex flex-col">
          <ul className="flex flex-col gap-1">
            {aliases.map((a) => (
              <AliasRow
                key={a.id}
                alias={a}
                active={a.id === activeAliasId}
                isDefault={a.id === defaultAliasId}
                isOwner={a.ownerId === user?.uid}
                onSelect={() => handleSwitch(a.id)}
                onMakeDefault={() => void handleMakeDefault(a.id)}
                onRename={() => {
                  setRenameValue(a.name)
                  setRenameTarget(a)
                }}
                onDelete={() => setDeleteTarget(a)}
              />
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<LogIn className="h-4 w-4" />}
              onClick={() => {
                setError(null)
                setMode('join')
              }}
            >
              Join a space
            </Button>
            <Button
              fullWidth
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setError(null)
                setMode('create')
              }}
            >
              Create new space
            </Button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Space name"
            placeholder="Family, Personal, Cottage…"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            error={error ?? undefined}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setMode('list')}
              disabled={busy}
            >
              Back
            </Button>
            <Button
              fullWidth
              loading={busy}
              disabled={!name.trim()}
              onClick={() => void handleCreate()}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Invite code"
            placeholder="e.g. AB3K9P"
            value={code}
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono uppercase tracking-widest"
            onChange={(e) => setCode(e.target.value)}
            error={error ?? undefined}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setMode('list')}
              disabled={busy}
            >
              Back
            </Button>
            <Button
              fullWidth
              loading={busy}
              disabled={!code.trim()}
              onClick={() => void handleJoin()}
            >
              Join
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>

    {/* Owner: rename a space (FR-13) */}
    <BottomSheet
      open={renameTarget !== null}
      onClose={() => setRenameTarget(null)}
      title="Rename space"
    >
      <div className="space-y-4">
        <TextInput
          name="rename-space"
          label="Space name"
          placeholder="Family, Personal, Cottage…"
          autoComplete="off"
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleRename()
            }
          }}
        />
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setRenameTarget(null)}
            disabled={crudBusy}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            loading={crudBusy}
            disabled={!renameValue.trim()}
            onClick={() => void handleRename()}
          >
            Save
          </Button>
        </div>
      </div>
    </BottomSheet>

    {/* Owner: delete a space (FR-13) */}
    <ConfirmDialog
      open={deleteTarget !== null}
      title="Delete space?"
      message={`"${deleteTarget?.name ?? 'This space'}" and its membership will be removed for everyone. This can't be undone.`}
      confirmLabel="Delete"
      destructive
      loading={crudBusy}
      onConfirm={() => void handleDelete()}
      onCancel={() => setDeleteTarget(null)}
    />
    </>
  )
}

function AliasRow({
  alias,
  active,
  isDefault,
  isOwner,
  onSelect,
  onMakeDefault,
  onRename,
  onDelete,
}: {
  alias: Alias
  active: boolean
  isDefault: boolean
  isOwner: boolean
  onSelect: () => void
  onMakeDefault: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <li className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex flex-1 items-center justify-between rounded-card px-3 py-2.5 text-left transition-colors',
          active ? 'bg-primary-50' : 'hover:bg-ink-50',
        )}
      >
        <span
          className={cn(
            'truncate text-base font-medium',
            active ? 'text-primary-700' : 'text-ink-800',
          )}
        >
          {alias.name}
        </span>
        {active && <Check className="h-5 w-5 shrink-0 text-primary-600" />}
      </button>
      <IconButton
        label={isDefault ? 'Default space' : 'Set as default'}
        size="sm"
        icon={
          <Star
            className={cn(
              'h-5 w-5',
              isDefault ? 'fill-amber-400 text-amber-400' : 'text-ink-300',
            )}
          />
        }
        onClick={onMakeDefault}
      />
      {/* Owner CRUD (FR-13) */}
      {isOwner && (
        <>
          <IconButton
            label={`Rename ${alias.name}`}
            size="sm"
            icon={<Pencil className="h-4 w-4" />}
            onClick={onRename}
            className="text-ink-400"
          />
          <IconButton
            label={`Delete ${alias.name}`}
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={onDelete}
            className="text-ink-400"
          />
        </>
      )}
    </li>
  )
}

export default AliasSwitcher
