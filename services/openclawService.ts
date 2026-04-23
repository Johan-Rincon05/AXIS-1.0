import { Ticket, User } from '@/types'

const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://172.17.0.1:8443'
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'tu_token_nuevo'

async function injectMessageToAgent(phone: string, prompt: string) {
  if (!phone) return

  // Limpiar teléfono
  let cleanPhone = phone.replace(/[^0-9+]/g, '')
  if (cleanPhone.startsWith('57')) cleanPhone = '+' + cleanPhone
  if (!cleanPhone.startsWith('+')) cleanPhone = '+57' + cleanPhone

  const body = JSON.stringify({
    text: prompt,
    metadata: { source: "axis_system_trigger" }
  })

  try {
    const res = await fetch(`${OPENCLAW_URL}/api/v1/agent/main/session/whatsapp:dm:${cleanPhone}/event`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body
    })
    
    if (!res.ok) {
      console.error(`[OpenClaw] Error inyectando mensaje a ${cleanPhone}:`, await res.text())
    }
  } catch (error) {
    console.error(`[OpenClaw] Fetch error:`, error)
  }
}

export async function notifyCoordinatorNewTicket(ticket: Ticket, coordinator: User) {
  const prompt = `[SISTEMA]: Se acaba de crear un nuevo ticket en tu área (${ticket.area}). 
  - ID: ${ticket.id.split('-')[0]}
  - Título: ${ticket.title}
  
  Escríbele AHORA MISMO a este coordinador para notificarle de la creación del ticket y pregúntale: "¿A qué miembro del equipo le asignamos este ticket?"`
  
  await injectMessageToAgent(coordinator.phone, prompt)
}

export async function notifyUserTicketResolved(ticket: Ticket, user: User) {
  const prompt = `[SISTEMA]: El ticket de este usuario (ID: ${ticket.id.split('-')[0]} - "${ticket.title}") acaba de ser marcado como RESUELTO o CERRADO.
  
  Escríbele AHORA MISMO para notificarle que su solicitud ha sido resuelta. Sé amable y despídete formalmente.`
  
  await injectMessageToAgent(user.phone, prompt)
}

export async function notifyUserTicketUpdated(ticket: Ticket, user: User) {
  const prompt = `[SISTEMA]: Hubo una actualización en el ticket de este usuario (ID: ${ticket.id.split('-')[0]} - "${ticket.title}"). El estado actual es: ${ticket.status}.
  
  Escríbele AHORA MISMO para informarle brevemente de esta actualización.`
  
  await injectMessageToAgent(user.phone, prompt)
}
