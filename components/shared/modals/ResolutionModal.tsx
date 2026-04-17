'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onResolve: (notes: string) => Promise<void>
  ticketTitle: string
}

export function ResolutionModal({ isOpen, onClose, onResolve, ticketTitle }: ResolutionModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try { await onResolve(notes); setNotes(''); onClose() }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como resuelto</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-2 truncate">{ticketTitle}</p>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Notas de resolución (opcional)
          </Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe cómo se resolvió el problema…"
            className="min-h-[90px] resize-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? 'Guardando…' : 'Confirmar resolución'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
