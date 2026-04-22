import { NextRequest, NextResponse } from 'next/server'
import { requireBotAuth } from '@/lib/bot'
import { getAllTickets } from '@/services/ticketService'
import { getAllUsers } from '@/services/userService'
import { getMetricasPorTecnico } from '@/services/slaService'
import { Role } from '@/types'

export async function GET(request: NextRequest) {
  // Proteger el endpoint con la misma autenticación del bot
  const authError = requireBotAuth(request)
  if (authError) return authError

  try {
    // 1. Obtener todos los tickets y usuarios activos
    const [tickets, users] = await Promise.all([
      getAllTickets(),
      getAllUsers()
    ])

    // 2. Filtrar solo técnicos de DTI (Asistencia, Coordinador, Gerente)
    const dtiUsers = users.filter(u => 
      u.area === 'DTI' && 
      [Role.ASISTENCIA, Role.COORDINADOR, Role.GERENTE].includes(u.role)
    )

    // 3. Calcular las métricas usando la función que ya existe
    const metricas = await getMetricasPorTecnico(tickets, dtiUsers)

    // 4. Filtrar los que tengan menos del 80% de cumplimiento y al menos 1 ticket o tarea
    const lowPerformers = metricas
      .filter(m => m.porcentajeCumplimiento < 80 && (m.totalTickets > 0 || m.linear.totalAsignadas > 0))
      .map(m => {
        // Buscar el teléfono del usuario para que Anthon sepa a quién escribirle
        const user = dtiUsers.find(u => u.id === m.userId)
        return {
          id: m.userId,
          name: m.userName,
          phone: user?.phone || null,
          totalTickets: m.totalTickets,
          resueltos: m.resueltos,
          fueraDeTiempo: m.fueraDeTiempo,
          porcentaje: m.porcentajeCumplimiento
        }
      })
      // Filtrar usuarios que no tengan número de teléfono registrado
      .filter(u => u.phone !== null)

    return NextResponse.json({ 
      ok: true, 
      count: lowPerformers.length,
      data: lowPerformers 
    })

  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'No se pudieron calcular las métricas',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
