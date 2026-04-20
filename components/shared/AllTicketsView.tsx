'use client'

import { useState, useMemo } from 'react'
import { useTickets } from '@/contexts/TicketsContext'
import { useUsers } from '@/contexts/UsersContext'
import { useAuth } from '@/contexts/AuthContext'
import { TicketFilters } from '@/components/TicketFilters'
import { Area, Status, Priority, Role } from '@/types'

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

export function AllTicketsView() {
  const { tickets, isLoading, getActive } = useTickets()
  const { users } = useUsers()
  const { currentUser } = useAuth()

  const userArea = currentUser?.area ?? null

  const [filters, setFilters] = useState<{ area: Area | 'all'; status: Status | 'all'; priority: Priority | 'all' }>({
    area: userArea ?? 'all', status: 'all', priority: 'all',
  })
  const [search, setSearch] = useState('')

  const visibleTickets = useMemo(() => {
    let list = getActive()

    if (currentUser?.role === Role.EMPLEADO) {
      list = list.filter(t => t.requester_id === currentUser.id)
    } else if (currentUser?.role === Role.ASISTENCIA) {
      list = list.filter(t => t.assigned_to === currentUser.id || t.requester_id === currentUser.id)
    }

    if (filters.area !== 'all') list = list.filter(t => t.area === filters.area)
    if (filters.status !== 'all') list = list.filter(t => t.status === filters.status)
    if (filters.priority !== 'all') list = list.filter(t => t.priority === filters.priority)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }

    return list
  }, [tickets, filters, search, currentUser, getActive])

  const totalDTI = useMemo(() => getActive().filter(t => t.area === 'DTI').length, [tickets, getActive])
  const totalCAM = useMemo(() => getActive().filter(t => t.area === 'CAM').length, [tickets, getActive])

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">Todos los tickets</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{userArea ? `Área ${userArea}` : 'Vista unificada DTI + CAM'}</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ticket…"
          className="h-8 w-56 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-zinc-800">
        <TicketFilters
          onFilterChange={setFilters}
          currentFilters={filters}
          totalDTI={totalDTI}
          totalCAM={totalCAM}
          userArea={userArea ?? undefined}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
            Cargando tickets…
          </div>
        ) : visibleTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span className="text-3xl">🎉</span>
            <p className="text-zinc-500 text-sm">Sin tickets activos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
              <tr>
                {['Área', 'Título', 'Estado', 'Prioridad', 'Solicitante', 'Asignado', 'Creado'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {visibleTickets.map(ticket => {
                const requester = users.find(u => u.id === ticket.requester_id)
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
                    <td className="px-4 py-3 text-zinc-400 text-xs">{requester?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{assignee?.name ?? 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-zinc-500 text-[11px]">{fmt(ticket.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {visibleTickets.length > 0 && (
        <div className="px-6 py-2 border-t border-zinc-800 text-[11px] text-zinc-600">
          {visibleTickets.length} ticket{visibleTickets.length !== 1 ? 's' : ''} activo{visibleTickets.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
