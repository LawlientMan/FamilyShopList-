import { createContext, useContext } from 'react'
import type { Alias } from '../types'

export interface AliasContextValue {
  aliases: Alias[]
  /** The currently active alias, or null until one is chosen/created. */
  activeAlias: Alias | null
  activeAliasId: string | null
  loading: boolean
  setActiveAliasId: (aliasId: string) => void
  /** Persist the launch-default alias (FR-5). */
  makeDefault: (aliasId: string) => Promise<void>
  /** Re-fetch my aliases (call after create/join/leave). */
  refresh: () => Promise<void>
  /** Whether the header space switcher sheet is open. */
  switcherOpen: boolean
  /** Open/close the switcher (used by the header trigger and empty states). */
  setSwitcherOpen: (open: boolean) => void
}

export const AliasContext = createContext<AliasContextValue | undefined>(
  undefined,
)

// Active-alias accessor for screens. Feature screens read `activeAliasId` to
// scope their Firestore queries.
export function useAlias(): AliasContextValue {
  const ctx = useContext(AliasContext)
  if (!ctx) throw new Error('useAlias must be used within an AliasProvider')
  return ctx
}
