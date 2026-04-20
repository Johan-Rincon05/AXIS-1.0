export interface ActivityEvent {
  id: string
  type: 'comment' | 'assignment' | 'status_change' | 'creation' | 'transfer'
  ticket_id: string
  user_id: string
  user_name: string
  description: string
  metadata?: any
  created_at: string
}

export interface CreateActivityData {
  type: ActivityEvent['type']
  ticket_id: string
  user_id: string
  description: string
  metadata?: any
}

export const activityService = {
  async createActivity(data: CreateActivityData): Promise<ActivityEvent> {
    const res = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al registrar actividad')
    return res.json()
  },

  async getActivityByTicket(ticketId: string): Promise<ActivityEvent[]> {
    const res = await fetch(`/api/activity/${ticketId}`)
    if (!res.ok) return []
    return res.json()
  },

  async deleteActivity(activityId: string): Promise<void> {
    const res = await fetch(`/api/activity?id=${activityId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar actividad')
  },
}

export const createActivityEvents = {
  comment: (ticketId: string, userId: string, commentText: string): CreateActivityData => ({
    type: 'comment',
    ticket_id: ticketId,
    user_id: userId,
    description: `Agregó un comentario: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
    metadata: { comment_text: commentText },
  }),

  assignment: (ticketId: string, userId: string, assignedToUserId: string, assignedToUserName: string): CreateActivityData => ({
    type: 'assignment',
    ticket_id: ticketId,
    user_id: userId,
    description: `Asignó el ticket a ${assignedToUserName}`,
    metadata: { assigned_to_user_id: assignedToUserId, assigned_to_user_name: assignedToUserName },
  }),

  statusChange: (ticketId: string, userId: string, oldStatus: string, newStatus: string): CreateActivityData => ({
    type: 'status_change',
    ticket_id: ticketId,
    user_id: userId,
    description: `Cambió el estado de "${oldStatus}" a "${newStatus}"`,
    metadata: { old_status: oldStatus, new_status: newStatus },
  }),

  creation: (ticketId: string, userId: string, ticketTitle: string): CreateActivityData => ({
    type: 'creation',
    ticket_id: ticketId,
    user_id: userId,
    description: `Creó el ticket: "${ticketTitle}"`,
    metadata: { ticket_title: ticketTitle },
  }),

  transfer: (ticketId: string, userId: string, fromLevel: string, toLevel: string, toUserName: string): CreateActivityData => ({
    type: 'transfer',
    ticket_id: ticketId,
    user_id: userId,
    description: `Transfirió de ${fromLevel} a ${toLevel} (${toUserName})`,
    metadata: { from_level: fromLevel, to_level: toLevel, to_user_name: toUserName },
  }),
}
