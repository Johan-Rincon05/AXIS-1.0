import { Comment } from '@/types'

export interface CreateCommentData {
  ticket_id: string
  user_id: string
  content: string
}

export const commentService = {
  async createComment(data: CreateCommentData): Promise<Comment> {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al crear comentario')
    return res.json()
  },

  async getCommentsByTicket(ticketId: string): Promise<Comment[]> {
    const res = await fetch(`/api/comments/${ticketId}`)
    if (!res.ok) return []
    return res.json()
  },

  async deleteComment(commentId: string): Promise<void> {
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar comentario')
  },
}
