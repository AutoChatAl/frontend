'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Plug, Send } from 'lucide-react';

import { HIDDEN_FEATURES } from '@lib/featureFlags';

const STEPS = [
  {
    id: 1,
    icon: Plug,
    title: 'Conecte seus canais',
    description:
      'Vincule WhatsApp e Instagram em menos de 5 minutos. Setup guiado, sem dor de cabeça.',
    accent: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/30',
  },
  {
    id: 2,
    icon: Bot,
    title: 'Treine sua IA',
    description:
      'Carregue produtos, regras e tom de voz. A IA aprende e responde como um vendedor da sua loja.',
    accent: 'from-indigo-500 to-violet-600',
    glow: 'shadow-indigo-500/30',
  },
  {
    id: 3,
    icon: Send,
    title: 'Venda no automático',
    description: HIDDEN_FEATURES.cartRecovery
      ? 'A Synq responde, atende e converte visitantes em clientes 24/7.'
      : 'A Synq responde, recupera carrinhos abandonados e converte visitantes em clientes 24/7.',
    accent: 'from-fuchsia-500 to-pink-600',
    glow: 'shadow-fuchsia-500/30',
  },
];

export default function HowItWorks() {
  return (
    <section id="funcionalidades" className="py-24 bg-white relative">
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
            Do primeiro clique à primeira venda em <span className="text-indigo-600">menos de 10 minutos</span>
          </h2>
          <p className="text-base text-slate-600">
            Três passos para sua operação rodar no automático, sem código e sem dor de cabeça.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px">
            <svg className="w-full h-px" preserveAspectRatio="none" viewBox="0 0 100 1">
              <line
                x1="0"
                y1="0.5"
                x2="100"
                y2="0.5"
                stroke="url(#hiwLine)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <defs>
                <linearGradient id="hiwLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' }}
                className="relative"
              >
                <div className="relative bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all group">
                  <div
                    className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accent} items-center justify-center mb-5 shadow-lg ${step.glow} group-hover:scale-110 transition-transform`}
                  >
                    <Icon size={26} className="text-white" />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-400">PASSO {step.id}</span>
                    {i < STEPS.length - 1 && (
                      <ArrowRight size={12} className="text-slate-300 md:hidden" />
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
