// Color picker for lists/wishlists (FR-16): 8 preset swatches plus a native
// <input type="color"> for a custom RGB pick. The custom swatch shows the
// current value and is highlighted when the value isn't one of the presets.

import { COLOR_PRESETS } from './iconSet'
import { cn } from '../../lib/cn'

export interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  label?: string
}

// Seed value for the native picker when no custom color is active yet: a light
// color (so the saturation/value area opens bright, not black) with a hue around
// the middle-right of the spectrum (sky-blue). The native OS picker positions its
// sliders from this hex, so this keeps it usable instead of opening on black.
const CUSTOM_SEED = '#7dd3fc'
const isHex6 = (v: string) => /^#[0-9a-f]{6}$/i.test(v)

export function ColorPicker({
  value,
  onChange,
  label = 'Color',
}: ColorPickerProps) {
  const normalized = value.toLowerCase()
  const isPreset = COLOR_PRESETS.some((c) => c.toLowerCase() === normalized)
  // What the native <input type="color"> opens at: the current custom color if
  // one is set, otherwise the light seed (never empty/invalid → never black).
  const customValue = !isPreset && isHex6(value) ? value : CUSTOM_SEED

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_PRESETS.map((c) => {
          const active = c.toLowerCase() === normalized
          return (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={active}
              onClick={() => onChange(c)}
              className={cn(
                'h-8 w-8 rounded-full border transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                active
                  ? 'border-white ring-2 ring-offset-1'
                  : 'border-black/10 hover:scale-105',
              )}
              style={{
                backgroundColor: c,
                ...(active ? { boxShadow: `0 0 0 2px ${c}` } : {}),
              }}
            />
          )
        })}

        {/* Custom RGB pick via the native color input. */}
        <label
          className={cn(
            'relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border',
            !isPreset
              ? 'border-white ring-2 ring-offset-1'
              : 'border-dashed border-ink-300',
          )}
          style={{
            backgroundColor: isPreset ? '#fff' : value,
            ...(!isPreset ? { boxShadow: `0 0 0 2px ${value}` } : {}),
          }}
          title="Custom color"
        >
          <input
            type="color"
            value={customValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Custom color"
          />
          {isPreset && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-base"
            >
              🎨
            </span>
          )}
        </label>
      </div>
    </div>
  )
}

export default ColorPicker
