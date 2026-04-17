'use client'

import { Ticket, User, Priority, Status, TipoSolicitudCAM, SLA_DIAS_CAM } from '@/types'
import { calcularSLAMetric } from '@/services/slaService'

const TIPO_ICON: Record<TipoSolicitudCAM, string> = {
  [TipoSolicitudCAM.DISEÑO_GRAFICO]: '🎨',
  [TipoSolicitudCAM.EDICION_VIDEO]: '🎬',
  [TipoSolicitudCAM.GRABACION_AUDIOVISUAL]: '📹',
  [TipoSolicitudCAM.PAUTA]: '📢',
  [TipoSolicitudCAM.REDES_SOCIALES]: '📱',
  [TipoSolicitudCAM.OTRO]: '📋',
}

const PRIORITY_STYLES: Record<Priority, string> = {
  [Priority.HIGH]: 'border-l-red-500',
  [Priority.MEDIUM]: 'border-l-amber-500',
  [Priority.LOW]: 'border-l-emerald-500',
}

interface CAMTicketCardProps {
  ticket: Ticket
  isSelected: boolean
  onClick: () => void
  users: User[]
}

export function CAMTicketCard({ ticket, isSelected, onClick, users }: CAMTicketCardProps) {
  const assignee = users.find(u => u.id === ticket.assigned_to)
  const date = new Date(ticket.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
  const sla = calcularSLAMetric(ticket)
  const slaOk = sla.enTiempo

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-l-2 transition-all ${
        PRIORITY_STYLES[ticket.priority]
      } ${isSelected ? 'bg-violet-500/10 border-l-violet-400' : 'hover:bg-zinc-800/40'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {ticket.tipo_solicitud && (
            <span className="text-sm flex-shrink-0">{TIPO_ICON[ticket.tipo_solicitud]}</span>
          )}
          <p className="text-zinc-200 text-xs font-medium leading-snug line-clamp-2">{ticket.title}</p>
        </div>
        {ticket.tipo_solicitud && (
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
            slaOk ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
          }`}>
            SLA {slaOk ? '✓' : '!'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {ticket.tipo_solicitud && (
          <span className="text-[10px] text-zinc-600">{SLA_DIAS_CAM[ticket.tipo_solicitud]}d SLA</span>
        )}
        <span className="text-zinc-700">·</span>
        <span className="text-[10px] text-zinc-600">{date}</span>
        {assignee && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-[10px] text-zinc-500 truncate">{assignee.name.split(' ')[0]}</span>
          </>
        )}
      </div>
    </button>
  )
}
