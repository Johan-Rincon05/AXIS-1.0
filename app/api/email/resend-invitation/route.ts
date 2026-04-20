import { type NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@/services/userService'
import { emailService } from '@/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const sent = await emailService.sendInvitationEmail(user.email, user.name, user.role, user.area ?? null)
    if (!sent) return NextResponse.json({ error: 'No se pudo enviar el correo. Verifica las credenciales de email.' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[resend-invitation] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
