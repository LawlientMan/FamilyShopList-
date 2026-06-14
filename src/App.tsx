import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider } from './auth/AuthProvider'
import { useAuthUser } from './auth/auth-context'
import { AliasProvider } from './alias/AliasProvider'
import SignIn from './auth/SignIn'
import Layout from './components/Layout'
import QuickListPage from './pages/QuickListPage'
import ListsPage from './pages/ListsPage'
import ListDetailPage from './pages/ListDetailPage'
import WishlistsPage from './pages/WishlistsPage'
import MorePage from './pages/MorePage'
import JoinPage from './pages/JoinPage'
import { FullSpinner } from './components/ui'

// Route protection: unauthenticated users see the SignIn screen (FR-1).
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <FullSpinner label="Loading" />
      </div>
    )
  }
  if (!user) return <SignIn />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RequireAuth>
          <AliasProvider>
            <Routes>
              {/* Join-by-link sits outside the tabbed Layout. */}
              <Route path="/join/:code" element={<JoinPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<QuickListPage />} />
                <Route path="lists" element={<ListsPage />} />
                <Route path="lists/:listId" element={<ListDetailPage />} />
                <Route path="wishlists" element={<WishlistsPage />} />
                <Route path="more" element={<MorePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AliasProvider>
        </RequireAuth>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
