import type { TimeSlot } from '@/types/Scheduling';

export interface GeneratedSlot {
  /** "HH:mm" */
  time: string;
  startMinutes: number;
  /** Duração padrão, ou o tamanho do turno quando ele é mais curto que ela. */
  durationMinutes: number;
}

/** Minuto do dia de um "HH:mm"; `null` quando o texto não é um horário. */
export function timeToMinutes(value: string): number | null {
  const [rawHour, rawMinute] = value.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Turno com fim antes ou igual ao início não gera horário nenhum. */
export function isWindowValid(window: TimeSlot): boolean {
  const start = timeToMinutes(window.start);
  const end = timeToMinutes(window.end);
  return start !== null && end !== null && end > start;
}

/**
 * Horários que um turno gera — a mesma regra do backend (`availability-slots.util`):
 * anda de duração em duração enquanto um atendimento inteiro cabe; turno mais
 * curto que a duração vira um único horário do tamanho do turno.
 */
export function generateWindowSlots(window: TimeSlot, slotDurationMinutes: number): GeneratedSlot[] {
  const start = timeToMinutes(window.start);
  const end = timeToMinutes(window.end);
  if (start === null || end === null || end <= start) return [];
  const step = slotDurationMinutes >= 1 ? Math.floor(slotDurationMinutes) : 30;
  if (end - start < step) {
    return [{ time: minutesToTime(start), startMinutes: start, durationMinutes: end - start }];
  }
  const slots: GeneratedSlot[] = [];
  for (let current = start; current + step <= end; current += step) {
    slots.push({ time: minutesToTime(current), startMinutes: current, durationMinutes: step });
  }
  return slots;
}
