'use client'

import { useState } from 'react'
import { useAuth, canAssignTickets, canManageTickets } from '@/contexts/AuthContext'
import { useUsers } from '@/contexts/UsersContext'
import { useDTITickets } from '../hooks/useDTITickets'
import { DTITicketCard } from './DTITicketCard'
import { DTITicketDetail } from './DTITicketDetail'
import { CreateDTITicketModal } from './modals/CreateDTITicketModal'
import { AssignModal } from '@/components/shared/modals/AssignModal'
import { CommentModal } from '@/components/shared/modals/CommentModal'
import { ResolutionModal } from '@/components/shared/modals/ResolutionModal'
import { Ticket, Status, Role } from '@/types'
import { commentService } from '@/services/commentService'
import { useNotifications } from '@/hooks/useNotifications'

export function DTIView() {
  const { currentUser } = useAuth()
  const { users } = useUsers()
  const { activeTickets, isLoading, createDTITicket, updateTicket, deleteTicket } = useDTITickets()
  const { showSuccess, showError } = useNotifications()

  const [selected, setSelected] = useState<Ticket | null>(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [showResolve, setShowResolve] = useState(false)

  const role = currentUser?.role
  const canAssign = role ? canAssignTickets(role) : false
  const canAct = role ? canManageTickets(role) : false

  const filtered = activeTickets.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  const assignableUsers = users.filter(u =>
    u.area === 'DTI' && [Role.ASISTENCIA, Role.COORDINADOR, Role.GERENTE].includes(u.role)
  )

  const handleCreate = async (data: any) => {
    try {
      await createDTITicket({ ...data, requester_id: currentUser?.id })
      showSuccess('Ticket creado', 'El ticket DTI fue registrado correctamente.')
      setShowCreate(false)
    } catch { showError('Error', 'No se pudo crear el ticket.') }
  }

  const handleAssign = async (userId: string) => {
    if (!selected) return
    await updateTicket(selected.id, { assigned_to: userId })
    setSelected(prev => prev ? { ...prev, assigned_to: userId } : null)
    showSuccess('Asignado', 'Ticket asignado correctamente.')
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
    showSuccess('Resuelto', 'Ticket marcado como resuelto.')
    setSelected(null)
    setShowResolve(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ticket?')) return
    await deleteTicket(id)
    setSelected(null)
    showSuccess('Eliminado', 'Ticket eliminado.')
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel — list */}
      <div className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-950">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-black">D</span>
                FixIT — DTI
              </h2>
              <p className="text-zinc-500 text-xs mt-0.5">{filtered.length} tickets activos</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tickets…"
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
          {isLoading ? (
            <div className="p-6 text-center text-zinc-600 text-sm">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-zinc-600 text-sm">Sin tickets activos</div>
          ) : (
            filtered.map(t => (
              <DTITicketCard
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

      {/* Right panel — detail */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <DTITicketDetail
            ticket={selected}
            users={users}
            currentUser={currentUser}
            canAssign={canAssign}
            canAct={canAct}
            onAssign={() => setShowAssign(true)}
            onComment={() => setShowComment(true)}
            onResolve={() => setShowResolve(true)}
            onDelete={() => handleDelete(selected.id)}
            onUpdateTicket={updateTicket}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-700 text-sm h-full">
            Selecciona un ticket para ver el detalle
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDTITicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        currentUser={currentUser}
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
