import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface TextInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
}

// Accepts ANY language — no language validation (NFR-2).
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { label, error, leftIcon, rightSlot, className, id, ...props },
    ref,
  ) {
    const inputId = id ?? props.name
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 text-ink-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-11 w-full rounded-card border bg-white text-ink-900 placeholder:text-ink-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightSlot ? 'pr-10' : 'pr-3.5',
              error ? 'border-red-400' : 'border-ink-200',
              className,
            )}
            aria-invalid={error ? true : undefined}
            {...props}
          />
          {rightSlot && (
            <span className="absolute right-2 flex items-center">
              {rightSlot}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)

export default TextInput
