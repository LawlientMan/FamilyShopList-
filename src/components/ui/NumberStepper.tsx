import { Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { IconButton } from './IconButton'

export interface NumberStepperProps {
  /** Current value. `null` means "no quantity set" (qty is optional, FR-B3). */
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}

// Numeric quantity with - / + buttons (FR-B3). Quantity is optional, so an
// empty input maps to null.
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  label = 'Quantity',
  className,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const current = value ?? 0

  const dec = () => onChange(clamp(current - step))
  const inc = () => onChange(clamp(current + step))

  return (
    <div
      className={cn(
        'inline-flex h-11 items-center gap-1 rounded-card border border-ink-200 bg-white p-1',
        className,
      )}
      role="group"
      aria-label={label}
    >
      <IconButton
        size="sm"
        variant="subtle"
        label="Decrease"
        icon={<Minus className="h-4 w-4" />}
        onClick={dec}
        disabled={value !== null && value <= min}
      />
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value ?? ''}
        placeholder="—"
        min={min}
        max={max}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onChange(null)
            return
          }
          const n = Number(raw)
          if (!Number.isNaN(n)) onChange(clamp(n))
        }}
        className="w-12 border-0 bg-transparent text-center font-medium text-ink-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <IconButton
        size="sm"
        variant="subtle"
        label="Increase"
        icon={<Plus className="h-4 w-4" />}
        onClick={inc}
        disabled={value !== null && value >= max}
      />
    </div>
  )
}

export default NumberStepper
