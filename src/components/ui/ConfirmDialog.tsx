import { BottomSheet } from './BottomSheet'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Use the danger style for destructive actions (delete, remove). */
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Confirmation prompt built on top of BottomSheet for a consistent mobile feel.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title}>
      {message && <p className="text-sm text-ink-600">{message}</p>}
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          fullWidth
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  )
}

export default ConfirmDialog
