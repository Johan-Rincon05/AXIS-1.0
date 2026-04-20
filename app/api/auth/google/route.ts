import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Google OAuth pendiente de implementación (Fase 3)
// Requiere configurar un proveedor OAuth propio o usar NextAuth.js
export async function GET() {
  return NextResponse.json(
    { error: 'Login con Google no disponible por el momento' },
    { status: 501 }
  )
}
