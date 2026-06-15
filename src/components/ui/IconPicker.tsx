// Grid picker for the 30-icon set (FR-16). Each cell renders the icon tinted
// with the currently-selected color so the user previews the final look. The
// selected cell gets a colored ring + faint fill.

import { ICON_KEYS, ICON_SET, DEFAULT_COLOR } from './iconSet'
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
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </span>
      <div className="grid grid-cols-6 gap-2">
        {ICON_KEYS.map((key) => {
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
    </div>
  )
}

export default IconPicker
