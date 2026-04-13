import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
  changePassword: (oldPwd: string, newPwd: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_KEY = 'sesmt_admin_auth'
// Default password if not overridden by env. This ensures tests work immediately.
const MASTER_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'sesmt2026'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Initialization: check memory token
  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY)
    if (token === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const getActivePassword = () => {
    const custom = localStorage.getItem('sesmt_custom_pwd')
    return custom ? custom : MASTER_PASSWORD
  }

  const login = (password: string) => {
    if (password === getActivePassword()) {
      localStorage.setItem(AUTH_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    setIsAuthenticated(false)
  }

  const changePassword = (oldPwd: string, newPwd: string) => {
    if (oldPwd === getActivePassword()) {
      localStorage.setItem('sesmt_custom_pwd', newPwd)
      return true
    }
    return false
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
