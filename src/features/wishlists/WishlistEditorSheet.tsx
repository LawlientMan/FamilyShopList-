// Create / rename a wishlist (FR-12.1) in a BottomSheet. The name field accepts
// any language with no validation (NFR-2) — only non-empty is required.

import { useEffect, useRef, useState } from 'react'
import { BottomSheet, Button, TextInput } from '../../components/ui'

export interface WishlistEditorSheetProps {
  open: boolean
  /** Current name when renaming; empty/undefined when creating a new wishlist. */
  initialName?: string
  /** "create" shows "New wishlist"; "rename" shows "Rename wishlist". */
  mode: 'create' | 'rename'
  onClose: () => void
  onSubmit: (name: string) => Promise<void> | void
}

export function WishlistEditorSheet({
  open,
  initialName = '',
  mode,
  onClose,
  onSubmit,
}: WishlistEditorSheetProps) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Seed the field with the incoming value and focus once the sheet opens.
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
      title={mode === 'create' ? 'New wishlist' : 'Rename wishlist'}
    >
      <div className="space-y-4">
        <TextInput
          ref={inputRef}
          label="Wishlist name"
          placeholder="Birthday, Christmas, Someday…"
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

export default WishlistEditorSheet
