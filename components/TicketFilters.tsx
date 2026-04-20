'use client'

import { Area, Status, Priority } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FilterState {
  area: Area | 'all'
  status: Status | 'all'
  priority: Priority | 'all'
}

interface TicketFiltersProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
  totalDTI: number
  totalCAM: number
  userArea?: Area
}

const AREA_LABELS: Record<Area | 'all', string> = {
  all: 'Todas las áreas',
  DTI: 'DTI',
  CAM: 'CAM',
}

const STATUS_LABELS: Record<Status | 'all', string> = {
  all: 'Todos los estados',
  [Status.OPEN]: 'Abierto',
  [Status.IN_PROGRESS]: 'En Progreso',
  [Status.RESOLVED]: 'Resuelto',
  [Status.CLOSED]: 'Cerrado',
}

const PRIORITY_LABELS: Record<Priority | 'all', string> = {
  all: 'Todas las prioridades',
  [Priority.URGENT]: 'Urgente',
  [Priority.HIGH]: 'Alta',
  [Priority.MEDIUM]: 'Media',
  [Priority.LOW]: 'Baja',
}

export function TicketFilters({
  onFilterChange,
  currentFilters,
  totalDTI,
  totalCAM,
  userArea,
}: TicketFiltersProps) {
  const update = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...currentFilters, [key]: value })
  }

  const showDTI = !userArea || userArea === 'DTI'
  const showCAM = !userArea || userArea === 'CAM'
  const showAll = !userArea

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3"
      style={{ fontFamily: "'DM Mono', 'JetBrains Mono', monospace" }}
    >
      {/* Area pills */}
      <div className="flex items-center gap-2 mr-2">
        {showAll && (
          <button
            onClick={() => update('area', 'all')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
              currentFilters.area === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Todos
            <span className="rounded-full bg-zinc-600 dark:bg-zinc-400 text-white dark:text-zinc-900 px-1.5 text-[10px]">
              {totalDTI + totalCAM}
            </span>
          </button>
        )}

        {showDTI && (
          <button
            onClick={() => update('area', 'DTI')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
              currentFilters.area === 'DTI'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            DTI
            <span
              className={`rounded-full px-1.5 text-[10px] ${
                currentFilters.area === 'DTI'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
              }`}
            >
              {totalDTI}
            </span>
          </button>
        )}

        {showCAM && (
          <button
            onClick={() => update('area', 'CAM')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
              currentFilters.area === 'CAM'
                ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                : 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            CAM
            <span
              className={`rounded-full px-1.5 text-[10px] ${
                currentFilters.area === 'CAM'
                  ? 'bg-violet-500 text-white'
                  : 'bg-violet-200 text-violet-700 dark:bg-violet-800 dark:text-violet-300'
              }`}
            >
              {totalCAM}
            </span>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Estado filter */}
      <Select
        value={currentFilters.status}
        onValueChange={(v) => update('status', v)}
      >
        <SelectTrigger className="h-8 w-44 rounded-lg border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(STATUS_LABELS) as [string, string][]).map(([val, label]) => (
            <SelectItem key={val} value={val} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Prioridad filter */}
      <Select
        value={currentFilters.priority}
        onValueChange={(v) => update('priority', v)}
      >
        <SelectTrigger className="h-8 w-48 rounded-lg border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(PRIORITY_LABELS) as [string, string][]).map(([val, label]) => (
            <SelectItem key={val} value={val} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {(currentFilters.area !== 'all' ||
        currentFilters.status !== 'all' ||
        currentFilters.priority !== 'all') && (
        <button
          onClick={() =>
            onFilterChange({ area: 'all', status: 'all', priority: 'all' })
          }
          className="ml-auto text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
