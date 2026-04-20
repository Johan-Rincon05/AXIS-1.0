'use client'

import { Ticket, User, Status, Priority, TipoSolicitudCAM, SLA_DIAS_CAM } from '@/types'
import { calcularSLAMetric } from '@/services/slaService'

const PRIORITY_BADGE: Record<Priority, string> = {
  [Priority.URGENT]: 'bg-red-950 text-red-300 border-red-600 ring-1 ring-red-500',
  [Priority.HIGH]: 'bg-red-900/50 text-red-300 border-red-700',
  [Priority.MEDIUM]: 'bg-amber-900/50 text-amber-300 border-amber-700',
  [Priority.LOW]: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
}

const TIPO_LABEL: Record<TipoSolicitudCAM, string> = {
  [TipoSolicitudCAM.DISEÑO_GRAFICO]: '🎨 Diseño Gráfico',
  [TipoSolicitudCAM.EDICION_VIDEO]: '🎬 Edición de Video',
  [TipoSolicitudCAM.GRABACION_AUDIOVISUAL]: '📹 Grabación Audiovisual',
  [TipoSolicitudCAM.PAUTA]: '📢 Pauta/Publicidad',
  [TipoSolicitudCAM.REDES_SOCIALES]: '📱 Redes Sociales',
  [TipoSolicitudCAM.OTRO]: '📋 Otro',
}

interface CAMTicketDetailProps {
  ticket: Ticket
  users: User[]
  currentUser: User | null
  canAssign: boolean
  canAct: boolean
  onAssign: () => void
  onComment: () => void
  onResolve: () => void
  onClose: () => void
}

export function CAMTicketDetail({
  ticket, users, canAssign, canAct,
  onAssign, onComment, onResolve, onClose,
}: CAMTicketDetailProps) {
  const requester = users.find(u => u.id === ticket.requester_id)
  const assignee = users.find(u => u.id === ticket.assigned_to)
  const isActive = ticket.status !== Status.RESOLVED && ticket.status !== Status.CLOSED
  const sla = calcularSLAMetric(ticket)
  const fmt = (d: string) => new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[ticket.priority]}`}>
              {ticket.priority}
            </span>
            {ticket.tipo_solicitud && (
              <span className="text-[11px] text-zinc-400 bg-violet-900/30 border border-violet-700 px-2 py-0.5 rounded-full">
                {TIPO_LABEL[ticket.tipo_solicitud]}
              </span>
            )}
            {ticket.tipo_solicitud && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                sla.enTiempo ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700' : 'bg-red-900/40 text-red-300 border-red-700'
              }`}>
                SLA {sla.enTiempo ? '✓ En tiempo' : `⚠ ${Math.abs(sla.diasRestantes || 0)}d tarde`}
              </span>
            )}
          </div>
          <h3 className="text-white font-bold text-base leading-snug">{ticket.title}</h3>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* SLA Banner */}
        {ticket.tipo_solicitud && (
          <div className={`rounded-lg px-4 py-3 flex items-center gap-3 ${
            sla.enTiempo ? 'bg-emerald-950/40 border border-emerald-800' : 'bg-red-950/40 border border-red-800'
          }`}>
            <span className="text-lg">{sla.enTiempo ? '✅' : '⏰'}</span>
            <div>
              <p className={`text-xs font-semibold ${sla.enTiempo ? 'text-emerald-300' : 'text-red-300'}`}>
                Plazo SLA: {SLA_DIAS_CAM[ticket.tipo_solicitud]} días hábiles
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {sla.fechaLimiteSLA
                  ? `Límite: ${new Date(sla.fechaLimiteSLA).toLocaleDateString('es-CO')}`
                  : 'Sin fecha límite calculada'}
              </p>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Descripción</p>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* CAM specific fields */}
        {(ticket.objetivo_solicitud || ticket.publico_objetivo || ticket.mensaje_clave) && (
          <div className="bg-violet-950/20 border border-violet-800/30 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Brief CAM</p>
            {ticket.objetivo_solicitud && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-0.5">Objetivo</p>
                <p className="text-zinc-300 text-xs">{ticket.objetivo_solicitud}</p>
              </div>
            )}
            {ticket.publico_objetivo && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-0.5">Público objetivo</p>
                <p className="text-zinc-300 text-xs">{ticket.publico_objetivo}</p>
              </div>
            )}
            {ticket.mensaje_clave && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-0.5">Mensaje clave</p>
                <p className="text-zinc-300 text-xs">{ticket.mensaje_clave}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Solicitante</p>
            <p className="text-zinc-200 text-sm">{requester?.name || 'Desconocido'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Asignado a</p>
            <p className="text-zinc-200 text-sm">{assignee?.name || 'Sin asignar'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Fecha creación</p>
            <p className="text-zinc-400 text-xs">{fmt(ticket.created_at)}</p>
          </div>
          {ticket.fecha_limite && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Fecha límite</p>
              <p className="text-zinc-400 text-xs">{new Date(ticket.fecha_limite).toLocaleDateString('es-CO')}</p>
            </div>
          )}
        </div>

        {ticket.comments?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Comentarios ({ticket.comments.length})
            </p>
            <div className="space-y-2">
              {ticket.comments.map(c => (
                <div key={c.id} className="bg-zinc-800/50 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-300 text-xs font-semibold">{c.author}</span>
                    <span className="text-zinc-600 text-[10px]">{new Date(c.timestamp).toLocaleDateString('es-CO')}</span>
                  </div>
                  <p className="text-zinc-400 text-xs">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isActive && (canAct || canAssign) && (
        <div className="px-6 py-4 border-t border-zinc-800 flex flex-wrap gap-2">
          <button onClick={onComment}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors">
            Comentar
          </button>
          {canAssign && (
            <button onClick={onAssign}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-violet-900/50 hover:bg-violet-800/60 text-violet-300 border border-violet-700 transition-colors">
              Asignar
            </button>
          )}
          {canAct && (
            <button onClick={onResolve}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700 transition-colors">
              Marcar entregado
            </button>
          )}
        </div>
      )}
    </div>
  )
}
