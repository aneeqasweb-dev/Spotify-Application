import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready
  // true right after the user clicks "Log out" (vs. a session that expired)
  const [signedOut, setSignedOut] = useState(false)

  // The token cookie is HTTP-only, so ask the backend who is logged in
  useEffect(() => {
    let alive = true
    authApi
      .me()
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setStatus('ready'))
    return () => {
      alive = false
    }
  }, [])

  // If any music request says 401, the session has expired -> back to login
  useEffect(() => {
    const id = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || ''
        if (error.response?.status === 401 && !url.startsWith('/auth/')) setUser(null)
        return Promise.reject(error)
      },
    )
    return () => api.interceptors.response.eject(id)
  }, [])

  const login = useCallback(async (identifier, password) => {
    const u = await authApi.login(identifier, password)
    setSignedOut(false)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (data) => {
    const u = await authApi.register(data)
    setSignedOut(false)
    setUser(u)
    return u
  }, [])

  const continueAsGuest = useCallback(async () => {
    const u = await authApi.guest()
    setSignedOut(false)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setSignedOut(true)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, signedOut, isArtist: user?.role === 'artist', isGuest: Boolean(user?.isGuest), login, register, continueAsGuest, logout }),
    [user, status, signedOut, login, register, continueAsGuest, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
