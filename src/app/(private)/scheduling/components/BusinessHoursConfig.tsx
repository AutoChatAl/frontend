'use client';

import { useState } from 'react';
import { Clock, Plus, Trash2, Calendar, Save, Loader2, Ban, AlertCircle } from 'lucide-react';
import type { BusinessHours, DaySchedule, TimeSlot, DateException } from '@/types/Scheduling';
import { DAY_NAMES } from '@/types/Scheduling';

interface BusinessHoursConfigProps {
  businessHours: BusinessHours;
  onSave: (data: Partial<BusinessHours>) => void;
}

export default function BusinessHoursConfig({ businessHours, onSave }: BusinessHoursConfigProps) {
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(businessHours.weeklySchedule);
  const [exceptions, setExceptions] = useState<DateException[]>(businessHours.exceptions);
  const [slotDuration, setSlotDuration] = useState(businessHours.slotDurationMinutes);
  const [saving, setSaving] = useState(false);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionType, setNewExceptionType] = useState<'BLOCKED' | 'CUSTOM'>('BLOCKED');
  const [newExceptionReason, setNewExceptionReason] = useState('');

  const toggleDay = (dayOfWeek: number) => {
    setWeeklySchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d
      )
    );
  };

  const updateSlot = (dayOfWeek: number, slotIdx: number, field: 'start' | 'end', value: string) => {
    setWeeklySchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, slots: d.slots.map((s, i) => (i === slotIdx ? { ...s, [field]: value } : s)) }
          : d
      )
    );
  };

  const addSlot = (dayOfWeek: number) => {
    setWeeklySchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, slots: [...d.slots, { start: '08:00', end: '12:00' }] }
          : d
      )
    );
  };

  const removeSlot = (dayOfWeek: number, slotIdx: number) => {
    setWeeklySchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, slots: d.slots.filter((_, i) => i !== slotIdx) }
          : d
      )
    );
  };

  const addException = () => {
    if (!newExceptionDate) return;
    if (exceptions.find((e) => e.date === newExceptionDate)) return;
    setExceptions((prev) => [...prev, {
      date: newExceptionDate,
      type: newExceptionType,
      reason: newExceptionReason || undefined,
      slots: newExceptionType === 'CUSTOM' ? [{ start: '08:00', end: '12:00' }] : undefined,
    }]);
    setNewExceptionDate('');
    setNewExceptionReason('');
  };

  const removeException = (date: string) => {
    setExceptions((prev) => prev.filter((e) => e.date !== date));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ weeklySchedule, exceptions, slotDurationMinutes: slotDuration });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Slot Duration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Duração do Slot</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Define o intervalo padrão entre horários disponíveis.
        </p>
        <select
          value={slotDuration}
          onChange={(e) => setSlotDuration(Number(e.target.value))}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {[15, 20, 30, 45, 60, 90, 120].map((m) => (
            <option key={m} value={m}>{m} minutos</option>
          ))}
        </select>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Horários Semanais</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Configure os horários de atendimento para cada dia da semana.
        </p>
        <div className="space-y-3">
          {weeklySchedule.map((day) => (
            <div key={day.dayOfWeek} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={() => toggleDay(day.dayOfWeek)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-sm font-medium ${day.enabled ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                    {DAY_NAMES[day.dayOfWeek]}
                  </span>
                </label>
                {day.enabled && (
                  <button
                    onClick={() => addSlot(day.dayOfWeek)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Turno
                  </button>
                )}
              </div>
              {day.enabled && (
                <div className="space-y-2 ml-6">
                  {day.slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateSlot(day.dayOfWeek, idx, 'start', e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 text-xs">até</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateSlot(day.dayOfWeek, idx, 'end', e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {day.slots.length > 1 && (
                        <button onClick={() => removeSlot(day.dayOfWeek, idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!day.enabled && (
                <div className="ml-6 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <Ban size={12} />
                  Não atende
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Date Exceptions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Exceções de Data</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Bloqueie datas específicas (feriados, folgas) ou defina horários especiais.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="date"
            value={newExceptionDate}
            onChange={(e) => setNewExceptionDate(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newExceptionType}
            onChange={(e) => setNewExceptionType(e.target.value as 'BLOCKED' | 'CUSTOM')}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="BLOCKED">Bloqueado</option>
            <option value="CUSTOM">Horário Especial</option>
          </select>
          <input
            type="text"
            value={newExceptionReason}
            onChange={(e) => setNewExceptionReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addException}
            disabled={!newExceptionDate}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {exceptions.length === 0 ? (
          <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
            Nenhuma exceção cadastrada
          </div>
        ) : (
          <div className="space-y-2">
            {exceptions.map((exc) => (
              <div key={exc.date} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${exc.type === 'BLOCKED' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                    {exc.type === 'BLOCKED' ? 'Bloqueado' : 'Especial'}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {new Date(exc.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  {exc.reason && <span className="text-xs text-slate-400">({exc.reason})</span>}
                </div>
                <button onClick={() => removeException(exc.date)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200 dark:shadow-none text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Salvando...' : 'Salvar Horários'}
        </button>
      </div>
    </div>
  );
}
