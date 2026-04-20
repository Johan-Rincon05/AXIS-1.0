'use client'

import { Ticket, User, Priority, Status } from '@/types'

const PRIORITY_STYLES: Record<Priority, string> = {
  [Priority.URGENT]: 'border-l-red-400 bg-red-500/10 ring-1 ring-inset ring-red-500/20',
  [Priority.HIGH]: 'border-l-red-500 bg-red-500/5',
  [Priority.MEDIUM]: 'border-l-amber-500 bg-amber-500/5',
  [Priority.LOW]: 'border-l-emerald-500 bg-emerald-500/5',
}

const STATUS_DOT: Record<Status, string> = {
  [Status.OPEN]: 'bg-blue-400',
  [Status.IN_PROGRESS]: 'bg-amber-400 animate-pulse',
  [Status.RESOLVED]: 'bg-emerald-400',
  [Status.CLOSED]: 'bg-zinc-500',
}

interface DTITicketCardProps {
  ticket: Ticket
  isSelected: boolean
  onClick: () => void
  users: User[]
}

export function DTITicketCard({ ticket, isSelected, onClick, users }: DTITicketCardProps) {
  const assignee = users.find(u => u.id === ticket.assigned_to)
  const date = new Date(ticket.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-l-2 transition-all ${
        PRIORITY_STYLES[ticket.priority]
      } ${isSelected ? 'bg-blue-500/10 border-l-blue-400' : 'hover:bg-zinc-800/40'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-zinc-200 text-xs font-medium leading-snug line-clamp-2 flex-1">{ticket.title}</p>
        <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[ticket.status]}`} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-zinc-600">{ticket.category}</span>
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
