'use client';

import { CalendarDays, MessageSquare, CalendarCheck } from 'lucide-react';

interface AISchedulingSectionProps {
  schedulingQueryEnabled: boolean;
  schedulingBookingEnabled: boolean;
  onToggleQuery: (enabled: boolean) => void;
  onToggleBooking: (enabled: boolean) => void;
}

export default function AISchedulingSection({
  schedulingQueryEnabled,
  schedulingBookingEnabled,
  onToggleQuery,
  onToggleBooking,
}: AISchedulingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays size={20} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Agendamento por IA</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Permita que a IA consulte e crie agendamentos automaticamente durante as conversas com seus clientes.
        </p>

        <div className="space-y-4">
          {/* Query Toggle */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Consultar Disponibilidade</h4>
                <button
                  onClick={() => onToggleQuery(!schedulingQueryEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    schedulingQueryEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" style={{ transform: schedulingQueryEnabled ? 'translateX(22px)' : 'translateX(0)' }} />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Quando ativado, a IA poderá verificar os horários disponíveis na sua agenda e informar ao cliente quais horários estão livres para agendamento.
              </p>
              {schedulingQueryEnabled && (
                <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    A IA usará os horários configurados na aba Agendamentos como base para responder sobre disponibilidade.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Toggle */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <CalendarCheck size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Criar Agendamentos</h4>
                <button
                  onClick={() => onToggleBooking(!schedulingBookingEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    schedulingBookingEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" style={{ transform: schedulingBookingEnabled ? 'translateX(22px)' : 'translateX(0)' }} />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Quando ativado, a IA poderá criar agendamentos automaticamente quando o cliente confirmar um horário durante a conversa. O contato será vinculado automaticamente.
              </p>
              {schedulingBookingEnabled && (
                <div className="mt-3 px-3 py-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    A IA criará o agendamento com o contato da conversa e o horário confirmado. O agendamento aparecerá na aba Agendamentos com a tag &ldquo;Criado por IA&rdquo;.
                  </p>
                </div>
              )}
              {schedulingBookingEnabled && !schedulingQueryEnabled && (
                <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Recomendamos também ativar &ldquo;Consultar Disponibilidade&rdquo; para que a IA possa verificar os horários antes de criar agendamentos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
