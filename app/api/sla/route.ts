import { NextRequest, NextResponse } from 'next/server'
import { getAllTickets } from '@/services/ticketService'
import { getAllUsers } from '@/services/userService'
import { getMetricasPorTecnico, getMetricasPersonales } from '@/services/slaService'
import { Area } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userName = searchParams.get('userName')
    const email = searchParams.get('email')
    const area = searchParams.get('area') as Area | null

    const [tickets, users] = await Promise.all([
      getAllTickets(),
      getAllUsers()
    ])

    const filteredTickets = area ? tickets.filter(t => t.area === area) : tickets

    const metricas = await getMetricasPorTecnico(filteredTickets, users)
    
    let currentUserMetrica = undefined
    if (userId && userName && email && area) {
      currentUserMetrica = await getMetricasPersonales(userId, userName, email, area, filteredTickets)
    }

    return NextResponse.json({ metricas, currentUserMetrica })
  } catch (error) {
    return NextResponse.json({ error: 'Error calculating SLA metrics' }, { status: 500 })
  }
}
