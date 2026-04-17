'use client'

import { useState, useMemo } from 'react'
import { useTickets } from '@/contexts/TicketsContext'
import { useUsers } from '@/contexts/UsersContext'
import { useAuth } from '@/contexts/AuthContext'
import { Area, Status, Priority, Role } from '@/types'

const PRIORITY_BADGE: Record<Priority, string> = {
  [Priority.HIGH]: 'bg-red-900/50 text-red-300 border-red-700',
  [Priority.MEDIUM]: 'bg-amber-900/50 text-amber-300 border-amber-700',
  [Priority.LOW]: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
}

const AREA_STYLES = {
  DTI: { dot: 'bg-blue-500', badge: 'text-blue-400' },
  CAM: { dot: 'bg-violet-500', badge: 'text-violet-400' },
}

export function ResolvedView() {
  const { getResolved, isLoading } = useTickets()
  const { users } = useUsers()
  const { currentUser } = useAuth()

  const [areaFilter, setAreaFilter] = useState<Area | 'all'>('all')
  const [search, setSearch] = useState('')

  const resolved = useMemo(() => {
    let list = getResolved()

    if (currentUser?.role === Role.EMPLEADO) {
      list = list.filter(t => t.requester_id === currentUser.id)
    } else if (currentUser?.role === Role.ASISTENCIA) {
      list = list.filter(t => t.assigned_to === currentUser.id || t.requester_id === currentUser.id)
    }

    if (areaFilter !== 'all') list = list.filter(t => t.area === areaFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) =>
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    )
  }, [getResolved, areaFilter, search, currentUser])

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

  const totalDTI = useMemo(() => getResolved().filter(t => t.area === 'DTI').length, [getResolved])
  const totalCAM = useMemo(() => getResolved().filter(t => t.area === 'CAM').length, [getResolved])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">Tickets resueltos</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Historial de solicitudes cerradas</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en historial…"
          className="h-8 w-56 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Area filter pills */}
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-2">
        {([['all', 'Todos', totalDTI + totalCAM, 'bg-zinc-700 text-zinc-200'], ['DTI', 'DTI', totalDTI, 'bg-blue-600 text-white'], ['CAM', 'CAM', totalCAM, 'bg-violet-600 text-white']] as const).map(
          ([val, label, count, activeClass]) => (
            <button
              key={val}
              onClick={() => setAreaFilter(val as Area | 'all')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                areaFilter === val
                  ? activeClass
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {label}
              <span className="rounded-full bg-black/20 px-1.5 text-[10px]">{count}</span>
            </button>
          )
        )}
        <span className="ml-auto text-[11px] text-zinc-600">{resolved.length} resultado{resolved.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Cargando…</div>
        ) : resolved.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span className="text-3xl">📭</span>
            <p className="text-zinc-500 text-sm">No hay tickets resueltos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
              <tr>
                {['Área', 'Título', 'Estado', 'Prioridad', 'Solicitante', 'Resuelto por', 'Fecha cierre'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {resolved.map(ticket => {
                const requester = users.find(u => u.id === ticket.requester_id)
                const assignee = users.find(u => u.id === ticket.assigned_to)
                const areaStyle = AREA_STYLES[ticket.area] ?? AREA_STYLES.DTI
                const closedAt = ticket.updated_at || ticket.created_at

                return (
                  <tr key={ticket.id} className="hover:bg-zinc-800/30 transition-colors opacity-80 hover:opacity-100">
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${areaStyle.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${areaStyle.dot}`} />
                        {ticket.area}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-zinc-300 text-xs font-medium truncate line-through decoration-zinc-600">{ticket.title}</p>
                      {ticket.category && (
                        <p className="text-zinc-600 text-[10px] mt-0.5 no-underline">{ticket.category}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-900/50 text-emerald-300 border-emerald-700">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{requester?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{assignee?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-600 text-[11px]">{fmt(closedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
