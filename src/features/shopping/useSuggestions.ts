// Name autocomplete from the per-alias suggestion history (FR-B2).
// Prefix query on `nameLower` against aliases/{aliasId}/suggestions. Returns the
// best matches (most-used first) for the current input. Debounced + cancellable.
//
// FR-B2.1: hidden (blocked) suggestions are filtered out CLIENT-SIDE — adding an
// inequality on `hidden` would break the prefix range and force a composite
// index. The prefix query stays on Firestore's auto single-field nameLower index.
// FR-B2.3: when the term is empty we still return suggestions (most-used first)
// so the persistent in-screen list shows everything by default.

import { useEffect, useState } from 'react'
import { getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { paths } from '../../lib/db'
import { normalizeName } from '../../lib/items'
import type { Suggestion } from '../../types'

const MAX_SUGGESTIONS = 8
const DEBOUNCE_MS = 150
// High code point: inclusive upper bound for a Firestore prefix range query.
const PREFIX_END = String.fromCharCode(0xf8ff)

// `term` is the raw text typed into the name field. Pass aliasId (or null to
// disable). Returns matching, non-hidden suggestions ordered by usage count.
export function useSuggestions(
  aliasId: string | null,
  term: string,
): Suggestion[] {
  const [results, setResults] = useState<Suggestion[]>([])
  const prefix = normalizeName(term)

  useEffect(() => {
    let cancelled = false

    if (!aliasId) {
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
        // Empty prefix -> list all (ordered by name); otherwise prefix range:
        // nameLower in [prefix, prefix + high-codepoint]. Both stay on the auto
        // single-field nameLower index. Usage-count ranking is applied below.
        const q =
          prefix.length === 0
            ? query(
                paths.suggestions(aliasId),
                orderBy('nameLower'),
                limit(MAX_SUGGESTIONS * 4),
              )
            : query(
                paths.suggestions(aliasId),
                where('nameLower', '>=', prefix),
                where('nameLower', '<=', prefix + PREFIX_END),
                orderBy('nameLower'),
                limit(MAX_SUGGESTIONS * 4),
              )
        const snap = await getDocs(q)
        if (cancelled) return
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Suggestion)
          // FR-B2.1: drop blocked suggestions client-side.
          .filter((s) => !s.hidden)
        data.sort((a, b) => b.count - a.count)
        setResults(data.slice(0, MAX_SUGGESTIONS))
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
