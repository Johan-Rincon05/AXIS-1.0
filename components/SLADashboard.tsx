'use client'

import { Role, Area, MetricasTecnico } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SLADashboardProps {
  metricas: MetricasTecnico[]
  currentUserRole: Role
  currentUserMetrica?: MetricasTecnico
  area?: Area
}

const AREA_COLOR = {
  DTI: { bg: 'bg-blue-500', text: 'text-blue-600', dark: 'dark:text-blue-400', hex: '#3B82F6' },
  CAM: { bg: 'bg-violet-500', text: 'text-violet-600', dark: 'dark:text-violet-400', hex: '#8B5CF6' },
}

function getCumplimientoBadge(pct: number) {
  if (pct >= 80) return { label: `${pct}%`, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' }
  if (pct >= 60) return { label: `${pct}%`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-700' }
  return { label: `${pct}%`, cls: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-700' }
}

function KPICard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <Card className="p-4 flex flex-col gap-1 border-zinc-200 dark:border-zinc-800">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={`text-3xl font-black tracking-tight ${accent ?? 'text-zinc-900 dark:text-white'}`} style={{ fontFamily: "'DM Mono', monospace" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </Card>
  )
}

function PersonalView({ metrica }: { metrica: MetricasTecnico }) {
  const areaColor = AREA_COLOR[metrica.area] ?? AREA_COLOR.DTI
  const badge = getCumplimientoBadge(metrica.porcentajeCumplimiento)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${areaColor.bg}`} />
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Mis métricas — <span className={`${areaColor.text} ${areaColor.dark}`}>{metrica.area}</span>
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="KPI Global" value={`${metrica.porcentajeCumplimiento}%`} sub="Promedio ponderado" accent="text-blue-600 dark:text-blue-400" />
        <KPICard label="Tickets Soporte" value={metrica.resueltos} sub={`de ${metrica.totalTickets} asignados`} />
        <KPICard label="SLA Tickets" value={`${metrica.porcentajeTickets}%`} sub={`${metrica.enTiempo} en tiempo`} />
        <KPICard label="Tareas Linear" value={metrica.linear.completadas} sub={`de ${metrica.linear.totalAsignadas} en total`} />
      </div>

      <Card className="p-5 border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cumplimiento Global</p>
          <Badge variant="outline" className={`text-sm font-bold px-3 py-1 ${badge.cls}`}>
            {badge.label}
          </Badge>
        </div>
        <Progress
          value={metrica.porcentajeCumplimiento}
          className="h-3 rounded-full"
        />
        <div className="flex justify-between mt-2 text-[11px] text-zinc-400">
          <span>Tickets: {metrica.porcentajeTickets}% · Linear: {metrica.linear.porcentaje}%</span>
          <span>Meta Global: 80%</span>
        </div>
      </Card>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-zinc-800 dark:text-white mb-1">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400">Cumplimiento: <strong>{payload[0]?.value}%</strong></p>
    </div>
  )
}

export function SLADashboard({
  metricas,
  currentUserRole,
  currentUserMetrica,
  area,
}: SLADashboardProps) {
  const isAsistencia = currentUserRole === Role.ASISTENCIA
  const isManager = currentUserRole === Role.GERENTE || currentUserRole === Role.COORDINADOR

  const filtered = area ? metricas.filter(m => m.area === area) : metricas

  const totalTickets = filtered.reduce((acc, m) => acc + m.totalTickets, 0)
  const totalResueltos = filtered.reduce((acc, m) => acc + m.resueltos, 0)
  const totalEnTiempo = filtered.reduce((acc, m) => acc + m.enTiempo, 0)
  const totalFuera = filtered.reduce((acc, m) => acc + m.fueraDeTiempo, 0)
  const globalPct = totalResueltos > 0 ? Math.round((totalEnTiempo / totalResueltos) * 100) : 100

  const chartData = filtered.map(m => ({
    name: m.userName.split(' ')[0],
    fullName: m.userName,
    area: m.area,
    pct: m.porcentajeCumplimiento,
  }))

  if (isAsistencia && currentUserMetrica) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
        <PersonalView metrica={currentUserMetrica} />
      </div>
    )
  }

  if (!isManager) return null

  return (
    <div
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-6"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
            Panel de Cumplimiento SLA
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {area ? `Área ${area}` : 'Todas las áreas'} · {filtered.length} técnico{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm font-bold px-3 py-1 ${getCumplimientoBadge(globalPct).cls}`}
        >
          {globalPct}% global
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Promedio Global" value={`${globalPct}%`} accent="text-blue-600 dark:text-blue-400" />
        <KPICard label="Tickets Soporte" value={totalResueltos} sub={`resueltos de ${totalTickets}`} accent="text-emerald-600 dark:text-emerald-400" />
        <KPICard label="SLA Tickets" value={totalResueltos > 0 ? Math.round((totalEnTiempo / totalResueltos) * 100) + '%' : '100%'} sub={`${totalEnTiempo} a tiempo`} />
        <KPICard label="Tareas Linear" value={filtered.reduce((acc, m) => acc + m.linear.completadas, 0)} sub={`de ${filtered.reduce((acc, m) => acc + m.linear.totalAsignadas, 0)} asignadas`} />
      </div>

      <Separator className="dark:bg-zinc-800" />

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
            Cumplimiento por técnico
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.area === 'CAM'
                          ? AREA_COLOR.CAM.hex
                          : AREA_COLOR.DTI.hex
                      }
                      opacity={entry.pct < 60 ? 0.6 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
            {(!area || area === 'DTI') && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> DTI
              </span>
            )}
            {(!area || area === 'CAM') && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> CAM
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> ≥80%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 60–79%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> &lt;60%
            </span>
          </div>
        </div>
      )}

      <Separator className="dark:bg-zinc-800" />

      {/* Técnico table */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
          Detalle por técnico
        </p>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                {['Técnico', 'Área', 'KPI Global', 'SLA Tickets', 'Progreso Linear', 'Tickets Fuera Plazo'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map(m => {
                const badge = getCumplimientoBadge(m.porcentajeCumplimiento)
                const badgeTickets = getCumplimientoBadge(m.porcentajeTickets)
                const badgeLinear = getCumplimientoBadge(m.linear.porcentaje)
                const aColor = AREA_COLOR[m.area] ?? AREA_COLOR.DTI
                return (
                  <tr
                    key={m.userId}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200 text-sm">
                      {m.userName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${aColor.text} ${aColor.dark}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${aColor.bg}`} />
                        {m.area}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs font-bold ${badge.cls}`}>
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeTickets.cls}`}>
                        {m.porcentajeTickets}%
                      </span>
                      <span className="ml-2 text-[10px]">({m.resueltos}/{m.totalTickets})</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeLinear.cls}`}>
                        {m.linear.porcentaje}%
                      </span>
                      <span className="ml-2 text-[10px]">({m.linear.completadas}/{m.linear.totalAsignadas})</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
                      {m.fueraDeTiempo > 0 ? <span className="text-red-500 font-bold">{m.fueraDeTiempo} atrasados</span> : '0'}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-400">
                    No hay datos de técnicos para el área seleccionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
