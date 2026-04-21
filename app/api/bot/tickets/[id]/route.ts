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
    const ticket = await updateBotTicket(id, {
      status: body.status,
      priority: body.priority,
      category: body.category,
      assigned_to: body.assigned_to,
      resolution_notes: body.resolution_notes,
      tipo_solicitud: body.tipo_solicitud,
      objetivo_solicitud: body.objetivo_solicitud,
      publico_objetivo: body.publico_objetivo,
      mensaje_clave: body.mensaje_clave,
      fecha_limite: body.fecha_limite,
    })

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
