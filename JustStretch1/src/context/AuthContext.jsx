import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { on } from '../lib/eventBus.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [pendingVerification, setPendingVerification] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get('/auth/me')
      .then(({ user: current, ...rest }) => {
        if (cancelled) return
        setUser(current ?? null)
        setPendingVerification(rest.verificationRequired ? rest : null)
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setPendingVerification(null)
      })
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(
    () =>
      on('unauthenticated', () => {
        setUser(null)
        setPendingVerification(null)
      }),
    [],
  )

  const accept = useCallback((payload) => {
    if (payload?.user) {
      setUser(payload.user)
      setPendingVerification(null)
      return { user: payload.user }
    }
    if (payload?.verificationRequired) {
      setUser(null)
      setPendingVerification(payload)
    }
    return payload
  }, [])

  const login = useCallback(
    async (credentials) => {
      const payload = await api.post('/auth/login', credentials)
      return accept(payload)
    },
    [accept],
  )

  const register = useCallback(
    async (details) => {
      const payload = await api.post('/auth/register', details)
      return accept(payload)
    },
    [accept],
  )

  const verifyEmail = useCallback(
    async (code) => {
      const { user: verified } = await api.post('/auth/verify-email', { code })
      setUser(verified)
      setPendingVerification(null)
      return verified
    },
    [],
  )

  const resendVerification = useCallback(async () => {
    const result = await api.post('/auth/resend-verification')
    setPendingVerification((current) => (current ? { ...current, ...result, verificationRequired: true } : current))
    return result
  }, [])

  const cancelVerification = useCallback(async () => {
    await api.post('/auth/cancel-verification').catch(() => {})
    setPendingVerification(null)
  }, [])

  const clearAuth = useCallback(() => {
    setUser(null)
    setPendingVerification(null)
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    clearAuth()
  }, [clearAuth])

  const value = useMemo(
    () => ({
      user,
      ready,
      pendingVerification,
      login,
      register,
      verifyEmail,
      resendVerification,
      cancelVerification,
      logout,
      clearAuth,
      setUser,
    }),
    [user, ready, pendingVerification, login, register, verifyEmail, resendVerification, cancelVerification, logout, clearAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
