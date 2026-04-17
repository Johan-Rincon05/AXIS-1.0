'use client'

import { useState, useCallback } from 'react'
import { Sidebar, AppView } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useTickets } from '@/contexts/TicketsContext'
import { Role } from '@/types'
import NotificationContainer from '@/components/NotificationContainer'
import { useNotifications } from '@/hooks/useNotifications'

// Views — lazy imports would be ideal in prod; keeping direct for dev speed
import { DTIView } from '@/features/dti/components/DTIView'
import { CAMView } from '@/features/cam/components/CAMView'
import { AllTicketsView } from '@/components/shared/AllTicketsView'
import { ResolvedView } from '@/components/shared/ResolvedView'
import { UsersView } from '@/features/users/components/UsersView'
import { SLAView } from '@/features/sla/components/SLAView'

export function AppShell() {
  const { currentUser, logout } = useAuth()
  const { tickets, isLoading } = useTickets()
  const { notifications, removeNotification } = useNotifications()

  const [currentView, setCurrentView] = useState<AppView>('all-tickets')
  const [isSyncing] = useState(false)

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const handleViewChange = useCallback((view: AppView) => {
    setCurrentView(view)
  }, [])

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
        {currentView === 'users' && <UsersView />}
        {currentView === 'sla' && <SLAView />}
      </main>

      <NotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </div>
  )
}
