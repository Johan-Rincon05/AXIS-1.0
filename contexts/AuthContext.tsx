'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User, Role } from '@/types'

interface AuthContextValue {
  currentUser: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  updateCurrentUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('axis_currentUser')
    return saved ? JSON.parse(saved) : null
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (currentUser) {
      localStorage.setItem('axis_currentUser', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('axis_currentUser')
    }
  }, [currentUser])

  const login = useCallback((user: User) => {
    setCurrentUser(user)
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  const updateCurrentUser = useCallback((user: User) => {
    setCurrentUser(user)
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Role helpers
export const isSuperUser = (role: Role) => role === Role.SUPER_USER
export const isEmpleado = (role: Role) => role === Role.EMPLEADO
export const isAsistencia = (role: Role) => role === Role.ASISTENCIA
export const isCoordinador = (role: Role) => role === Role.COORDINADOR
export const isGerente = (role: Role) => role === Role.GERENTE
export const canManageTickets = (role: Role) => [Role.ASISTENCIA, Role.COORDINADOR, Role.GERENTE].includes(role)
export const canAssignTickets = (role: Role) => [Role.COORDINADOR, Role.GERENTE].includes(role)
export const canViewSLA = (role: Role) => [Role.COORDINADOR, Role.GERENTE].includes(role)
export const canManageUsers = (role: Role) => role === Role.SUPER_USER
