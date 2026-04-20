'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers } from '@/contexts/UsersContext'
import { User, Role, Area } from '@/types'
import { UserModal } from './UserModal'
import { useNotifications } from '@/hooks/useNotifications'

const ROLE_BADGE: Record<Role, string> = {
  [Role.SUPER_USER]: 'bg-rose-900/50 text-rose-300 border-rose-700',
  [Role.GERENTE]: 'bg-amber-900/50 text-amber-300 border-amber-700',
  [Role.COORDINADOR]: 'bg-blue-900/50 text-blue-300 border-blue-700',
  [Role.ASISTENCIA]: 'bg-violet-900/50 text-violet-300 border-violet-700',
  [Role.EMPLEADO]: 'bg-zinc-800 text-zinc-400 border-zinc-700',
}

const AREA_BADGE: Record<string, string> = {
  DTI: 'bg-blue-500/10 text-blue-400',
  CAM: 'bg-violet-500/10 text-violet-400',
}

export function UsersView() {
  const { currentUser } = useAuth()
  const { users, createUser, updateUser, inactivateUser, activateUser } = useUsers()
  const { showSuccess, showError } = useNotifications()

  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState<Area | 'all'>('all')
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all')

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchArea = filterArea === 'all' || u.area === filterArea
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && u.is_active !== false) ||
      (filterStatus === 'inactive' && u.is_active === false)
    return matchSearch && matchArea && matchRole && matchStatus
  })

  const handleSave = async (data: any) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data)
        showSuccess('Actualizado', 'Usuario actualizado correctamente.')
      } else {
        await createUser(data)
        showSuccess('Creado', 'Usuario creado correctamente.')
      }
      setShowModal(false)
      setEditingUser(null)
    } catch (e: any) {
      showError('Error', e.message || 'No se pudo guardar el usuario.')
    }
  }

  const handleToggleActive = async (user: User) => {
    const isActive = user.is_active !== false
    const action = isActive ? 'inactivar' : 'activar'
    if (!confirm(`¿Deseas ${action} a ${user.name}?`)) return
    try {
      if (isActive) {
        await inactivateUser(user.id)
        showSuccess('Inactivado', `${user.name} ha sido inactivado.`)
      } else {
        await activateUser(user.id)
        showSuccess('Activado', `${user.name} ha sido activado.`)
      }
    } catch {
      showError('Error', `No se pudo ${action} el usuario.`)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Gestión de Usuarios</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:outline-none focus:border-blue-500 w-56"
        />
        <select
          value={filterArea}
          onChange={e => setFilterArea(e.target.value as Area | 'all')}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
        >
          <option value="all">Todas las áreas</option>
          <option value="DTI">DTI</option>
          <option value="CAM">CAM</option>
        </select>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value as Role | 'all')}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
        >
          <option value="all">Todos los roles</option>
          {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as 'active' | 'inactive' | 'all')}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <span className="text-zinc-600 text-xs ml-auto">{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
            <tr>
              {['Nombre', 'Correo', 'Área', 'Rol', 'Estado', 'Teléfono', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.map(user => {
              const active = user.is_active !== false
              return (
                <tr key={user.id} className={`hover:bg-zinc-800/30 transition-colors group ${!active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5 text-zinc-200 font-medium">{user.name}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs">{user.email}</td>
                  <td className="px-5 py-3.5">
                    {user.area ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AREA_BADGE[user.area] || 'bg-zinc-800 text-zinc-400'}`}>
                        {user.area}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 text-xs">{user.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => { setEditingUser(user); setShowModal(true) }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                      )}
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`text-xs ${active ? 'text-red-500 hover:text-red-400' : 'text-emerald-500 hover:text-emerald-400'}`}
                        >
                          {active ? 'Inactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-zinc-600 text-sm">No se encontraron usuarios.</div>
        )}
      </div>

      <UserModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingUser(null) }}
        onSave={handleSave}
        user={editingUser}
      />
    </div>
  )
}
