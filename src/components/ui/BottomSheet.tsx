import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Hide the default header (title + close button). */
  hideHeader?: boolean
}

// Mobile-first modal that slides up from the bottom. Safe-area aware so its
// content never sits under the iOS home indicator.
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  hideHeader = false,
}: BottomSheetProps) {
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

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[88vh] w-full animate-sheet-up overflow-y-auto rounded-t-xl2 bg-white shadow-sheet pb-safe"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink-200" />
        {!hideHeader && (
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            <IconButton
              label="Close"
              icon={<X className="h-5 w-5" />}
              onClick={onClose}
            />
          </div>
        )}
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export default BottomSheet
