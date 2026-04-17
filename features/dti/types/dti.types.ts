import { Priority } from '@/types'

export type DTICategory =
  | 'Hardware'
  | 'Software'
  | 'Red'
  | 'Correo'
  | 'Accesos'
  | 'Instalación'
  | 'Mantenimiento'
  | 'Otro'

export const DTI_CATEGORIES: DTICategory[] = [
  'Hardware', 'Software', 'Red', 'Correo',
  'Accesos', 'Instalación', 'Mantenimiento', 'Otro',
]

export interface CreateDTITicketForm {
  title: string
  description: string
  priority: Priority
  category: DTICategory
  origin: 'Interna' | 'Externa'
  requester_id?: string
  external_company?: string
  external_contact?: string
  assigned_to?: string
}
