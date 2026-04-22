'use client'

import { useState, useEffect } from 'react'
import { User, Role, Area, isResolverArea } from '@/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  user: User | null
}

interface AreaEntry { id: string; name: string }

const NO_AREA = '__none__'
const BLANK = { name: '', email: '', phone: '', role: Role.EMPLEADO, area: NO_AREA as string }

function autoEmail(name: string) {
  return name ? name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '.') + '@empresa.com' : ''
}

const RESOLVER_ROLES: Role[] = [Role.GERENTE, Role.COORDINADOR, Role.ASISTENCIA, Role.EMPLEADO]
const REQUESTER_ROLES: Role[] = [Role.EMPLEADO]
const ROLES_NO_AREA: Role[] = [Role.SUPER_USER]

export function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const [form, setForm] = useState(BLANK)
  const [loading, setLoading] = useState(false)
  const [customAreas, setCustomAreas] = useState<AreaEntry[]>([])

  useEffect(() => {
    fetch('/api/areas').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCustomAreas(data)
    }).catch(() => {})
  }, [isOpen])

  useEffect(() => {
    setForm(user
      ? { name: user.name, email: user.email, phone: user.phone || '', role: user.role, area: user.area || NO_AREA }
      : BLANK
    )
  }, [user, isOpen])

  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name, email: prev.email || autoEmail(name) }))
  }

  const hasArea = form.area && form.area !== NO_AREA
  const availableRoles = !hasArea
    ? ROLES_NO_AREA
    : isResolverArea(form.area)
    ? RESOLVER_ROLES
    : REQUESTER_ROLES

  const handleAreaChange = (v: string) => {
    const defaultRole = !v || v === NO_AREA
      ? Role.SUPER_USER
      : isResolverArea(v)
      ? Role.EMPLEADO
      : Role.EMPLEADO
    setForm(p => ({ ...p, area: v, role: defaultRole }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ ...form, area: (form.area && form.area !== NO_AREA) ? form.area : null })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogDescription className="sr-only">
            {user ? 'Edita los datos del usuario.' : 'Completa los datos para crear un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Nombre completo</Label>
            <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Juan Pérez" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Correo electrónico</Label>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Teléfono</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+57 300 000 0000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Área</Label>
              <Select value={form.area || undefined} onValueChange={handleAreaChange}>
                <SelectTrigger><SelectValue placeholder="Sin área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_AREA}>Sin área (SuperUser)</SelectItem>
                  <SelectItem value="DTI">DTI — Resolutora</SelectItem>
                  <SelectItem value="CAM">CAM — Resolutora</SelectItem>
                  {customAreas.map(a => (
                    <SelectItem key={a.id} value={a.name}>{a.name} — Solicitante</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Rol</Label>
              <Select value={form.role || undefined} onValueChange={v => setForm(p => ({ ...p, role: v as Role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
