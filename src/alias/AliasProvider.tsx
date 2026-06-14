import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuthUser } from '../auth/auth-context'
import { getUser, listMyAliases, setDefaultAlias } from '../lib/db'
import type { Alias } from '../types'
import { AliasContext } from './alias-context'

export function AliasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthUser()
  const [aliases, setAliases] = useState<Alias[]>([])
  const [activeAliasId, setActiveAliasIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
      }}
    >
      {children}
    </AliasContext.Provider>
  )
}
