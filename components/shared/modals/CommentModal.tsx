'use client'

import { useState } from 'react'
import { User } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (text: string) => Promise<void>
  currentUser: User | null
}

export function CommentModal({ isOpen, onClose, onAdd, currentUser }: CommentModalProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)
    try { await onAdd(text); setText(''); onClose() }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar comentario</DialogTitle>
          <DialogDescription className="sr-only">Modal de interacción</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribe tu comentario…"
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!text.trim() || loading}>
            {loading ? 'Enviando…' : 'Comentar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
