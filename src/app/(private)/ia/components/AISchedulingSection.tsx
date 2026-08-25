'use client';
import Link from 'next/link';

import Card from '@/components/Card';

import AINote from './AINote';
import AISectionHeader from './AISectionHeader';
import AIToggleRow from './AIToggleRow';

interface AISchedulingSectionProps {
    schedulingQueryEnabled: boolean;
    schedulingBookingEnabled: boolean;
    schedulingQueryAllowed: boolean;
    schedulingBookingAllowed: boolean;
    onToggleQuery: (enabled: boolean) => void;
    onToggleBooking: (enabled: boolean) => void;
}
const QUERY_LOCK = 'Seu plano de IA atual não inclui consulta de disponibilidade. Faça upgrade para liberar.';
const BOOKING_LOCK = 'Seu plano de IA atual não inclui criação de agendamentos. Faça upgrade para liberar.';

export default function AISchedulingSection({ schedulingQueryEnabled, schedulingBookingEnabled, schedulingQueryAllowed, schedulingBookingAllowed, onToggleQuery, onToggleBooking }: AISchedulingSectionProps) {
  return (
    <Card className="p-4">
      <AISectionHeader
        title="Agendamento pela IA"
        hint="Quanto a IA pode mexer na sua agenda durante a conversa. Ela usa os horários configurados em Agendamentos."
        action={
          <Link href="/scheduling" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            Abrir agenda
          </Link>
        }
      />

      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        <AIToggleRow
          title="Consultar disponibilidade"
          description="A IA verifica os horários livres e informa ao cliente o que dá para marcar."
          checked={schedulingQueryEnabled}
          onChange={onToggleQuery}
          {...(schedulingQueryAllowed ? {} : { lockReason: QUERY_LOCK })}
        >
          {!schedulingQueryAllowed && <AINote tone="warning">{QUERY_LOCK}</AINote>}
          {schedulingQueryAllowed && schedulingQueryEnabled && (
            <AINote>
              A base são os horários de trabalho e as exceções da aba Agendamentos. Mudou lá, muda aqui.
            </AINote>
          )}
        </AIToggleRow>

        <AIToggleRow
          title="Criar agendamentos"
          description="Quando o cliente confirma um horário, a IA marca sozinha e vincula o contato da conversa."
          checked={schedulingBookingEnabled}
          onChange={onToggleBooking}
          {...(schedulingBookingAllowed ? {} : { lockReason: BOOKING_LOCK })}
        >
          {!schedulingBookingAllowed && <AINote tone="warning">{BOOKING_LOCK}</AINote>}
          {schedulingBookingAllowed && schedulingBookingEnabled && (
            <AINote tone="success">
              O agendamento aparece na sua agenda com a marca &ldquo;Criado por IA&rdquo;, então dá para revisar depois.
            </AINote>
          )}
          {schedulingBookingAllowed && schedulingBookingEnabled && !schedulingQueryEnabled && (
            <AINote tone="warning">
              Sem &ldquo;Consultar disponibilidade&rdquo; ligado, a IA marca sem checar a agenda antes — o risco de choque de horário sobe.
            </AINote>
          )}
        </AIToggleRow>
      </div>
    </Card>
  );
}
