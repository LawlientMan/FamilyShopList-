import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import type {
  DocumentData,
  Query,
  QueryDocumentSnapshot,
} from 'firebase/firestore'

export interface CollectionState<T> {
  data: T[]
  loading: boolean
  error: Error | undefined
}

// Generic real-time collection subscription. Each doc is mapped to `{ id, ...data }`.
// Pass a memoized query (or null to pause, e.g. before an active alias exists).
//
// Example (feature agents follow this pattern for items):
//   const q = useMemo(
//     () => query(paths.quickItems(aliasId), where('done','==',false), orderBy('updatedAt','desc')),
//     [aliasId],
//   )
//   const { data, loading } = useCollection<ShoppingItem>(q)
export function useCollection<T extends { id: string }>(
  q: Query<DocumentData> | null,
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: q !== null,
    error: undefined,
  })

  useEffect(() => {
    if (!q) {
      // Paused (e.g. no active alias yet) — clear on the next tick to avoid a
      // synchronous setState during the effect.
      const id = setTimeout(
        () => setState({ data: [], loading: false, error: undefined }),
        0,
      )
      return () => clearTimeout(id)
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() }) as T,
        )
        setState({ data, loading: false, error: undefined })
      },
      (error) => setState({ data: [], loading: false, error }),
    )
    return unsub
  }, [q])

  return state
}

export default useCollection
