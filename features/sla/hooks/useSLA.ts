'use client'

import { useMemo } from 'react'
import { useTickets } from '@/contexts/TicketsContext'
import { useUsers } from '@/contexts/UsersContext'
import { useAuth } from '@/contexts/AuthContext'
import { getMetricasPorTecnico, getMetricasPersonales } from '@/services/slaService'
import { Role, Area } from '@/types'

export function useSLA(area?: Area) {
  const { tickets } = useTickets()
  const { users } = useUsers()
  const { currentUser } = useAuth()

  const metricas = useMemo(() => {
    const filtered = area ? tickets.filter(t => t.area === area) : tickets
    return getMetricasPorTecnico(filtered, users)
  }, [tickets, users, area])

  const currentUserMetrica = useMemo(() => {
    if (!currentUser) return undefined
    const userArea = currentUser.area ?? 'DTI'
    const userTickets = area
      ? tickets.filter(t => t.area === area)
      : tickets
    return getMetricasPersonales(currentUser.id, currentUser.name, userArea as Area, userTickets)
  }, [tickets, currentUser, area])

  const isStaff = currentUser?.role !== Role.EMPLEADO

  return { metricas, currentUserMetrica, isStaff }
}
