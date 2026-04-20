import { query, queryOne } from '@/lib/db/client'
import { User, Role, Area } from '@/types'

export type { User }

export interface CreateUserData {
  email: string
  name: string
  phone?: string
  role: Role
  area?: Area | null
}

// ─── Server-side functions (usadas por API routes) ────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  return query<User>(
    `SELECT id, name, email, phone, role, area, is_active, created_at, updated_at
     FROM users
     WHERE is_active = TRUE
     ORDER BY created_at DESC`
  )
}

export async function getUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT id, name, email, phone, role, area, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  )
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT id, name, email, phone, role, area, is_active, created_at, updated_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  )
}

export async function createUser(data: CreateUserData): Promise<User> {
  const existing = await getUserByEmail(data.email)
  if (existing) throw new Error('Ya existe un usuario con este email')

  const row = await queryOne<User>(
    `INSERT INTO users (name, email, phone, role, area)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role, area, is_active, created_at, updated_at`,
    [data.name, data.email.toLowerCase(), data.phone ?? null, data.role, data.area ?? null]
  )
  if (!row) throw new Error('Error al crear usuario')
  return row
}

export async function updateUser(id: string, data: Partial<CreateUserData>): Promise<User> {
  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name) }
  if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email.toLowerCase()) }
  if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone) }
  if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role) }
  if (data.area !== undefined) { fields.push(`area = $${idx++}`); values.push(data.area) }

  if (fields.length === 0) throw new Error('No hay campos para actualizar')

  values.push(id)
  const row = await queryOne<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, email, phone, role, area, is_active, created_at, updated_at`,
    values
  )
  if (!row) throw new Error('Usuario no encontrado')
  return row
}

export async function deleteUser(id: string): Promise<void> {
  // Desvincular tickets asignados al usuario
  await query(`UPDATE tickets SET assigned_to = NULL WHERE assigned_to = $1`, [id])
  // Eliminar comentarios del usuario
  await query(`DELETE FROM comments WHERE user_id = $1`, [id])
  // Marcar inactivo (soft delete) para no romper tickets creados por el usuario
  await query(`UPDATE users SET is_active = FALSE WHERE id = $1`, [id])
}

// ─── Client-side (browser) — llama las API routes ─────────────────────────────

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
    const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`)
    if (!res.ok) throw new Error('Error al obtener usuario')
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
