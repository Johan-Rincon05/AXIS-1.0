import { type NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db/client'

export async function GET() {
  try {
    const rows = await query('SELECT id, name FROM areas ORDER BY name ASC')
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[areas] GET error:', error)
    return NextResponse.json({ error: 'Error al obtener áreas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    const row = await queryOne(
      'INSERT INTO areas (name) VALUES ($1) RETURNING id, name',
      [name.trim()]
    )
    return NextResponse.json(row, { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'El área ya existe' }, { status: 409 })
    }
    console.error('[areas] POST error:', error)
    return NextResponse.json({ error: 'Error al crear área' }, { status: 500 })
  }
}
