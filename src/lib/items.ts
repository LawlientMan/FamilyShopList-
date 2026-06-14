// Shopping-item operations shared by the Quick list (quickItems) and named
// Lists (lists/{listId}/items) — they share the same document shape (DATA-MODEL.md).
// Feature agents call these with the appropriate collection ref from `paths`.

import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { paths } from './db'

export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

export interface ShoppingItemInput {
  name: string
  qty?: number | null
  unit?: string
}

// Add or dedupe by nameLower (FR-B4). If an item with the same nameLower exists,
// update it (qty/unit, done=false, updatedAt=now) instead of creating a new one.
// Pass the target collection ref (paths.quickItems(aliasId) or paths.listItems(...)).
export async function addOrUpdateItem(
  itemsRef: CollectionReference<DocumentData>,
  fbUser: FirebaseUser,
  input: ShoppingItemInput,
): Promise<void> {
  const name = input.name.trim()
  const nameLower = normalizeName(name)
  const qty = input.qty ?? null
  const unit = input.unit ?? ''

  const existing = await getDocs(
    query(itemsRef, where('nameLower', '==', nameLower), limit(1)),
  )

  if (!existing.empty) {
    const ref = existing.docs[0].ref
    await updateDoc(ref, {
      name,
      qty,
      unit,
      done: false,
      boughtAt: null,
      updatedAt: serverTimestamp(),
    })
    return
  }

  await addDoc(itemsRef, {
    name,
    nameLower,
    qty,
    unit,
    done: false,
    authorId: fbUser.uid,
    authorName: fbUser.displayName ?? '',
    authorPhoto: fbUser.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    boughtAt: null,
  })
}

// Toggle bought/active (FR-B5/B6). done -> moves to the "Bought" section with a
// boughtAt timestamp; unchecking returns it to the active list.
export async function setItemDone(
  itemsRef: CollectionReference<DocumentData>,
  itemId: string,
  done: boolean,
): Promise<void> {
  await updateDoc(doc(itemsRef, itemId), {
    done,
    boughtAt: done ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteItem(
  itemsRef: CollectionReference<DocumentData>,
  itemId: string,
): Promise<void> {
  await deleteDoc(doc(itemsRef, itemId))
}

// Record a name in the autocomplete history for this alias (FR-B2). Keyed by
// nameLower as the document id so repeats just bump the count.
//
// Single setDoc(merge) with increment() — no read-then-write round trip and no
// race: increment() on a missing field starts from 0, so concurrent adds of the
// same name from two devices both increment the shared counter instead of one
// overwriting the other (the previous getDoc + create/update branch could lose
// a count when both took the create branch).
export async function recordSuggestion(
  aliasId: string,
  name: string,
): Promise<void> {
  const nameLower = normalizeName(name)
  if (!nameLower) return
  // nameLower is the doc id, so repeats hit the same document.
  const ref = doc(paths.suggestions(aliasId), nameLower)
  await setDoc(
    ref,
    {
      name: name.trim(),
      nameLower,
      count: increment(1),
      lastUsedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
