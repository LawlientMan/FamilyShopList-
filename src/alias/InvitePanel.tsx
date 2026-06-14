import { useState } from 'react'
import { Check, Copy, RefreshCw, Share2 } from 'lucide-react'
import { Button } from '../components/ui'
import { regenerateInvite } from '../lib/db'
import { useAlias } from './alias-context'
import type { Alias } from '../types'

// Derive the invite base from the current origin so the shared link always
// matches where the app is actually served (prod, preview channel, or emulator
// per NFR-5) instead of a hardcoded production host. Falls back to the prod
// host for non-browser contexts.
const INVITE_BASE =
  typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/join`
    : 'https://family-shop-list-2b4ae.web.app/join'

function inviteLink(code: string): string {
  return `${INVITE_BASE}/${code}`
}

// Invite panel (FR-6): share link + raw code, Share/Copy, and Regenerate.
// Only the owner reaches this (gated by the caller).
export function InvitePanel({ alias }: { alias: Alias }) {
  const { refresh } = useAlias()
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const code = alias.inviteCode
  const link = inviteLink(code)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  const handleShare = async () => {
    // Prefer the native share sheet; fall back to clipboard.
    if (canShare && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my space',
          text: `Join “${alias.name}” on FamilyShopList`,
          url: link,
        })
        return
      } catch {
        // User dismissed share or it failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — link is still shown for manual copy.
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await regenerateInvite(alias)
      await refresh()
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="flex flex-col">
      <p className="text-sm text-ink-500">
        Anyone with this link can join “{alias.name}”.
      </p>

      <div className="mt-3 break-all rounded-card border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-700">
        {link}
      </div>

      <Button
        className="mt-3"
        fullWidth
        leftIcon={
          copied ? (
            <Check className="h-4 w-4" />
          ) : canShare ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )
        }
        onClick={() => void handleShare()}
      >
        {copied ? 'Copied' : canShare ? 'Share link' : 'Copy link'}
      </Button>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-400">Or enter this code manually</p>
          <p className="font-mono text-base font-semibold tracking-widest text-ink-800">
            {code}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          loading={regenerating}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void handleRegenerate()}
        >
          Regenerate
        </Button>
      </div>
    </div>
  )
}

export default InvitePanel
