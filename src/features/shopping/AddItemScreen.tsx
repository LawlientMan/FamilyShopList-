// Full-screen Add/Edit-item panel that slides in from the right (FR-B1, FR-14).
// Reused by the Quick list and by an opened named List — the caller passes the
// target collection ref + aliasId. Also serves item EDIT (FR-13) when `editItem`
// is provided (fields are prefilled and the title/CTA switch to edit/save).
//
// Contents:
//  - Name input (autofocused on open) with a PERSISTENT suggestion list below
//    (FR-B2/B2.3): tapping fills the name and does NOT close; clicking elsewhere
//    does NOT hide it. Each row can be renamed / deleted (FR-B2.1/13).
//  - Optional quantity (NumberStepper) + optional free-text unit with colored
//    quick-pick chips g / kg / l / ml (FR-B3).
//  - A "Manage suggestions" tab listing ALL suggestions with rename/delete.

import { useEffect, useMemo, useRef, useState } from 'react'
import { query } from 'firebase/firestore'
import { Check, ChevronLeft, Pencil, Trash2, X } from 'lucide-react'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { createPortal } from 'react-dom'
import {
  BottomSheet,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  NumberStepper,
  Spinner,
  TextInput,
} from '../../components/ui'
import { cn } from '../../lib/cn'
import { useCollection } from '../../hooks/useCollection'
import { paths } from '../../lib/db'
import {
  addOrUpdateItem,
  deleteSuggestion,
  editItem as editItemDoc,
  recordSuggestion,
  renameSuggestion,
} from '../../lib/items'
import type { ShoppingItem, Suggestion } from '../../types'
import { useSuggestions } from './useSuggestions'

// Colored quick-pick unit chips (FR-B3). Values are exactly g / kg / l / ml.
const UNIT_CHIPS: { value: string; tint: string; active: string }[] = [
  {
    value: 'g',
    tint: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    active: 'border-amber-500 bg-amber-500 text-white',
  },
  {
    value: 'kg',
    tint: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
    active: 'border-orange-500 bg-orange-500 text-white',
  },
  {
    value: 'l',
    tint: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    active: 'border-sky-500 bg-sky-500 text-white',
  },
  {
    value: 'ml',
    tint: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
    active: 'border-violet-500 bg-violet-500 text-white',
  },
]

export interface AddItemScreenProps {
  open: boolean
  onClose: () => void
  itemsRef: CollectionReference<DocumentData>
  aliasId: string
  user: FirebaseUser
  /** When set, the screen opens in EDIT mode prefilled with this item (FR-13). */
  editItem?: ShoppingItem | null
}

type Tab = 'add' | 'manage'

export function AddItemScreen({
  open,
  onClose,
  itemsRef,
  aliasId,
  user,
  editItem = null,
}: AddItemScreenProps) {
  const isEdit = !!editItem
  const [tab, setTab] = useState<Tab>('add')
  const [name, setName] = useState('')
  const [qty, setQty] = useState<number | null>(null)
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const suggestions = useSuggestions(aliasId, isEdit ? '' : name)

  // Seed fields + focus when the screen opens (deferred past the slide-in so we
  // don't setState synchronously in the effect, and focus lands after paint).
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      setTab('add')
      setName(editItem?.name ?? '')
      setQty(editItem?.qty ?? null)
      setUnit(editItem?.unit ?? '')
      nameRef.current?.focus()
    }, 60)
    return () => clearTimeout(id)
  }, [open, editItem])

  // Escape closes the screen.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Back gesture / hardware Back closes the screen instead of navigating the
  // router away from the current page. On open we push a throwaway history
  // entry; a real Back press pops it and fires popstate -> onClose(). When the
  // screen is closed from the UI (X / Save / Cancel / backdrop) the cleanup
  // pops our entry once so history stays balanced (no leaked entries across
  // repeated open/close). `poppedRef` tracks whether popstate already consumed
  // the entry, so we never double-pop.
  useEffect(() => {
    if (!open) return
    let poppedRef = false
    window.history.pushState({ addItem: true }, '')
    const onPop = () => {
      poppedRef = true
      onClose()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // UI-driven close: our pushed entry is still on top, so pop it once.
      if (!poppedRef) window.history.back()
    }
  }, [open, onClose])

  if (!open) return null

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      if (isEdit && editItem) {
        await editItemDoc(itemsRef, editItem.id, {
          name: trimmed,
          qty,
          unit: unit.trim(),
        })
      } else {
        await addOrUpdateItem(itemsRef, user, {
          name: trimmed,
          qty,
          unit: unit.trim(),
        })
        // Best-effort suggestion history (FR-B2): never blocks the saved item.
        void recordSuggestion(aliasId, trimmed).catch(() => {})
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const title = isEdit
    ? 'Edit item'
    : tab === 'manage'
      ? 'Manage suggestions'
      : 'Add item'

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-900/30"
        onClick={onClose}
        aria-hidden
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative ml-auto flex h-dvh w-full max-w-md animate-slide-in-right flex-col bg-ink-100 shadow-sheet"
      >
        {/* Header — safe-area aware (NFR-4) */}
        <header className="sticky top-0 z-10 flex items-center gap-1 bg-white pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-safe shadow-sm">
          <div className="flex h-14 w-full items-center gap-1">
            {tab === 'manage' && !isEdit ? (
              <IconButton
                label="Back to add"
                variant="ghost"
                icon={<ChevronLeft className="h-6 w-6" />}
                onClick={() => setTab('add')}
              />
            ) : (
              <IconButton
                label="Close"
                variant="ghost"
                icon={<X className="h-6 w-6" />}
                onClick={onClose}
              />
            )}
            <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-ink-900">
              {title}
            </h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
          {tab === 'add' ? (
            <AddTab
              isEdit={isEdit}
              name={name}
              setName={setName}
              qty={qty}
              setQty={setQty}
              unit={unit}
              setUnit={setUnit}
              nameRef={nameRef}
              suggestions={suggestions}
              aliasId={aliasId}
              onManage={() => setTab('manage')}
              onSubmit={() => void submit()}
            />
          ) : (
            <ManageTab aliasId={aliasId} />
          )}
        </div>

        {/* Sticky action bar */}
        {tab === 'add' && (
          <div className="sticky bottom-0 border-t border-ink-200 bg-white px-4 py-3 pb-safe">
            <Button
              fullWidth
              size="lg"
              leftIcon={<Check className="h-5 w-5" />}
              loading={saving}
              disabled={!name.trim()}
              onClick={() => void submit()}
            >
              {isEdit ? 'Save changes' : 'Add'}
            </Button>
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}

// ---- Add tab ----
function AddTab({
  isEdit,
  name,
  setName,
  qty,
  setQty,
  unit,
  setUnit,
  nameRef,
  suggestions,
  aliasId,
  onManage,
  onSubmit,
}: {
  isEdit: boolean
  name: string
  setName: (v: string) => void
  qty: number | null
  setQty: (v: number | null) => void
  unit: string
  setUnit: (v: string) => void
  nameRef: React.RefObject<HTMLInputElement | null>
  suggestions: Suggestion[]
  aliasId: string
  onManage: () => void
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <TextInput
        ref={nameRef}
        name="item-name"
        label="Name"
        placeholder="What do you need?"
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
          }
        }}
      />

      {/* FR-B3: optional quantity + optional unit + colored quick-pick chips */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-700">
          Quantity <span className="font-normal text-ink-400">(optional)</span>
        </span>
        <div className="flex items-center gap-2">
          <NumberStepper value={qty} onChange={setQty} />
          <div className="flex-1">
            <TextInput
              name="item-unit"
              placeholder="unit"
              autoComplete="off"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {UNIT_CHIPS.map((chip) => {
            const active = unit === chip.value
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                onClick={() => setUnit(active ? '' : chip.value)}
                className={cn(
                  'h-10 min-w-[3rem] flex-1 rounded-card border text-sm font-semibold transition-colors',
                  active ? chip.active : chip.tint,
                )}
              >
                {chip.value}
              </button>
            )
          })}
        </div>
      </div>

      {/* FR-B2/B2.3: persistent suggestion list (not a transient dropdown) */}
      {!isEdit && (
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">Suggestions</span>
            <button
              type="button"
              onClick={onManage}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:underline"
            >
              Manage
            </button>
          </div>
          <SuggestionList
            aliasId={aliasId}
            suggestions={suggestions}
            onPick={(s) => {
              setName(s.name)
              nameRef.current?.focus()
            }}
          />
        </div>
      )}
    </div>
  )
}

// Persistent suggestion list used inside the Add tab. Tapping a row fills the
// name; the trailing button deletes the suggestion (FR-B2.1) — a hard delete.
// Re-adding an item with that name later recreates the suggestion.
function SuggestionList({
  aliasId,
  suggestions,
  onPick,
}: {
  aliasId: string
  suggestions: Suggestion[]
  onPick: (s: Suggestion) => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  if (suggestions.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-ink-200 px-3 py-6 text-center text-sm text-ink-400">
        No suggestions yet. Items you add show up here next time.
      </p>
    )
  }

  async function remove(s: Suggestion) {
    if (busyId) return
    setBusyId(s.id)
    try {
      await deleteSuggestion(aliasId, s.id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ul className="divide-y divide-ink-100 overflow-hidden rounded-card border border-ink-200 bg-white">
      {suggestions.map((s) => (
        <li key={s.id} className="flex items-center">
          <button
            type="button"
            onClick={() => onPick(s)}
            className="flex min-w-0 flex-1 items-center px-3 py-2.5 text-left text-sm text-ink-800 hover:bg-ink-50 focus:outline-none focus-visible:bg-ink-50"
          >
            <span className="truncate">{s.name}</span>
          </button>
          <IconButton
            label={`Delete "${s.name}"`}
            size="sm"
            variant="ghost"
            icon={<Trash2 className="h-4 w-4" />}
            disabled={busyId === s.id}
            onClick={() => void remove(s)}
            className="mr-1 text-ink-400"
          />
        </li>
      ))}
    </ul>
  )
}

// ---- Manage suggestions tab (FR-B2.2 / FR-13) ----
// Lists the alias's suggestions with rename + delete. Delete is a plain hard
// delete (FR-B2.1) — the suggestion is removed, but re-adding an item with that
// name later recreates it.
function ManageTab({ aliasId }: { aliasId: string }) {
  const q = useMemo(() => query(paths.suggestions(aliasId)), [aliasId])
  const { data: all, loading } = useCollection<Suggestion>(q)

  // Alphabetical.
  const visible = useMemo(
    () => [...all].sort((a, b) => a.nameLower.localeCompare(b.nameLower)),
    [all],
  )

  const [renameTarget, setRenameTarget] = useState<Suggestion | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Suggestion | null>(null)
  const [working, setWorking] = useState(false)

  if (loading) {
    return (
      <div className="py-10">
        <Spinner />
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No suggestions yet"
        description="Names of items you add are remembered here so you can reuse, rename, or delete them."
        className="py-10"
      />
    )
  }

  async function saveRename() {
    if (!renameTarget || !renameValue.trim() || working) return
    setWorking(true)
    try {
      await renameSuggestion(aliasId, renameTarget.id, renameValue.trim())
      setRenameTarget(null)
    } finally {
      setWorking(false)
    }
  }

  // Hard delete (FR-B2.1): remove the document. Re-adding an item with this
  // name later recreates the suggestion (recordSuggestion uses setDoc merge).
  async function confirmDelete() {
    if (!deleteTarget || working) return
    setWorking(true)
    try {
      await deleteSuggestion(aliasId, deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setWorking(false)
    }
  }

  return (
    <>
      <ul className="divide-y divide-ink-100 overflow-hidden rounded-card border border-ink-200 bg-white">
        {visible.map((s) => (
          <li key={s.id} className="flex items-center gap-1 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-ink-800">
              {s.name}
            </span>
            <IconButton
              label={`Rename ${s.name}`}
              size="sm"
              variant="ghost"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => {
                setRenameValue(s.name)
                setRenameTarget(s)
              }}
              className="text-ink-400"
            />
            <IconButton
              label={`Delete ${s.name}`}
              size="sm"
              variant="ghost"
              icon={<Trash2 className="h-4 w-4" />}
              disabled={working}
              onClick={() => setDeleteTarget(s)}
              className="text-ink-400"
            />
          </li>
        ))}
      </ul>

      {/* Rename suggestion */}
      {renameTarget && (
        <RenameSuggestionSheet
          value={renameValue}
          onChange={setRenameValue}
          saving={working}
          onCancel={() => setRenameTarget(null)}
          onSave={() => void saveRename()}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete suggestion?"
        message={`"${deleteTarget?.name ?? ''}" will be removed from suggestions. Adding an item with this name again will bring it back.`}
        confirmLabel="Delete"
        destructive
        loading={working}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

// Small rename sheet reusing the BottomSheet/TextInput pattern.
function RenameSuggestionSheet({
  value,
  onChange,
  saving,
  onCancel,
  onSave,
}: {
  value: string
  onChange: (v: string) => void
  saving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <BottomSheet open onClose={onCancel} title="Rename suggestion">
      <div className="space-y-4">
        <TextInput
          name="rename-suggestion"
          label="Name"
          autoComplete="off"
          value={value}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSave()
            }
          }}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            fullWidth
            loading={saving}
            disabled={!value.trim()}
            onClick={onSave}
          >
            Save
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

export default AddItemScreen
