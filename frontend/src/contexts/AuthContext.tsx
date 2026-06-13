import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { tokenStore } from '@/api/tokenStore'
import { loginApi } from '@/api/auth'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'sales_rep'
  displayName: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateDisplayName: (name: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseJwt(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1]
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return JSON.parse(atob(padded))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const tokenRef = useRef<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await loginApi(email, password)
    const payload = parseJwt(access_token)
    tokenRef.current = access_token
    tokenStore.setToken(access_token)
    setUser({
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as AuthUser['role'],
      displayName: null,
    })
  }, [])

  const logout = useCallback(() => {
    tokenRef.current = null
    tokenStore.setToken(null)
    setUser(null)
  }, [])

  const updateDisplayName = useCallback((name: string) => {
    setUser((prev) => prev ? { ...prev, displayName: name } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
