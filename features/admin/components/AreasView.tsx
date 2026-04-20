'use client'

import { useState, useEffect } from 'react'
import { useUsers } from '@/contexts/UsersContext'
import { isResolverArea } from '@/types'

interface AreaEntry {
  id: string
  name: string
}

export function AreasView() {
  const { users } = useUsers()
  const [areas, setAreas] = useState<AreaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const loadAreas = async () => {
    try {
      const res = await fetch('/api/areas')
      if (res.ok) setAreas(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAreas() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const area = await res.json()
        setAreas(prev => [...prev, area].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName('')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Error al crear área')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' })
    if (res.ok) setAreas(prev => prev.filter(a => a.id !== id))
  }

  const getMemberCount = (areaName: string) =>
    users.filter(u => u.area === areaName && u.is_active !== false).length

  const allAreas = [
    { id: 'DTI', name: 'DTI', fixed: true },
    { id: 'CAM', name: 'CAM', fixed: true },
    ...areas.map(a => ({ ...a, fixed: false })),
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h1 className="text-white font-bold text-lg tracking-tight">Gestión de Áreas</h1>
        <p className="text-zinc-500 text-xs mt-0.5">Áreas solicitantes de la organización</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 max-w-2xl">
        {/* Create form */}
        <form onSubmit={handleCreate} className="flex items-center gap-3">
          <input
            value={newName}
            onChange={e => { setNewName(e.target.value); setError('') }}
            placeholder="Nombre del área (Ej: Contabilidad)"
            className="flex-1 h-9 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {creating ? 'Creando…' : 'Crear área'}
          </button>
        </form>
        {error && <p className="text-xs text-red-400 -mt-4">{error}</p>}

        {/* Areas list */}
        {loading ? (
          <p className="text-zinc-500 text-sm">Cargando…</p>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800">
                  {['Área', 'Tipo', 'Usuarios activos', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {allAreas.map(area => (
                  <tr key={area.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${
                        area.name === 'DTI' ? 'text-blue-400' :
                        area.name === 'CAM' ? 'text-violet-400' :
                        'text-zinc-200'
                      }`}>
                        {area.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        area.fixed
                          ? 'bg-blue-900/30 text-blue-300 border-blue-700'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {area.fixed ? 'Resolutora' : 'Solicitante'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs font-mono">
                      {getMemberCount(area.name)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!area.fixed && (
                        <button
                          onClick={() => handleDelete(area.id)}
                          className="text-[11px] text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-400">Tipos de área</p>
          <p><strong className="text-blue-400">Resolutoras</strong>: DTI y CAM. Gestionan y resuelven los tickets.</p>
          <p><strong className="text-zinc-300">Solicitantes</strong>: Contabilidad, RRHH, etc. Solo crean solicitudes dirigidas a DTI o CAM.</p>
        </div>
      </div>
    </div>
  )
}
