'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User, Area } from '@/types'
import { userServiceClient } from '@/services/userServiceClient'
import type { CreateUserData } from '@/services/userServiceClient'

interface UsersContextValue {
  users: User[]
  isLoading: boolean
  reload: () => Promise<void>
  createUser: (data: CreateUserData) => Promise<User>
  updateUser: (id: string, data: Partial<CreateUserData & { is_active?: boolean }>) => Promise<User>
  inactivateUser: (id: string) => Promise<void>
  activateUser: (id: string) => Promise<void>
  getByArea: (area: Area) => User[]
}

const UsersContext = createContext<UsersContextValue | null>(null)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const fetched = await userServiceClient.getAllUsers()
      setUsers(fetched)
    } catch (e) {
      console.error('[AXIS] Error loading users:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const createUser = useCallback(async (data: CreateUserData) => {
    const user = await userServiceClient.createUser(data)
    setUsers(prev => [user, ...prev])
    return user
  }, [])

  const updateUser = useCallback(async (id: string, data: Partial<CreateUserData>) => {
    const user = await userServiceClient.updateUser(id, data)
    setUsers(prev => prev.map(u => u.id === id ? user : u))
    return user
  }, [])

  const inactivateUser = useCallback(async (id: string) => {
    const updated = await userServiceClient.updateUser(id, { is_active: false } as any)
    setUsers(prev => prev.map(u => u.id === id ? updated : u))
  }, [])

  const activateUser = useCallback(async (id: string) => {
    const updated = await userServiceClient.updateUser(id, { is_active: true } as any)
    setUsers(prev => prev.map(u => u.id === id ? updated : u))
  }, [])

  const getByArea = useCallback((area: Area) =>
    users.filter(u => u.area === area), [users])

  return (
    <UsersContext.Provider value={{
      users, isLoading, reload,
      createUser, updateUser,
      inactivateUser, activateUser,
      getByArea,
    }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used within UsersProvider')
  return ctx
}
