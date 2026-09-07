'use client';
import { Headset, MessageCircle, MessageSquarePlus, X } from 'lucide-react';
import type { ReactNode } from 'react';

/** Canal de origem, só para o selo do cartão. Mesmos valores do tipo da inbox, sem importá-lo. */
export type AttendantAlertChannel = 'WHATSAPP' | 'INSTAGRAM' | 'WHATSAPP_OFFICIAL';

export type AttendantAlertKind = 'message' | 'new-conversation' | 'handoff';

export interface AttendantAlert {
  id: string;
  kind: AttendantAlertKind;
  title: string;
  body: string;
  channelType: AttendantAlertChannel | null;
  /** Null quando não há conversa visível para abrir — o clique leva à caixa de entrada. */
  conversationId: string | null;
  createdAt: number;
}

interface AttendantAlertStackProps {
  alerts: AttendantAlert[];
  onOpen: (alert: AttendantAlert) => void;
  onDismiss: (id: string) => void;
  /** Conteúdo fixo acima dos cartões — o convite de permissão do navegador. */
  header?: ReactNode;
}

const KIND_LABEL: Record<AttendantAlertKind, string> = {
  message: 'Nova mensagem',
  'new-conversation': 'Conversa nova',
  handoff: 'Transferida para atendimento humano',
};

const KIND_ICON: Record<AttendantAlertKind, typeof MessageCircle> = {
  message: MessageCircle,
  'new-conversation': MessageSquarePlus,
  handoff: Headset,
};

/** O repasse para humano é urgência e ganha o tom âmbar; o resto segue a cor primária. */
const KIND_TONE: Record<AttendantAlertKind, string> = {
  message: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  'new-conversation': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  handoff: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
};

const CHANNEL_LABEL: Record<AttendantAlertChannel, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WHATSAPP_OFFICIAL: 'WhatsApp Oficial',
};

const CHANNEL_DOT: Record<AttendantAlertChannel, string> = {
  WHATSAPP: 'bg-emerald-500',
  INSTAGRAM: 'bg-fuchsia-500',
  WHATSAPP_OFFICIAL: 'bg-emerald-500',
};

/**
 * Cartões de alerta de atendimento: conversa nova, mensagem recebida e repasse
 * para humano. Vivem abaixo do cabeçalho, para não cobrir o sino, e o cartão
 * inteiro abre a conversa — o botão "Abrir" existe para deixar isso óbvio.
 */
export default function AttendantAlertStack({ alerts, onOpen, onDismiss, header = null }: AttendantAlertStackProps) {
  if (alerts.length === 0 && !header) return null;
  return (
    <div
      className="fixed top-16 right-4 sm:right-6 z-50 flex w-[min(92vw,380px)] flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Alertas de atendimento"
      aria-live="polite"
    >
      {header}
      {alerts.map((alert) => {
        const Icon = KIND_ICON[alert.kind];
        return (
          <div
            key={alert.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800 animate-in slide-in-from-right-4 duration-300"
          >
            <button
              type="button"
              onClick={() => onOpen(alert)}
              className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${KIND_TONE[alert.kind]}`}>
                <Icon size={16}/>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {KIND_LABEL[alert.kind]}
                  {alert.channelType && (
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${CHANNEL_DOT[alert.channelType]}`} aria-hidden/>
                      {CHANNEL_LABEL[alert.channelType]}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900 dark:text-white">{alert.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{alert.body}</span>
                <span className="mt-1.5 inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400">Abrir conversa</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              aria-label="Dispensar alerta"
              className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X size={14}/>
            </button>
          </div>
        );
      })}
    </div>
  );
}
