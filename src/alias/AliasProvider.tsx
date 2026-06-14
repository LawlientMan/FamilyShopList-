import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuthUser } from '../auth/auth-context'
import { getUser, listMyAliases, paths, setDefaultAlias } from '../lib/db'
import type { Alias } from '../types'
import { AliasContext } from './alias-context'

export function AliasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthUser()
  const [aliases, setAliases] = useState<Alias[]>([])
  const [activeAliasId, setActiveAliasIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const load = useCallback(async () => {
    // Yield first so this never updates state synchronously within an effect.
    await Promise.resolve()
    if (!user) {
      setAliases([])
      setActiveAliasIdState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const [mine, profile] = await Promise.all([
      listMyAliases(user.uid),
      getUser(user.uid),
    ])
    setAliases(mine)

    // Pick the active alias: keep current if still a member, else default, else first.
    setActiveAliasIdState((current) => {
      if (current && mine.some((a) => a.id === current)) return current
      const fallback = profile?.defaultAliasId
      if (fallback && mine.some((a) => a.id === fallback)) return fallback
      return mine[0]?.id ?? null
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
          setAliases((prev) => prev.filter((a) => a.id !== activeAliasId))
        }
      },
      // A permission error here also means we lost access — clear the alias.
      () => {
        setActiveAliasIdState(null)
        setAliases((prev) => prev.filter((a) => a.id !== activeAliasId))
      },
    )
    return unsub
  }, [user, activeAliasId])

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
