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

// Edit an existing item's content (FR-13): name / qty / unit. authorId and
// createdAt are NOT touched — the content update rule (authorFrozen) freezes the
// author snapshot, so we only change name/nameLower/qty/unit/updatedAt.
export async function editItem(
  itemsRef: CollectionReference<DocumentData>,
  itemId: string,
  input: ShoppingItemInput,
): Promise<void> {
  const name = input.name.trim()
  await updateDoc(doc(itemsRef, itemId), {
    name,
    nameLower: normalizeName(name),
    qty: input.qty ?? null,
    unit: input.unit ?? '',
    updatedAt: serverTimestamp(),
  })
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
  // IMPORTANT (FR-B2.1): never write `hidden` here. setDoc(merge) leaves an
  // existing hidden:true intact, so re-adding a blocked item does NOT revive it.
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

// ---- suggestion management (FR-B2.1 / FR-B2.2 / FR-13) ----

// Block a suggestion forever (set hidden:true). Autocomplete filters it out and
// recordSuggestion never clears the flag, so re-adding the item won't revive it.
export async function blockSuggestion(
  aliasId: string,
  id: string,
): Promise<void> {
  await updateDoc(doc(paths.suggestions(aliasId), id), { hidden: true })
}

// Rename a suggestion (FR-B2.2). The doc id stays the original nameLower (so the
// dedup key for items added via recordSuggestion is unaffected); we update the
// displayed name and its nameLower used for prefix matching.
export async function renameSuggestion(
  aliasId: string,
  id: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim()
  await updateDoc(doc(paths.suggestions(aliasId), id), {
    name: trimmed,
    nameLower: normalizeName(trimmed),
  })
}

export async function deleteSuggestion(
  aliasId: string,
  id: string,
): Promise<void> {
  await deleteDoc(doc(paths.suggestions(aliasId), id))
}
