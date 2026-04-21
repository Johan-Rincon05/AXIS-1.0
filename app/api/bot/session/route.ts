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
      allowCreate: body.allowCreate ?? true,
    })

    const tickets = await listTicketsForActor(
      actor.id,
      body.area as Area | undefined,
      body.status,
      body.limit ?? 10
    )

    return NextResponse.json({ actor, tickets })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'No se pudo abrir la sesión del bot',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 400 }
    )
  }
}
