import { NextRequest, NextResponse } from 'next/server'
import { requireBotAuth } from '@/lib/bot'
import { addTicketComment, findOrCreateBotActor, listTicketComments } from '@/services/botService'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const comments = await listTicketComments(id)
    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'No se pudieron obtener los comentarios',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: 'content es requerido' },
        { status: 400 }
      )
    }

    const actor = await findOrCreateBotActor({
      email: body.email,
      phone: body.phone,
      whatsappId: body.whatsappId,
      name: body.name,
      allowCreate: false,
    })

    const comment = await addTicketComment(id, actor.id, body.content)
    return NextResponse.json({ actor, comment }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'Usuario no encontrado') {
      return NextResponse.json(
        { error: 'user_not_found', message: 'No se encontró un usuario registrado. Este servicio es exclusivo para empleados registrados.' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'No se pudo crear el comentario', details: message },
      { status: 400 }
    )
  }
}
