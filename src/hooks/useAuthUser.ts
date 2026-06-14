// Auth is provided by AuthProvider; the hook + context live in auth-context.
// Re-exported here so existing imports from '../hooks/useAuthUser' keep working.
export { useAuthUser } from '../auth/auth-context'
