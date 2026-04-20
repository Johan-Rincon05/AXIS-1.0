'use client'

import { useState, useMemo } from 'react'
import { useTickets } from '@/contexts/TicketsContext'
import { useUsers } from '@/contexts/UsersContext'
import { useAuth } from '@/contexts/AuthContext'
import { Priority, Status, isResolverArea } from '@/types'
import { CreateDTITicketModal } from '@/features/dti/components/modals/CreateDTITicketModal'
import { CreateCAMTicketModal } from '@/features/cam/components/modals/CreateCAMTicketModal'

const STATUS_BADGE: Record<Status, string> = {
  [Status.OPEN]: 'bg-blue-900/50 text-blue-300 border-blue-700',
  [Status.IN_PROGRESS]: 'bg-amber-900/50 text-amber-300 border-amber-700',
  [Status.RESOLVED]: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  [Status.CLOSED]: 'bg-zinc-800 text-zinc-400 border-zinc-700',
}

const PRIORITY_BADGE: Record<Priority, string> = {
  [Priority.URGENT]: 'bg-red-950 text-red-300 border-red-600 ring-1 ring-red-500',
  [Priority.HIGH]: 'bg-red-900/50 text-red-300 border-red-700',
  [Priority.MEDIUM]: 'bg-amber-900/50 text-amber-300 border-amber-700',
  [Priority.LOW]: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
}

const AREA_STYLES = {
  DTI: { dot: 'bg-blue-500', badge: 'text-blue-400' },
  CAM: { dot: 'bg-violet-500', badge: 'text-violet-400' },
}

export function MyRequestsView() {
  const { tickets, isLoading, createTicket } = useTickets()
  const { users } = useUsers()
  const { currentUser } = useAuth()

  const [search, setSearch] = useState('')
  const [showDTIModal, setShowDTIModal] = useState(false)
  const [showCAMModal, setShowCAMModal] = useState(false)

  const myTickets = useMemo(() => {
    if (!currentUser) return []
    let list = tickets.filter(t => t.requester_id === currentUser.id)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [tickets, currentUser, search])

  const isResolver = isResolverArea(currentUser?.area)

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

  const handleCreateDTI = async (data: any) => {
    await createTicket({ ...data, area: 'DTI' })
    setShowDTIModal(false)
  }

  const handleCreateCAM = async (data: any) => {
    await createTicket({ ...data, area: 'CAM' })
    setShowCAMModal(false)
  }

  const openCount = myTickets.filter(t => t.status !== Status.RESOLVED && t.status !== Status.CLOSED).length
  const resolvedCount = myTickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">Mis Solicitudes</h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            {isResolver
              ? 'Tus solicitudes personales a otras áreas'
              : 'Solicitudes enviadas a DTI o CAM'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="h-8 w-44 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={() => setShowDTIModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <span className="w-3.5 h-3.5 rounded bg-white/20 flex items-center justify-center text-[9px] font-black">D</span>
            DTI
          </button>
          <button
            onClick={() => setShowCAMModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
          >
            <span className="w-3.5 h-3.5 rounded bg-white/20 flex items-center justify-center text-[9px] font-black">C</span>
            CAM
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs">Total:</span>
          <span className="text-zinc-200 text-xs font-semibold">{myTickets.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span className="text-zinc-500 text-xs">En curso:</span>
          <span className="text-blue-300 text-xs font-semibold">{openCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-500 text-xs">Resueltos:</span>
          <span className="text-emerald-300 text-xs font-semibold">{resolvedCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Cargando…</div>
        ) : myTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-4xl">📬</span>
            <p className="text-zinc-500 text-sm">Aún no has enviado ninguna solicitud</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDTIModal(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Nueva solicitud a DTI
              </button>
              <button
                onClick={() => setShowCAMModal(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                Nueva solicitud a CAM
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
              <tr>
                {['Área', 'Título', 'Estado', 'Prioridad', 'Asignado a', 'Fecha'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {myTickets.map(ticket => {
                const assignee = users.find(u => u.id === ticket.assigned_to)
                const areaStyle = AREA_STYLES[ticket.area] ?? AREA_STYLES.DTI
                return (
                  <tr key={ticket.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${areaStyle.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${areaStyle.dot}`} />
                        {ticket.area}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-zinc-200 text-xs font-medium truncate">{ticket.title}</p>
                      {ticket.category && (
                        <p className="text-zinc-600 text-[10px] mt-0.5">{ticket.category}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{assignee?.name ?? 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-zinc-600 text-[11px]">{fmt(ticket.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {currentUser && (
        <>
          <CreateDTITicketModal
            isOpen={showDTIModal}
            onClose={() => setShowDTIModal(false)}
            onSubmit={handleCreateDTI}
            currentUser={currentUser as any}
            users={users}
          />
          <CreateCAMTicketModal
            isOpen={showCAMModal}
            onClose={() => setShowCAMModal(false)}
            onSubmit={handleCreateCAM}
            currentUser={currentUser as any}
            users={users}
          />
        </>
      )}
    </div>
  )
}
