'use client';
import { AlertCircle, Ban, Calendar, Clock, MessageSquare, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import DatePicker from '@/components/DatePicker';
import Input from '@/components/Input';
import Select from '@/components/Select';
import TimePicker from '@/components/TimePicker';
import ToggleSwitch from '@/components/ToggleSwitch';
import type { BusinessHours, DaySchedule, DateException } from '@/types/Scheduling';
import { DAY_NAMES } from '@/types/Scheduling';

interface BusinessHoursConfigProps {
  businessHours: BusinessHours;
  onSave: (data: Partial<BusinessHours>) => void;
  schedulingReminderEnabled: boolean;
  onSchedulingReminderChange: (value: boolean) => void;
}

/**
 * DatePicker e Input já vêm com 42px de altura; o Select e o Button não, então
 * levam a altura na mão para os quatro campos da linha ficarem alinhados.
 */
const FIELD_HEIGHT = 'h-[42px]';

function SectionHeader({ title, hint }: { icon: typeof Clock; title: string; hint: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

export default function BusinessHoursConfig({
  businessHours,
  onSave,
  schedulingReminderEnabled,
  onSchedulingReminderChange,
}: BusinessHoursConfigProps) {
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(businessHours.weeklySchedule);
  const [exceptions, setExceptions] = useState<DateException[]>(businessHours.exceptions);
  const [slotDuration, setSlotDuration] = useState(businessHours.slotDurationMinutes);
  const [saving, setSaving] = useState(false);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionType, setNewExceptionType] = useState<'BLOCKED' | 'CUSTOM'>('BLOCKED');
  const [newExceptionReason, setNewExceptionReason] = useState('');

  const toggleDay = (dayOfWeek: number) => {
    setWeeklySchedule((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d)));
  };
  const updateSlot = (dayOfWeek: number, slotIdx: number, field: 'start' | 'end', value: string) => {
    setWeeklySchedule((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek
      ? { ...d, slots: d.slots.map((s, i) => (i === slotIdx ? { ...s, [field]: value } : s)) }
      : d));
  };
  const addSlot = (dayOfWeek: number) => {
    setWeeklySchedule((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek
      ? { ...d, slots: [...d.slots, { start: '08:00', end: '12:00' }] }
      : d));
  };
  const removeSlot = (dayOfWeek: number, slotIdx: number) => {
    setWeeklySchedule((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek
      ? { ...d, slots: d.slots.filter((_, i) => i !== slotIdx) }
      : d));
  };
  const addException = () => {
    if (!newExceptionDate) return;
    if (exceptions.find((e) => e.date === newExceptionDate)) return;
    setExceptions((prev) => [...prev, {
      date: newExceptionDate,
      type: newExceptionType,
      ...(newExceptionReason ? { reason: newExceptionReason } : {}),
      ...(newExceptionType === 'CUSTOM' ? { slots: [{ start: '08:00', end: '12:00' }] } : {}),
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
    <div className="space-y-3">
      {/* Dois ajustes curtos lado a lado em vez de dois cards altos quase vazios. */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <SectionHeader icon={Clock} title="Duração do slot" hint="Intervalo padrão entre horários disponíveis." />
          <div className="w-40">
            <Select
              size="sm"
              value={String(slotDuration)}
              onChange={(v) => setSlotDuration(Number(v))}
              options={[15, 20, 30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: `${m} minutos` }))}
            />
          </div>
        </Card>

        <Card className="flex flex-col p-4">
          <SectionHeader
            icon={MessageSquare}
            title="Lembrete via WhatsApp"
            hint="Mensagem automática ao contato 1 hora antes do horário agendado."
          />
          <div className="mt-auto flex items-center justify-between gap-3">
            <span className="text-[13px] text-slate-600 dark:text-slate-300">Enviar lembrete 1 hora antes</span>
            <ToggleSwitch checked={schedulingReminderEnabled} onChange={onSchedulingReminderChange} />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHeader
          icon={Calendar}
          title="Horários semanais"
          hint="Os sete dias lado a lado. Marque o dia para atender e some quantos turnos precisar."
        />
        {/* Sete colunas a partir de xl; abaixo disso quebra em linhas em vez de rolar. */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weeklySchedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`rounded-lg border p-2.5 transition-colors ${
                day.enabled
                  ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  : 'border-dashed border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/30'
              }`}
            >
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={() => toggleDay(day.dayOfWeek)}
                  className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 dark:border-slate-600"
                />
                <span
                  className={`truncate text-[13px] font-medium ${
                    day.enabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {DAY_NAMES[day.dayOfWeek]}
                </span>
              </label>

              {day.enabled ? (
                <div className="mt-2 space-y-1.5">
                  {/* Início e fim empilhados: com sete colunas na tela não sobra
                      largura para os dois lado a lado sem espremer o campo. */}
                  {day.slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-slate-100 p-1.5 dark:border-slate-700/60"
                    >
                      <TimePicker
                        showIcon={false}
                        size="sm"
                        value={slot.start}
                        onChange={(v) => updateSlot(day.dayOfWeek, idx, 'start', v)}
                        ariaLabel={`Início do turno ${idx + 1} de ${DAY_NAMES[day.dayOfWeek]}`}
                      />
                      <div className="my-1 flex items-center justify-between gap-1 px-0.5">
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          até
                        </span>
                        {day.slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(day.dayOfWeek, idx)}
                            aria-label={`Remover turno ${idx + 1} de ${DAY_NAMES[day.dayOfWeek]}`}
                            className="cursor-pointer text-slate-400 transition-colors hover:text-rose-500"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <TimePicker
                        showIcon={false}
                        size="sm"
                        value={slot.end}
                        onChange={(v) => updateSlot(day.dayOfWeek, idx, 'end', v)}
                        ariaLabel={`Fim do turno ${idx + 1} de ${DAY_NAMES[day.dayOfWeek]}`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addSlot(day.dayOfWeek)}
                    className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 py-1 text-[11px] font-medium text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-indigo-400 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                  >
                    <Plus size={11} />
                    Turno
                  </button>
                </div>
              ) : (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <Ban size={11} />
                  Não atende
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionHeader
          icon={AlertCircle}
          title="Exceções de data"
          hint="Bloqueie feriados e folgas, ou defina um horário especial para uma data."
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="sm:w-44">
            <DatePicker
              value={newExceptionDate}
              onChange={setNewExceptionDate}
              placeholder="Selecione a data"
            />
          </div>
          <div className="sm:w-44">
            <Select<'BLOCKED' | 'CUSTOM'>
              triggerClassName={FIELD_HEIGHT}
              value={newExceptionType}
              onChange={(v) => setNewExceptionType(v)}
              options={[
                { value: 'BLOCKED', label: 'Bloqueado' },
                { value: 'CUSTOM', label: 'Horário especial' },
              ]}
            />
          </div>
          <Input
            value={newExceptionReason}
            onChange={(e) => setNewExceptionReason(e.target.value)}
            placeholder="Motivo (opcional)"
            aria-label="Motivo da exceção"
            wrapperClassName="flex-1"
          />
          <Button
            variant="secondary"
            onClick={addException}
            disabled={!newExceptionDate}
            icon={<Plus size={16} />}
            className={`${FIELD_HEIGHT} shrink-0 justify-center`}
          >
            Adicionar
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 py-5 text-center text-[13px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
            Nenhuma exceção cadastrada
          </p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {exceptions.map((exc) => (
              <div
                key={exc.date}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700/60"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      exc.type === 'BLOCKED'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    }`}
                  >
                    {exc.type === 'BLOCKED' ? 'Bloqueado' : 'Especial'}
                  </span>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                    {new Date(`${exc.date}T12:00:00`).toLocaleDateString('pt-BR')}
                  </span>
                  {exc.reason && (
                    <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">{exc.reason}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeException(exc.date)}
                  aria-label={`Remover exceção de ${exc.date}`}
                  className="shrink-0 cursor-pointer text-slate-400 transition-colors hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} loadingText="Salvando..." icon={<Save size={16} />}>
          Salvar horários
        </Button>
      </div>
    </div>
  );
}
