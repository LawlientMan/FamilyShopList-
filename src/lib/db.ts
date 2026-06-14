// Typed Firestore data-access layer for FamilyShopList.
// All logic is client-side (Firebase Spark, no Cloud Functions). Security is
// enforced by firestore.rules. Document shapes mirror DATA-MODEL.md exactly.

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { db } from './firebase'
import type { Alias, Invite, Member, User } from '../types'

// ---- collection / doc path helpers (single source of truth for paths) ----
export const paths = {
  users: () => collection(db, 'users'),
  user: (uid: string) => doc(db, 'users', uid),
  invites: () => collection(db, 'invites'),
  invite: (code: string) => doc(db, 'invites', code),
  aliases: () => collection(db, 'aliases'),
  alias: (aliasId: string) => doc(db, 'aliases', aliasId),
  members: (aliasId: string) => collection(db, 'aliases', aliasId, 'members'),
  member: (aliasId: string, uid: string) =>
    doc(db, 'aliases', aliasId, 'members', uid),
  quickItems: (aliasId: string) =>
    collection(db, 'aliases', aliasId, 'quickItems'),
  lists: (aliasId: string) => collection(db, 'aliases', aliasId, 'lists'),
  listItems: (aliasId: string, listId: string) =>
    collection(db, 'aliases', aliasId, 'lists', listId, 'items'),
  wishlists: (aliasId: string) =>
    collection(db, 'aliases', aliasId, 'wishlists'),
  wishlistItems: (aliasId: string, wishlistId: string) =>
    collection(db, 'aliases', aliasId, 'wishlists', wishlistId, 'items'),
  suggestions: (aliasId: string) =>
    collection(db, 'aliases', aliasId, 'suggestions'),
}

// ---- invite code generation (6 chars, unambiguous alphabet) ----
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateInviteCode(length = 6): string {
  let out = ''
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[arr[i] % CODE_ALPHABET.length]
  }
  return out
}

// ---- user profile ----

// Upsert users/{uid} on first sign-in (FR-2). Never clobbers defaultAliasId.
export async function upsertUser(fbUser: FirebaseUser): Promise<void> {
  const ref = paths.user(fbUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, {
      displayName: fbUser.displayName ?? null,
      email: fbUser.email ?? null,
      photoURL: fbUser.photoURL ?? null,
    })
    return
  }
  await setDoc(ref, {
    displayName: fbUser.displayName ?? null,
    email: fbUser.email ?? null,
    photoURL: fbUser.photoURL ?? null,
    defaultAliasId: null,
    createdAt: serverTimestamp(),
  })
}

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(paths.user(uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...(snap.data() as Omit<User, 'uid'>) }
}

// Set/clear the alias opened on launch (FR-5).
export async function setDefaultAlias(
  uid: string,
  aliasId: string | null,
): Promise<void> {
  await updateDoc(paths.user(uid), { defaultAliasId: aliasId })
}

// ---- alias creation (FR-3) ----
// IMPORTANT (DATA-MODEL.md): write the alias doc and the owner member doc as TWO
// sequential writes (not a batch) so the membership rule can read the alias via
// get() and confirm ownership.
export async function createAlias(
  fbUser: FirebaseUser,
  name: string,
): Promise<string> {
  const code = generateInviteCode()
  const aliasRef = doc(paths.aliases())
  const aliasId = aliasRef.id

  // 1) alias document
  await setDoc(aliasRef, {
    name,
    ownerId: fbUser.uid,
    inviteCode: code,
    createdAt: serverTimestamp(),
  })

  // 2) owner membership (separate write — rule reads the alias that now exists)
  await setDoc(paths.member(aliasId, fbUser.uid), {
    uid: fbUser.uid,
    displayName: fbUser.displayName ?? null,
    photoURL: fbUser.photoURL ?? null,
    role: 'owner',
    status: 'active',
    code,
    joinedAt: serverTimestamp(),
  } satisfies Omit<Member, 'joinedAt'> & { joinedAt: ReturnType<typeof serverTimestamp> })

  // 3) invite lookup doc (code -> alias)
  await setDoc(paths.invite(code), {
    code,
    aliasId,
    aliasName: name,
    active: true,
  } satisfies Invite)

  return aliasId
}

// ---- join-by-code (FR-6, DATA-MODEL.md join flow) ----

// Resolve a code to its invite (any signed-in user may read invites/{code}).
export async function resolveInvite(code: string): Promise<Invite | null> {
  const snap = await getDoc(paths.invite(code))
  if (!snap.exists()) return null
  const data = snap.data() as Invite
  if (!data.active) return null
  return data
}

// Self-join (create or re-activate own membership) with a valid code. The rule
// validates code == alias.inviteCode via get(). Re-joining a removed member
// flips status back to 'active' (FR-11).
export async function joinByCode(
  fbUser: FirebaseUser,
  code: string,
): Promise<string> {
  const invite = await resolveInvite(code)
  if (!invite) throw new Error('Invalid or expired invite code.')

  await setDoc(
    paths.member(invite.aliasId, fbUser.uid),
    {
      uid: fbUser.uid,
      displayName: fbUser.displayName ?? null,
      photoURL: fbUser.photoURL ?? null,
      role: 'member',
      status: 'active',
      code,
      joinedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return invite.aliasId
}

// ---- membership management ----

// Owner soft-removes a member (FR-8). Data + authorship are preserved.
export async function removeMember(
  aliasId: string,
  uid: string,
): Promise<void> {
  await updateDoc(paths.member(aliasId, uid), { status: 'removed' })
}

// ---- list my aliases (for the switcher, DATA-MODEL.md collectionGroup query) ----
// collectionGroup('members') where uid == me and status == 'active', then load
// each parent alias document.
export async function listMyAliases(uid: string): Promise<Alias[]> {
  const q = query(
    collectionGroup(db, 'members'),
    where('uid', '==', uid),
    where('status', '==', 'active'),
  )
  const memberSnaps = await getDocs(q)

  const aliasIds = memberSnaps.docs
    .map((m) => m.ref.parent.parent?.id)
    .filter((id): id is string => Boolean(id))

  const aliases = await Promise.all(
    aliasIds.map(async (id) => {
      const snap = await getDoc(paths.alias(id))
      if (!snap.exists()) return null
      return { id: snap.id, ...(snap.data() as Omit<Alias, 'id'>) }
    }),
  )

  return aliases.filter((a): a is Alias => a !== null)
}

// Re-export so feature code can build server timestamps without re-importing.
export { serverTimestamp, Timestamp }
