import { useMemo } from 'react'
import { useTickets } from '@/contexts/TicketsContext'
import { useAuth } from '@/contexts/AuthContext'
import { Status, Role } from '@/types'

export function useCAMTickets() {
  const { tickets, isLoading, createTicket, updateTicket, deleteTicket } = useTickets()
  const { currentUser } = useAuth()

  const camTickets = useMemo(() =>
    tickets.filter(t => t.area === 'CAM'), [tickets])

  const activeTickets = useMemo(() => {
    const role = currentUser?.role
    return camTickets.filter(t => {
      if (t.status === Status.RESOLVED || t.status === Status.CLOSED) return false
      if (role === Role.EMPLEADO) return t.requester_id === currentUser?.id
      if (role === Role.ASISTENCIA) return t.assigned_to === currentUser?.id || t.requester_id === currentUser?.id
      return true
    })
  }, [camTickets, currentUser])

  const resolvedTickets = useMemo(() =>
    camTickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED),
    [camTickets])

  const createCAMTicket = async (data: any) =>
    createTicket({ ...data, area: 'CAM', category: data.tipo_solicitud || 'Otro' })

  return {
    camTickets,
    activeTickets,
    resolvedTickets,
    isLoading,
    createCAMTicket,
    updateTicket,
    deleteTicket,
  }
}
