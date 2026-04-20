import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { ticketId } = await params
    const rows = await query(
      `SELECT c.id, u.name AS author, c.content AS text, c.created_at AS timestamp
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [ticketId]
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[API comments GET]', err)
    return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 })
  }
}
