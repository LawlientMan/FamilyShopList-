// Wishlist operations (Screen 3, FR-12). Wishlists live at
// aliases/{aliasId}/wishlists/{wishlistId} with { name, createdAt, createdBy };
// their items live at .../items and follow the WishlistItem shape (DATA-MODEL.md).
// All logic is client-side (Firebase Spark, no Cloud Functions); security is
// enforced by firestore.rules.

import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { CollectionReference, DocumentData } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { paths } from './db'
import { DEFAULT_ICON_KEY, DEFAULT_COLOR } from '../components/ui/iconSet'
import type { Priority, WishlistItem } from '../types'

// ---- wishlists (FR-12.1 / FR-16) ----

export async function createWishlist(
  aliasId: string,
  fbUser: FirebaseUser,
  name: string,
  appearance?: { icon?: string; color?: string },
): Promise<string> {
  const ref = await addDoc(paths.wishlists(aliasId), {
    name: name.trim(),
    createdBy: fbUser.uid,
    createdAt: serverTimestamp(),
    icon: appearance?.icon ?? DEFAULT_ICON_KEY,
    color: appearance?.color ?? DEFAULT_COLOR,
  })
  return ref.id
}

// Rename and/or update appearance (icon/color, FR-16). Only provided fields
// are written.
export async function renameWishlist(
  aliasId: string,
  wishlistId: string,
  name: string,
  appearance?: { icon?: string; color?: string },
): Promise<void> {
  const patch: Record<string, unknown> = { name: name.trim() }
  if (appearance?.icon !== undefined) patch.icon = appearance.icon
  if (appearance?.color !== undefined) patch.color = appearance.color
  await updateDoc(doc(paths.wishlists(aliasId), wishlistId), patch)
}

// Delete a wishlist. Items in its subcollection are removed first so no orphans
// are left (Firestore has no client-side cascade; family-sized lists are small).
export async function deleteWishlist(
  aliasId: string,
  wishlistId: string,
): Promise<void> {
  const items = await getDocs(paths.wishlistItems(aliasId, wishlistId))
  await Promise.all(items.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(paths.wishlists(aliasId), wishlistId))
}

// ---- wishlist items (FR-12.2/12.3/12.5) ----

export interface WishlistItemInput {
  name: string
  description: string | null
  priority: Priority
  urls: string[]
  imageUrl: string | null
}

// Normalize a user-supplied input into a stored payload: trim the name, drop
// blank URLs, and coerce empty description/image to null. The image URL is a
// MANUAL link from the creator (FR-12.4) — no auto-fetch.
function cleanInput(input: WishlistItemInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() ? input.description.trim() : null,
    priority: input.priority,
    urls: input.urls.map((u) => u.trim()).filter(Boolean),
    imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
  }
}

export async function addWishlistItem(
  itemsRef: CollectionReference<DocumentData>,
  fbUser: FirebaseUser,
  input: WishlistItemInput,
): Promise<void> {
  await addDoc(itemsRef, {
    ...cleanInput(input),
    authorId: fbUser.uid,
    authorName: fbUser.displayName ?? '',
    authorPhoto: fbUser.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateWishlistItem(
  itemsRef: CollectionReference<DocumentData>,
  itemId: string,
  input: WishlistItemInput,
): Promise<void> {
  await updateDoc(doc(itemsRef, itemId), {
    ...cleanInput(input),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteWishlistItem(
  itemsRef: CollectionReference<DocumentData>,
  itemId: string,
): Promise<void> {
  await deleteDoc(doc(itemsRef, itemId))
}

// ---- client-side sort (FR-12.6) ----
// By priority (high -> med -> low), then by name alphabetically. Done in memory
// per DATA-MODEL.md — no composite index needed.
const PRIORITY_RANK: Record<Priority, number> = { high: 0, med: 1, low: 2 }

export function sortWishlistItems(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (byPriority !== 0) return byPriority
    return a.name.localeCompare(b.name)
  })
}
