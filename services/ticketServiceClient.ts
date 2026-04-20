import { Ticket, Priority, Status, Area, TipoSolicitudCAM } from '@/types'

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

export const ticketServiceClient = {
  async getAllTickets(): Promise<Ticket[]> {
    const res = await fetch('/api/tickets')
    if (!res.ok) throw new Error('Error al obtener tickets')
    return res.json()
  },

  async getTicketById(id: string): Promise<Ticket | null> {
    const res = await fetch(`/api/tickets/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Error al obtener ticket')
    return res.json()
  },

  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear ticket')
    }
    return res.json()
  },

  async updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar ticket')
    }
    return res.json()
  },

  async deleteTicket(id: string): Promise<void> {
    const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar ticket')
    }
  },
}
