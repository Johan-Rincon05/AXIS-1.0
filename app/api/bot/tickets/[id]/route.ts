import { NextRequest, NextResponse } from 'next/server'
import { requireBotAuth } from '@/lib/bot'
import { getTicketForBot, updateBotTicket } from '@/services/botService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const ticket = await getTicketForBot(id)

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'No se pudo obtener el ticket',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    const allowed = [
      'status', 'priority', 'category', 'assigned_to',
      'resolution_notes', 'tipo_solicitud', 'objetivo_solicitud',
      'publico_objetivo', 'mensaje_clave', 'fecha_limite',
    ] as const

    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron campos para actualizar' },
        { status: 400 }
      )
    }

    const ticket = await updateBotTicket(id, updates)

    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'No se pudo actualizar el ticket',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 400 }
    )
  }
}
