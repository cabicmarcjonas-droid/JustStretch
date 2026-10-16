import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { on } from '../lib/eventBus.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Login survives a refresh because the server session cookie is checked on load.
  useEffect(() => {
    let cancelled = false
    api
      .get('/auth/me')
      .then(({ user: current }) => !cancelled && setUser(current))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [])

  // A 401 from any API call means the session is gone.
  useEffect(() => on('unauthenticated', () => setUser(null)), [])

  const login = useCallback(async (credentials) => {
    const { user: signedIn } = await api.post('/auth/login', credentials)
    setUser(signedIn)
    return signedIn
  }, [])

  const register = useCallback(async (details) => {
    const { user: created } = await api.post('/auth/register', details)
    setUser(created)
    return created
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout, setUser }),
    [user, ready, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
