import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/services/userService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXTAUTH_URL || ''

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?auth_error=no_code`)
  }

  try {
    // Intercambiar código por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('[Google OAuth] Token error:', tokens)
      return NextResponse.redirect(`${appUrl}/?auth_error=token_failed`)
    }

    // Obtener info del usuario de Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userInfoRes.json()

    if (!googleUser.email) {
      return NextResponse.redirect(`${appUrl}/?auth_error=no_email`)
    }

    // Buscar usuario en la base de datos por email
    const user = await getUserByEmail(googleUser.email)

    if (!user) {
      return NextResponse.redirect(`${appUrl}/?auth_error=user_not_found`)
    }

    if (user.is_active === false) {
      return NextResponse.redirect(`${appUrl}/?auth_error=user_inactive`)
    }

    // Redirigir al frontend con el ID del usuario para auto-login
    return NextResponse.redirect(`${appUrl}/?google_user_id=${user.id}`)
  } catch (e: any) {
    console.error('[Google OAuth] Error:', e)
    return NextResponse.redirect(`${appUrl}/?auth_error=oauth_failed`)
  }
}
