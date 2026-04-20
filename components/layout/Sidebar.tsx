'use client'

import { useAuth, canViewSLA, isSuperUser } from '@/contexts/AuthContext'
import { Role, isResolverArea } from '@/types'
import DarkModeToggle from '@/components/DarkModeToggle'

export type AppView = 'all-tickets' | 'dti' | 'cam' | 'resolved' | 'users' | 'sla' | 'my-requests' | 'areas' | 'dashboard'

interface SidebarProps {
  currentView: AppView
  onViewChange: (view: AppView) => void
  onLogout: () => void
  isSyncing?: boolean
}

const NavItem = ({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  accent?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'
}) => {
  const activeClasses = {
    blue: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    violet: 'bg-violet-600 text-white shadow-lg shadow-violet-500/20',
    emerald: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    amber: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    rose: 'bg-rose-600 text-white shadow-lg shadow-rose-500/20',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 ${
        active
          ? (activeClasses[accent ?? 'emerald'])
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      {children}
    </button>
  )
}

const ROLE_BADGE_COLORS: Record<Role, string> = {
  [Role.SUPER_USER]: 'bg-rose-900/60 text-rose-300',
  [Role.GERENTE]: 'bg-amber-900/60 text-amber-300',
  [Role.COORDINADOR]: 'bg-blue-900/60 text-blue-300',
  [Role.ASISTENCIA]: 'bg-violet-900/60 text-violet-300',
  [Role.EMPLEADO]: 'bg-zinc-700 text-zinc-300',
}

export function Sidebar({ currentView, onViewChange, onLogout, isSyncing }: SidebarProps) {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const role = currentUser.role
  const area = currentUser.area
  const superUser = isSuperUser(role)
  const resolverUser = isResolverArea(area)
  // Users in custom areas (Contabilidad, etc.) only see Mis Solicitudes
  const requesterAreaUser = !!area && !resolverUser

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-none">AXIS</h1>
              <p className="text-zinc-500 text-[10px] leading-none mt-0.5">Gestión Integrada</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="h-3 w-3 rounded-full border-2 border-zinc-600 border-t-blue-400 animate-spin" />
            )}
            <DarkModeToggle size="sm" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">

        {/* SuperUser: dashboard + gestión de usuarios + áreas */}
        {superUser && (
          <>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-3 pb-1">
              Visión General
            </p>
            <NavItem active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} accent="rose">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
              </svg>
              Dashboard
            </NavItem>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-4 pb-1">
              Administración
            </p>
            <NavItem active={currentView === 'users'} onClick={() => onViewChange('users')} accent="rose">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Gestión de Usuarios
            </NavItem>
            <NavItem active={currentView === 'areas'} onClick={() => onViewChange('areas')} accent="rose">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Gestión de Áreas
            </NavItem>
          </>
        )}

        {/* Requester area users: only Mis Solicitudes */}
        {requesterAreaUser && (
          <>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-3 pb-1">
              Mis solicitudes
            </p>
            <NavItem active={currentView === 'my-requests'} onClick={() => onViewChange('my-requests')} accent="emerald">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Mis Solicitudes
            </NavItem>
          </>
        )}

        {/* Resolver area users (DTI/CAM): full nav */}
        {!superUser && resolverUser && (
          <>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-3 pb-1">
              Vista general
            </p>
            <NavItem active={currentView === 'all-tickets'} onClick={() => onViewChange('all-tickets')} accent="emerald">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Todos los Tickets
            </NavItem>
            <NavItem active={currentView === 'resolved'} onClick={() => onViewChange('resolved')} accent="emerald">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resueltos
            </NavItem>

            {/* Area-specific */}
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-4 pb-1">
              Mi Área
            </p>
            {area === 'DTI' && (
              <NavItem active={currentView === 'dti'} onClick={() => onViewChange('dti')} accent="blue">
                <span className="w-4 h-4 rounded flex items-center justify-center bg-blue-500/20 text-blue-400 text-[10px] font-black">D</span>
                FixIT — DTI
              </NavItem>
            )}
            {area === 'CAM' && (
              <NavItem active={currentView === 'cam'} onClick={() => onViewChange('cam')} accent="violet">
                <span className="w-4 h-4 rounded flex items-center justify-center bg-violet-500/20 text-violet-400 text-[10px] font-black">C</span>
                CAM
              </NavItem>
            )}

            {/* Mis Solicitudes — cross-area personal submissions */}
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-4 pb-1">
              Personal
            </p>
            <NavItem active={currentView === 'my-requests'} onClick={() => onViewChange('my-requests')} accent="emerald">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Mis Solicitudes
            </NavItem>

            {/* SLA — Coordinador y Gerente */}
            {canViewSLA(role) && (
              <>
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-4 pb-1">
                  Gestión
                </p>
                <NavItem active={currentView === 'sla'} onClick={() => onViewChange('sla')} accent="amber">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  SLA & Métricas
                </NavItem>
              </>
            )}

            {/* Mis métricas — solo ASISTENCIA */}
            {role === Role.ASISTENCIA && (
              <>
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 pt-4 pb-1">
                  Métricas
                </p>
                <NavItem active={currentView === 'sla'} onClick={() => onViewChange('sla')} accent="amber">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Mis Métricas
                </NavItem>
              </>
            )}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-zinc-800">
        <div className="px-4 py-3 rounded-xl bg-zinc-900 mb-2">
          <p className="text-white text-sm font-semibold truncate">{currentUser.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE_COLORS[role] ?? 'bg-zinc-700 text-zinc-300'}`}>
              {role}
            </span>
            {currentUser.area && (
              <span className="text-[10px] text-zinc-500">{currentUser.area}</span>
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
