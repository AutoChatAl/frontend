'use client';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ roteiro */

const SCRIPT = {
  templateName: 300,
  templateBody: 1100,
  templateSaved: 2600,
  campaign: 3300,
  campaignFilled: 4200,
  campaignSaved: 5400,
  schedule: 6100,
  clock: 7000,
  fire: 9600,
} as const;

const TOTAL_CONTACTS = 1284;
// Velocidade do contador durante o disparo (contatos por tique de 40ms).
const SEND_STEP = 18;
const SEND_TICK_MS = 40;

const CLOCK_STEPS = ['08:57', '08:58', '08:59', '09:00'];
const CLOCK_TICK_MS = 750;

const TEMPLATE_NAME = 'colecao_inverno';
const TEMPLATE_BODY = 'Oi {{1}}! Chegou a nova coleção de inverno 🧥 Só hoje com 15% off no PIX.';

// Amostra que cabe na tela do celular — o restante fica no contador.
const CONTACTS = [
  { name: 'Marina Rocha', initials: 'MR' },
  { name: 'Bruno Tavares', initials: 'BT' },
  { name: 'Letícia Alves', initials: 'LA' },
  { name: 'Rafael Nunes', initials: 'RN' },
];

function messageFor(name: string): string {
  return TEMPLATE_BODY.replace('{{1}}', name.split(' ')[0] ?? name);
}

/* ------------------------------------------------------------ apresentação */

/** Campo de formulário que se preenche sozinho. */
function Field({ label, value, filled, active }: {
  label: string;
  value: string;
  filled: boolean;
  active: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div
        className={`flex h-9 items-center overflow-hidden rounded-lg border px-3 transition-colors duration-300 ${
          active ? 'border-indigo-400 bg-white ring-2 ring-indigo-500/15' : 'border-slate-200 bg-slate-50'
        }`}
      >
        {filled ? (
          <motion.span
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.6, ease: 'linear' }}
            className="truncate text-[13px] font-medium text-slate-800"
          >
            {value}
          </motion.span>
        ) : (
          <span className="text-[13px] text-slate-300">—</span>
        )}
      </div>
    </div>
  );
}

function StageShell({ step, title, children }: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex h-full flex-col"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
          {step}
        </span>
        <p className="text-xs font-semibold text-slate-900">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ seção */

export default function CampaignSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [clockStep, setClockStep] = useState(0);
  const [typed, setTyped] = useState(0);
  const [sent, setSent] = useState(0);

  // Dispara uma vez, quando a seção entra na tela.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const marks = Object.values(SCRIPT);
        marks.forEach((delay) => {
          window.setTimeout(() => setTick((current) => Math.max(current, delay)), delay);
        });
      },
      { rootMargin: '-120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const phase =
    tick >= SCRIPT.schedule ? 'schedule' : tick >= SCRIPT.campaign ? 'campaign' : 'template';

  // Digitação do corpo do template.
  useEffect(() => {
    if (tick < SCRIPT.templateBody || tick >= SCRIPT.templateSaved) return;
    const id = window.setInterval(
      () => setTyped((current) => Math.min(current + 2, TEMPLATE_BODY.length)),
      24,
    );
    return () => window.clearInterval(id);
  }, [tick]);

  // Relógio andando até o horário agendado.
  useEffect(() => {
    if (tick < SCRIPT.clock || clockStep >= CLOCK_STEPS.length - 1) return;
    const id = window.setTimeout(() => setClockStep((current) => current + 1), CLOCK_TICK_MS);
    return () => window.clearTimeout(id);
  }, [tick, clockStep]);

  // Contador do disparo, subindo até o total de destinatários da campanha.
  useEffect(() => {
    if (tick < SCRIPT.fire || sent >= TOTAL_CONTACTS) return;
    const id = window.setInterval(
      () => setSent((current) => Math.min(current + SEND_STEP, TOTAL_CONTACTS)),
      SEND_TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [tick, sent]);

  const firing = tick >= SCRIPT.fire;
  const progress = sent / TOTAL_CONTACTS;
  // Quantas conversas já couberam na tela, na mesma proporção do contador.
  const visibleRows = Math.min(CONTACTS.length, Math.ceil(progress * CONTACTS.length));

  return (
    <section id="campanhas" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-2xl"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Disparo em massa
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Monte uma vez, dispare{' '}
            <span className="text-indigo-600">para toda a sua base</span>
          </h2>
          <p className="text-base leading-relaxed text-slate-600">
            Crie o template, monte a campanha em cima dele e escolha a hora. No horário marcado a
            Synq envia para cada contato com o nome dele no lugar certo.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Fluxo: template -> campanha -> agendamento -> relógio */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-[24rem] rounded-3xl border border-slate-200/80 bg-white p-6 lg:p-7"
          >
            {phase === 'template' && (
              <StageShell key="template" step={1} title="Novo template">
                <div className="space-y-3">
                  <Field
                    label="Nome do template"
                    value={TEMPLATE_NAME}
                    filled={tick >= SCRIPT.templateName}
                    active={tick >= SCRIPT.templateName && tick < SCRIPT.templateBody}
                  />

                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Corpo da mensagem
                    </p>
                    <div
                      className={`h-24 rounded-lg border p-3 transition-colors duration-300 ${
                        tick >= SCRIPT.templateBody && tick < SCRIPT.templateSaved
                          ? 'border-indigo-400 bg-white ring-2 ring-indigo-500/15'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed text-slate-700">
                        {TEMPLATE_BODY.slice(0, typed)}
                        {tick >= SCRIPT.templateBody && tick < SCRIPT.templateSaved && (
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                            className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-indigo-500"
                          />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-auto flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors duration-300 ${
                    tick >= SCRIPT.templateSaved ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                >
                  {tick >= SCRIPT.templateSaved ? (
                    <>
                      <Check size={14} strokeWidth={3} />
                      Template aprovado
                    </>
                  ) : (
                    'Salvar template'
                  )}
                </div>
              </StageShell>
            )}

            {phase === 'campaign' && (
              <StageShell key="campaign" step={2} title="Nova campanha">
                <div className="space-y-3">
                  <Field
                    label="Nome da campanha"
                    value="Coleção de inverno"
                    filled={tick >= SCRIPT.campaign}
                    active={tick >= SCRIPT.campaign && tick < SCRIPT.campaignFilled}
                  />
                  <Field
                    label="Template aprovado"
                    value={TEMPLATE_NAME}
                    filled={tick >= SCRIPT.campaignFilled}
                    active={tick >= SCRIPT.campaignFilled && tick < SCRIPT.campaignSaved}
                  />
                  <Field
                    label="Destinatários"
                    value={`${TOTAL_CONTACTS.toLocaleString('pt-BR')} contatos`}
                    filled={tick >= SCRIPT.campaignSaved}
                    active={false}
                  />
                </div>

                <div className="mt-auto flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
                  Agendar disparo
                </div>
              </StageShell>
            )}

            {phase === 'schedule' && (
              <StageShell key="schedule" step={3} title="Disparo agendado">
                <div className="flex flex-1 flex-col items-center justify-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {firing ? 'Enviando agora' : 'Hoje às 09:00'}
                  </p>

                  <p
                    className={`mt-2 text-6xl font-bold tabular-nums tracking-tight transition-colors duration-500 ${
                      firing ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {CLOCK_STEPS[clockStep] ?? CLOCK_STEPS[0]}
                  </p>

                  <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {firing
                      ? `${sent.toLocaleString('pt-BR')} de ${TOTAL_CONTACTS.toLocaleString('pt-BR')} contatos`
                      : 'Aguardando o horário'}
                  </p>
                </div>
              </StageShell>
            )}
          </motion.div>

          {/* Tela do celular recebendo os disparos — só a tela, sem moldura. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
            className="flex h-[24rem] min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">Conversas</p>
              <p className="text-[11px] tabular-nums text-slate-400">
                {CLOCK_STEPS[clockStep] ?? CLOCK_STEPS[0]}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {visibleRows === 0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <p className="text-[13px] text-slate-400">
                    As mensagens da campanha aparecem aqui no horário agendado.
                  </p>
                </div>
              ) : (
                <>
                  {CONTACTS.slice(0, visibleRows).map((contact) => (
                    <motion.div
                      key={contact.name}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="flex items-start gap-2.5 border-b border-slate-100 px-4 py-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                        {contact.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold text-slate-900">
                            {contact.name}
                          </p>
                          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">09:00</span>
                        </div>
                        <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                          <CheckCheck size={13} className="mt-0.5 shrink-0 text-sky-500" />
                          <span className="line-clamp-2">{messageFor(contact.name)}</span>
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {sent > CONTACTS.length && (
                    <p className="px-4 py-3 text-center text-[11px] font-medium text-slate-400">
                      + {(sent - CONTACTS.length).toLocaleString('pt-BR')} conversas
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
