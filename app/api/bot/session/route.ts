import { NextRequest, NextResponse } from 'next/server'
import { requireBotAuth } from '@/lib/bot'
import { findOrCreateBotActor, listTicketsForActor } from '@/services/botService'
import type { Area } from '@/types'

export async function POST(request: NextRequest) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const actor = await findOrCreateBotActor({
      email: body.email,
      phone: body.phone,
      whatsappId: body.whatsappId,
      name: body.name,
      allowCreate: body.allowCreate ?? false,
    })

    const tickets = await listTicketsForActor(
      actor.id,
      body.area as Area | undefined,
      body.status,
      body.limit ?? 10
    )

    return NextResponse.json({ actor, tickets })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'

    if (message === 'Usuario no encontrado') {
      return NextResponse.json(
        {
          error: 'user_not_found',
          message: 'No se encontró un usuario registrado con ese número de teléfono. Este servicio es exclusivo para empleados registrados.',
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'session_error',
        details: message,
      },
      { status: 400 }
    )
  }
}
