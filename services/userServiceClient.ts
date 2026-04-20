'use client'

import { User, Role, Area } from '@/types'

export interface CreateUserData {
  email: string
  name: string
  phone?: string
  role: Role
  area?: Area | null
}

export const userServiceClient = {
  async getAllUsers(): Promise<User[]> {
    const res = await fetch('/api/users')
    if (!res.ok) throw new Error('Error al obtener usuarios')
    return res.json()
  },

  async getUserById(id: string): Promise<User | null> {
    const res = await fetch(`/api/users/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Error al obtener usuario')
    return res.json()
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const res = await fetch('/api/users')
    if (!res.ok) throw new Error('Error al obtener usuarios')
    const users: User[] = await res.json()
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null
  },

  async createUser(data: CreateUserData): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear usuario')
    }
    return res.json()
  },

  async updateUser(id: string, data: Partial<CreateUserData>): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar usuario')
    }
    return res.json()
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar usuario')
    }
  },
}
