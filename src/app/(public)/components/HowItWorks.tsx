'use client';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Check, Instagram, Loader2, MessageCircle, MousePointer2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { HIDDEN_FEATURES } from '@lib/featureFlags';

/* ------------------------------------------------------------------ QR code */

const QR_MODULES = 21;

// Padrão localizador 7x7 do canto (anel externo + núcleo 3x3). Fora dele fica o separador.
function finderModule(i: number, j: number): boolean {
  if (i < 0 || j < 0 || i > 6 || j > 6) return false;
  const ring = i === 0 || i === 6 || j === 0 || j === 6;
  const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
  return ring || core;
}

// QR decorativo: o desenho é determinístico de propósito — nada de Math.random,
// senão servidor e cliente renderizariam grades diferentes e a hidratação quebraria.
function moduleAt(x: number, y: number): boolean {
  const far = QR_MODULES - 7;
  if (x < 8 && y < 8) return finderModule(x, y);
  if (x >= far - 1 && y < 8) return finderModule(x - far, y);
  if (x < 8 && y >= far - 1) return finderModule(x, y - far);
  if (y === 6) return x % 2 === 0;
  if (x === 6) return y % 2 === 0;
  return (x * x + y * 3 + x * y * 5) % 7 < 3;
}

const QR_GRID = Array.from({ length: QR_MODULES }, (_, y) =>
  Array.from({ length: QR_MODULES }, (_, x) => moduleAt(x, y)),
);

function QrCode({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden="true">
      {QR_GRID.map((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} rx={0.28} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}

/* ------------------------------------------- Passo 1 — conexão dos canais */

// Roteiro da animação, disparado uma única vez quando a seção entra na tela.
const SCRIPT = {
  typeUser: 300,
  typePassword: 1300,
  whatsappDone: 2000,
  submit: 2300,
  consent: 3100,
  authorize: 4100,
  instagramDone: 4800,
} as const;

const PERMISSIONS = ['Ler e responder mensagens', 'Gerenciar comentários', 'Acessar dados do perfil'];

const CORNERS = [
  'top-0 left-0 border-t-2 border-l-2 rounded-tl',
  'top-0 right-0 border-t-2 border-r-2 rounded-tr',
  'bottom-0 left-0 border-b-2 border-l-2 rounded-bl',
  'bottom-0 right-0 border-b-2 border-r-2 rounded-br',
];

function PanelHeading({ icon, tint, children }: {
  icon: typeof Instagram;
  tint: string;
  children: string;
}) {
  const Icon = icon;
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon size={15} className={tint} />
      <span className="text-xs font-semibold text-slate-900">{children}</span>
    </div>
  );
}

/** Campo do formulário que se preenche sozinho, como se alguém digitasse. */
function FakeField({ label, value, active, filled }: {
  label: string;
  value: string;
  active: boolean;
  filled: boolean;
}) {
  return (
    <div
      className={`flex h-9 items-center overflow-hidden rounded-lg border px-3 transition-colors duration-300 ${
        active ? 'border-indigo-400 bg-white ring-2 ring-indigo-500/15' : 'border-slate-200 bg-slate-50'
      }`}
    >
      {filled ? (
        <motion.span
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.7, ease: 'linear' }}
          className="truncate text-[13px] font-medium text-slate-800"
        >
          {value}
        </motion.span>
      ) : (
        <span className="truncate text-[13px] text-slate-400">{label}</span>
      )}
    </div>
  );
}

const CHANNELS = [
  { key: 'whatsapp', name: 'WhatsApp Business', detail: '+55 11 9····-4821', icon: MessageCircle, tint: 'text-emerald-500' },
  { key: 'instagram', name: 'Instagram Direct', detail: '@sualoja', icon: Instagram, tint: 'text-fuchsia-500' },
] as const;

function ConnectStage() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const [tick, setTick] = useState(0);

  // Uma passada só: cada marco do roteiro dispara um estágio e nada reinicia depois.
  useEffect(() => {
    if (!inView) return;
    const marks = Object.values(SCRIPT);
    const timers = marks.map((delay) =>
      window.setTimeout(() => setTick((current) => Math.max(current, delay)), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView]);

  const whatsappDone = tick >= SCRIPT.whatsappDone;
  const instagramDone = tick >= SCRIPT.instagramDone;
  const showConsent = tick >= SCRIPT.consent;
  const submitting = tick >= SCRIPT.submit && !showConsent;
  const authorizing = tick >= SCRIPT.authorize && !instagramDone;
  const connected: Record<string, boolean> = {
    whatsapp: whatsappDone,
    instagram: instagramDone,
  };

  return (
    <div ref={ref}>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* WhatsApp — leitura do QR Code */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
          <PanelHeading icon={MessageCircle} tint="text-emerald-500">
            Conectar WhatsApp
          </PanelHeading>

          <div className="relative mx-auto h-32 w-32">
            {CORNERS.map((corner) => (
              <span
                key={corner}
                aria-hidden="true"
                className={`pointer-events-none absolute h-5 w-5 transition-colors duration-500 ${corner} ${
                  whatsappDone ? 'border-emerald-500' : 'border-indigo-500'
                }`}
              />
            ))}

            <div className="relative h-full w-full overflow-hidden p-2.5">
              <QrCode
                className={`h-full w-full text-slate-900 transition-opacity duration-500 ${
                  whatsappDone ? 'opacity-15' : 'opacity-100'
                }`}
              />

              {inView && !whatsappDone && (
                <motion.div
                  aria-hidden="true"
                  initial={{ y: '-35%' }}
                  animate={{ y: '135%' }}
                  transition={{ duration: 1, repeat: 1, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent"
                >
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {whatsappDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40">
                    <Check size={24} className="text-white" strokeWidth={3} />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-auto pt-3 text-center text-[11px] font-medium text-slate-500">
            {whatsappDone ? 'Código lido com sucesso' : 'Aponte a câmera para o código'}
          </p>
        </div>

        {/* Instagram — login OAuth */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
          <PanelHeading icon={Instagram} tint="text-fuchsia-500">
            Entrar com Instagram
          </PanelHeading>

          <div className="min-h-[8.25rem]">
            {showConsent ? (
              <motion.div
                key="consent"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <p className="text-[13px] font-semibold text-slate-900">
                    A Synq quer acessar sua conta
                </p>
                <ul className="mt-2 space-y-1.5">
                  {PERMISSIONS.map((permission) => (
                    <li
                      key={permission}
                      className="flex items-center gap-1.5 text-[11px] text-slate-600"
                    >
                      <Check size={11} className="shrink-0 text-slate-400" strokeWidth={3} />
                      {permission}
                    </li>
                  ))}
                </ul>

                <div
                  className={`mt-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors duration-300 ${
                    instagramDone ? 'bg-emerald-500' : 'bg-fuchsia-500'
                  }`}
                >
                  {instagramDone ? (
                    <>
                      <Check size={14} strokeWidth={3} />
                        Autorizado
                    </>
                  ) : authorizing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                        Autorizando…
                    </>
                  ) : (
                    'Autorizar Synq'
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="login">
                <div className="space-y-2">
                  <FakeField
                    label="Usuário"
                    value="@sualoja"
                    active={tick >= SCRIPT.typeUser && tick < SCRIPT.typePassword}
                    filled={tick >= SCRIPT.typeUser}
                  />
                  <FakeField
                    label="Senha"
                    value="••••••••••"
                    active={tick >= SCRIPT.typePassword && tick < SCRIPT.submit}
                    filled={tick >= SCRIPT.typePassword}
                  />
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white">
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                        Entrando…
                    </>
                  ) : (
                    'Entrar'
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <p className="mt-auto pt-3 text-center text-[11px] font-medium text-slate-500">
            {instagramDone
              ? 'Conta autorizada via Meta'
              : showConsent
                ? 'Permissões da API Oficial'
                : 'Login seguro pela API Oficial'}
          </p>
        </div>
      </div>

      {/* Canais conectados */}
      <div className="space-y-2 empty:mt-0 [&:not(:empty)]:mt-3">
        <AnimatePresence>
          {CHANNELS.filter((channel) => connected[channel.key]).map((channel) => {
            const Icon = channel.icon;
            return (
              <motion.div
                key={channel.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className={`rounded-xl bg-slate-50 p-2 ${channel.tint}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{channel.name}</p>
                  <p className="truncate text-xs text-slate-500">{channel.detail}</p>
                </div>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Conectado
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* --------------------------------------------- Passo 2 — treino da IA */

// Roteiro do passo 2: importar catálogo -> escrever as instruções -> ligar a IA nos canais.
const TRAIN_SCRIPT = {
  clickImport: 700,
  products: 1100,
  prompt: 3000,
  channels: 6400,
  whatsappAi: 7000,
  instagramAi: 7800,
} as const;

const FEATURED = {
  name: 'Camiseta Oversized Bege',
  url: 'sualoja.com/camiseta-oversized',
  price: 'R$ 89,90',
};

const PRODUCTS = [
  FEATURED,
  { name: 'Calça Cargo Preta', url: 'sualoja.com/calca-cargo', price: 'R$ 179,90' },
  { name: 'Jaqueta Corta-Vento', url: 'sualoja.com/jaqueta-corta-vento', price: 'R$ 249,90' },
];

const PROMPT_TEXT =
  'Loja de moda urbana em São Paulo. Sempre ofereça 10% no PIX, informe o prazo de entrega e nunca dê desconto acima de 15%.';

/** Chave liga/desliga usada para ativar a IA em cada canal. */
function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${
        on ? 'bg-indigo-600' : 'bg-slate-200'
      }`}
    >
      <motion.span
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
      />
    </span>
  );
}

/** Ponteiro que aparece no momento do clique — só para dar leitura de ação do usuário. */
function ClickCursor({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6, x: 8, y: 8 }}
          animate={{ opacity: 1, scale: [1, 0.8, 1], x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="pointer-events-none absolute -bottom-1 -right-1 text-slate-700"
        >
          <MousePointer2 size={16} className="fill-white" />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function TrainingStage() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const [tick, setTick] = useState(0);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = Object.values(TRAIN_SCRIPT).map((delay) =>
      window.setTimeout(() => setTick((current) => Math.max(current, delay)), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView]);

  const phase =
    tick >= TRAIN_SCRIPT.channels ? 'channels' : tick >= TRAIN_SCRIPT.prompt ? 'prompt' : 'catalog';

  // Digitação das instruções: avança alguns caracteres por quadro enquanto a etapa dura.
  useEffect(() => {
    if (phase !== 'prompt') return;
    const id = window.setInterval(
      () => setTyped((current) => Math.min(current + 2, PROMPT_TEXT.length)),
      26,
    );
    return () => window.clearInterval(id);
  }, [phase]);

  const aiOn: Record<string, boolean> = {
    whatsapp: tick >= TRAIN_SCRIPT.whatsappAi,
    instagram: tick >= TRAIN_SCRIPT.instagramAi,
  };
  const allOn = aiOn.whatsapp === true && aiOn.instagram === true;
  // O ponteiro fica só no próximo canal a ser ligado, senão pareceriam dois cliques ao mesmo tempo.
  const nextToEnable = CHANNELS.find((channel) => aiOn[channel.key] !== true)?.key;

  return (
    <div
      ref={ref}
      className="flex h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5"
    >
      {phase === 'catalog' && (
        <motion.div key="catalog" className="flex h-full flex-col">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900">Catálogo</span>
            <span className="relative">
              <motion.span
                animate={
                  tick >= TRAIN_SCRIPT.clickImport ? { scale: [1, 0.94, 1] } : { scale: 1 }
                }
                transition={{ duration: 0.35 }}
                className={`inline-flex rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-300 ${
                  tick >= TRAIN_SCRIPT.products
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {tick >= TRAIN_SCRIPT.products ? '3 produtos importados' : 'Importar produtos'}
              </motion.span>
              <ClickCursor
                visible={tick >= TRAIN_SCRIPT.clickImport && tick < TRAIN_SCRIPT.products}
              />
            </span>
          </div>

          <div className="space-y-2">
            {tick >= TRAIN_SCRIPT.products &&
              PRODUCTS.map((product, i) => (
                <motion.div
                  key={product.url}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.18, duration: 0.35, ease: 'easeOut' }}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-800">
                      {product.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{product.url}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold text-slate-900">
                    {product.price}
                  </span>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {phase === 'prompt' && (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex h-full flex-col"
        >
          <p className="mb-3 text-xs font-semibold text-slate-900">Instruções da IA</p>
          <div className="flex-1 rounded-xl border border-indigo-400 bg-white p-3 ring-2 ring-indigo-500/15">
            <p className="text-[13px] leading-relaxed text-slate-700">
              {PROMPT_TEXT.slice(0, typed)}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-indigo-500"
              />
            </p>
          </div>
        </motion.div>
      )}

      {phase === 'channels' && (
        <motion.div
          key="channels"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex h-full flex-col"
        >
          <p className="mb-3 text-xs font-semibold text-slate-900">Ativar IA nos canais</p>

          <div className="space-y-2">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const on = aiOn[channel.key] === true;
              return (
                <div
                  key={channel.key}
                  className={`relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${
                    on ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className={`rounded-lg bg-white p-1.5 ${channel.tint}`}>
                    <Icon size={14} />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">
                    {channel.name}
                  </p>
                  <Toggle on={on} />
                  <ClickCursor visible={nextToEnable === channel.key} />
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {allOn && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mt-auto rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-emerald-700">
                  Sua IA está respondendo seus 2 canais de atendimento
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------- Passo 3 — conversa que vende */

// Roteiro da conversa. Cada marco solta uma mensagem, o "digitando", um clique ou o checkout.
const CHAT_SCRIPT = {
  ask1: 500,
  typing1: 1200,
  reply1: 2100,
  ask2: 3100,
  typing2: 3900,
  reply2: 5000,
  pickHover: 6000,
  picked: 6700,
  typing3: 7400,
  reply3: 8500,
  buyHover: 9500,
  checkout: 10200,
} as const;

// Mensagens em ordem — usado só para rolar o chat sempre que uma nova entra.
const MESSAGE_MARKS = [
  CHAT_SCRIPT.ask1,
  CHAT_SCRIPT.reply1,
  CHAT_SCRIPT.ask2,
  CHAT_SCRIPT.reply2,
  CHAT_SCRIPT.picked,
  CHAT_SCRIPT.reply3,
];

function Bubble({ from, children }: { from: 'customer' | 'ai'; children: React.ReactNode }) {
  const isAi = from === 'ai';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: isAi ? 12 : -12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`w-fit max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
        isAi
          ? 'ml-auto rounded-tr-sm bg-indigo-600 text-white'
          : 'rounded-tl-sm bg-slate-100 text-slate-700'
      }`}
    >
      {children}
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="ml-auto flex w-fit items-center gap-1 rounded-2xl rounded-tr-sm bg-indigo-600 px-3 py-2.5"
    >
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
          className="h-1.5 w-1.5 rounded-full bg-white/70"
        />
      ))}
    </motion.div>
  );
}

function SellingStage() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = Object.values(CHAT_SCRIPT).map((delay) =>
      window.setTimeout(() => setTick((current) => Math.max(current, delay)), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView]);

  const visibleMessages = MESSAGE_MARKS.filter((mark) => tick >= mark).length;

  // Mantém a conversa colada no fim, como num chat de verdade.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleMessages, tick]);

  const showQuickReplies = tick >= CHAT_SCRIPT.reply2 && tick < CHAT_SCRIPT.picked;
  const typing =
    (tick >= CHAT_SCRIPT.typing1 && tick < CHAT_SCRIPT.reply1) ||
    (tick >= CHAT_SCRIPT.typing2 && tick < CHAT_SCRIPT.reply2) ||
    (tick >= CHAT_SCRIPT.typing3 && tick < CHAT_SCRIPT.reply3);

  return (
    <div
      ref={ref}
      className="relative flex h-[26rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <div className="rounded-lg bg-slate-50 p-1.5 text-emerald-500">
          <MessageCircle size={14} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">Marina R.</p>
          <p className="truncate text-[11px] text-emerald-600">IA respondendo</p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-hidden px-4 py-3">
        {tick >= CHAT_SCRIPT.ask1 && <Bubble from="customer">Bom dia, tudo bem?</Bubble>}

        {tick >= CHAT_SCRIPT.reply1 && (
          <Bubble from="ai">Bom dia! Tudo ótimo por aqui 😊 Como posso ajudar?</Bubble>
        )}

        {tick >= CHAT_SCRIPT.ask2 && (
          <Bubble from="customer">Quais são os produtos em destaque?</Bubble>
        )}

        {tick >= CHAT_SCRIPT.reply2 && (
          <Bubble from="ai">
            <p>Temos estes 3 em destaque no estoque agora:</p>
            <ul className="mt-2 space-y-2">
              {PRODUCTS.map((product) => (
                <li key={product.url}>
                  <p className="font-bold">{product.name}</p>
                  <p className="text-indigo-100">{product.price}</p>
                </li>
              ))}
            </ul>
          </Bubble>
        )}

        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-wrap justify-end gap-1.5"
          >
            {PRODUCTS.map((product, i) => (
              <span
                key={product.url}
                className={`relative rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-300 ${
                  i === 0 && tick >= CHAT_SCRIPT.pickHover
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {product.name}
                {i === 0 && <ClickCursor visible={tick >= CHAT_SCRIPT.pickHover} />}
              </span>
            ))}
          </motion.div>
        )}

        {tick >= CHAT_SCRIPT.picked && <Bubble from="customer">{FEATURED.name}</Bubble>}

        {tick >= CHAT_SCRIPT.reply3 && (
          <Bubble from="ai">
            <p>
              Algodão premium, modelagem ampla e caimento reto. Disponível do P ao GG e sai hoje
              mesmo.
            </p>
            <p className="mt-2 font-bold">{FEATURED.name}</p>
            <p className="text-indigo-100">{FEATURED.price}</p>
            <span className="relative mt-2.5 block">
              <span className="block rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-indigo-700">
                Comprar agora
              </span>
              <ClickCursor visible={tick >= CHAT_SCRIPT.buyHover} />
            </span>
          </Bubble>
        )}

        {typing && <TypingBubble />}
      </div>

      {/* Checkout numa janela estilo macOS, aberta pelo botão da mensagem. */}
      <AnimatePresence>
        {tick >= CHAT_SCRIPT.checkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-[17rem] overflow-hidden rounded-xl border border-slate-300 bg-white"
            >
              <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="mx-auto pr-6 text-[10px] font-medium text-slate-500">
                  sualoja.com/checkout
                </span>
              </div>

              <div className="p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Resumo do pedido
                </p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <span className="text-[13px] font-semibold text-slate-900">{FEATURED.name}</span>
                  <span className="shrink-0 text-[13px] text-slate-600">{FEATURED.price}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-[12px]">
                  <span className="text-slate-600">PIX · 10% de desconto</span>
                  <span className="font-semibold text-emerald-600">−R$ 8,99</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-900">Total</span>
                  <span className="text-[15px] font-bold text-slate-900">R$ 80,91</span>
                </div>

                <div className="mt-3 rounded-lg bg-indigo-600 py-2 text-center text-xs font-semibold text-white">
                  Finalizar compra
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------------------------------------- Timeline */

// A cor caminha de indigo-400 a indigo-700 ao longo dos passos: a progressão fica legível
// sem trocar de matiz, mantendo a superfície da landing homogênea (DESIGN_SYSTEM 9.6).
const STEPS = [
  {
    id: 1,
    duration: '≈ 3 min',
    title: 'Conecte seus canais',
    short: 'Conecte seu atendimento',
    description:
      'Leia o QR Code no WhatsApp e autorize o Instagram pela API Oficial. Sem código, sem integração manual.',
    tone: 'from-indigo-400 to-indigo-500',
    Stage: ConnectStage,
  },
  {
    id: 2,
    duration: '≈ 5 min',
    title: 'Treine sua IA',
    short: 'Personalize para seu negócio',
    description:
      'Carregue catálogo, regras e tom de voz. A IA aprende e responde como um vendedor da sua loja.',
    tone: 'from-indigo-500 to-indigo-600',
    Stage: TrainingStage,
  },
  {
    id: 3,
    duration: '24/7',
    title: 'Venda no automático',
    short: 'Venda no automático',
    description: HIDDEN_FEATURES.cartRecovery
      ? 'A Synq responde, atende e converte visitantes em clientes a qualquer hora do dia.'
      : 'A Synq responde, recupera carrinhos abandonados e converte visitantes em clientes.',
    tone: 'from-indigo-600 to-indigo-700',
    Stage: SellingStage,
  },
];

export default function HowItWorks() {
  return (
    <section id="funcionalidades" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Do primeiro clique à primeira venda em{' '}
            <span className="text-indigo-600">menos de 10 minutos</span>
          </h2>
          <p className="text-base text-slate-600">
            Três passos para sua operação rodar sozinha — sem código e sem equipe de TI.
          </p>
        </motion.div>

        {/* Linha do tempo: eixo à esquerda no mobile, centralizado no desktop com os
            passos alternando entre os lados. */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-5 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-indigo-200 to-transparent lg:left-1/2"
          />

          <ol className="space-y-12 lg:space-y-4">
            {STEPS.map((step, i) => {
              const { Stage } = step;
              const isLeft = i % 2 === 0;

              return (
                <li key={step.id} className="relative">
                  <motion.span
                    aria-hidden="true"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`absolute left-5 top-2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-lg shadow-indigo-600/25 ring-4 ring-white lg:left-1/2 ${step.tone}`}
                  >
                    {step.id}
                  </motion.span>

                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className={`absolute top-2 hidden h-10 items-center text-md font-semibold text-slate-600 lg:flex ${
                      isLeft ? 'left-[calc(50%+2rem)]' : 'right-[calc(50%+2rem)]'
                    }`}
                  >
                    {step.short}
                  </motion.span>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`pl-14 lg:w-[calc(50%-3rem)] lg:pl-0 ${isLeft ? '' : 'lg:ml-auto'}`}
                  >
                    <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 lg:p-7">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Passo {step.id}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                          {step.duration}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-lg font-bold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {step.description}
                      </p>

                      <div className="mt-6">
                        <Stage />
                      </div>
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
