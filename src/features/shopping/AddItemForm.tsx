// Add-item form shared by the Quick list (FR-9) and named Lists (FR-10.3).
//
// FR-B1: tapping "Add item" immediately reveals and focuses the name field.
// FR-B2: name autocomplete from the per-alias suggestion history.
// FR-B3: optional quantity (NumberStepper) + optional free-text unit with quick
//        unit buttons (g / kg / l). Both fields are optional.
// FR-B4: dedup happens in addOrUpdateItem (keyed by nameLower).

import { useEffect, useRef, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { Button, NumberStepper, TextInput } from '../../components/ui'
import { cn } from '../../lib/cn'
import { addOrUpdateItem, recordSuggestion } from '../../lib/items'
import type { Suggestion } from '../../types'
import { useSuggestions } from './useSuggestions'

const QUICK_UNITS = ['g', 'kg', 'l']

export interface AddItemFormProps {
  itemsRef: CollectionReference<DocumentData>
  aliasId: string
  user: FirebaseUser
}

export function AddItemForm({ itemsRef, aliasId, user }: AddItemFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [qty, setQty] = useState<number | null>(null)
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const suggestions = useSuggestions(aliasId, name)

  // FR-B1: focus the name field as soon as the form opens.
  useEffect(() => {
    if (open) nameRef.current?.focus()
  }, [open])

  function reset() {
    setName('')
    setQty(null)
    setUnit('')
    setShowSuggestions(false)
  }

  function close() {
    reset()
    setOpen(false)
  }

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await addOrUpdateItem(itemsRef, user, {
        name: trimmed,
        qty,
        unit: unit.trim(),
      })
      // Suggestion history is best-effort (FR-B2): a failure here must not block
      // the item that already saved, nor surface as a submit error. These are
      // two independent writes (no transactions on Spark); the autocomplete
      // count is non-critical, so we swallow its failure.
      void recordSuggestion(aliasId, trimmed).catch(() => {})
      reset()
      // Keep the form open and refocus for fast consecutive adds.
      nameRef.current?.focus()
    } finally {
      setSaving(false)
    }
  }

  function pickSuggestion(s: Suggestion) {
    setName(s.name)
    setShowSuggestions(false)
    nameRef.current?.focus()
  }

  if (!open) {
    return (
      <Button
        fullWidth
        leftIcon={<Plus className="h-5 w-5" />}
        onClick={() => setOpen(true)}
      >
        Add item
      </Button>
    )
  }

  return (
    <div className="rounded-card border border-ink-200 bg-white p-3 shadow-card">
      <div className="relative">
        <TextInput
          ref={nameRef}
          name="item-name"
          placeholder="What do you need?"
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void submit()
            } else if (e.key === 'Escape') {
              if (showSuggestions) setShowSuggestions(false)
              else close()
            }
          }}
        />
        {/* FR-B2: autocomplete dropdown from history */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-card border border-ink-200 bg-white py-1 shadow-card">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-ink-800 hover:bg-ink-50"
                >
                  <span className="truncate">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FR-B3: optional quantity + optional unit. Stepper and unit field share a
          row; the quick-unit chips sit directly under the unit field (instead of
          wrapping awkwardly beside it) so they read as belonging to it at 412px. */}
      <div className="mt-3 flex flex-col gap-2">
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
          {QUICK_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={cn(
                'h-10 min-w-[2.75rem] rounded-card border px-3 text-sm font-medium transition-colors',
                unit === u
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={close} disabled={saving}>
          Cancel
        </Button>
        <Button
          fullWidth
          leftIcon={<Check className="h-5 w-5" />}
          loading={saving}
          disabled={!name.trim()}
          onClick={() => void submit()}
        >
          Add
        </Button>
      </div>
    </div>
  )
}

export default AddItemForm
