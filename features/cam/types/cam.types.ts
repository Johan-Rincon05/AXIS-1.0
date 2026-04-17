import { TipoSolicitudCAM, Priority, SLA_DIAS_CAM } from '@/types'

export interface CreateCAMTicketForm {
  title: string
  description: string
  priority: Priority
  tipo_solicitud: TipoSolicitudCAM
  objetivo_solicitud: string
  publico_objetivo: string
  mensaje_clave: string
  fecha_limite: string
  requester_id: string
  assigned_to?: string
}

export function getSLADias(tipo: TipoSolicitudCAM): number {
  return SLA_DIAS_CAM[tipo]
}
