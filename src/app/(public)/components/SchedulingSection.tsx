'use client';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ roteiro */

const SCRIPT = {
  ask: 600,
  typing1: 1300,
  slots: 2200,
  pick: 3300,
  typing2: 3900,
  confirm: 4700,
  event: 5300,
  reminder: 6200,
} as const;

const SLOTS = ['Quinta, 14h', 'Quinta, 16h30', 'Sexta, 10h'];
const CHOSEN = SLOTS[0] ?? 'Quinta, 14h';

// Grade do dia: o evento novo entra às 14h, entre um horário livre e um já ocupado.
const HOURS = [
  { time: '13:00', busy: null },
  { time: '14:00', busy: null },
  { time: '15:00', busy: 'Reunião interna' },
  { time: '16:00', busy: null },
];

/* ------------------------------------------------------------------ seção */

export default function SchedulingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = Object.values(SCRIPT).map((delay) =>
      window.setTimeout(() => setTick((current) => Math.max(current, delay)), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView]);

  const typing =
    (tick >= SCRIPT.typing1 && tick < SCRIPT.slots) ||
    (tick >= SCRIPT.typing2 && tick < SCRIPT.confirm);

  return (
    <section id="agendamento" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Agendamento automático
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            A IA marca a reunião e{' '}
            <span className="text-indigo-600">põe na sua agenda</span>
          </h2>
          <p className="text-base text-slate-600">
            Ela consulta os horários livres, confirma com o cliente e cria o evento direto no Google
            Agenda da equipe. Ninguém precisa abrir o calendário.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white lg:grid-cols-2"
        >
          {/* Conversa */}
          <div className="flex min-h-[20rem] flex-col border-b border-slate-200 lg:min-h-[24rem] lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                CM
              </span>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">Carolina Menezes</p>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 bg-slate-50/60 p-4">
              {tick >= SCRIPT.ask && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-fit max-w-[86%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[13px] text-slate-700"
                >
                  Consegue marcar uma avaliação essa semana?
                </motion.div>
              )}

              {tick >= SCRIPT.slots && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-auto w-fit max-w-[86%] rounded-2xl rounded-tr-sm bg-indigo-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white"
                >
                  <p>Consigo sim! Tenho estes horários livres:</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SLOTS.map((slot) => (
                      <span
                        key={slot}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-300 ${
                          tick >= SCRIPT.pick && slot === CHOSEN
                            ? 'bg-white text-indigo-700'
                            : 'bg-white/15 text-white'
                        }`}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {tick >= SCRIPT.pick && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-fit max-w-[86%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[13px] text-slate-700"
                >
                  {CHOSEN} fica ótimo!
                </motion.div>
              )}

              {tick >= SCRIPT.confirm && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-auto w-fit max-w-[86%] rounded-2xl rounded-tr-sm bg-indigo-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white"
                >
                  Marcado! Já coloquei na agenda e te mando um lembrete um dia antes 💜
                </motion.div>
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
          </div>

          {/* Agenda */}
          <div className="flex min-h-[20rem] flex-col lg:min-h-[24rem]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">Agenda da equipe</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Google Agenda conectado
              </span>
            </div>

            <div className="flex-1 p-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Quinta-feira
              </p>

              <div className="space-y-1.5">
                {HOURS.map((hour) => {
                  const isNewEvent = hour.time === '14:00' && tick >= SCRIPT.event;
                  return (
                    <div key={hour.time} className="flex items-start gap-3">
                      <span className="w-11 shrink-0 pt-2 text-[11px] tabular-nums text-slate-400">
                        {hour.time}
                      </span>

                      {isNewEvent ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="flex-1 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 px-3 py-2"
                        >
                          <p className="text-[13px] font-semibold text-slate-900">
                            Avaliação · Carolina Menezes
                          </p>
                          <p className="text-[11px] text-slate-500">14:00 às 14:45 · criado pela IA</p>
                        </motion.div>
                      ) : hour.busy ? (
                        <div className="flex-1 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-3 py-2">
                          <p className="text-[13px] text-slate-500">{hour.busy}</p>
                        </div>
                      ) : (
                        <div className="h-9 flex-1 rounded-lg border border-dashed border-slate-200" />
                      )}
                    </div>
                  );
                })}
              </div>

              {tick >= SCRIPT.reminder && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <Check size={15} className="shrink-0 text-emerald-600" strokeWidth={3} />
                  <span className="text-[13px] font-semibold text-emerald-700">
                    Lembrete agendado para quarta, 14h
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
