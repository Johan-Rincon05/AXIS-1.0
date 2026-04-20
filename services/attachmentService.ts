import { Attachment } from '../types'

export interface CreateAttachmentData {
  ticket_id: string
  filename: string
  original_name: string
  file_size: number
  file_type: string
  file_path: string
  uploaded_by: string
}

export class AttachmentService {
  static async getAttachmentsByTicketId(ticketId: string): Promise<Attachment[]> {
    const res = await fetch(`/api/attachments/${ticketId}`)
    if (!res.ok) return []
    return res.json()
  }

  static async createAttachment(data: CreateAttachmentData): Promise<Attachment> {
    const res = await fetch('/api/attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al guardar adjunto')
    return res.json()
  }

  static async deleteAttachment(attachmentId: string): Promise<void> {
    // Obtener URL del blob antes de eliminar
    const res = await fetch(`/api/attachments?id=${attachmentId}`)
    if (res.ok) {
      const attachment: Attachment = await res.json()
      // Eliminar del blob storage
      await fetch('/api/delete-blob', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: attachment.file_path }),
      }).catch(() => {})
    }
    // Eliminar de la BD
    const delRes = await fetch(`/api/attachments?id=${attachmentId}`, { method: 'DELETE' })
    if (!delRes.ok) throw new Error('Error al eliminar adjunto')
  }

  static async uploadFileToBlob(file: File, ticketId: string): Promise<{ url: string; pathname: string; size: number }> {
    const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&ticketId=${ticketId}`, {
      method: 'POST',
      body: file,
    })
    if (!res.ok) throw new Error('Error al subir archivo')
    return res.json()
  }

  static getFileIcon(fileType: string): string {
    if (!fileType) return '📄'
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    if (fileType.includes('zip') || fileType.includes('compressed')) return '📦'
    return '📄'
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static getFileDownloadUrl(attachment: Attachment): string {
    return attachment.file_path
  }
}

export const attachmentServiceClient = AttachmentService
