// Create / rename a named list (FR-10.2) in a BottomSheet. The name field
// accepts any language with no validation (NFR-2) — only non-empty is required.

import { useEffect, useRef, useState } from 'react'
import { BottomSheet, Button, TextInput } from '../../components/ui'

export interface ListEditorSheetProps {
  open: boolean
  /** Current name when renaming; empty/undefined when creating a new list. */
  initialName?: string
  /** "create" shows "New list"; "rename" shows "Rename list". */
  mode: 'create' | 'rename'
  onClose: () => void
  onSubmit: (name: string) => Promise<void> | void
}

export function ListEditorSheet({
  open,
  initialName = '',
  mode,
  onClose,
  onSubmit,
}: ListEditorSheetProps) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset the field to the incoming value and focus once the sheet opens.
  // Deferred to a timeout so the field is seeded after the open animation and
  // we avoid a synchronous setState inside the effect body.
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      setName(initialName)
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(id)
  }, [open, initialName])

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onSubmit(trimmed)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'New list' : 'Rename list'}
    >
      <div className="space-y-4">
        <TextInput
          ref={inputRef}
          label="List name"
          placeholder="New Year, Party, Cottage…"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void submit()
            }
          }}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            fullWidth
            loading={saving}
            disabled={!name.trim()}
            onClick={() => void submit()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

export default ListEditorSheet
