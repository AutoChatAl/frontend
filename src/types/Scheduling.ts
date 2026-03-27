export interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  slots: TimeSlot[];
}

export interface DateException {
  date: string; // YYYY-MM-DD
  type: 'BLOCKED' | 'CUSTOM';
  slots?: TimeSlot[];
  reason?: string;
}

export interface BusinessHours {
  id: string;
  workspaceId: string;
  weeklySchedule: DaySchedule[];
  exceptions: DateException[];
  slotDurationMinutes: number;
}

export interface Appointment {
  id: string;
  workspaceId: string;
  contactId: string;
  productId?: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  createdBy: 'USER' | 'AI';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: AvailabilitySlot[];
  slotDurationMinutes: number;
}

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não Compareceu',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  NO_SHOW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
