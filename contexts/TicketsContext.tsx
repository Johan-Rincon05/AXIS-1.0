'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Ticket, Area, Status } from '@/types'
import { ticketServiceClient } from '@/services/ticketServiceClient'
import { activityService, createActivityEvents } from '@/services/activityService'
import { syncService, createTicketEvent } from '@/services/syncService'
import { useAuth } from './AuthContext'

interface TicketsContextValue {
  tickets: Ticket[]
  isLoading: boolean
  reload: () => Promise<void>
  createTicket: (data: any) => Promise<Ticket>
  updateTicket: (id: string, data: any) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  getByArea: (area: Area) => Ticket[]
  getActive: (area?: Area) => Ticket[]
  getResolved: (area?: Area) => Ticket[]
}

const TicketsContext = createContext<TicketsContextValue | null>(null)

export function TicketsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const fetched = await ticketServiceClient.getAllTickets()
      setTickets(fetched)
    } catch (e) {
      console.error('[AXIS] Error loading tickets:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const createTicket = useCallback(async (data: any): Promise<Ticket> => {
    const ticket = await ticketServiceClient.createTicket(data)
    try {
      await activityService.createActivity(
        createActivityEvents.creation(ticket.id, currentUser?.id || '', ticket.title)
      )
      await syncService.sendSyncEvent(createTicketEvent('TICKET_CREATED', ticket))
    } catch { /* non-critical */ }
    setTickets(prev => [ticket, ...prev])
    return ticket
  }, [currentUser])

  const updateTicket = useCallback(async (id: string, data: any) => {
    const updated = await ticketServiceClient.updateTicket(id, data)
    setTickets(prev => prev.map(t => t.id === id ? updated : t))
  }, [])

  const deleteTicket = useCallback(async (id: string) => {
    await ticketServiceClient.deleteTicket(id)
    setTickets(prev => prev.filter(t => t.id !== id))
  }, [])

  const getByArea = useCallback((area: Area) =>
    tickets.filter(t => t.area === area), [tickets])

  const getActive = useCallback((area?: Area) =>
    tickets.filter(t =>
      t.status !== Status.RESOLVED &&
      t.status !== Status.CLOSED &&
      (!area || t.area === area)
    ), [tickets])

  const getResolved = useCallback((area?: Area) =>
    tickets.filter(t =>
      (t.status === Status.RESOLVED || t.status === Status.CLOSED) &&
      (!area || t.area === area)
    ), [tickets])

  return (
    <TicketsContext.Provider value={{
      tickets, isLoading, reload,
      createTicket, updateTicket, deleteTicket,
      getByArea, getActive, getResolved,
    }}>
      {children}
    </TicketsContext.Provider>
  )
}

export function useTickets() {
  const ctx = useContext(TicketsContext)
  if (!ctx) throw new Error('useTickets must be used within TicketsProvider')
  return ctx
}
