import { Ticket, TipoSolicitudCAM, SLA_DIAS_CAM, SLAMetric, MetricasTecnico, Status, Area } from '@/types'

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return result
}

function businessDaysBetween(start: Date, end: Date): number {
  let count = 0
  const current = new Date(start)
  while (current < end) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

export function calcularFechaLimiteSLA(ticket: Ticket): Date | null {
  if (ticket.area !== 'CAM' || !ticket.tipo_solicitud) return null
  const plazo = SLA_DIAS_CAM[ticket.tipo_solicitud]
  return addBusinessDays(new Date(ticket.created_at), plazo)
}

export function calcularSLAMetric(ticket: Ticket): SLAMetric {
  const fechaLimiteSLA = calcularFechaLimiteSLA(ticket)
  const now = new Date()
  const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at) : undefined
  const referenceDate = resolvedAt ?? now

  let enTiempo = true
  let diasRestantes: number | undefined

  if (fechaLimiteSLA) {
    enTiempo = referenceDate <= fechaLimiteSLA
    diasRestantes = businessDaysBetween(referenceDate, fechaLimiteSLA)
    if (!enTiempo) diasRestantes = -businessDaysBetween(fechaLimiteSLA, referenceDate)
  }

  return {
    ticketId: ticket.id,
    title: ticket.title,
    assignedTo: ticket.assigned_to,
    area: ticket.area,
    tipo_solicitud: ticket.tipo_solicitud,
    createdAt: ticket.created_at,
    resolvedAt: ticket.resolved_at,
    fechaLimiteSLA: fechaLimiteSLA?.toISOString(),
    enTiempo,
    diasRestantes,
    status: ticket.status,
  }
}

export function getMetricasPorTecnico(
  tickets: Ticket[],
  users: { id: string; name: string; area?: string | null }[]
): MetricasTecnico[] {
  const techUsers = users.filter(u => u.area)

  return techUsers.map(user => {
    const asignados = tickets.filter(t => t.assigned_to === user.id)
    const resueltos = asignados.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED)
    const metricas = asignados.map(calcularSLAMetric)
    const enTiempo = metricas.filter(m => m.enTiempo && m.resolvedAt).length
    const fueraDeTiempo = resueltos.length - enTiempo

    const tiempos = resueltos
      .filter(t => t.resolved_at)
      .map(t => {
        const ms = new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()
        return ms / (1000 * 60 * 60 * 24)
      })

    const tiempoPromedio = tiempos.length > 0 ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0
    const porcentaje = resueltos.length > 0 ? Math.round((enTiempo / resueltos.length) * 100) : 100

    return {
      userId: user.id,
      userName: user.name,
      area: user.area as Area,
      totalTickets: asignados.length,
      resueltos: resueltos.length,
      enTiempo,
      fueraDeTiempo,
      porcentajeCumplimiento: porcentaje,
      tiempoPromedioResolucion: Math.round(tiempoPromedio * 10) / 10,
    }
  })
}

export function getMetricasPersonales(
  userId: string,
  userName: string,
  area: Area,
  tickets: Ticket[]
): MetricasTecnico {
  const asignados = tickets.filter(t => t.assigned_to === userId)
  const resueltos = asignados.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED)
  const metricas = asignados.map(calcularSLAMetric)
  const enTiempo = metricas.filter(m => m.enTiempo && m.resolvedAt).length
  const fueraDeTiempo = resueltos.length - enTiempo

  const tiempos = resueltos
    .filter(t => t.resolved_at)
    .map(t => {
      const ms = new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()
      return ms / (1000 * 60 * 60 * 24)
    })

  const tiempoPromedio = tiempos.length > 0 ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0
  const porcentaje = resueltos.length > 0 ? Math.round((enTiempo / resueltos.length) * 100) : 100

  return {
    userId,
    userName,
    area,
    totalTickets: asignados.length,
    resueltos: resueltos.length,
    enTiempo,
    fueraDeTiempo,
    porcentajeCumplimiento: porcentaje,
    tiempoPromedioResolucion: Math.round(tiempoPromedio * 10) / 10,
  }
}
