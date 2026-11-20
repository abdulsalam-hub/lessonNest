import { useEffect, useState, type ReactNode } from 'react'
import { getIdTokenResult } from 'firebase/auth'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      setIsAdmin(false)
      return
    }

    setIsAdmin(null)
    getIdTokenResult(user, true)
      .then((token) => {
        if (!cancelled) setIsAdmin(token.claims.admin === true)
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (loading || (user && isAdmin === null)) {
    return (
      <main className="auth-page">
        <div className="auth-card" role="status">
          <p>Verifying administrator access…</p>
        </div>
      </main>
    )
  }

  if (!user) {
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
