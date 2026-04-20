'use client'

import { useState, useEffect } from 'react'
import { Role, Priority, TipoSolicitudCAM, SLA_DIAS_CAM } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export interface CAMTicketFormData {
  title: string
  description: string
  priority: Priority
  tipo_solicitud: TipoSolicitudCAM
  objetivo_solicitud: string
  publico_objetivo: string
  mensaje_clave: string
  fecha_limite: string
  requester_id: string
  area: 'CAM'
  category: string
  assigned_to?: string
}

interface CreateCAMTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CAMTicketFormData) => Promise<void>
  currentUser: { id: string; name: string; email: string; area?: string; role: Role }
  users: { id: string; name: string; role: Role; area?: string | null }[]
}

const TIPO_LABELS: Record<TipoSolicitudCAM, string> = {
  [TipoSolicitudCAM.DISEÑO_GRAFICO]: '🎨 Diseño Gráfico',
  [TipoSolicitudCAM.EDICION_VIDEO]: '🎬 Edición de Video',
  [TipoSolicitudCAM.GRABACION_AUDIOVISUAL]: '📹 Grabación Audiovisual',
  [TipoSolicitudCAM.PAUTA]: '📢 Pauta / Publicidad',
  [TipoSolicitudCAM.REDES_SOCIALES]: '📱 Redes Sociales',
  [TipoSolicitudCAM.OTRO]: '📋 Otro',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.URGENT]: '🚨 Urgente — P1',
  [Priority.HIGH]: '🔴 Alta',
  [Priority.MEDIUM]: '🟡 Media',
  [Priority.LOW]: '🟢 Baja',
}

const CATEGORY_BY_TIPO: Record<TipoSolicitudCAM, string> = {
  [TipoSolicitudCAM.DISEÑO_GRAFICO]: 'Diseño',
  [TipoSolicitudCAM.EDICION_VIDEO]: 'Video',
  [TipoSolicitudCAM.GRABACION_AUDIOVISUAL]: 'Audiovisual',
  [TipoSolicitudCAM.PAUTA]: 'Pauta',
  [TipoSolicitudCAM.REDES_SOCIALES]: 'Redes Sociales',
  [TipoSolicitudCAM.OTRO]: 'Otro',
}

const BLANK: Omit<CAMTicketFormData, 'requester_id' | 'area'> = {
  title: '',
  description: '',
  priority: Priority.MEDIUM,
  tipo_solicitud: TipoSolicitudCAM.DISEÑO_GRAFICO,
  objetivo_solicitud: '',
  publico_objetivo: '',
  mensaje_clave: '',
  fecha_limite: '',
  category: 'Diseño',
}

function addBusinessDays(days: number): string {
  const date = new Date()
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const d = date.getDay()
    if (d !== 0 && d !== 6) added++
  }
  return date.toISOString().split('T')[0]
}

export function CreateCAMTicketModal({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  users,
}: CreateCAMTicketModalProps) {
  const [form, setForm] = useState(BLANK)
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CAMTicketFormData, string>>>({})

  const isCoordinador = currentUser.role === Role.COORDINADOR
  const slaPlazoDias = SLA_DIAS_CAM[form.tipo_solicitud]

  // Auto-suggest fecha_limite from SLA when tipo changes
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      category: CATEGORY_BY_TIPO[prev.tipo_solicitud],
      fecha_limite: addBusinessDays(SLA_DIAS_CAM[prev.tipo_solicitud]),
    }))
  }, [form.tipo_solicitud])

  const camUsers = users.filter(
    u =>
      u.area === 'CAM' &&
      (u.role === Role.ASISTENCIA || u.role === Role.COORDINADOR || u.role === Role.GERENTE)
  )

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'El título es requerido'
    if (!form.description.trim()) e.description = 'La descripción es requerida'
    if (!form.objetivo_solicitud.trim()) e.objetivo_solicitud = 'El objetivo es requerido'
    if (!form.publico_objetivo.trim()) e.publico_objetivo = 'El público es requerido'
    if (!form.mensaje_clave.trim()) e.mensaje_clave = 'El mensaje clave es requerido'
    if (!form.fecha_limite) e.fecha_limite = 'La fecha límite es requerida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        requester_id: currentUser.id,
        area: 'CAM',
        assigned_to: assignedTo || undefined,
      })
      setForm(BLANK)
      setAssignedTo('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0"
        style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-4 rounded-t-xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold tracking-tight flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center text-sm">📣</span>
              Nueva Solicitud — Área CAM
            </DialogTitle>
            <p className="text-violet-200 text-xs mt-0.5">
              Comunicaciones Audiovisuales y Marketing
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* SLA Banner */}
          <div className="flex items-start gap-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-4 py-3">
            <span className="text-violet-500 mt-0.5 text-base">⏱</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                Tiempo de entrega estimado — SLA CAM
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                Para <strong>{TIPO_LABELS[form.tipo_solicitud].replace(/^.+?\s/, '')}</strong>:{' '}
                <strong>{slaPlazoDias} día{slaPlazoDias !== 1 ? 's' : ''} hábil{slaPlazoDias !== 1 ? 'es' : ''}</strong>.
                El tiempo inicia cuando la solicitud esté completa con todos los insumos.
              </p>
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Título de la solicitud *
            </Label>
            <Input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Diseño flyer evento graduación 2025"
              className={`h-9 text-sm ${errors.title ? 'border-red-400' : ''}`}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Tipo de solicitud + Prioridad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Tipo de solicitud *
              </Label>
              <Select
                value={form.tipo_solicitud}
                onValueChange={v => set('tipo_solicitud', v as TipoSolicitudCAM)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-sm">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Prioridad *
              </Label>
              <Select
                value={form.priority}
                onValueChange={v => set('priority', v as Priority)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-sm">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="dark:bg-zinc-800" />

          {/* Objetivo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Objetivo de la solicitud *
            </Label>
            <p className="text-[11px] text-zinc-400">¿Qué se busca lograr? (generar leads, informar, posicionar, convocar…)</p>
            <Textarea
              value={form.objetivo_solicitud}
              onChange={e => set('objetivo_solicitud', e.target.value)}
              placeholder="Ej: Generar expectativa para el evento e incentivar la asistencia de estudiantes"
              className={`text-sm min-h-[72px] resize-none ${errors.objetivo_solicitud ? 'border-red-400' : ''}`}
            />
            {errors.objetivo_solicitud && (
              <p className="text-xs text-red-500">{errors.objetivo_solicitud}</p>
            )}
          </div>

          {/* Público + Mensaje */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Público objetivo *
              </Label>
              <p className="text-[11px] text-zinc-400">¿A quién va dirigido?</p>
              <Input
                value={form.publico_objetivo}
                onChange={e => set('publico_objetivo', e.target.value)}
                placeholder="Ej: Estudiantes universitarios"
                className={`h-9 text-sm ${errors.publico_objetivo ? 'border-red-400' : ''}`}
              />
              {errors.publico_objetivo && (
                <p className="text-xs text-red-500">{errors.publico_objetivo}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Mensaje clave *
              </Label>
              <p className="text-[11px] text-zinc-400">¿Qué debe sentir/entender?</p>
              <Input
                value={form.mensaje_clave}
                onChange={e => set('mensaje_clave', e.target.value)}
                placeholder="Ej: Esta es una oportunidad única"
                className={`h-9 text-sm ${errors.mensaje_clave ? 'border-red-400' : ''}`}
              />
              {errors.mensaje_clave && (
                <p className="text-xs text-red-500">{errors.mensaje_clave}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Descripción de la solicitud *
            </Label>
            <p className="text-[11px] text-zinc-400">Explica claramente qué necesitas (formato, tamaño, referencias, etc.)</p>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Ej: Necesito un flyer vertical para Instagram (1080x1920px) con los logos institucionales, fecha del evento y call to action…"
              className={`text-sm min-h-[96px] resize-none ${errors.description ? 'border-red-400' : ''}`}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Fecha límite */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              Fecha límite de entrega *
              <Badge
                variant="outline"
                className="text-[10px] border-violet-300 text-violet-600 dark:text-violet-400 font-normal"
              >
                Sugerido por SLA: {slaPlazoDias}d hábiles
              </Badge>
            </Label>
            <Input
              type="date"
              value={form.fecha_limite}
              onChange={e => set('fecha_limite', e.target.value)}
              className={`h-9 text-sm w-52 ${errors.fecha_limite ? 'border-red-400' : ''}`}
            />
            {errors.fecha_limite && <p className="text-xs text-red-500">{errors.fecha_limite}</p>}
          </div>

          {/* Asignación — solo COORDINADOR */}
          {isCoordinador && camUsers.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Asignar a (opcional)
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Sin asignación — se asignará después" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-sm text-zinc-400">
                    Sin asignación
                  </SelectItem>
                  {camUsers.map(u => (
                    <SelectItem key={u.id} value={u.id} className="text-sm">
                      {u.name}{' '}
                      <span className="text-zinc-400 text-xs">— {u.role}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conditions note */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">⚠ Condiciones generales</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-600 dark:text-amber-500">
              <li>Solicitudes incompletas podrán ser devueltas para corrección.</li>
              <li>Solicitudes urgentes deben estar justificadas y sujetas a disponibilidad.</li>
              <li>Los tiempos SLA inician cuando todos los insumos estén entregados.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="text-sm">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Enviando…
              </span>
            ) : (
              'Enviar solicitud'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
