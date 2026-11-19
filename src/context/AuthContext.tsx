import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getFirebaseServices } from '../lib/firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const { auth } = getFirebaseServices()
      return onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser)
          setLoading(false)
        },
        () => {
          setUser(null)
          setLoading(false)
        },
      )
    } catch {
      setUser(null)
      setLoading(false)
      return undefined
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
