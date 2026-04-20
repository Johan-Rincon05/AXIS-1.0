'use client'

import { useState, useCallback, useEffect } from 'react'
import { Sidebar, AppView } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useTickets } from '@/contexts/TicketsContext'
import { Role, isResolverArea } from '@/types'
import NotificationContainer from '@/components/NotificationContainer'
import { useNotifications } from '@/hooks/useNotifications'

import { DTIView } from '@/features/dti/components/DTIView'
import { CAMView } from '@/features/cam/components/CAMView'
import { AllTicketsView } from '@/components/shared/AllTicketsView'
import { ResolvedView } from '@/components/shared/ResolvedView'
import { MyRequestsView } from '@/components/shared/MyRequestsView'
import { UsersView } from '@/features/users/components/UsersView'
import { AreasView } from '@/features/admin/components/AreasView'
import { SLAView } from '@/features/sla/components/SLAView'

function getDefaultView(role: Role, area: string | null | undefined): AppView {
  if (role === Role.SUPER_USER) return 'users'
  if (!area || !isResolverArea(area)) return 'my-requests'
  return 'all-tickets'
}

export function AppShell() {
  const { currentUser, logout } = useAuth()
  const { tickets, isLoading } = useTickets()
  const { notifications, removeNotification } = useNotifications()
  const [isSyncing] = useState(false)

  const [currentView, setCurrentView] = useState<AppView>(() =>
    currentUser ? getDefaultView(currentUser.role, currentUser.area) : 'all-tickets'
  )

  // Recalculate default when user changes (login/logout)
  useEffect(() => {
    if (currentUser) setCurrentView(getDefaultView(currentUser.role, currentUser.area))
  }, [currentUser?.id])

  const handleLogout = useCallback(() => { logout() }, [logout])
  const handleViewChange = useCallback((view: AppView) => { setCurrentView(view) }, [])

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
        {currentView === 'all-tickets' && <AllTicketsView />}
        {currentView === 'dti' && <DTIView />}
        {currentView === 'cam' && <CAMView />}
        {currentView === 'resolved' && <ResolvedView />}
        {currentView === 'my-requests' && <MyRequestsView />}
        {currentView === 'users' && <UsersView />}
        {currentView === 'areas' && <AreasView />}
        {currentView === 'sla' && <SLAView />}
      </main>

      <NotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </div>
  )
}
