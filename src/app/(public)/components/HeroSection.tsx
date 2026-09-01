'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { HIDDEN_FEATURES } from '@lib/featureFlags';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/*
        Wash de profundidade do hero — só indigo, para não poluir a superfície com várias
        matizes. A máscara vertical apaga o wash antes da borda inferior, então o corte do
        `overflow-hidden` nunca vira uma linha visível (DESIGN_SYSTEM 9.6).
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_18%_15%,rgba(99,102,241,0.14),transparent_55%),radial-gradient(circle_at_82%_50%,rgba(129,140,248,0.12),transparent_55%)] [mask-image:linear-gradient(to_bottom,black_30%,transparent_95%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.15] mb-5 tracking-tight">
            Transforme conversas em{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-indigo-600">vendas</span>
              {/* Rabisco de marca-texto: duas passadas de traço irregular, desenhadas na entrada. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 200 22"
                preserveAspectRatio="none"
                fill="none"
                className="absolute -left-[4%] top-full -mt-[0.14em] w-[108%] h-[0.28em] -rotate-[0.8deg] overflow-visible text-indigo-300"
              >
                <motion.path
                  d="M4 15.2C24 5.4 52 2.1 86 3.4c17 .7 33 2.6 50 3.2 16 .6 33-.1 60-2.9"
                  stroke="currentColor"
                  strokeWidth={8}
                  strokeLinecap="round"
                  opacity={0.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
                />
                <motion.path
                  d="M16 19.4c28-4.8 58-6.6 92-5.4 19 .7 38 2.4 58 1.5"
                  stroke="currentColor"
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  opacity={0.38}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.95, duration: 0.45, ease: 'easeOut' }}
                />
              </svg>
            </span>
            <br />
            no piloto automático
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-600">
            {HIDDEN_FEATURES.cartRecovery ? (<>
              <strong className="text-slate-900">WhatsApp e Instagram</strong> num só lugar, com IA treinada
              no seu negócio respondendo 24h por dia.
            </>) : (<>
              <strong className="text-slate-900">WhatsApp, Instagram</strong> e{' '}
              <strong className="text-slate-900">recuperação de carrinho</strong> num só lugar, com IA
              treinada no seu negócio respondendo 24h por dia.
            </>)}
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all"
            >
              Começar 7 dias grátis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#funcionalidades"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-semibold text-base transition-all"
            >
              Ver como funciona
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="relative mx-auto mt-14 w-full min-w-0 max-w-6xl"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-indigo-300/25 blur-3xl"
          />

          {/* Janela estilo macOS envolvendo o print do painel. */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3.5 py-2.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="mx-auto pr-12 text-[11px] font-medium text-slate-500">
                app.synq.com.br
              </span>
            </div>

            <Image
              src="/image.png"
              alt="Painel da Synq com as métricas de mensagens enviadas pela IA, manualmente e por automações"
              width={2874}
              height={1694}
              priority
              sizes="(min-width: 1024px) 80vw, 100vw"
              className="h-auto w-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
