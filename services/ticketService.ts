import { query, queryOne } from '@/lib/db/client'
import { Ticket, Priority, Status, Area, TipoSolicitudCAM } from '@/types'
import { getColombiaTimestamp } from '@/utils/colombiaTime'

export { type Ticket, Priority, Status }

export interface CreateTicketData {
  title: string
  description: string
  priority: Priority
  category: string
  area: Area
  requester_id: string
  assigned_to?: string
  // DTI
  origin?: 'Interna' | 'Externa'
  external_company?: string
  external_contact?: string
  // CAM
  tipo_solicitud?: TipoSolicitudCAM
  objetivo_solicitud?: string
  publico_objetivo?: string
  mensaje_clave?: string
  fecha_limite?: string
}

export interface UpdateTicketData {
  title?: string
  description?: string
  priority?: Priority
  status?: Status
  category?: string
  assigned_to?: string | null
  resolution_notes?: string
  resolved_at?: string
  tipo_solicitud?: TipoSolicitudCAM
  objetivo_solicitud?: string
  publico_objetivo?: string
  mensaje_clave?: string
  fecha_limite?: string
}

// Query base que incluye comentarios embebidos y datos de usuarios relacionados
const TICKET_SELECT = `
  SELECT
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
`

function normalizeTicket(row: any): Ticket {
  if (!row) return row
  // Limpiar el objeto assigned_user si no hay asignado
  if (row.assigned_user && !row.assigned_user.name) {
    row.assigned_user = null
  }
  if (row.creator && !row.creator.name) {
    row.creator = null
  }
  return {
    ...row,
    comments: row.comments || [],
    attachments: row.attachments || [],
  }
}

export async function getAllTickets(): Promise<Ticket[]> {
  const rows = await query(
    `${TICKET_SELECT}
     GROUP BY t.id, au.name, au.email, cu.name, cu.email
     ORDER BY t.created_at DESC`
  )
  return rows.map(normalizeTicket)
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const row = await queryOne(
    `${TICKET_SELECT}
     WHERE t.id = $1
     GROUP BY t.id, au.name, au.email, cu.name, cu.email`,
    [id]
  )
  return row ? normalizeTicket(row) : null
}

export async function getTicketsByArea(area: Area): Promise<Ticket[]> {
  const rows = await query(
    `${TICKET_SELECT}
     WHERE t.area = $1
     GROUP BY t.id, au.name, au.email, cu.name, cu.email
     ORDER BY t.created_at DESC`,
    [area]
  )
  return rows.map(normalizeTicket)
}

export async function getTicketsByUser(userId: string): Promise<Ticket[]> {
  const rows = await query(
    `${TICKET_SELECT}
     WHERE t.created_by = $1 OR t.assigned_to = $1
     GROUP BY t.id, au.name, au.email, cu.name, cu.email
     ORDER BY t.created_at DESC`,
    [userId]
  )
  return rows.map(normalizeTicket)
}

export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  const row = await queryOne(
    `INSERT INTO tickets (
       title, description, priority, status, category, area,
       created_by, assigned_to,
       origin, external_company, external_contact,
       tipo_solicitud, objetivo_solicitud, publico_objetivo, mensaje_clave, fecha_limite
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    [
      data.title,
      data.description,
      data.priority,
      Status.OPEN,
      data.category || 'Otro',
      data.area,
      data.requester_id,
      data.assigned_to ?? null,
      data.origin ?? (data.area === 'DTI' ? 'Interna' : null),
      data.external_company ?? null,
      data.external_contact ?? null,
      data.tipo_solicitud ?? null,
      data.objetivo_solicitud ?? null,
      data.publico_objetivo ?? null,
      data.mensaje_clave ?? null,
      data.fecha_limite ?? null,
    ]
  )
  if (!row) throw new Error('Error al crear ticket')
  const ticket = await getTicketById(row.id)
  if (!ticket) throw new Error('Error al obtener ticket creado')
  return ticket
}

export async function updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  const allowed: (keyof UpdateTicketData)[] = [
    'title', 'description', 'priority', 'status', 'category',
    'assigned_to', 'resolution_notes', 'resolved_at',
    'tipo_solicitud', 'objetivo_solicitud', 'publico_objetivo',
    'mensaje_clave', 'fecha_limite',
  ]

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${idx++}`)
      values.push((data as any)[key])
    }
  }

  if (data.status === Status.RESOLVED && !data.resolved_at) {
    fields.push(`resolved_at = $${idx++}`)
    values.push(getColombiaTimestamp())
  }

  if (fields.length === 0) throw new Error('No hay campos para actualizar')

  values.push(id)
  await query(
    `UPDATE tickets SET ${fields.join(', ')} WHERE id = $${idx}`,
    values
  )

  const ticket = await getTicketById(id)
  if (!ticket) throw new Error('Ticket no encontrado')
  return ticket
}

export async function deleteTicket(id: string): Promise<void> {
  await query(`DELETE FROM tickets WHERE id = $1`, [id])
}
