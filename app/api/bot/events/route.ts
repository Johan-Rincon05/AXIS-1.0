import { NextRequest, NextResponse } from 'next/server'
import { requireBotAuth } from '@/lib/bot'
import { query } from '@/lib/db/client'
import { Role } from '@/types'

export async function GET(request: NextRequest) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const minutes = parseInt(searchParams.get('minutes') || '2', 10)

    // Buscar tickets creados recientemente que no tengan asignado
    const newTickets = await query(`
      SELECT t.id, t.title, t.area, u.phone as coord_phone, u.name as coord_name
      FROM tickets t
      JOIN users u ON u.area = t.area AND u.role = $1 AND u.is_active = TRUE
      WHERE t.created_at >= NOW() - INTERVAL '${minutes} minutes'
      AND t.assigned_to IS NULL
    `, [Role.COORDINADOR])

    // Buscar tickets que fueron resueltos recientemente
    const resolvedTickets = await query(`
      SELECT t.id, t.title, u.phone as requester_phone, u.name as requester_name
      FROM tickets t
      JOIN users u ON u.id = t.requester_id
      WHERE t.resolved_at >= NOW() - INTERVAL '${minutes} minutes'
      AND t.status IN ('Resuelto', 'Cerrado')
    `)

    return NextResponse.json({
      ok: true,
      newTickets,
      resolvedTickets
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Error fetching events' }, { status: 500 })
  }
}
