// Create / rename a named list (FR-10.2) in a BottomSheet, including its icon +
// tint color (FR-16). The name field accepts any language with no validation
// (NFR-2) — only non-empty is required.

import { useEffect, useRef, useState } from 'react'
import {
  BottomSheet,
  Button,
  ColorPicker,
  DEFAULT_COLOR,
  DEFAULT_ICON_KEY,
  IconPicker,
  TextInput,
} from '../../components/ui'

export interface ListAppearance {
  icon: string
  color: string
}

export interface ListEditorSheetProps {
  open: boolean
  /** Current name when renaming; empty/undefined when creating a new list. */
  initialName?: string
  /** Current icon/color when renaming; defaults applied when creating. */
  initialIcon?: string
  initialColor?: string
  /** "create" shows "New list"; "rename" shows "Rename list". */
  mode: 'create' | 'rename'
  onClose: () => void
  onSubmit: (name: string, appearance: ListAppearance) => Promise<void> | void
}

export function ListEditorSheet({
  open,
  initialName = '',
  initialIcon = DEFAULT_ICON_KEY,
  initialColor = DEFAULT_COLOR,
  mode,
  onClose,
  onSubmit,
}: ListEditorSheetProps) {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(initialColor)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset the fields to the incoming values and focus once the sheet opens.
  // Deferred to a timeout so the fields seed after the open animation.
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      setName(initialName)
      setIcon(initialIcon || DEFAULT_ICON_KEY)
      setColor(initialColor || DEFAULT_COLOR)
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(id)
  }, [open, initialName, initialIcon, initialColor])

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onSubmit(trimmed, { icon, color })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'New list' : 'Edit list'}
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

        {/* FR-16: icon + color */}
        <ColorPicker value={color} onChange={setColor} />
        <IconPicker value={icon} onChange={setIcon} color={color} />

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
