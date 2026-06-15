// Grid picker for the icon set (FR-16). Each cell renders the icon tinted with
// the currently-selected color so the user previews the final look. The selected
// cell gets a colored ring + faint fill. Shows 18 core icons by default with a
// "More" toggle to reveal the full set so the sheet stays short.

import { useState } from 'react'
import { ICON_KEYS, CORE_ICON_KEYS, ICON_SET, DEFAULT_COLOR } from './iconSet'
import { cn } from '../../lib/cn'

export interface IconPickerProps {
  value: string
  onChange: (key: string) => void
  /** Tint color for the icons (default brand teal). */
  color?: string
  label?: string
}

export function IconPicker({
  value,
  onChange,
  color = DEFAULT_COLOR,
  label = 'Icon',
}: IconPickerProps) {
  const [expanded, setExpanded] = useState(false)

  // Collapsed: the 18 core icons, plus the current selection if it's outside the
  // core set (so the chosen icon stays visible/highlighted). Expanded: everything.
  const keys = expanded
    ? ICON_KEYS
    : value && !CORE_ICON_KEYS.includes(value) && ICON_SET[value]
      ? [value, ...CORE_ICON_KEYS]
      : CORE_ICON_KEYS

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </span>
      <div className="grid grid-cols-6 gap-2">
        {keys.map((key) => {
          const Icon = ICON_SET[key]
          const active = value === key
          return (
            <button
              key={key}
              type="button"
              aria-label={key}
              aria-pressed={active}
              onClick={() => onChange(key)}
              className={cn(
                'flex aspect-square items-center justify-center rounded-card border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                active ? 'border-transparent' : 'border-ink-200 hover:bg-ink-50',
              )}
              style={
                active
                  ? {
                      color,
                      backgroundColor: `${color}1a`,
                      boxShadow: `inset 0 0 0 2px ${color}`,
                    }
                  : { color }
              }
            >
              <Icon className="h-5 w-5" />
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:underline"
      >
        {expanded ? 'Show less' : `More (${ICON_KEYS.length})`}
      </button>
    </div>
  )
}

export default IconPicker
