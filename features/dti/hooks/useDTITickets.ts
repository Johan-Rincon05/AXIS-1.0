import { useMemo } from 'react'
import { useTickets } from '@/contexts/TicketsContext'
import { useAuth } from '@/contexts/AuthContext'
import { Status, Role } from '@/types'

export function useDTITickets() {
  const { tickets, isLoading, createTicket, updateTicket, deleteTicket } = useTickets()
  const { currentUser } = useAuth()

  const dtiTickets = useMemo(() =>
    tickets.filter(t => t.area === 'DTI'), [tickets])

  const activeTickets = useMemo(() => {
    const role = currentUser?.role
    return dtiTickets.filter(t => {
      if (t.status === Status.RESOLVED || t.status === Status.CLOSED) return false
      if (role === Role.EMPLEADO) return t.requester_id === currentUser?.id
      if (role === Role.ASISTENCIA) return t.assigned_to === currentUser?.id || t.requester_id === currentUser?.id
      return true // COORDINADOR / GERENTE ven todos
    })
  }, [dtiTickets, currentUser])

  const resolvedTickets = useMemo(() =>
    dtiTickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED),
    [dtiTickets])

  const createDTITicket = async (data: any) =>
    createTicket({ ...data, area: 'DTI' })

  return {
    dtiTickets,
    activeTickets,
    resolvedTickets,
    isLoading,
    createDTITicket,
    updateTicket,
    deleteTicket,
  }
}
