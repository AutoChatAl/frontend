'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Instagram, Search, Sparkles, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const ARRIVAL_MS = 4500;
const MAX_CONVERSATIONS = 9;

/* ------------------------------------------------------------------ modelo */

type ChannelType = 'whatsapp' | 'instagram';
type Assignment = 'none' | 'ai' | 'agent';

interface Message {
  from: 'contact' | 'agent' | 'ai';
  text: string;
}

interface Conversation {
  id: string;
  name: string;
  channel: ChannelType;
  time: string;
  unread: number;
  assignment: Assignment;
  messages: Message[];
}

// Mesmos canais conectados no passo 1 do "Como funciona".
const CHANNEL_META: Record<ChannelType, { label: string; chip: string; icon: typeof Instagram }> = {
  whatsapp: {
    label: 'WhatsApp Business',
    chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: BadgeCheck,
  },
  instagram: {
    label: 'Instagram Direct',
    chip: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    icon: Instagram,
  },
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    name: 'Marina Rocha',
    channel: 'whatsapp',
    time: '09:42',
    unread: 2,
    assignment: 'none',
    messages: [
      { from: 'contact', text: 'Oi! A camiseta bege ainda tem no M?' },
      { from: 'ai', text: 'Tem sim! Última do M em estoque. Quer que eu separe?' },
      { from: 'contact', text: 'Perfeito, vou fechar os dois então!' },
    ],
  },
  {
    id: 'c2',
    name: 'Bruno Tavares',
    channel: 'instagram',
    time: '09:38',
    unread: 1,
    assignment: 'ai',
    messages: [
      { from: 'contact', text: 'Vi o story de hoje, como faço pra comprar?' },
      { from: 'ai', text: 'Te mando o link agora! Prefere PIX ou cartão?' },
    ],
  },
  {
    id: 'c3',
    name: 'Letícia Alves',
    channel: 'whatsapp',
    time: '09:21',
    unread: 0,
    assignment: 'agent',
    messages: [
      { from: 'contact', text: 'Consegue enviar ainda hoje?' },
      { from: 'agent', text: 'Já subiu o pedido pro envio 🚚' },
    ],
  },
];

const ARRIVAL_POOL: Omit<Conversation, 'id'>[] = [
  {
    name: 'Aline Souza',
    channel: 'instagram',
    time: 'agora',
    unread: 1,
    assignment: 'none',
    messages: [{ from: 'contact', text: 'Esse vestido tem no P?' }],
  },
  {
    name: 'Thiago Barros',
    channel: 'whatsapp',
    time: 'agora',
    unread: 1,
    assignment: 'none',
    messages: [{ from: 'contact', text: 'Boa tarde, vocês entregam em Campinas?' }],
  },
  {
    name: 'Juliana Reis',
    channel: 'instagram',
    time: 'agora',
    unread: 2,
    assignment: 'none',
    messages: [{ from: 'contact', text: 'Comentei no post e vim pela DM 😊' }],
  },
  {
    name: 'Pedro Henrique',
    channel: 'whatsapp',
    time: 'agora',
    unread: 1,
    assignment: 'none',
    messages: [{ from: 'contact', text: 'Qual o prazo pra chegar no RJ?' }],
  },
  {
    name: 'Fernanda Lima',
    channel: 'instagram',
    time: 'agora',
    unread: 1,
    assignment: 'none',
    messages: [{ from: 'contact', text: 'Ainda dá tempo de trocar o tamanho?' }],
  },
  {
    name: 'Gustavo Pinto',
    channel: 'whatsapp',
    time: 'agora',
    unread: 1,
    assignment: 'none',
    messages: [{ from: 'contact', text: 'Vocês parcelam em quantas vezes?' }],
  },
];

const AI_HANDOFF = 'Assumi daqui 👋 Já li a conversa: você quer a camiseta bege no M. Fecho no PIX com 10%?';

const FILTERS = ['Todos', 'WhatsApp', 'Instagram'];

/* ------------------------------------------------------------ apresentação */

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Prévia da linha: sempre a última mensagem da conversa, com quem falou. */
function lastMessagePreview(conversation: Conversation): string {
  const last = conversation.messages.at(-1);
  if (!last) return '—';
  const prefix = last.from === 'agent' ? 'Você: ' : last.from === 'ai' ? 'IA: ' : '';
  return `${prefix}${last.text}`;
}

function ChannelBadge({ channel }: { channel: ChannelType }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.chip}`}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function AssignmentChip({ assignment }: { assignment: Assignment }) {
  if (assignment === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
        <Sparkles size={11} />
        IA
      </span>
    );
  }
  if (assignment === 'agent') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        <UserCheck size={11} />
        você
      </span>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ seção */

export default function InboxSection() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState('c1');
  const arrivalIndex = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);

  // As conversas chegam sozinhas pelos dois canais, como numa operação aberta.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setConversations((current) => {
        if (current.length >= MAX_CONVERSATIONS) return current;
        const template = ARRIVAL_POOL[arrivalIndex.current % ARRIVAL_POOL.length];
        if (!template) return current;
        arrivalIndex.current += 1;
        return [{ ...template, id: `arrival-${arrivalIndex.current}` }, ...current];
      });
    }, ARRIVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const selected = conversations.find((conversation) => conversation.id === selectedId);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selected?.messages.length, selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: 0 } : conversation,
      ),
    );
  }, []);

  const handleAssign = useCallback((assignment: Assignment) => {
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== selectedId || conversation.assignment === assignment) {
          return conversation;
        }
        // A IA retoma o fio da conversa; a transferência só troca o responsável.
        const messages: Message[] =
          assignment === 'ai'
            ? [...conversation.messages, { from: 'ai' as const, text: AI_HANDOFF }]
            : conversation.messages;
        const time = messages.length > conversation.messages.length ? 'agora' : conversation.time;
        return { ...conversation, assignment, messages, time, unread: 0 };
      }),
    );
  }, [selectedId]);

  return (
    <section id="atendimento" className="relative py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
        {/* No mobile o texto vem primeiro; no desktop ele fica à direita do mock. */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-start-2 lg:row-start-1"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Chat multiplataforma
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
            Sua equipe toda atendendo{' '}
            <span className="text-indigo-600">em um lugar só</span>
          </h2>
          <p className="text-base leading-relaxed text-slate-600">
            Transfira o atendimento, peça à IA para continuar de onde parou e acompanhe suas
            conversas em tempo real.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="grid min-w-0 grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white lg:col-start-1 lg:row-start-1 lg:h-[30rem] lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]"
        >
          {/* Caixa de entrada */}
          <aside className="flex h-64 min-h-0 flex-col border-b border-slate-200 lg:h-auto lg:border-b-0 lg:border-r">
            <div className="space-y-2.5 border-b border-slate-100 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Caixa de entrada</h3>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                  {conversations.length} conversas
                </span>
              </div>

              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <div className="flex h-9 w-full items-center rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] text-slate-400">
                  Buscar conversa...
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {FILTERS.map((filter, i) => (
                  <span
                    key={filter}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                      i === 0 ? 'bg-white text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {filter}
                  </span>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {conversations.map((conversation) => {
                  const active = conversation.id === selectedId;
                  return (
                    <motion.button
                      key={conversation.id}
                      type="button"
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      onClick={() => handleSelect(conversation.id)}
                      className={`relative flex w-full cursor-pointer items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left transition-colors ${
                        active ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {active && (
                        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" />
                      )}

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                        {initials(conversation.name)}
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-slate-900">
                            {conversation.name}
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                            {conversation.time}
                          </span>
                        </span>

                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-slate-500">
                            {lastMessagePreview(conversation)}
                          </span>
                          {conversation.unread > 0 && (
                            <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
                              {conversation.unread}
                            </span>
                          )}
                        </span>

                        <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <ChannelBadge channel={conversation.channel} />
                          <AssignmentChip assignment={conversation.assignment} />
                        </span>
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 p-2.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Chat ativo
              </p>
            </div>
          </aside>

          {/* Conversa aberta */}
          <div className="flex h-96 min-h-0 flex-col lg:h-auto">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                {initials(selected?.name ?? '')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">
                  {selected?.name ?? 'Selecione uma conversa'}
                </p>
                {selected && <ChannelBadge channel={selected.channel} />}
              </div>

              <div className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAssign('agent')}
                  className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                >
                  Transferir para mim
                </button>
                <button
                  type="button"
                  onClick={() => handleAssign('ai')}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                >
                  <Sparkles size={12} />
                  IA assume
                </button>
              </div>
            </div>

            <div ref={threadRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-slate-50/60 p-4">
              {selected?.messages.map((message, i) => (
                <motion.div
                  key={`${selected.id}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`w-fit max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    message.from === 'contact'
                      ? 'rounded-tl-sm bg-white text-slate-700'
                      : message.from === 'ai'
                        ? 'ml-auto rounded-tr-sm bg-indigo-600 text-white'
                        : 'ml-auto rounded-tr-sm bg-slate-800 text-white'
                  }`}
                >
                  {message.from === 'ai' && (
                    <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                      <Sparkles size={9} />
                      IA
                    </span>
                  )}
                  {message.text}
                </motion.div>
              ))}
            </div>

            <div className="border-t border-slate-100 p-3">
              <div className="flex h-10 w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-400">
                Escreva uma mensagem...
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
