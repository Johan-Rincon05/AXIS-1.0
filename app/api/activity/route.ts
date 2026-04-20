import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { type, ticket_id, user_id, description, metadata } = await req.json()

    if (!type || !ticket_id || !user_id || !description) {
      return NextResponse.json({ error: 'Campos requeridos: type, ticket_id, user_id, description' }, { status: 400 })
    }

    const row = await queryOne(
      `INSERT INTO activity_log (type, ticket_id, user_id, description, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [type, ticket_id, user_id, description, metadata ? JSON.stringify(metadata) : null]
    )

    const user = await queryOne(
      `SELECT name FROM users WHERE id = $1`,
      [user_id]
    )

    return NextResponse.json({ ...row, user_name: (user as any)?.name || 'Usuario' }, { status: 201 })
  } catch (err) {
    console.error('[API activity POST]', err)
    return NextResponse.json({ error: 'Error al registrar actividad' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await query(`DELETE FROM activity_log WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API activity DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar actividad' }, { status: 500 })
  }
}
