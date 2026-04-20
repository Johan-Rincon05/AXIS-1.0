import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { ticketId } = await params
    const rows = await query(
      `SELECT a.*, u.name AS user_name
       FROM activity_log a
       JOIN users u ON a.user_id = u.id
       WHERE a.ticket_id = $1
       ORDER BY a.created_at ASC`,
      [ticketId]
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[API activity GET]', err)
    return NextResponse.json({ error: 'Error al obtener actividad' }, { status: 500 })
  }
}
