import { BadgeCheck, Instagram } from 'lucide-react';
import React, { type ReactNode } from 'react';

interface AuthShellProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

/* --------------------------------------------- Ilustração estática do inbox */

// Mesma leitura do chat multiplataforma da landing, porém sem estado nem
// animação: aqui é só ilustração, não vale carregar JS de cliente por isso.
const CONVERSATIONS = [
  {
    initials: 'MR',
    name: 'Marina Rocha',
    preview: 'Perfeito, vou fechar os dois então!',
    time: '09:42',
    unread: 2,
    channel: 'whatsapp' as const,
    active: true,
  },
  {
    initials: 'BT',
    name: 'Bruno Tavares',
    preview: 'IA: Te mando o link agora! Prefere PIX?',
    time: '09:38',
    unread: 0,
    channel: 'instagram' as const,
    active: false,
  },
  {
    initials: 'LA',
    name: 'Letícia Alves',
    preview: 'Você: Já subiu o pedido pro envio 🚚',
    time: '09:21',
    unread: 0,
    channel: 'whatsapp' as const,
    active: false,
  },
];

const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', chip: 'bg-emerald-100 text-emerald-700', icon: BadgeCheck },
  instagram: { label: 'Instagram', chip: 'bg-fuchsia-100 text-fuchsia-700', icon: Instagram },
};

// Balões de venda que sobem por cima do chat, cada um com o seu atraso.
const MONEY_BUBBLES = [
  { value: '+ R$ 89,90', position: '-top-2 left-[16%]', delay: '0s' },
  { value: '+ R$ 249,90', position: '-top-4 right-[16%]', delay: '1.6s' },
  { value: '+ R$ 179,90', position: '-top-1 left-[48%]', delay: '3.2s' },
];

const THREAD = [
  { from: 'contact' as const, text: 'Oi! A camiseta bege ainda tem no M?' },
  { from: 'ai' as const, text: 'Tem sim! Última do M em estoque. Quer que eu separe?' },
  { from: 'contact' as const, text: 'Perfeito, vou fechar os dois então!' },
];

function InboxPreview() {
  return (
    <div className="grid w-full grid-cols-[minmax(0,11rem)_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <aside className="flex flex-col border-r border-slate-200">
        <div className="border-b border-slate-100 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-slate-900">Caixa de entrada</p>
        </div>

        <div className="flex-1">
          {CONVERSATIONS.map((conversation) => {
            const meta = CHANNEL_META[conversation.channel];
            const ChannelIcon = meta.icon;
            return (
              <div
                key={conversation.name}
                className={`relative flex items-start gap-2 border-b border-slate-100 px-3 py-2.5 ${
                  conversation.active ? 'bg-indigo-50' : ''
                }`}
              >
                {conversation.active && (
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" />
                )}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500">
                  {conversation.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="truncate text-[11px] font-semibold text-slate-900">
                      {conversation.name}
                    </p>
                    <span className="shrink-0 text-[9px] tabular-nums text-slate-400">
                      {conversation.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="truncate text-[10px] text-slate-500">{conversation.preview}</p>
                    {conversation.unread > 0 && (
                      <span className="flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1 text-[8px] font-semibold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${meta.chip}`}
                  >
                    <ChannelIcon size={8} />
                    {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-100 px-3 py-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-slate-600">Chat ativo</span>
        </div>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500">
            MR
          </span>
          <div>
            <p className="text-[11px] font-semibold text-slate-900">Marina Rocha</p>
            <p className="text-[9px] text-emerald-600">IA respondendo</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 bg-slate-50/60 p-3">
          {THREAD.map((message) => (
            <div
              key={message.text}
              className={`w-fit max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed ${
                message.from === 'ai'
                  ? 'ml-auto rounded-tr-sm bg-indigo-600 text-white'
                  : 'rounded-tl-sm bg-white text-slate-700'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 p-2.5">
          <div className="flex h-7 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[10px] text-slate-400">
            Escreva uma mensagem...
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (<div className="min-h-screen bg-slate-50 flex" data-theme="light">
    <div className="hidden w-1/2 items-center justify-center bg-indigo-600 lg:flex">
      <div className="w-full max-w-2xl px-10 text-white">
        <div className="relative">
          <InboxPreview />

          {MONEY_BUBBLES.map((bubble) => (
            <span
              key={bubble.value}
              aria-hidden="true"
              style={{ animationDelay: bubble.delay }}
              className={`animate-float-up pointer-events-none absolute rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-600 ${bubble.position}`}
            >
              {bubble.value}
            </span>
          ))}
        </div>

        <div className="mt-10 text-center">
          <h2 className="mb-3 text-4xl font-bold leading-tight">Venda no automático</h2>
          <p className="mx-auto max-w-sm text-base text-indigo-100">
            A IA responde na hora. Nenhuma venda perdida por falta de resposta.
          </p>
        </div>
      </div>
    </div>

    <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 mt-2 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  </div>);
}
