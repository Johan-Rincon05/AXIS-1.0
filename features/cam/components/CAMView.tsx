'use client'

import { useState } from 'react'
import { useAuth, canAssignTickets, canManageTickets } from '@/contexts/AuthContext'
import { useUsers } from '@/contexts/UsersContext'
import { useCAMTickets } from '../hooks/useCAMTickets'
import { CAMTicketCard } from './CAMTicketCard'
import { CAMTicketDetail } from './CAMTicketDetail'
import { CreateCAMTicketModal } from './modals/CreateCAMTicketModal'
import { AssignModal } from '@/components/shared/modals/AssignModal'
import { CommentModal } from '@/components/shared/modals/CommentModal'
import { ResolutionModal } from '@/components/shared/modals/ResolutionModal'
import { Ticket, Status, Role, TipoSolicitudCAM } from '@/types'
import { commentService } from '@/services/commentService'
import { useNotifications } from '@/hooks/useNotifications'

const TIPO_LABELS: Record<TipoSolicitudCAM, string> = {
  [TipoSolicitudCAM.DISEÑO_GRAFICO]: 'Diseño Gráfico',
  [TipoSolicitudCAM.EDICION_VIDEO]: 'Edición de Video',
  [TipoSolicitudCAM.GRABACION_AUDIOVISUAL]: 'Grabación Audiovisual',
  [TipoSolicitudCAM.PAUTA]: 'Pauta/Publicidad',
  [TipoSolicitudCAM.REDES_SOCIALES]: 'Redes Sociales',
  [TipoSolicitudCAM.OTRO]: 'Otro',
}

export function CAMView() {
  const { currentUser } = useAuth()
  const { users } = useUsers()
  const { activeTickets, isLoading, createCAMTicket, updateTicket, deleteTicket } = useCAMTickets()
  const { showSuccess, showError } = useNotifications()

  const [selected, setSelected] = useState<Ticket | null>(null)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<TipoSolicitudCAM | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [showResolve, setShowResolve] = useState(false)

  const role = currentUser?.role
  const canAssign = role ? canAssignTickets(role) : false
  const canAct = role ? canManageTickets(role) : false

  const filtered = activeTickets.filter(t => {
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    const matchTipo = filterTipo === 'all' || t.tipo_solicitud === filterTipo
    return matchSearch && matchTipo
  })

  const assignableUsers = users.filter(u =>
    u.area === 'CAM' && [Role.ASISTENCIA, Role.COORDINADOR, Role.GERENTE].includes(u.role)
  )

  const handleCreate = async (data: any) => {
    try {
      await createCAMTicket({ ...data, requester_id: currentUser?.id })
      showSuccess('Solicitud creada', 'La solicitud CAM fue registrada.')
      setShowCreate(false)
    } catch { showError('Error', 'No se pudo crear la solicitud.') }
  }

  const handleAssign = async (userId: string) => {
    if (!selected) return
    await updateTicket(selected.id, { assigned_to: userId })
    setSelected(prev => prev ? { ...prev, assigned_to: userId } : null)
    showSuccess('Asignado', 'Solicitud asignada.')
    setShowAssign(false)
  }

  const handleComment = async (text: string) => {
    if (!selected || !currentUser) return
    await commentService.createComment({ ticket_id: selected.id, user_id: currentUser.id, content: text })
    showSuccess('Comentario', 'Comentario agregado.')
    setShowComment(false)
  }

  const handleResolve = async (notes: string) => {
    if (!selected) return
    await updateTicket(selected.id, { status: Status.RESOLVED, resolution_notes: notes })
    showSuccess('Entregado', 'Solicitud marcada como entregada.')
    setSelected(null)
    setShowResolve(false)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel */}
      <div className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="px-4 pt-5 pb-3 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px] font-black">C</span>
                CAM
              </h2>
              <p className="text-zinc-500 text-xs mt-0.5">{filtered.length} solicitudes activas</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="h-8 w-8 rounded-lg bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar solicitudes…"
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:outline-none focus:border-violet-500 transition-colors"
          />

          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value as TipoSolicitudCAM | 'all')}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-violet-500"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(TIPO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
          {isLoading ? (
            <div className="p-6 text-center text-zinc-600 text-sm">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-zinc-600 text-sm">Sin solicitudes activas</div>
          ) : (
            filtered.map(t => (
              <CAMTicketCard
                key={t.id}
                ticket={t}
                isSelected={selected?.id === t.id}
                onClick={() => setSelected(t)}
                users={users}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <CAMTicketDetail
            ticket={selected}
            users={users}
            currentUser={currentUser}
            canAssign={canAssign}
            canAct={canAct}
            onAssign={() => setShowAssign(true)}
            onComment={() => setShowComment(true)}
            onResolve={() => setShowResolve(true)}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-700 text-sm h-full">
            Selecciona una solicitud para ver el detalle
          </div>
        )}
      </div>

      <CreateCAMTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        currentUser={{ id: currentUser?.id ?? '', name: currentUser?.name ?? '', email: currentUser?.email ?? '', area: currentUser?.area ?? undefined, role: currentUser?.role! }}
        users={users}
      />
      <AssignModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onAssign={handleAssign}
        ticket={selected}
        assignableUsers={assignableUsers}
      />
      <CommentModal
        isOpen={showComment}
        onClose={() => setShowComment(false)}
        onAdd={handleComment}
        currentUser={currentUser}
      />
      <ResolutionModal
        isOpen={showResolve}
        onClose={() => setShowResolve(false)}
        onResolve={handleResolve}
        ticketTitle={selected?.title || ''}
      />
    </div>
  )
}
