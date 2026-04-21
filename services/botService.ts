import 'server-only'
import { query, queryOne } from '@/lib/db/client'
import { buildWhatsAppJidCandidates, normalizePhone } from '@/lib/bot'
import { createUser, getUserByEmail, getUserById, type CreateUserData, type User } from '@/services/userService'
import { createTicket, getTicketById, updateTicket, type CreateTicketData, type UpdateTicketData } from '@/services/ticketService'
import { Role, type Area, type Ticket } from '@/types'

export interface BotActorLookup {
  email?: string
  phone?: string
  whatsappId?: string
  name?: string
  allowCreate?: boolean
  role?: Role
  area?: Area | null
}

export interface BotComment {
  id: string
  author: string
  text: string
  timestamp: string
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const candidates = buildWhatsAppJidCandidates(phone)
  if (!candidates.length) return null

  return queryOne<User>(
    `SELECT id, name, email, phone, role, area, is_active, created_at, updated_at
     FROM users
     WHERE phone = ANY($1::text[])
     ORDER BY created_at DESC
     LIMIT 1`,
    [candidates]
  )
}

export async function findOrCreateBotActor(input: BotActorLookup): Promise<User> {
  if (input.email) {
    const existing = await getUserByEmail(input.email)
    if (existing) return existing
  }

  if (input.phone) {
    const existing = await findUserByPhone(input.phone)
    if (existing) return existing
  }

  if (!input.allowCreate) {
    throw new Error('Usuario no encontrado')
  }

  const email =
    input.email?.toLowerCase() ||
    `${(input.whatsappId || input.phone || `bot-${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '_')}@bot.axis`

  const payload: CreateUserData = {
    email,
    name: input.name?.trim() || 'Usuario WhatsApp',
    phone: input.phone ? normalizePhone(input.phone) : input.whatsappId,
    role: input.role || Role.EMPLEADO,
    area: input.area ?? null,
  }

  return createUser(payload)
}

export async function listTicketsForActor(userId: string, area?: Area, status?: string, limit = 10): Promise<Ticket[]> {
  const values: any[] = [userId]
  const where = ['(t.created_by = $1 OR t.assigned_to = $1)']
  let index = 2

  if (area) {
    where.push(`t.area = $${index++}`)
    values.push(area)
  }

  if (status) {
    where.push(`t.status = $${index++}`)
    values.push(status)
  }

  values.push(Math.max(1, Math.min(limit, 50)))

  return query<Ticket>(
    `SELECT
       t.*,
       t.created_by AS requester_id,
       json_build_object('name', au.name, 'email', au.email) AS assigned_user,
       json_build_object('name', cu.name, 'email', cu.email) AS creator,
       COALESCE(
         json_agg(
           json_build_object(
             'id', c.id,
             'author', cu2.name,
             'text', c.content,
             'timestamp', c.created_at
           ) ORDER BY c.created_at ASC
         ) FILTER (WHERE c.id IS NOT NULL),
         '[]'::json
       ) AS comments
     FROM tickets t
     LEFT JOIN users au ON t.assigned_to = au.id
     LEFT JOIN users cu ON t.created_by = cu.id
     LEFT JOIN comments c ON c.ticket_id = t.id
     LEFT JOIN users cu2 ON c.user_id = cu2.id
     WHERE ${where.join(' AND ')}
     GROUP BY t.id, au.name, au.email, cu.name, cu.email
     ORDER BY t.updated_at DESC
     LIMIT $${index}`,
    values
  )
}

export async function listTicketComments(ticketId: string): Promise<BotComment[]> {
  return query<BotComment>(
    `SELECT c.id, u.name AS author, c.content AS text, c.created_at AS timestamp
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.ticket_id = $1
     ORDER BY c.created_at ASC`,
    [ticketId]
  )
}

export async function addTicketComment(ticketId: string, userId: string, content: string): Promise<BotComment> {
  const row = await queryOne<BotComment>(
    `INSERT INTO comments (ticket_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, content AS text,
       (SELECT name FROM users WHERE id = $2) AS author,
       created_at AS timestamp`,
    [ticketId, userId, content.trim()]
  )

  if (!row) {
    throw new Error('No se pudo crear el comentario')
  }

  return row
}

export async function getTicketForBot(id: string): Promise<Ticket | null> {
  return getTicketById(id)
}

export async function createBotTicket(data: CreateTicketData): Promise<Ticket> {
  return createTicket(data)
}

export async function updateBotTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
  return updateTicket(id, data)
}

export async function getUserSafe(userId: string): Promise<User | null> {
  return getUserById(userId)
}
