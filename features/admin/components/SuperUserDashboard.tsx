'use client'

import { useMemo } from 'react'
import { useTickets } from '@/contexts/TicketsContext'
import { useUsers } from '@/contexts/UsersContext'
import { Status, Priority, isResolverArea } from '@/types'
import { getMetricasPorTecnico } from '@/services/slaService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent = '#a1a1aa', icon,
}: {
  label: string; value: string | number; sub?: string; accent?: string; icon: string
}) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: accent + '22' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight" style={{ color: accent }}>{value}</p>
        {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function AreaPanel({
  area, color, tickets, users,
}: {
  area: 'DTI' | 'CAM'
  color: string
  tickets: ReturnType<typeof useTickets>['tickets']
  users: ReturnType<typeof useUsers>['users']
}) {
  const areaTickets = tickets.filter(t => t.area === area)
  const active = areaTickets.filter(t => t.status !== Status.RESOLVED && t.status !== Status.CLOSED)
  const resolved = areaTickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED)
  const inProgress = areaTickets.filter(t => t.status === Status.IN_PROGRESS)
  const resolvedPct = pct(resolved.length, areaTickets.length)

  const metricas = useMemo(
    () => getMetricasPorTecnico(areaTickets, users).filter(m => m.area === area),
    [areaTickets, users, area]
  )

  const priorityBreakdown = [
    { label: 'Alta', count: areaTickets.filter(t => t.priority === Priority.HIGH).length, color: '#ef4444' },
    { label: 'Media', count: areaTickets.filter(t => t.priority === Priority.MEDIUM).length, color: '#f59e0b' },
    { label: 'Baja', count: areaTickets.filter(t => t.priority === Priority.LOW).length, color: '#10b981' },
  ]

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Area header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between"
        style={{ borderLeft: `3px solid ${color}` }}>
        <div>
          <p className="text-white font-bold text-base">{area}</p>
          <p className="text-zinc-500 text-xs">{areaTickets.length} ticket{areaTickets.length !== 1 ? 's' : ''} en total</p>
        </div>
        <div className="text-right">
          <p className="font-black text-2xl" style={{ color }}>{resolvedPct}%</p>
          <p className="text-zinc-500 text-[11px]">resueltos</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Progress bar */}
        <ProgressBar value={resolvedPct} color={color} />

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Activos', value: active.length, c: '#60a5fa' },
            { label: 'En curso', value: inProgress.length, c: '#fbbf24' },
            { label: 'Resueltos', value: resolved.length, c: '#34d399' },
          ].map(({ label, value, c }) => (
            <div key={label} className="rounded-xl bg-zinc-800 px-3 py-2.5 text-center">
              <p className="font-bold text-lg" style={{ color: c }}>{value}</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Priority breakdown */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Prioridad</p>
          <div className="space-y-1.5">
            {priorityBreakdown.map(({ label, count, color: c }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-8">{label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: areaTickets.length > 0 ? `${(count / areaTickets.length) * 100}%` : '0%',
                      background: c,
                    }}
                  />
                </div>
                <span className="text-[11px] text-zinc-500 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team performance */}
        {metricas.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Equipo</p>
            <div className="space-y-2">
              {metricas.map(m => (
                <div key={m.userId} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: color + 'aa' }}>
                    {m.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 font-medium truncate">{m.userName.split(' ')[0]}</p>
                    <ProgressBar value={m.porcentajeCumplimiento} color={
                      m.porcentajeCumplimiento >= 80 ? '#10b981' :
                      m.porcentajeCumplimiento >= 60 ? '#f59e0b' : '#ef4444'
                    } />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-bold text-zinc-200">{m.porcentajeCumplimiento}%</p>
                    <p className="text-[10px] text-zinc-600">{m.resueltos}/{m.totalTickets}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-2xl">
      <p className="font-bold text-white mb-1">{label}</p>
      <p style={{ color: payload[0]?.fill }}>SLA: <strong>{payload[0]?.value}%</strong></p>
      {payload[1] && <p className="text-zinc-400">Resueltos: <strong>{payload[1]?.value}</strong></p>}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function SuperUserDashboard() {
  const { tickets } = useTickets()
  const { users } = useUsers()

  const activeUsers = users.filter(u => u.is_active !== false)
  const resolverUsers = activeUsers.filter(u => isResolverArea(u.area))

  const total = tickets.length
  const active = tickets.filter(t => t.status !== Status.RESOLVED && t.status !== Status.CLOSED).length
  const inProgress = tickets.filter(t => t.status === Status.IN_PROGRESS).length
  const resolved = tickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED).length

  const dtiTickets = tickets.filter(t => t.area === 'DTI')
  const camTickets = tickets.filter(t => t.area === 'CAM')

  const metricas = useMemo(
    () => getMetricasPorTecnico(tickets, users),
    [tickets, users]
  )

  // Bar chart data: one bar per person
  const chartData = metricas
    .filter(m => m.totalTickets > 0)
    .sort((a, b) => b.porcentajeCumplimiento - a.porcentajeCumplimiento)
    .map(m => ({
      name: m.userName.split(' ')[0],
      fullName: m.userName,
      area: m.area,
      sla: m.porcentajeCumplimiento,
      resueltos: m.resueltos,
      total: m.totalTickets,
    }))

  // Pie chart: status distribution
  const pieData = [
    { name: 'Abiertos', value: tickets.filter(t => t.status === Status.OPEN).length, fill: '#3b82f6' },
    { name: 'En Progreso', value: inProgress, fill: '#f59e0b' },
    { name: 'Resueltos', value: tickets.filter(t => t.status === Status.RESOLVED).length, fill: '#10b981' },
    { name: 'Cerrados', value: tickets.filter(t => t.status === Status.CLOSED).length, fill: '#52525b' },
  ].filter(d => d.value > 0)

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-zinc-950">
      {/* ── Header ── */}
      <div className="px-7 py-5 border-b border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white font-black text-xl tracking-tight">Dashboard Global</h1>
            <p className="text-zinc-500 text-xs mt-0.5 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-rose-900/40 text-rose-300 border border-rose-800">
              SuperUser
            </span>
          </div>
        </div>
      </div>

      <div className="px-7 py-6 space-y-6">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total tickets" value={total} sub="histórico" icon="🎫" accent="#818cf8" />
          <StatCard label="Activos" value={active} sub="pendientes de cierre" icon="🔓" accent="#60a5fa" />
          <StatCard label="En progreso" value={inProgress} sub="siendo trabajados" icon="⚙️" accent="#fbbf24" />
          <StatCard label="Resueltos" value={resolved} sub={`${pct(resolved, total)}% del total`} icon="✅" accent="#34d399" />
        </div>

        {/* ── User stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Usuarios activos" value={activeUsers.length} icon="👥" accent="#a78bfa" />
          <StatCard label="Equipo técnico" value={resolverUsers.length} sub="DTI + CAM" icon="🔧" accent="#fb923c" />
          <StatCard label="Cumplimiento DTI" value={`${pct(dtiTickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED).length, dtiTickets.length)}%`} sub="tickets resueltos" icon="📘" accent="#3b82f6" />
          <StatCard label="Cumplimiento CAM" value={`${pct(camTickets.filter(t => t.status === Status.RESOLVED || t.status === Status.CLOSED).length, camTickets.length)}%`} sub="tickets resueltos" icon="📗" accent="#8b5cf6" />
        </div>

        {/* ── Area panels ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">Progreso por área</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AreaPanel area="DTI" color="#3b82f6" tickets={tickets} users={users} />
            <AreaPanel area="CAM" color="#8b5cf6" tickets={tickets} users={users} />
          </div>
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Bar chart: SLA per person */}
          <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-4">Cumplimiento SLA por persona</p>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-36 text-zinc-600 text-sm">Sin datos suficientes</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={22} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="sla" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.area === 'CAM' ? '#8b5cf6' :
                            entry.area === 'DTI' ? '#3b82f6' : '#6b7280'
                          }
                          opacity={entry.sla < 60 ? 0.55 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />DTI</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" />CAM</span>
              <span className="flex items-center gap-1 ml-auto"><span className="h-2 w-2 rounded-full bg-emerald-500" />≥80%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />60–79%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />&lt;60%</span>
            </div>
          </div>

          {/* Pie chart: status distribution */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-4">Distribución de estados</p>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-36 text-zinc-600 text-sm">Sin tickets</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: '#e4e4e7' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, color: '#71717a' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Full team table ── */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Rendimiento del equipo técnico</p>
          </div>
          {metricas.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-zinc-600 text-sm">
              Sin datos de técnicos aún
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Persona', 'Área', 'Tickets', 'Resueltos', 'SLA', 'Progreso', 'T. Prom.'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {metricas
                  .sort((a, b) => b.porcentajeCumplimiento - a.porcentajeCumplimiento)
                  .map(m => {
                    const slaColor = m.porcentajeCumplimiento >= 80 ? '#10b981' : m.porcentajeCumplimiento >= 60 ? '#f59e0b' : '#ef4444'
                    const areaColor = m.area === 'DTI' ? '#3b82f6' : '#8b5cf6'
                    return (
                      <tr key={m.userId} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                              style={{ background: areaColor + '55', color: areaColor }}
                            >
                              {m.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-zinc-200 text-xs font-medium">{m.userName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: areaColor + '22', color: areaColor }}
                          >
                            {m.area}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{m.totalTickets}</td>
                        <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{m.resueltos}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold" style={{ color: slaColor }}>
                            {m.porcentajeCumplimiento}%
                          </span>
                        </td>
                        <td className="px-4 py-3 w-32">
                          <ProgressBar value={m.porcentajeCumplimiento} color={slaColor} />
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                          {m.tiempoPromedioResolucion > 0 ? `${m.tiempoPromedioResolucion}d` : '—'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  )
}
