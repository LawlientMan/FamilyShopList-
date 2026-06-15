// Small copy-to-clipboard button with brief "copied" feedback. Used for wishlist
// item links (copy a product URL to share). Disabled when there's nothing to copy.

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { IconButton } from './IconButton'

export interface CopyButtonProps {
  text: string
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function CopyButton({
  text,
  label = 'Copy link',
  size = 'sm',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard blocked — ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <IconButton
      label={copied ? 'Copied' : label}
      size={size}
      variant="ghost"
      disabled={!text}
      onClick={() => void copy()}
      className={className}
      icon={
        copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      }
    />
  )
}

export default CopyButton
