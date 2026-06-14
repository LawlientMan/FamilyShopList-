import { createContext, useContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

export interface AuthContextValue {
  user: FirebaseUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Auth accessor for components. `user` is null when signed out.
export function useAuthUser(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthUser must be used within an AuthProvider')
  return ctx
}
