'use client'

import { useState } from 'react'
import { User, Ticket } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AssignModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (userId: string) => Promise<void>
  ticket: Ticket | null
  assignableUsers: User[]
}

export function AssignModal({ isOpen, onClose, onAssign, ticket, assignableUsers }: AssignModalProps) {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!userId) return
    setLoading(true)
    try { await onAssign(userId); onClose() }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar ticket</DialogTitle>
          <DialogDescription className="sr-only">Selecciona un técnico para asignar este ticket.</DialogDescription>
        </DialogHeader>
        {ticket && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">{ticket.title}</span>
          </p>
        )}
        <Select value={userId || undefined} onValueChange={setUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar técnico…" />
          </SelectTrigger>
          <SelectContent>
            {assignableUsers.filter(u => u.id).map(u => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} — <span className="text-zinc-400 text-xs">{u.role}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!userId || loading}>
            {loading ? 'Asignando…' : 'Asignar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
