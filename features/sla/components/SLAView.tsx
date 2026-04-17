'use client'

import { useAuth } from '@/contexts/AuthContext'
import { canViewSLA } from '@/contexts/AuthContext'
import { useSLA } from '../hooks/useSLA'
import { SLADashboard } from '@/components/SLADashboard'
import { Role } from '@/types'

export function SLAView() {
  const { currentUser } = useAuth()
  const { metricas, currentUserMetrica } = useSLA()

  if (!currentUser) return null

  const canView = currentUser.role !== Role.EMPLEADO

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No tienes acceso a esta sección.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-zinc-800">
        <h1 className="text-white font-bold text-lg tracking-tight">Panel SLA</h1>
        <p className="text-zinc-500 text-xs mt-0.5">Cumplimiento de acuerdos de servicio — todas las áreas</p>
      </div>
      <div className="flex-1 px-6 py-5">
        <SLADashboard
          metricas={metricas}
          currentUserRole={currentUser.role}
          currentUserMetrica={currentUserMetrica}
          area={currentUser.area ?? undefined}
        />
      </div>
    </div>
  )
}
