'use client'

import { useState } from 'react'
import { User, Priority, Role } from '@/types'
import { DTI_CATEGORIES, DTICategory } from '../../types/dti.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateDTITicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  currentUser: User | null
  users: User[]
}

const BLANK = {
  title: '', description: '', priority: Priority.MEDIUM,
  category: 'Otro' as DTICategory, origin: 'Interna' as 'Interna' | 'Externa',
  requester_id: '', external_company: '', external_contact: '',
}

export function CreateDTITicketModal({ isOpen, onClose, onSubmit, currentUser, users }: CreateDTITicketModalProps) {
  const [form, setForm] = useState(BLANK)
  const [loading, setLoading] = useState(false)

  const isStaff = currentUser?.role !== Role.EMPLEADO
  const employeeUsers = users.filter(u => u.role === Role.EMPLEADO)

  const set = <K extends keyof typeof BLANK>(k: K, v: (typeof BLANK)[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        requester_id: isStaff && form.origin === 'Interna' && form.requester_id
          ? form.requester_id
          : currentUser?.id,
      })
      setForm(BLANK)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">D</span>
            Nuevo Ticket DTI
          </DialogTitle>
          <DialogDescription className="sr-only">Crea un nuevo ticket de soporte DTI llenando este formulario.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Título *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Describe el problema brevemente" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Categoría</Label>
              <Select value={form.category || undefined} onValueChange={v => set('category', v as DTICategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DTI_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Prioridad</Label>
              <Select value={form.priority || undefined} onValueChange={v => set('priority', v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.URGENT}>🔴 Urgente — P1</SelectItem>
                  <SelectItem value={Priority.HIGH}>Alta — P2</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>Media — P3</SelectItem>
                  <SelectItem value={Priority.LOW}>Baja — P4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Origen</Label>
            <Select value={form.origin || undefined} onValueChange={v => set('origin', v as 'Interna' | 'Externa')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Interna">Interna</SelectItem>
                <SelectItem value="Externa">Externa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isStaff && form.origin === 'Interna' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Solicitante</Label>
              <Select value={form.requester_id || undefined} onValueChange={v => set('requester_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar empleado…" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.origin === 'Externa' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Empresa</Label>
                <Input value={form.external_company} onChange={e => set('external_company', e.target.value)} placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contacto</Label>
                <Input value={form.external_contact} onChange={e => set('external_contact', e.target.value)} placeholder="Nombre del contacto" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Descripción *</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe el problema con el mayor detalle posible…"
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white">
              {loading ? 'Creando…' : 'Crear Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
