import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { upsertUser } from '../lib/db'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // First sign-in upserts users/{uid} (FR-2).
        try {
          await upsertUser(fbUser)
        } catch {
          // Profile upsert is best-effort; auth state still stands.
        }
      }
      setUser(fbUser)
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
