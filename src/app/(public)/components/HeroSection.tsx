'use client';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Instagram, MessageCircle, Sparkles, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const HERO_BUBBLES = [
  {
    id: 1,
    side: 'left' as const,
    delay: 0.6,
    icon: Instagram,
    iconColor: 'text-fuchsia-500',
    title: 'Instagram',
    message: 'Vi seu post! Tem desconto pra primeira compra? 🤩',
  },
  {
    id: 2,
    side: 'right' as const,
    delay: 1.2,
    icon: Sparkles,
    iconColor: 'text-indigo-500',
    title: 'Synq IA',
    message: 'Oi! Sim, 10% no PIX. Quer que eu te envie o link? 💜',
  },
  {
    id: 3,
    side: 'left' as const,
    delay: 1.8,
    icon: ShoppingCart,
    iconColor: 'text-amber-500',
    title: 'Carrinho recuperado',
    message: 'Tá ali esperando, finaliza? Frete grátis hoje! 🚀',
  },
];

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50">
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_80%_60%,rgba(217,70,239,0.12),transparent_50%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/70 backdrop-blur border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Atendimento e vendas automatizadas com IA
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
            Transforme cada{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                conversa
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                className="absolute -bottom-1 left-0 right-0 h-3 bg-fuchsia-200/60 -z-0 origin-left rounded"
              />
            </span>
            <br />
            em uma venda no piloto automático
          </h1>

          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            A Synq centraliza <strong className="text-slate-900">WhatsApp, Instagram</strong> e{' '}
            <strong className="text-slate-900">recuperação de carrinho</strong> em uma só plataforma — com
            IA treinada no seu negócio respondendo 24h por dia.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/40 transition-all"
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

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Sem cartão
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Setup em 5 minutos
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Cancele quando quiser
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="relative h-[520px] hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-6 -right-2 w-72 h-72 bg-gradient-to-br from-indigo-300/30 to-fuchsia-300/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-6 -left-2 w-72 h-72 bg-gradient-to-br from-emerald-300/30 to-indigo-300/30 rounded-full blur-3xl"
          />

          <div className="absolute inset-0 flex flex-col justify-center gap-4 px-4">
            {HERO_BUBBLES.map((bubble, i) => {
              const Icon = bubble.icon;
              return (
                <motion.div
                  key={bubble.id}
                  initial={{ opacity: 0, x: bubble.side === 'left' ? -40 : 40, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: bubble.delay, duration: 0.5, ease: 'easeOut' }}
                  className={`flex ${bubble.side === 'right' ? 'justify-end' : 'justify-start'}`}
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 4 + i * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.3,
                    }}
                    className={`max-w-[78%] bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 p-4 ${
                      bubble.side === 'right' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg bg-slate-50 ${bubble.iconColor}`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{bubble.title}</span>
                      <div className="ml-auto flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{bubble.message}</p>
                  </motion.div>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.5 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-lg border border-slate-100">
                <div className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ y: [0, -3, 0] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: dot * 0.15,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400"
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500">IA digitando…</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3, duration: 0.4 }}
              className="absolute -bottom-2 right-4 flex items-center gap-2 bg-emerald-500 text-white px-3 py-2 rounded-full shadow-lg shadow-emerald-500/30"
            >
              <MessageCircle size={14} />
              <span className="text-xs font-semibold">+R$ 1.247 recuperados hoje</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
