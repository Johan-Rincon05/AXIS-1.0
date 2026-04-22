import { Ticket, TipoSolicitudCAM, SLA_DIAS_CAM, SLA_DTI, SLAMetric, MetricasTecnico, Status, Area, Priority, LinearMetrica } from '@/types'
import { getLinearMetricsByEmail } from './linearService'

// ─── Business hours helpers (8:00–17:00 Mon–Fri) ─────────────────────────────

const BH_START = 8 * 60   // 480 min
const BH_END   = 17 * 60  // 1020 min

function minutesInWorkdaySlice(dayMidnight: Date, from: Date, to: Date): number {
  const ms = dayMidnight.getTime()
  const dayEnd = ms + 24 * 60 * 60 * 1000
  const fromMs = Math.max(from.getTime(), ms)
  const toMs   = Math.min(to.getTime(), dayEnd)
  if (toMs <= fromMs) return 0
  const fromMin = (fromMs - ms) / 60000
  const toMin   = (toMs   - ms) / 60000
  return Math.max(0, Math.min(toMin, BH_END) - Math.max(fromMin, BH_START))
}

export function businessMinutesBetween(start: Date, end: Date): number {
  if (end <= start) return 0
  let total = 0
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  while (cur <= end) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) total += minutesInWorkdaySlice(cur, start, end)
    cur.setDate(cur.getDate() + 1)
  }
  return total
}

export function addBusinessHours(date: Date, hours: number): Date {
  const result = new Date(date)
  let mins = hours * 60

  // Snap to inside business hours
  const snapToNextWorkStart = (d: Date) => {
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    if (d.getHours() * 60 + d.getMinutes() >= BH_END) {
      d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0)
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    } else if (d.getHours() * 60 + d.getMinutes() < BH_START) {
      d.setHours(8, 0, 0, 0)
    }
  }
  snapToNextWorkStart(result)

  while (mins > 0) {
    const curMin = result.getHours() * 60 + result.getMinutes()
    const left = BH_END - curMin
    if (mins <= left) {
      result.setMinutes(result.getMinutes() + Math.round(mins))
      break
    }
    mins -= left
    result.setDate(result.getDate() + 1)
    result.setHours(8, 0, 0, 0)
    while (result.getDay() === 0 || result.getDay() === 6) result.setDate(result.getDate() + 1)
  }
  return result
}

export interface DTISLAMetric {
  responseDeadline: Date
  resolutionDeadline: Date
  responseEnTiempo: boolean
  resolutionEnTiempo: boolean
  responseHorasRestantes: number
  resolutionHorasRestantes: number
  responded: boolean
  resolved: boolean
}

export function calcularSLAMetric_DTI(ticket: Ticket): DTISLAMetric {
  const sla = SLA_DTI[ticket.priority as Priority] ?? SLA_DTI[Priority.LOW]
  const created = new Date(ticket.created_at)
  const responseDeadline   = addBusinessHours(created, sla.responseHours)
  const resolutionDeadline = addBusinessHours(created, sla.resolutionHours)

  const now          = new Date()
  const respondedAt  = ticket.first_response_at ? new Date(ticket.first_response_at) : null
  const resolvedAt   = ticket.resolved_at        ? new Date(ticket.resolved_at)        : null

  const responseRef   = respondedAt ?? now
  const resolutionRef = resolvedAt  ?? now

  const responseEnTiempo   = responseRef   <= responseDeadline
  const resolutionEnTiempo = resolutionRef <= resolutionDeadline

  const responseHoras   = businessMinutesBetween(
    responseEnTiempo   ? responseRef   : responseDeadline,
    responseEnTiempo   ? responseDeadline : responseRef
  ) / 60

  const resolutionHoras = businessMinutesBetween(
    resolutionEnTiempo ? resolutionRef  : resolutionDeadline,
    resolutionEnTiempo ? resolutionDeadline : resolutionRef
  ) / 60

  return {
    responseDeadline,
    resolutionDeadline,
    responseEnTiempo,
    resolutionEnTiempo,
    responseHorasRestantes:   Math.round(responseHoras   * 10) / 10,
    resolutionHorasRestantes: Math.round(resolutionHoras * 10) / 10,
    responded: !!respondedAt,
    resolved:  !!resolvedAt,
  }
}

// ─── CAM business-day helpers ─────────────────────────────────────────────────

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
  // DTI: use business-hour based SLA
  if (ticket.area === 'DTI') {
    const dti = calcularSLAMetric_DTI(ticket)
    return {
      ticketId: ticket.id,
      title: ticket.title,
      assignedTo: ticket.assigned_to,
      area: ticket.area,
      createdAt: ticket.created_at,
      resolvedAt: ticket.resolved_at,
      fechaLimiteSLA: dti.resolutionDeadline.toISOString(),
      enTiempo: dti.resolutionEnTiempo,
      diasRestantes: dti.resolutionEnTiempo ? dti.resolutionHorasRestantes / 8 : -dti.resolutionHorasRestantes / 8,
      status: ticket.status,
    }
  }

  // CAM: use business-day based SLA
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

export async function getMetricasPorTecnico(
  tickets: Ticket[],
  users: { id: string; name: string; email: string; area?: string | null }[]
): Promise<MetricasTecnico[]> {
  const techUsers = users.filter(u => u.area)
  const linearMetrics = await getLinearMetricsByEmail()

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
    const porcentajeTickets = resueltos.length > 0 ? Math.round((enTiempo / resueltos.length) * 100) : 100

    // Fusionar métricas de Linear
    const linear = linearMetrics[user.email.toLowerCase()] || {
      totalAsignadas: 0,
      completadas: 0,
      enProgreso: 0,
      porcentaje: 100
    }

    // KPI Combinado: Si tiene tareas en Linear, promediar. Si no, solo tickets.
    let kpiCombinado = porcentajeTickets
    if (linear.totalAsignadas > 0 && resueltos.length > 0) {
      kpiCombinado = Math.round((porcentajeTickets + linear.porcentaje) / 2)
    } else if (linear.totalAsignadas > 0 && resueltos.length === 0) {
      kpiCombinado = linear.porcentaje
    }

    return {
      userId: user.id,
      userName: user.name,
      area: user.area as Area,
      totalTickets: asignados.length,
      resueltos: resueltos.length,
      enTiempo,
      fueraDeTiempo,
      porcentajeTickets,
      tiempoPromedioResolucion: Math.round(tiempoPromedio * 10) / 10,
      linear,
      porcentajeCumplimiento: kpiCombinado
    }
  })
}

export async function getMetricasPersonales(
  userId: string,
  userName: string,
  email: string,
  area: Area,
  tickets: Ticket[]
): Promise<MetricasTecnico> {
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
  const porcentajeTickets = resueltos.length > 0 ? Math.round((enTiempo / resueltos.length) * 100) : 100

  const linearMetrics = await getLinearMetricsByEmail()
  const linear = linearMetrics[email.toLowerCase()] || {
    totalAsignadas: 0, completadas: 0, enProgreso: 0, porcentaje: 100
  }

  let kpiCombinado = porcentajeTickets
  if (linear.totalAsignadas > 0 && resueltos.length > 0) {
    kpiCombinado = Math.round((porcentajeTickets + linear.porcentaje) / 2)
  } else if (linear.totalAsignadas > 0 && resueltos.length === 0) {
    kpiCombinado = linear.porcentaje
  }

  return {
    userId,
    userName,
    area,
    totalTickets: asignados.length,
    resueltos: resueltos.length,
    enTiempo,
    fueraDeTiempo,
    porcentajeTickets,
    tiempoPromedioResolucion: Math.round(tiempoPromedio * 10) / 10,
    linear,
    porcentajeCumplimiento: kpiCombinado
  }
}
