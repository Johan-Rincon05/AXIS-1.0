import { NextRequest, NextResponse } from 'next/server'
import { requireBotAuth } from '@/lib/bot'
import { createBotTicket, findOrCreateBotActor, listTicketsForActor } from '@/services/botService'
import { Priority, RESOLVER_AREAS, type Area } from '@/types'

function parsePriority(value?: string): Priority {
  switch ((value || '').toLowerCase()) {
    case 'alta':
    case 'high':
      return Priority.HIGH
    case 'baja':
    case 'low':
      return Priority.LOW
    default:
      return Priority.MEDIUM
  }
}

export async function GET(request: NextRequest) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || undefined
    const phone = searchParams.get('phone') || undefined
    const whatsappId = searchParams.get('whatsappId') || undefined
    const status = searchParams.get('status') || undefined
    const area = (searchParams.get('area') as Area | null) || undefined
    const limit = Number(searchParams.get('limit') || '10')

    const actor = await findOrCreateBotActor({
      email,
      phone,
      whatsappId,
      allowCreate: false,
    })

    const tickets = await listTicketsForActor(actor.id, area, status, limit)
    return NextResponse.json({ actor, tickets })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'Usuario no encontrado') {
      return NextResponse.json(
        { error: 'user_not_found', message: 'No se encontró un usuario registrado. Este servicio es exclusivo para empleados registrados.' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'No se pudieron consultar los tickets', details: message },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'title y description son requeridos' },
        { status: 400 }
      )
    }

    const area: Area = RESOLVER_AREAS.includes(body.area) ? body.area : 'DTI'

    const actor = await findOrCreateBotActor({
      email: body.email,
      phone: body.phone,
      whatsappId: body.whatsappId,
      name: body.name,
      allowCreate: false,
    })

    const ticket = await createBotTicket({
      title: body.title,
      description: body.description,
      priority: parsePriority(body.priority),
      category: body.category || 'WhatsApp',
      area,
      requester_id: actor.id,
      origin: body.origin || 'Interna',
      external_company: body.external_company,
      external_contact: body.external_contact,
      tipo_solicitud: body.tipo_solicitud,
      objetivo_solicitud: body.objetivo_solicitud,
      publico_objetivo: body.publico_objetivo,
      mensaje_clave: body.mensaje_clave,
      fecha_limite: body.fecha_limite,
    })

    return NextResponse.json({ actor, ticket }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'Usuario no encontrado') {
      return NextResponse.json(
        { error: 'user_not_found', message: 'No se encontró un usuario registrado. Este servicio es exclusivo para empleados registrados.' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'No se pudo crear el ticket', details: message },
      { status: 400 }
    )
  }
}
