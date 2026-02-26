import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { setAuthFromToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setAuthFromToken(token)
        .then(() => navigate('/dashboard', { replace: true }))
        .catch(() => {
          setError('Authentication failed. Please try again.')
          setTimeout(() => navigate('/login', { replace: true }), 2000)
        })
    } else {
      setError('No authentication token received.')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-destructive text-lg font-medium mb-2">{error}</p>
            <p className="text-muted-foreground text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  )
}
