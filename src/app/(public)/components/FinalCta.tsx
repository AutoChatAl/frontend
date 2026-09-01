'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FinalCta() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-3xl border border-indigo-100 bg-indigo-50/50 px-6 py-14 text-center sm:px-10"
        >
          <h2 className="mx-auto mb-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Sua próxima venda já está{' '}
            <span className="text-indigo-600">esperando uma resposta</span>
          </h2>

          <p className="mx-auto mb-8 max-w-xl text-base text-slate-600">
            Comece em menos de 5 minutos. 7 dias grátis, sem cartão de crédito.
          </p>

          <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Quero testar grátis
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#precos"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              Ver planos e preços
            </a>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
