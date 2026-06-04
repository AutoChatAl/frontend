'use client';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function FinalCta() {
  return (
    <section className="relative py-24 overflow-hidden bg-slate-900">
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.25),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(217,70,239,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center"
      >
        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
          Sua próxima venda já está{' '}
          <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
            esperando uma resposta
          </span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
          Comece em menos de 5 minutos. 7 dias grátis, sem cartão de crédito.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-indigo-50 text-slate-900 rounded-xl font-semibold text-base shadow-2xl shadow-indigo-500/20 transition-all"
          >
            Quero testar grátis
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#precos"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur text-white border border-white/20 rounded-xl font-semibold text-base transition-all"
          >
            Ver planos e preços
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Sem cartão
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Setup em 5 min
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Cancele a qualquer momento
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Suporte em português
          </div>
        </div>
      </motion.div>
    </section>
  );
}
