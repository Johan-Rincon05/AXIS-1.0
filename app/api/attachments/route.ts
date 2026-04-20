import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const row = await queryOne(`SELECT * FROM attachments WHERE id = $1`, [id])
    if (!row) return NextResponse.json({ error: 'Adjunto no encontrado' }, { status: 404 })
    return NextResponse.json(row)
  } catch (err) {
    console.error('[API attachments GET]', err)
    return NextResponse.json({ error: 'Error al obtener adjunto' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ticket_id, uploaded_by, filename, original_name, file_size, file_type, file_path } = await req.json()

    if (!ticket_id || !uploaded_by || !filename || !file_path) {
      return NextResponse.json({ error: 'Campos requeridos: ticket_id, uploaded_by, filename, file_path' }, { status: 400 })
    }

    const row = await queryOne(
      `INSERT INTO attachments (ticket_id, uploaded_by, filename, original_name, file_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, ticket_id, filename, original_name, file_url AS file_path, file_size, mime_type AS file_type, uploaded_by, created_at`,
      [ticket_id, uploaded_by, filename, original_name || filename, file_path, file_size || 0, file_type || 'application/octet-stream']
    )

    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error('[API attachments POST]', err)
    return NextResponse.json({ error: 'Error al guardar adjunto' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await query(`DELETE FROM attachments WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API attachments DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar adjunto' }, { status: 500 })
  }
}
