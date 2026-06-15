// Typed Firestore data-access layer for FamilyShopList.
// All logic is client-side (Firebase Spark, no Cloud Functions). Security is
// enforced by firestore.rules. Document shapes mirror DATA-MODEL.md exactly.

import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
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

// Owner re-activates a previously removed member ("Invite back", FR-11). The
// owner-update branch of the rule permits this; data + authorship were kept.
export async function reactivateMember(
  aliasId: string,
  uid: string,
): Promise<void> {
  await updateDoc(paths.member(aliasId, uid), { status: 'active' })
}

// Owner rotates the invite code (FR-6 "Regenerate"). Returns the new code.
//
// These are sequential, best-effort writes (Spark = no transactions across
// these refs). The ordering is deliberate so the alias and the active invite
// never disagree in a way that would reject a legitimate join:
//   1) create the NEW invite as active — so it exists+active BEFORE the alias
//      points at it (the member rule checks both joinCodeOk and inviteActive);
//   2) point the alias at the new code — now the new code fully validates;
//   3) deactivate the OLD invite — old link/code stops working (the rule's
//      inviteActive() now rejects it even if a client supplies the old code).
// If step 2 or 3 fails (e.g. network drop) the caller refreshes the alias, so
// the panel re-reads the authoritative inviteCode rather than trusting a stale
// local value; a re-run of Regenerate is idempotent enough for a family app.
export async function regenerateInvite(alias: Alias): Promise<string> {
  const newCode = generateInviteCode()

  // 1) New code -> alias lookup, active (owner-gated by the invites rule).
  await setDoc(paths.invite(newCode), {
    code: newCode,
    aliasId: alias.id,
    aliasName: alias.name,
    active: true,
  } satisfies Invite)

  // 2) Point the alias at the new code (the rule's get() now resolves it).
  await updateDoc(paths.alias(alias.id), { inviteCode: newCode })

  // 3) Deactivate the previous invite so the old link/code stops working.
  if (alias.inviteCode && alias.inviteCode !== newCode) {
    await updateDoc(paths.invite(alias.inviteCode), { active: false })
  }

  return newCode
}

// ---- named lists (FR-10.2) ----
// Lists live at aliases/{aliasId}/lists/{listId} with { name, createdAt, createdBy }.
// Their items reuse the shopping-item shape (paths.listItems + lib/items.ts).
export async function createList(
  aliasId: string,
  fbUser: FirebaseUser,
  name: string,
): Promise<string> {
  const ref = await addDoc(paths.lists(aliasId), {
    name: name.trim(),
    createdBy: fbUser.uid,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function renameList(
  aliasId: string,
  listId: string,
  name: string,
): Promise<void> {
  await updateDoc(doc(paths.lists(aliasId), listId), { name: name.trim() })
}

// Delete a list. Items in its subcollection are removed first so no orphans are
// left (Firestore has no client-side cascade; the family-sized lists are small).
export async function deleteList(
  aliasId: string,
  listId: string,
): Promise<void> {
  const items = await getDocs(paths.listItems(aliasId, listId))
  await Promise.all(items.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(paths.lists(aliasId), listId))
}

// ---- alias rename / delete (FR-13, owner-only per rules) ----

// Rename the active alias (rule allows owner update of aliases/{id}). Best-effort
// keeps the current invite's aliasName roughly in sync so the "Join {alias}?"
// confirmation shows the new name; a failure there is non-critical.
export async function renameAlias(alias: Alias, name: string): Promise<void> {
  const trimmed = name.trim()
  await updateDoc(paths.alias(alias.id), { name: trimmed })
  if (alias.inviteCode) {
    void updateDoc(paths.invite(alias.inviteCode), {
      aliasName: trimmed,
    }).catch(() => {})
  }
}

// Delete an alias (owner-only). Spark has no server cascade, so we do a small,
// safe client-side cleanup: remove the member docs and the current invite, then
// the alias document itself. Larger content subcollections (items, suggestions,
// wishlists) may remain orphaned and unreachable — acceptable for a family app.
// Member docs are deleted last-but-before the alias so the owner still passes
// isOwner() (which reads the alias doc) while removing them.
export async function deleteAlias(alias: Alias): Promise<void> {
  // 1) deactivate the current invite (owner-gated UPDATE — the invites rule
  //    checks isOwner via request.resource.data.aliasId, which a delete lacks,
  //    so we flip active:false instead of deleting the lookup doc).
  if (alias.inviteCode) {
    await updateDoc(paths.invite(alias.inviteCode), { active: false }).catch(
      () => {},
    )
  }
  // 2) delete member docs (owner-only delete per rules). These are read via
  //    the nested members rule (isActiveMember) — the owner is active here.
  const members = await getDocs(paths.members(alias.id))
  await Promise.all(members.docs.map((d) => deleteDoc(d.ref).catch(() => {})))
  // 3) delete the alias document (owner-only). Content subcollections (items,
  //    suggestions, wishlists) may remain orphaned/unreachable — acceptable.
  await deleteDoc(paths.alias(alias.id))
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
