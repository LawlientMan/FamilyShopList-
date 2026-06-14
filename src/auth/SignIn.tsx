import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'
import { Button } from '../components/ui'
import { useAuthUser } from './auth-context'

// Branded English sign-in screen (FR-1). Google sign-in via popup.
export default function SignIn() {
  const { signInWithGoogle } = useAuthUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white px-6 pt-safe pb-safe">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-xl2 bg-primary-600 text-white shadow-card">
          <ShoppingBasket className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-ink-900">Family Shop</h1>
        <p className="mt-2 text-sm text-ink-500">
          Shared shopping lists and wishlists for your family. Sign in to get
          started.
        </p>

        <Button
          className="mt-8"
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleSignIn}
          leftIcon={<GoogleMark />}
        >
          Continue with Google
        </Button>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-8 20-20 0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C41.9 35.8 44 30.4 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  )
}
