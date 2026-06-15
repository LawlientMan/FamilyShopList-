// Add / edit a wishlist item (FR-12.2/12.3/12.4/12.5/12.8) in a BottomSheet.
//
// FR-12.2: name is required, no autocomplete (manual entry only).
// FR-12.8: optional multiline description.
// FR-12.3: one or more URLs via a repeatable field with "+ Add link".
// FR-12.4: image is a MANUAL URL the creator pastes (no auto-fetch / microlink).
//          A fixed-aspect preview (object-contain) shows it, with a "no image"
//          placeholder when empty or broken.
// FR-12.5: priority selector low / med / high.
// No price field (FR-12.7).

import { useEffect, useState } from 'react'
import { Link2, Plus, X } from 'lucide-react'
import {
  BottomSheet,
  Button,
  CopyButton,
  IconButton,
  ItemImage,
  TextInput,
  Textarea,
} from '../../components/ui'
import { cn } from '../../lib/cn'
import type { WishlistItemInput } from '../../lib/wishlists'
import type { Priority, WishlistItem } from '../../types'

export interface WishlistItemEditorSheetProps {
  open: boolean
  /** Provided when editing an existing item; absent when adding a new one. */
  item?: WishlistItem | null
  onClose: () => void
  onSubmit: (input: WishlistItemInput) => Promise<void> | void
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const priorityStyles: Record<Priority, string> = {
  high: 'border-red-500 bg-red-50 text-red-700',
  med: 'border-amber-500 bg-amber-50 text-amber-700',
  low: 'border-primary-500 bg-primary-50 text-primary-700',
}

export function WishlistItemEditorSheet({
  open,
  item,
  onClose,
  onSubmit,
}: WishlistItemEditorSheetProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('med')
  // Always keep at least one (possibly empty) URL field for "+ Add link" UX.
  const [urls, setUrls] = useState<string[]>([''])
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  // Seed the form whenever it opens (from the item when editing, or blank).
  // Deferred to a timeout so we avoid a synchronous setState in the effect body
  // (matches the ListEditorSheet pattern) and seed after the open animation.
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      setName(item?.name ?? '')
      setDescription(item?.description ?? '')
      setPriority(item?.priority ?? 'med')
      setUrls(item?.urls && item.urls.length > 0 ? [...item.urls] : [''])
      setImageUrl(item?.imageUrl ?? '')
    }, 50)
    return () => clearTimeout(id)
  }, [open, item])

  function setUrlAt(index: number, value: string) {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
  }

  function addUrlField() {
    setUrls((prev) => [...prev, ''])
  }

  function removeUrlField(index: number) {
    setUrls((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : ['']
    })
  }

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onSubmit({
        name: trimmed,
        description: description.trim() || null,
        priority,
        urls,
        imageUrl: imageUrl.trim() || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={item ? 'Edit item' : 'Add item'}
    >
      <div className="space-y-4">
        {/* FR-12.2: name, required, no autocomplete */}
        <TextInput
          label="Name"
          placeholder="What would you like?"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* FR-12.8: optional multiline description */}
        <Textarea
          label="Description"
          placeholder="Color, size, notes… (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* FR-12.5: priority selector */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-700">
            Priority
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(
                  'h-10 rounded-card border text-sm font-medium transition-colors',
                  priority === p.value
                    ? priorityStyles[p.value]
                    : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* FR-12.3: one or more URLs with "+ Add link" */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-700">
            Links
          </span>
          <div className="space-y-2">
            {urls.map((url, i) => {
              // Hide remove on a lone empty field so the first add stays clean.
              const showRemove = urls.length > 1 || url.trim() !== ''
              return (
                <div key={i} className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <TextInput
                      name={`url-${i}`}
                      placeholder="https://…"
                      inputMode="url"
                      autoComplete="off"
                      leftIcon={<Link2 className="h-4 w-4" />}
                      value={url}
                      onChange={(e) => setUrlAt(i, e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <CopyButton text={url.trim()} />
                  {showRemove && (
                    <IconButton
                      label="Remove link"
                      size="sm"
                      icon={<X className="h-4 w-4" />}
                      onClick={() => removeUrlField(i)}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={addUrlField}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add link
          </button>
        </div>

        {/* FR-12.4: manual image URL + fixed-aspect, object-contain preview */}
        <div>
          <TextInput
            label="Image URL"
            placeholder="Paste a link to an image (optional)"
            inputMode="url"
            autoComplete="off"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="mt-2">
            <ItemImage src={imageUrl} alt={name} />
          </div>
        </div>

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
            {item ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

export default WishlistItemEditorSheet
