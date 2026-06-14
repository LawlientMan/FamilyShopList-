import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../lib/firebase'

// Thin wrapper around react-firebase-hooks so components import from one place.
export function useAuthUser() {
  return useAuthState(auth)
}
