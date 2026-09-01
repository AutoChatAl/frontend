'use client';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Flame, Headset, Instagram, MessageCircle, Snowflake, Thermometer, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const ARRIVAL_MS = 6000;
const AI_REPLY_MS = 900;
const MAX_LEADS = 11;
const QUALIFICATIONS_BEFORE_SWITCH = 2;
const LEAD_SWITCH_MS = 2400;

/* ------------------------------------------------------------------ modelo */

type Temperature = 'COLD' | 'WARM' | 'HOT' | 'ON_FIRE';
type Channel = 'whatsapp' | 'instagram';

interface Lead {
  id: string;
  name: string;
  channel: Channel;
  stageId: string;
  temperature: Temperature;
  score: number;
  probability: number;
  when: string;
  awaitingHuman: boolean;
}

// Etapas e cores espelham o funil padrão do app (funnel.service.ts).
const STAGES = [
  { id: 'novo', name: 'Novo Lead', dot: 'bg-blue-500' },
  { id: 'contato', name: 'Em Contato', dot: 'bg-indigo-500' },
  { id: 'qualificado', name: 'Qualificado', dot: 'bg-violet-500' },
  { id: 'negociacao', name: 'Negociação', dot: 'bg-amber-500' },
  { id: 'ganho', name: 'Ganho', dot: 'bg-emerald-500' },
];

const TEMPERATURE_META: Record<Temperature, { label: string; chip: string; ring: string; icon: typeof Flame }> = {
  COLD: { label: 'Frio', chip: 'bg-blue-50 text-blue-700 border-blue-200', ring: 'text-blue-500', icon: Snowflake },
  WARM: { label: 'Morno', chip: 'bg-amber-50 text-amber-700 border-amber-200', ring: 'text-amber-500', icon: Thermometer },
  HOT: { label: 'Aquecido', chip: 'bg-orange-50 text-orange-700 border-orange-200', ring: 'text-orange-500', icon: Flame },
  ON_FIRE: { label: 'Quente', chip: 'bg-red-50 text-red-700 border-red-200', ring: 'text-red-500', icon: Flame },
};

const CHANNEL_META: Record<Channel, { icon: typeof Instagram; className: string }> = {
  whatsapp: { icon: MessageCircle, className: 'bg-emerald-100 text-emerald-600' },
  instagram: { icon: Instagram, className: 'bg-fuchsia-100 text-fuchsia-600' },
};

const INITIAL_LEADS: Lead[] = [
  { id: 'l1', name: 'Marina Rocha', channel: 'whatsapp', stageId: 'novo', temperature: 'WARM', score: 42, probability: 38, when: 'há 3 min', awaitingHuman: false },
  { id: 'l2', name: 'Bruno Tavares', channel: 'instagram', stageId: 'contato', temperature: 'WARM', score: 55, probability: 47, when: 'há 6 min', awaitingHuman: false },
  { id: 'l3', name: 'Letícia Alves', channel: 'whatsapp', stageId: 'qualificado', temperature: 'HOT', score: 71, probability: 63, when: 'há 18 min', awaitingHuman: false },
  { id: 'l4', name: 'Rafael Nunes', channel: 'instagram', stageId: 'negociacao', temperature: 'ON_FIRE', score: 88, probability: 79, when: 'há 24 min', awaitingHuman: false },
];

const ARRIVAL_POOL: { name: string; channel: Channel; temperature: Temperature; score: number; probability: number }[] = [
  { name: 'Aline Souza', channel: 'instagram', temperature: 'WARM', score: 44, probability: 36 },
  { name: 'Thiago Barros', channel: 'whatsapp', temperature: 'COLD', score: 25, probability: 19 },
  { name: 'Juliana Reis', channel: 'whatsapp', temperature: 'HOT', score: 68, probability: 58 },
  { name: 'Pedro Henrique', channel: 'instagram', temperature: 'WARM', score: 39, probability: 31 },
  { name: 'Fernanda Lima', channel: 'whatsapp', temperature: 'WARM', score: 51, probability: 44 },
  { name: 'Lucas Andrade', channel: 'instagram', temperature: 'COLD', score: 30, probability: 24 },
  { name: 'Beatriz Moraes', channel: 'whatsapp', temperature: 'HOT', score: 64, probability: 55 },
  { name: 'Gustavo Pinto', channel: 'instagram', temperature: 'WARM', score: 47, probability: 40 },
];

/* ---------------------------------------------------------------- diálogo */

interface DialogueNode {
  ai: string;
  effect?: Partial<Pick<Lead, 'stageId' | 'temperature' | 'score' | 'probability' | 'awaitingHuman'>>;
  options: { label: string; next: string }[];
}

const HUMAN_OPTION = { label: 'Quero falar com um atendente', next: 'human' };

const DIALOGUE: Record<string, DialogueNode> = {
  start: {
    ai: 'Oi! Sou a IA da Loja Nova 💜 Posso te ajudar a achar alguma peça?',
    options: [
      { label: 'Quero ver os produtos', next: 'browsing' },
      { label: 'Só estou dando uma olhada', next: 'casual' },
      HUMAN_OPTION,
    ],
  },
  browsing: {
    ai: 'Os destaques de hoje são a Camiseta Oversized Bege (R$ 89,90) e a Jaqueta Corta-Vento (R$ 249,90). Qual te interessa?',
    effect: { stageId: 'contato', temperature: 'WARM', score: 52, probability: 45 },
    options: [
      { label: 'A camiseta, quanto fica no PIX?', next: 'negotiating' },
      { label: 'Tem frete grátis?', next: 'shipping' },
      HUMAN_OPTION,
    ],
  },
  casual: {
    ai: 'Fica à vontade! Se quiser, te aviso quando entrar novidade no seu tamanho.',
    effect: { stageId: 'novo', temperature: 'COLD', score: 24, probability: 18 },
    options: [
      { label: 'Quero ver os produtos', next: 'browsing' },
      { label: 'Pode me avisar sim', next: 'notify' },
    ],
  },
  shipping: {
    ai: 'Frete grátis acima de R$ 199. A camiseta sai por R$ 89,90 — quer que eu monte um combo pra fechar o frete?',
    effect: { stageId: 'qualificado', temperature: 'HOT', score: 69, probability: 61 },
    options: [
      { label: 'Pode montar o combo', next: 'negotiating' },
      { label: 'Vou pensar', next: 'thinking' },
      HUMAN_OPTION,
    ],
  },
  negotiating: {
    ai: 'No PIX fica R$ 80,91 com 10% de desconto e envio hoje. Posso gerar o link de pagamento?',
    effect: { stageId: 'negociacao', temperature: 'ON_FIRE', score: 86, probability: 78 },
    options: [
      { label: 'Pode gerar, quero comprar', next: 'won' },
      { label: 'Vou pensar', next: 'thinking' },
      HUMAN_OPTION,
    ],
  },
  thinking: {
    ai: 'Sem pressa! Vou segurar essa condição por 24h pra você 😉',
    effect: { stageId: 'qualificado', temperature: 'WARM', score: 58, probability: 49 },
    options: [
      { label: 'Fechado, quero comprar', next: 'won' },
      HUMAN_OPTION,
    ],
  },
  notify: {
    ai: 'Anotado! Assim que chegar novidade eu te chamo por aqui 💜',
    effect: { stageId: 'contato', temperature: 'WARM', score: 40, probability: 33 },
    options: [],
  },
  won: {
    ai: 'Pedido gerado! Te mandei o PIX aqui. Assim que cair, já separo pro envio 🎉',
    effect: { stageId: 'ganho', temperature: 'ON_FIRE', score: 96, probability: 95 },
    options: [],
  },
  human: {
    ai: 'Claro! Já sinalizei no funil e um atendente do time assume essa conversa em instantes 👋',
    effect: { awaitingHuman: true },
    options: [],
  },
};

/* ------------------------------------------------------------ apresentação */

function ScoreRing({ score, temperature }: { score: number; temperature: Temperature }) {
  const size = 34;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (clamped / 100) * circumference}
          stroke="currentColor"
          className={`${TEMPERATURE_META[temperature].ring} transition-[stroke-dashoffset] duration-500`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
        {clamped}
      </span>
    </div>
  );
}

function LeadBody({ lead, isChatLead }: { lead: Lead; isChatLead: boolean }) {
  const ChannelIcon = CHANNEL_META[lead.channel].icon;
  const temperature = TEMPERATURE_META[lead.temperature];
  const TemperatureIcon = temperature.icon;

  return (
    <div className="flex items-start gap-2.5">
      <ScoreRing score={lead.score} temperature={lead.temperature} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-slate-900">{lead.name}</p>
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${CHANNEL_META[lead.channel].className}`}
          >
            <ChannelIcon size={9} />
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
            <TrendingUp size={11} />
            {lead.probability}%
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Clock size={11} />
            {lead.when}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${temperature.chip}`}
          >
            <TemperatureIcon size={9} />
            {temperature.label}
          </span>
          {lead.awaitingHuman && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
              <Headset size={9} />
              Aguardando atendente
            </span>
          )}
          {isChatLead && !lead.awaitingHuman && (
            <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
              No chat
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const CARD_SHELL = 'rounded-lg border bg-white p-2.5';

function SortableLead({ lead, isChatLead }: { lead: Lead; isChatLead: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const highlight = lead.awaitingHuman
    ? 'border-rose-300 ring-2 ring-rose-500/20'
    : isChatLead
      ? 'border-indigo-300 ring-2 ring-indigo-500/20'
      : 'border-slate-200';

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) ?? undefined, transition: transition ?? undefined }}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...attributes}
      {...listeners}
      className={`${CARD_SHELL} cursor-grab touch-none active:cursor-grabbing ${highlight}`}
    >
      <LeadBody lead={lead} isChatLead={isChatLead} />
    </motion.div>
  );
}

function Column({ stage, leads, chatLeadId }: {
  stage: (typeof STAGES)[number];
  leads: Lead[];
  chatLeadId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-[15.5rem] shrink-0 flex-col rounded-lg border bg-white transition-colors ${
        isOver ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 p-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stage.dot}`} />
        <h3 className="truncate text-sm font-semibold text-slate-900">{stage.name}</h3>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
          {leads.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {leads.map((lead) => (
              <SortableLead key={lead.id} lead={lead} isChatLead={lead.id === chatLeadId} />
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ seção */

interface ChatMessage {
  id: number;
  from: 'lead' | 'ai' | 'system';
  text: string;
}

export default function FunnelSection() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [chatLeadId, setChatLeadId] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState('start');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, from: 'ai', text: DIALOGUE.start?.ai ?? '' },
  ]);
  const [typing, setTyping] = useState(false);

  const arrivalIndex = useRef(0);
  const messageId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const qualifications = useRef(0);
  // Espelho dos leads para escolher o próximo atendimento sem sujar o updater de estado.
  const leadsRef = useRef(leads);
  leadsRef.current = leads;
  const chatLeadRef = useRef<string | null>(null);
  chatLeadRef.current = chatLeadId;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Sorteia o lead da conversa só depois da hidratação — Math.random no render
  // faria servidor e cliente escolherem leads diferentes.
  useEffect(() => {
    const pick = INITIAL_LEADS[Math.floor(Math.random() * INITIAL_LEADS.length)];
    setChatLeadId(pick?.id ?? null);
  }, []);

  // Novos leads chegam sozinhos, como numa operação rodando.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeads((current) => {
        if (current.length >= MAX_LEADS) return current;
        const template = ARRIVAL_POOL[arrivalIndex.current % ARRIVAL_POOL.length];
        if (!template) return current;
        arrivalIndex.current += 1;
        return [
          {
            ...template,
            id: `arrival-${arrivalIndex.current}`,
            stageId: 'novo',
            when: 'Agora mesmo',
            awaitingHuman: false,
          },
          ...current,
        ];
      });
    }, ARRIVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggingId(null);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;
    const activeId = String(event.active.id);

    setLeads((current) => {
      const target =
        STAGES.find((stage) => stage.id === overId)?.id ??
        current.find((lead) => lead.id === overId)?.stageId;
      if (!target) return current;
      return current.map((lead) => (lead.id === activeId ? { ...lead, stageId: target } : lead));
    });
  }, []);

  const switchLead = useCallback(() => {
    const candidates = leadsRef.current.filter(
      (lead) => lead.id !== chatLeadRef.current && !lead.awaitingHuman,
    );
    const pick = candidates.find((lead) => lead.stageId === 'novo') ?? candidates[0];
    if (!pick) return;

    qualifications.current = 0;
    setChatLeadId(pick.id);
    setNodeId('start');
    setMessages([
      { id: messageId.current++, from: 'system', text: `Novo atendimento — ${pick.name}` },
      { id: messageId.current++, from: 'ai', text: DIALOGUE.start?.ai ?? '' },
    ]);
  }, []);

  const handleOption = useCallback(
    (option: { label: string; next: string }) => {
      const next = DIALOGUE[option.next];
      if (!next || typing) return;

      setMessages((current) => [...current, { id: messageId.current++, from: 'lead', text: option.label }]);
      setTyping(true);

      window.setTimeout(() => {
        setMessages((current) => [...current, { id: messageId.current++, from: 'ai', text: next.ai }]);
        setTyping(false);
        setNodeId(option.next);

        // A resposta do cliente requalifica o lead: etapa, temperatura e score.
        if (next.effect) {
          setLeads((current) =>
            current.map((lead) =>
              lead.id === chatLeadId ? { ...lead, ...next.effect, when: 'Agora mesmo' } : lead,
            ),
          );
          if (next.effect.stageId) qualifications.current += 1;
        }

        // Passa para o próximo lead depois de duas qualificações — ou quando a
        // conversa chega num nó sem saída, para a demonstração não travar.
        const exhausted = qualifications.current >= QUALIFICATIONS_BEFORE_SWITCH;
        if (exhausted || next.options.length === 0) {
          window.setTimeout(switchLead, LEAD_SWITCH_MS);
        }
      }, AI_REPLY_MS);
    },
    [chatLeadId, switchLead, typing],
  );

  const chatLead = leads.find((lead) => lead.id === chatLeadId);
  const draggingLead = leads.find((lead) => lead.id === draggingId);
  const currentNode = DIALOGUE[nodeId];
  const options = typing ? [] : (currentNode?.options ?? []);

  return (
    <section id="funil" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Funil de vendas
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Qualifique e organize seus leads{' '}
            <span className="text-indigo-600">automaticamente durante a conversa</span>
          </h2>
          <p className="text-base text-slate-600">
            Responda como cliente no chat ao lado e veja a IA mover o lead pelo funil. Arraste os
            cards para reorganizar do seu jeito — como no painel de verdade.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
        >
          {/* Quadro do funil */}
          <div className="min-w-0 rounded-3xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-sm">
            <DndContext
              sensors={sensors}
              onDragStart={(event: DragStartEvent) => setDraggingId(String(event.active.id))}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setDraggingId(null)}
            >
              <div className="relative">
                <div className="flex h-[27rem] gap-3 overflow-x-auto pb-1">
                  {STAGES.map((stage) => (
                    <Column
                      key={stage.id}
                      stage={stage}
                      leads={leads.filter((lead) => lead.stageId === stage.id)}
                      chatLeadId={chatLeadId}
                    />
                  ))}
                </div>
                {/* Avisa que há mais etapas à direita — o quadro rola na horizontal, como no app. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent"
                />
              </div>

              <DragOverlay>
                {draggingLead && (
                  <div className={`${CARD_SHELL} w-[15rem] rotate-1 cursor-grabbing border-indigo-300 shadow-xl ring-2 ring-indigo-500/20`}>
                    <LeadBody lead={draggingLead} isChatLead={draggingLead.id === chatLeadId} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Conversa — a tela do chat, sem moldura de aparelho */}
          <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
            <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                {(chatLead?.name ?? '?').charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">
                  {chatLead?.name ?? 'Novo lead'}
                </p>
                <p className="truncate text-[11px] text-emerald-600">
                  {chatLead?.awaitingHuman ? 'Aguardando atendente' : 'IA respondendo'}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-slate-50/60 px-4 py-3">
              {messages.map((message) =>
                message.from === 'system' ? (
                  <motion.p
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="py-1 text-center text-[11px] font-medium text-slate-400"
                  >
                    {message.text}
                  </motion.p>
                ) : (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8, x: message.from === 'ai' ? 12 : -12 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`w-fit max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      message.from === 'ai'
                        ? 'ml-auto rounded-tr-sm bg-indigo-600 text-white'
                        : 'rounded-tl-sm bg-white text-slate-700'
                    }`}
                  >
                    {message.text}
                  </motion.div>
                ),
              )}

              {typing && (
                <div className="ml-auto flex w-fit items-center gap-1 rounded-2xl rounded-tr-sm bg-indigo-600 px-3 py-2.5">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
                      className="h-1.5 w-1.5 rounded-full bg-white/70"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-3">
              {options.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleOption(option)}
                      className="cursor-pointer rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[11px] font-medium text-slate-400">
                  {chatLead?.awaitingHuman
                    ? 'Lead destacado no funil, aguardando um atendente.'
                    : 'Conversa finalizada pela IA.'}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
