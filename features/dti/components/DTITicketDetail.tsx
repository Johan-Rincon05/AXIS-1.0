'use client'

import { Ticket, User, Status, Priority } from '@/types'
import { Badge } from '@/components/ui/badge'

const PRIORITY_BADGE: Record<Priority, string> = {
  [Priority.HIGH]: 'bg-red-900/50 text-red-300 border-red-700',
  [Priority.MEDIUM]: 'bg-amber-900/50 text-amber-300 border-amber-700',
  [Priority.LOW]: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
}

const STATUS_BADGE: Record<Status, string> = {
  [Status.OPEN]: 'bg-blue-900/50 text-blue-300 border-blue-700',
  [Status.IN_PROGRESS]: 'bg-amber-900/50 text-amber-300 border-amber-700',
  [Status.RESOLVED]: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  [Status.CLOSED]: 'bg-zinc-800 text-zinc-400 border-zinc-700',
}

interface DTITicketDetailProps {
  ticket: Ticket
  users: User[]
  currentUser: User | null
  canAssign: boolean
  canAct: boolean
  onAssign: () => void
  onComment: () => void
  onResolve: () => void
  onDelete: () => void
  onClose: () => void
}

export function DTITicketDetail({
  ticket, users, currentUser, canAssign, canAct,
  onAssign, onComment, onResolve, onDelete, onClose,
}: DTITicketDetailProps) {
  const requester = users.find(u => u.id === ticket.requester_id)
  const assignee = users.find(u => u.id === ticket.assigned_to)
  const isActive = ticket.status !== Status.RESOLVED && ticket.status !== Status.CLOSED
  const fmt = (d: string) => new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[ticket.status]}`}>
              {ticket.status}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[ticket.priority]}`}>
              {ticket.priority}
            </span>
            <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{ticket.category}</span>
          </div>
          <h3 className="text-white font-bold text-base leading-snug">{ticket.title}</h3>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Descripción</p>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

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
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Creado</p>
            <p className="text-zinc-400 text-xs">{fmt(ticket.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Origen</p>
            <p className="text-zinc-400 text-sm">{ticket.origin || 'Interna'}</p>
          </div>
          {ticket.external_company && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Empresa externa</p>
              <p className="text-zinc-400 text-sm">{ticket.external_company} — {ticket.external_contact}</p>
            </div>
          )}
        </div>

        {/* Comments */}
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
                  <p className="text-zinc-400 text-xs leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {isActive && (canAct || canAssign) && (
        <div className="px-6 py-4 border-t border-zinc-800 flex flex-wrap gap-2">
          <button onClick={onComment}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors">
            Comentar
          </button>
          {canAssign && (
            <button onClick={onAssign}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-900/50 hover:bg-blue-800/60 text-blue-300 border border-blue-700 transition-colors">
              Asignar
            </button>
          )}
          {canAct && (
            <button onClick={onResolve}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700 transition-colors">
              Marcar resuelto
            </button>
          )}
          {canAssign && (
            <button onClick={onDelete}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 transition-colors ml-auto">
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
