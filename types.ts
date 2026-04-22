export enum Role {
  SUPER_USER = 'SuperUser',
  EMPLEADO = 'Empleado',
  GERENTE = 'Gerente',
  COORDINADOR = 'Coordinador',
  ASISTENCIA = 'Asistencia',
}

export type Area = 'DTI' | 'CAM'

export const RESOLVER_AREAS: string[] = ['DTI', 'CAM']
export const isResolverArea = (area: string | null | undefined): boolean =>
  area === 'DTI' || area === 'CAM'

export enum Status {
  OPEN = 'Abierto',
  IN_PROGRESS = 'En Progreso',
  RESOLVED = 'Resuelto',
  CLOSED = 'Cerrado',
}

export enum Priority {
  URGENT = 'Urgente',
  HIGH   = 'Alta',
  MEDIUM = 'Media',
  LOW    = 'Baja',
}

export interface SLATarget { responseHours: number; resolutionHours: number }

export const SLA_DTI: Record<Priority, SLATarget> = {
  [Priority.URGENT]: { responseHours: 0.5, resolutionHours: 4  },
  [Priority.HIGH]:   { responseHours: 1,   resolutionHours: 8  },
  [Priority.MEDIUM]: { responseHours: 4,   resolutionHours: 24 },
  [Priority.LOW]:    { responseHours: 8,   resolutionHours: 48 },
}

export enum TipoSolicitudCAM {
  DISEÑO_GRAFICO = 'Diseño Gráfico',
  EDICION_VIDEO = 'Edición de Video',
  GRABACION_AUDIOVISUAL = 'Grabación Audiovisual',
  PAUTA = 'Pauta/Publicidad',
  REDES_SOCIALES = 'Redes Sociales',
  OTRO = 'Otro',
}

export const SLA_DIAS_CAM: Record<TipoSolicitudCAM, number> = {
  [TipoSolicitudCAM.DISEÑO_GRAFICO]: 2,
  [TipoSolicitudCAM.EDICION_VIDEO]: 4,
  [TipoSolicitudCAM.GRABACION_AUDIOVISUAL]: 4,
  [TipoSolicitudCAM.PAUTA]: 2,
  [TipoSolicitudCAM.REDES_SOCIALES]: 1,
  [TipoSolicitudCAM.OTRO]: 2,
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  area?: Area | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  ticket_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requester_id: string;
  assigned_to?: string;
  transferred_by?: string;
  status: Status;
  priority: Priority;
  category: string;
  area: Area;
  // DTI-specific
  origin?: 'Interna' | 'Externa';
  external_company?: string;
  external_contact?: string;
  // CAM-specific
  tipo_solicitud?: TipoSolicitudCAM;
  objetivo_solicitud?: string;
  publico_objetivo?: string;
  mensaje_clave?: string;
  fecha_limite?: string;
  // Metadata
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  first_response_at?: string;
  comments: Comment[];
  attachments?: Attachment[];
}

export interface SLAMetric {
  ticketId: string;
  title: string;
  assignedTo?: string;
  area: Area;
  tipo_solicitud?: TipoSolicitudCAM;
  createdAt: string;
  resolvedAt?: string;
  fechaLimiteSLA?: string;
  enTiempo: boolean;
  diasRestantes?: number;
  status: Status;
}

export interface LinearMetrica {
  totalAsignadas: number;
  completadas: number;
  enProgreso: number;
  porcentaje: number;
}

export interface MetricasTecnico {
  userId: string;
  userName: string;
  area: Area;
  // Métricas de AXIS (Soporte)
  totalTickets: number;
  resueltos: number;
  enTiempo: number;
  fueraDeTiempo: number;
  porcentajeTickets: number;
  tiempoPromedioResolucion: number;
  // Métricas de Linear (Proyectos)
  linear: LinearMetrica;
  // KPI Combinado
  porcentajeCumplimiento: number;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
