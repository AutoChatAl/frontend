'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Plus, Clock, User } from 'lucide-react';
import type { Appointment, BusinessHours } from '@/types/Scheduling';
import type { Contact } from '@/types/Contact';
import type { Product } from '@/services/ai.service';
import { STATUS_COLORS, STATUS_LABELS, DAY_SHORT, type AppointmentStatus } from '@/types/Scheduling';

interface CalendarViewProps {
  appointments: Appointment[];
  businessHours: BusinessHours | null;
  contacts: Contact[];
  products: Product[];
  currentWeekStart: Date;
  onWeekChange: (date: Date) => void;
  onCreateAppointment: (date?: string, time?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6:00 to 20:00

export default function CalendarView({
  appointments,
  businessHours,
  contacts,
  products,
  currentWeekStart,
  onWeekChange,
  onCreateAppointment,
  onEditAppointment,
  onUpdateStatus,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const contactMap = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // ── Week View Logic ───────────────────────────
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  // ── Month View Logic ──────────────────────────
  const currentMonth = useMemo(() => {
    const midWeek = new Date(currentWeekStart);
    midWeek.setDate(midWeek.getDate() + 3);
    return midWeek;
  }, [currentWeekStart]);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const days: Date[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1];
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      days.push(d);
    }
    return days;
  }, [currentMonth]);

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDateStr(date);
    return appointments.filter((a) => {
      const aptDate = new Date(a.startAt).toISOString().slice(0, 10);
      return aptDate === dateStr && a.status !== 'CANCELLED';
    });
  };

  const getAppointmentsForHour = (date: Date, hour: number) => {
    const dateStr = formatDateStr(date);
    return appointments.filter((a) => {
      const aptStart = new Date(a.startAt);
      const aptDate = aptStart.toISOString().slice(0, 10);
      const aptHour = aptStart.getUTCHours();
      return aptDate === dateStr && aptHour === hour && a.status !== 'CANCELLED';
    });
  };

  const isWorkingHour = (date: Date, hour: number) => {
    if (!businessHours) return true;
    const dayOfWeek = date.getDay();
    const dateStr = formatDateStr(date);

    const exception = businessHours.exceptions.find((e) => e.date === dateStr);
    if (exception) {
      if (exception.type === 'BLOCKED') return false;
      if (exception.slots) {
        return exception.slots.some((s) => {
          const [sh] = s.start.split(':').map(Number);
          const [eh] = s.end.split(':').map(Number);
          return hour >= sh && hour < eh;
        });
      }
    }

    const daySchedule = businessHours.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.enabled) return false;
    return daySchedule.slots.some((s) => {
      const [sh] = s.start.split(':').map(Number);
      const [eh] = s.end.split(':').map(Number);
      return hour >= sh && hour < eh;
    });
  };

  const navigateWeek = (direction: number) => {
    const newStart = new Date(currentWeekStart);
    if (viewMode === 'week') {
      newStart.setDate(newStart.getDate() + direction * 7);
    } else {
      newStart.setMonth(newStart.getMonth() + direction);
    }
    onWeekChange(newStart);
  };

  const goToToday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    onWeekChange(weekStart);
  };

  const formatDateStr = (d: Date) => {
    return d.toISOString().slice(0, 10);
  };

  const isToday = (d: Date) => {
    return formatDateStr(d) === formatDateStr(today);
  };

  const isCurrentMonth = (d: Date) => {
    return d.getMonth() === currentMonth.getMonth();
  };

  const headerLabel = viewMode === 'week'
    ? `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            Hoje
          </button>
          <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronRight size={18} className="text-slate-600 dark:text-slate-400" />
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize ml-1">
            {headerLabel}
          </span>
        </div>
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex-1 sm:flex-initial justify-center ${viewMode === 'week' ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <CalendarDays size={14} />
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex-1 sm:flex-initial justify-center ${viewMode === 'month' ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <LayoutGrid size={14} />
            Mês
          </button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700">
            <div className="p-2 border-r border-slate-100 dark:border-slate-700" />
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-2 sm:p-3 text-center border-r last:border-r-0 border-slate-100 dark:border-slate-700 ${isToday(day) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
              >
                <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium uppercase">
                  {DAY_SHORT[day.getDay()]}
                </div>
                <div className={`text-sm sm:text-lg font-bold mt-0.5 ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          {/* Time grid - scrollable on mobile */}
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
            <div className="min-w-[640px]">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <div className="p-1 sm:p-2 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 text-right pr-2 sm:pr-3 border-r border-slate-100 dark:border-slate-700 font-medium">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day, dayIdx) => {
                    const dayAppts = getAppointmentsForHour(day, hour);
                    const isWorking = isWorkingHour(day, hour);
                    return (
                      <div
                        key={dayIdx}
                        onClick={() => isWorking ? onCreateAppointment(formatDateStr(day), `${String(hour).padStart(2, '0')}:00`) : undefined}
                        className={`min-h-[48px] sm:min-h-[56px] p-0.5 sm:p-1 border-r last:border-r-0 border-slate-100 dark:border-slate-700 transition-colors ${
                          isWorking
                            ? 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/5 cursor-pointer'
                            : 'bg-slate-50 dark:bg-slate-800/50'
                        } ${isToday(day) ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}`}
                      >
                        {dayAppts.map((apt) => {
                          const contact = contactMap.get(apt.contactId);
                          return (
                            <div
                              key={apt.id}
                              onClick={(e) => { e.stopPropagation(); onEditAppointment(apt); }}
                              className={`text-[10px] sm:text-xs p-1 sm:p-1.5 rounded-md mb-0.5 cursor-pointer truncate border-l-2 ${
                                apt.status === 'CONFIRMED' ? 'bg-green-50 dark:bg-green-900/10 border-green-500 text-green-800 dark:text-green-300'
                                : apt.status === 'COMPLETED' ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-400 text-slate-600 dark:text-slate-300'
                                : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 text-indigo-800 dark:text-indigo-300'
                              }`}
                            >
                              <div className="font-semibold truncate">{apt.title}</div>
                              <div className="truncate opacity-75 hidden sm:block">
                                {contact?.displayName || 'Sem contato'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {DAY_SHORT.map((d) => (
              <div key={d} className="p-2 text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium uppercase">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const dayAppts = getAppointmentsForDate(day);
              const isCurrMonth = isCurrentMonth(day);
              return (
                <div
                  key={idx}
                  onClick={() => onCreateAppointment(formatDateStr(day))}
                  className={`min-h-[70px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                    idx % 7 === 6 ? 'border-r-0' : ''
                  } ${!isCurrMonth ? 'opacity-40' : ''} ${isToday(day) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${
                    isToday(day)
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => { e.stopPropagation(); onEditAppointment(apt); }}
                        className={`text-[9px] sm:text-[11px] px-1 py-0.5 rounded truncate cursor-pointer ${
                          apt.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                        }`}
                      >
                        {new Date(apt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} {apt.title}
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <div className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 px-1">
                        +{dayAppts.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
