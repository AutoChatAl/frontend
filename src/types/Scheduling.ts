export interface TimeSlot {
    start: string;
    end: string;
}
export interface DaySchedule {
    dayOfWeek: number;
    enabled: boolean;
    slots: TimeSlot[];
}
export interface DateException {
    date: string;
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
export type AppointmentType = 'APPOINTMENT' | 'BLOCK';
export const TYPE_LABELS: Record<AppointmentType, string> = {
  APPOINTMENT: 'Agendamento',
  BLOCK: 'Bloqueio',
};
export interface Appointment {
    id: string;
    workspaceId: string;
    type: AppointmentType;
    contactId?: string;
    productId?: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    createdBy: 'USER' | 'AI' | 'GOOGLE';
    notes?: string;
    googleEventId?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AvailabilitySlot {
    time: string;
    available: boolean;
    /** Duração padrão, ou o tamanho do turno quando ele é mais curto que ela. */
    durationMinutes?: number;
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

export type SchedulingReminderKey = 'oneHour' | 'thirtyMinutes';
export interface SchedulingReminderSetting {
    enabled: boolean;
    message: string;
}
export type SchedulingReminders = Record<SchedulingReminderKey, SchedulingReminderSetting>;
export type SchedulingRemindersPatch = Partial<Record<SchedulingReminderKey, Partial<SchedulingReminderSetting>>>;
export const SCHEDULING_REMINDER_MESSAGE_MAX_LENGTH = 1000;
export const SCHEDULING_REMINDER_OPTIONS: { key: SchedulingReminderKey; title: string; leadTime: string }[] = [
  { key: 'oneHour', title: '1 hora antes', leadTime: '1 hora' },
  { key: 'thirtyMinutes', title: '30 minutos antes', leadTime: '30 minutos' },
];
/** Variáveis que o backend troca no envio. `example` alimenta a prévia. */
export const SCHEDULING_REMINDER_VARIABLES: { token: string; label: string; example: string }[] = [
  { token: 'nome', label: 'Nome do contato', example: 'Maria' },
  { token: 'servico', label: 'Serviço', example: 'Corte de cabelo' },
  { token: 'data', label: 'Data', example: '14/10' },
  { token: 'horario', label: 'Horário', example: '14:30' },
  { token: 'periodo', label: 'Período do dia', example: 'tarde' },
  { token: 'antecedencia', label: 'Tempo que falta', example: '1 hora' },
];
