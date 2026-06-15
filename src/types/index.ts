// Shared domain types for FamilyShopList.
// Mirrors DATA-MODEL.md (Firestore collections + document shapes) exactly.
// All Firestore timestamps surface as the Firebase `Timestamp` type.

import type { Timestamp } from 'firebase/firestore'

// ---- Literal unions (erasableSyntaxOnly: use string-literal unions, not enums) ----
export type MemberRole = 'owner' | 'member'
export type MemberStatus = 'active' | 'removed'
export type Priority = 'high' | 'med' | 'low'

// ---- users/{uid} ----
export interface User {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  defaultAliasId: string | null
  createdAt: Timestamp
}

// ---- invites/{code} : code -> alias lookup for join-by-code ----
export interface Invite {
  code: string
  aliasId: string
  aliasName: string
  active: boolean
}

// ---- aliases/{aliasId} ----
export interface Alias {
  id: string
  name: string
  ownerId: string
  inviteCode: string
  createdAt: Timestamp
  // v1.4 (FR-18): soft-delete trash marker. null/absent = active; set = in the
  // owner's "Deleted spaces" trash (restorable). Pre-v1.4 docs lack it.
  deletedAt?: Timestamp | null
}

// ---- aliases/{aliasId}/members/{uid} : membership source of truth ----
export interface Member {
  uid: string
  displayName: string | null
  photoURL: string | null
  role: MemberRole
  status: MemberStatus
  code: string
  joinedAt: Timestamp
}

// ---- Shopping item (quickItems and lists/*/items share this shape) ----
export interface ShoppingItem {
  id: string
  name: string
  nameLower: string
  qty: number | null
  unit: string
  done: boolean
  authorId: string
  authorName: string
  authorPhoto: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  boughtAt: Timestamp | null
}

// ---- aliases/{aliasId}/lists/{listId} ----
export interface ShoppingList {
  id: string
  name: string
  createdAt: Timestamp
  createdBy: string
  // v1.3 (FR-16): optional icon key + tint color. Pre-v1.3 docs lack these and
  // render with defaults (DEFAULT_ICON_KEY + DEFAULT_COLOR).
  icon?: string
  color?: string
}

// ---- aliases/{aliasId}/wishlists/{wishlistId} ----
export interface Wishlist {
  id: string
  name: string
  createdAt: Timestamp
  createdBy: string
  // v1.3 (FR-16): optional icon key + tint color (see ShoppingList).
  icon?: string
  color?: string
  // v1.4 (FR-18): soft-delete trash marker. null/absent = active; set = in the
  // "Deleted" trash (restorable). Pre-v1.4 docs lack it.
  deletedAt?: Timestamp | null
}

// ---- aliases/{aliasId}/wishlists/{wishlistId}/items/{itemId} ----
export interface WishlistItem {
  id: string
  name: string
  // v1.3 (FR-12.8): optional, multiline description.
  description: string | null
  priority: Priority
  urls: string[]
  // v1.3 (FR-12.4): manual image URL pasted by the creator (no auto-fetch).
  imageUrl: string | null
  authorId: string
  authorName: string
  authorPhoto: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ---- aliases/{aliasId}/suggestions/{suggestionId} : autocomplete history ----
export interface Suggestion {
  id: string
  name: string
  nameLower: string
  count: number
  lastUsedAt: Timestamp
}
