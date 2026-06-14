// Name autocomplete from the per-alias suggestion history (FR-B2).
// Prefix query on `nameLower` against aliases/{aliasId}/suggestions. Returns the
// best matches (most-used first) for the current input. Debounced + cancellable.

import { useEffect, useState } from 'react'
import { getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { paths } from '../../lib/db'
import { normalizeName } from '../../lib/items'
import type { Suggestion } from '../../types'

const MAX_SUGGESTIONS = 6
const DEBOUNCE_MS = 150
// High code point: inclusive upper bound for a Firestore prefix range query.
const PREFIX_END = String.fromCharCode(0xf8ff)

// `term` is the raw text typed into the name field. Pass aliasId (or null to
// disable). Returns matching suggestions ordered by usage count (desc).
export function useSuggestions(
  aliasId: string | null,
  term: string,
): Suggestion[] {
  const [results, setResults] = useState<Suggestion[]>([])
  const prefix = normalizeName(term)

  useEffect(() => {
    let cancelled = false

    if (!aliasId || prefix.length === 0) {
      // Clear on the next tick to avoid a synchronous setState in the effect.
      const id = setTimeout(() => {
        if (!cancelled) setResults([])
      }, 0)
      return () => {
        cancelled = true
        clearTimeout(id)
      }
    }

    const handle = setTimeout(async () => {
      try {
        // Prefix range: nameLower in [prefix, prefix + high-codepoint].
        // Single orderBy('nameLower') keeps it on Firestore's auto index; the
        // usage-count ranking is applied client-side below.
        const q = query(
          paths.suggestions(aliasId),
          where('nameLower', '>=', prefix),
          where('nameLower', '<=', prefix + PREFIX_END),
          orderBy('nameLower'),
          limit(MAX_SUGGESTIONS),
        )
        const snap = await getDocs(q)
        if (cancelled) return
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Suggestion,
        )
        data.sort((a, b) => b.count - a.count)
        setResults(data)
      } catch {
        if (!cancelled) setResults([])
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [aliasId, prefix])

  return results
}

export default useSuggestions
