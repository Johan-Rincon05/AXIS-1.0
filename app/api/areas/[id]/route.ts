import { type NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query('DELETE FROM areas WHERE id = $1', [params.id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[areas] DELETE error:', error)
    return NextResponse.json({ error: 'Error al eliminar área' }, { status: 500 })
  }
}
