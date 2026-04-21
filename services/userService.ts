import 'server-only'
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
     FROM users WHERE email = $1 AND is_active = TRUE`,
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
  // Desasociar comentarios del usuario (mantener historial, no borrar)
  await query(`UPDATE comments SET user_id = NULL WHERE user_id = $1`, [id])
  // Marcar inactivo (soft delete) para no romper tickets creados por el usuario
  await query(`UPDATE users SET is_active = FALSE WHERE id = $1`, [id])
}

