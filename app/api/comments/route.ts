import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { ticket_id, user_id, content } = await req.json()

    if (!ticket_id || !user_id || !content?.trim()) {
      return NextResponse.json({ error: 'Campos requeridos: ticket_id, user_id, content' }, { status: 400 })
    }

    const row = await queryOne(
      `INSERT INTO comments (ticket_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content AS text,
         (SELECT name FROM users WHERE id = $2) AS author,
         created_at AS timestamp`,
      [ticket_id, user_id, content.trim()]
    )

    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error('[API comments POST]', err)
    return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await query(`DELETE FROM comments WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API comments DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar comentario' }, { status: 500 })
  }
}
