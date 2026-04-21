import { NextRequest, NextResponse } from 'next/server'

export const AXIS_BOT_API_KEY_ENV = 'AXIS_BOT_API_KEY'

export function getBotApiKey(): string | null {
  const value = process.env[AXIS_BOT_API_KEY_ENV]?.trim()
  return value || null
}

export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}

export function getBotTokenFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-axis-bot-key')?.trim() || getBearerToken(request) || null
}

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: 'No autorizado',
      message: `Incluye x-axis-bot-key o Authorization: Bearer <token>. Configura ${AXIS_BOT_API_KEY_ENV}.`,
    },
    { status: 401 }
  )
}

export function requireBotAuth(request: NextRequest): NextResponse | null {
  const expected = getBotApiKey()
  const provided = getBotTokenFromRequest(request)

  if (!expected || !provided || provided !== expected) {
    return unauthorizedResponse()
  }

  return null
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return ''

  if (digits.startsWith('+')) return digits
  if (digits.startsWith('57')) return `+${digits}`
  return `+57${digits}`
}

export function buildWhatsAppJidCandidates(raw: string): string[] {
  const normalized = normalizePhone(raw)
  const digits = normalized.replace(/^\+/, '')
  const jid = digits ? `${digits}@s.whatsapp.net` : ''

  return [raw.trim(), normalized, digits, jid].filter(Boolean)
}
