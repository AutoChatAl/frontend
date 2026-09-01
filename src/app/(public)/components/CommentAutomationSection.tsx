'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Heart, Instagram, MessageCircle, Send } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ roteiro */

const SCRIPT = {
  comment: 900,
  detected: 2000,
  dm: 2900,
  dmDetails: 3800,
} as const;

const KEYWORD = 'EU QUERO';

const EXISTING_COMMENT = { user: 'ana.paula', text: 'Amei essa jaqueta 😍' };
const TRIGGER_COMMENT = { user: 'marina.rocha', text: KEYWORD };

/* ------------------------------------------------------------------ seção */

export default function CommentAutomationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  // Roda uma vez, quando a seção entra na tela.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        Object.values(SCRIPT).forEach((delay) => {
          window.setTimeout(() => setTick((current) => Math.max(current, delay)), delay);
        });
      },
      { rootMargin: '-120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const detected = tick >= SCRIPT.detected;
  const dmSent = tick >= SCRIPT.dm;

  return (
    <section id="comentarios" className="relative py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Automação de comentários
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Quem comenta vira <span className="text-indigo-600">conversa na DM</span>
          </h2>
          <p className="text-base leading-relaxed text-slate-600">
            Escolha a palavra-chave do post. Quem comentar recebe as informações no direct
            automaticamente — sem você digitar nada, nem perder o comentário no meio dos outros.
          </p>
        </motion.div>

        {/* Post + direct: a DM chega sobrepondo o post, como uma notificação. */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative min-w-0 pb-28 sm:pb-20"
        >
          <div className="max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
            <div className="flex items-center gap-2.5 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-600">
                <Instagram size={15} />
              </span>
              <p className="text-[13px] font-semibold text-slate-900">sualoja</p>
            </div>

            <div className="relative aspect-square bg-slate-100">
              <Image
                src="/jaqueta.png"
                alt="Jaqueta corta-vento azul-marinho pendurada em um cabide"
                fill
                sizes="(min-width: 1024px) 30vw, 90vw"
                className="object-cover"
              />
            </div>

            <div className="flex items-center gap-4 px-3 pt-3 text-slate-700">
              <Heart size={19} />
              <MessageCircle size={19} />
              <Send size={19} />
              <Bookmark size={19} className="ml-auto" />
            </div>

            <div className="space-y-2 p-3">
              <p className="text-[13px] leading-relaxed text-slate-700">
                <span className="font-semibold text-slate-900">sualoja</span> Jaqueta corta-vento
                chegou 🧥 Comente{' '}
                <span className="rounded bg-indigo-50 px-1 font-semibold text-indigo-700">
                  {KEYWORD}
                </span>{' '}
                que eu te mando o link no direct 💜
              </p>

              <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                <p className="text-[13px] text-slate-600">
                  <span className="font-semibold text-slate-900">{EXISTING_COMMENT.user}</span>{' '}
                  {EXISTING_COMMENT.text}
                </p>

                <AnimatePresence>
                  {tick >= SCRIPT.comment && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`-mx-1.5 rounded-lg px-1.5 py-1 transition-colors duration-500 ${
                        detected ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <p className="text-[13px] text-slate-600">
                        <span className="font-semibold text-slate-900">{TRIGGER_COMMENT.user}</span>{' '}
                        <span className="font-semibold text-indigo-700">{TRIGGER_COMMENT.text}</span>
                      </p>

                      <AnimatePresence>
                        {detected && !dmSent && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-1 text-[11px] font-semibold text-indigo-600"
                          >
                            Palavra-chave &ldquo;{KEYWORD}&rdquo; detectada
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* A loja responde no próprio comentário, como acontece no Instagram. */}
                <AnimatePresence>
                  {dmSent && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="pl-5 text-[13px] text-slate-600"
                    >
                      <span className="font-semibold text-slate-900">sualoja</span>{' '}
                      <span className="font-medium text-indigo-600">
                        @{TRIGGER_COMMENT.user}
                      </span>{' '}
                      te mandei o link no direct 💜
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {dmSent && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute bottom-0 right-0 w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white sm:max-w-sm"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                    MR
                  </span>
                  <p className="truncate text-[12px] font-semibold text-slate-900">
                    {TRIGGER_COMMENT.user}
                  </p>
                  <span className="ml-auto shrink-0 rounded-full bg-fuchsia-50 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-600">
                    Direct
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50/60 p-3">
                  <div className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-tr-sm bg-indigo-600 px-3 py-2 text-[12px] leading-relaxed text-white">
                    Oi Marina! Aqui está a jaqueta corta-vento 🧥
                  </div>

                  {tick >= SCRIPT.dmDetails && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-tr-sm bg-indigo-600 px-3 py-2 text-[12px] leading-relaxed text-white"
                    >
                      <p className="font-bold">Jaqueta Corta-Vento</p>
                      <p className="text-indigo-100">R$ 249,90 — 10% no PIX</p>
                      <p className="mt-1.5 rounded-lg bg-white px-2.5 py-1.5 text-center text-[11px] font-semibold text-indigo-700">
                        Comprar agora
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
