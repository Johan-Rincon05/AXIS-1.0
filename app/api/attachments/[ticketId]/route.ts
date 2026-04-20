import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { ticketId } = await params
    const rows = await query(
      `SELECT id, ticket_id, filename, original_name,
              file_url AS file_path, file_size, mime_type AS file_type,
              uploaded_by, created_at
       FROM attachments
       WHERE ticket_id = $1
       ORDER BY created_at DESC`,
      [ticketId]
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[API attachments GET by ticket]', err)
    return NextResponse.json({ error: 'Error al obtener adjuntos' }, { status: 500 })
  }
}
