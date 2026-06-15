import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuthUser } from '../auth/auth-context'
import { getUser, listMyAliases, paths, setDefaultAlias } from '../lib/db'
import type { Alias } from '../types'
import { AliasContext } from './alias-context'

// A space is ACTIVE when it has no trash marker (FR-18). Pre-v1.4 docs lack the
// field entirely — treat absent as active.
const isActive = (a: Alias): boolean => a.deletedAt == null

export function AliasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthUser()
  // All of my memberships' aliases (active + soft-deleted); split below.
  const [allAliases, setAllAliases] = useState<Alias[]>([])
  const [activeAliasId, setActiveAliasIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  // The switcher's ACTIVE list. Deleted spaces never appear here.
  const aliases = useMemo(() => allAliases.filter(isActive), [allAliases])
  // The owner's trash (FR-18): soft-deleted spaces I own. Other members of a
  // space I deleted do NOT see it in their trash — only the owner manages it.
  const deletedAliases = useMemo(
    () =>
      allAliases.filter((a) => !isActive(a) && a.ownerId === user?.uid),
    [allAliases, user?.uid],
  )

  const load = useCallback(async () => {
    // Yield first so this never updates state synchronously within an effect.
    await Promise.resolve()
    if (!user) {
      setAllAliases([])
      setActiveAliasIdState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const [mine, profile] = await Promise.all([
      listMyAliases(user.uid),
      getUser(user.uid),
    ])
    setAllAliases(mine)

    // Pick the active alias from ACTIVE spaces only (never a deleted one): keep
    // current if still active, else default (if active), else first active.
    const activeOnly = mine.filter(isActive)
    setActiveAliasIdState((current) => {
      if (current && activeOnly.some((a) => a.id === current)) return current
      const fallback = profile?.defaultAliasId
      if (fallback && activeOnly.some((a) => a.id === fallback)) return fallback
      return activeOnly[0]?.id ?? null
    })
    setLoading(false)
  }, [user])

  useEffect(() => {
    // `load` is async and yields before any setState, so there is no
    // synchronous state update here (the rule can't see across the await).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Watch the current user's own membership in the active alias. listMyAliases
  // is a one-shot fetch, so without this a member who gets soft-removed
  // (status='removed') would keep the alias selected and every content listener
  // (all isActiveMember-gated) would start throwing permission-denied. When our
  // own membership flips away from 'active' (or vanishes), drop the alias and
  // refresh the roster so the switcher reflects reality.
  useEffect(() => {
    if (!user || !activeAliasId) return
    const unsub = onSnapshot(
      paths.member(activeAliasId, user.uid),
      (snap) => {
        const stillActive = snap.exists() && snap.data().status === 'active'
        if (!stillActive) {
          setActiveAliasIdState(null)
          setAllAliases((prev) => prev.filter((a) => a.id !== activeAliasId))
        }
      },
      // A permission error here also means we lost access — clear the alias.
      () => {
        setActiveAliasIdState(null)
        setAllAliases((prev) => prev.filter((a) => a.id !== activeAliasId))
      },
    )
    return unsub
  }, [user, activeAliasId])

  // Watch the active alias doc for a soft-delete (FR-18). If it gets trashed
  // (here or on another device), drop it as active and fall back like a removed
  // membership — the selection logic only ever picks ACTIVE spaces. Membership
  // is unchanged, so the trash entry still surfaces via load() for the owner.
  useEffect(() => {
    if (!activeAliasId) return
    const unsub = onSnapshot(
      paths.alias(activeAliasId),
      (snap) => {
        const deleted = snap.exists() && snap.data().deletedAt != null
        if (deleted) {
          setActiveAliasIdState((current) => {
            if (current !== activeAliasId) return current
            return null
          })
        }
      },
      () => {},
    )
    return unsub
  }, [activeAliasId])

  const setActiveAliasId = useCallback((aliasId: string) => {
    setActiveAliasIdState(aliasId)
  }, [])

  const makeDefault = useCallback(
    async (aliasId: string) => {
      if (!user) return
      await setDefaultAlias(user.uid, aliasId)
    },
    [user],
  )

  const activeAlias = aliases.find((a) => a.id === activeAliasId) ?? null

  return (
    <AliasContext.Provider
      value={{
        aliases,
        deletedAliases,
        activeAlias,
        activeAliasId,
        loading,
        setActiveAliasId,
        makeDefault,
        refresh: load,
        switcherOpen,
        setSwitcherOpen,
      }}
    >
      {children}
    </AliasContext.Provider>
  )
}
