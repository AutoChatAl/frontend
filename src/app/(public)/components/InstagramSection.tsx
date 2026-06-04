'use client';
import { motion } from 'framer-motion';
import { Check, Heart, Instagram, MessageCircle, Send } from 'lucide-react';

const FEATURES = [
  'Resposta automática em DMs com IA personalizada',
  'Comentários respondidos com regras por palavra-chave',
  'Story replies e menções respondidas em segundos',
  'Captação de leads direto do perfil para o seu funil',
];

export default function InstagramSection() {
  return (
    <section id="instagram" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="order-2 lg:order-1"
        >
          <div className="inline-flex items-center gap-2 bg-fuchsia-100 text-fuchsia-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
            <Instagram size={14} />
            Canal Instagram
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 tracking-tight">
            Transforme cada{' '}
            <span className="bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              comentário em venda
            </span>
          </h2>

          <p className="text-base text-slate-600 mb-8 leading-relaxed">
            Pare de perder oportunidades nos seus posts e stories. A Synq automatiza DMs e comentários
            do Instagram via <strong className="text-slate-900">API Oficial Meta</strong> — segurança e
            estabilidade sem risco de banimento.
          </p>

          <ul className="space-y-3 mb-8">
            {FEATURES.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 w-5 h-5 rounded-full bg-fuchsia-100 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-fuchsia-600" strokeWidth={3} />
                </div>
                <span className="text-sm text-slate-700">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <a
            href="#precos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-600 hover:text-fuchsia-700 transition-colors"
          >
            Ver planos com Instagram
            <span aria-hidden>→</span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="order-1 lg:order-2 relative"
        >
          <div className="relative mx-auto max-w-sm">
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl shadow-fuchsia-500/10 border-[10px] border-slate-900 overflow-hidden">
              <div className="bg-slate-900 px-6 py-2 flex items-center justify-between text-white text-xs">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>

              <div className="bg-gradient-to-b from-fuchsia-50 to-white px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <Instagram size={16} className="text-fuchsia-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-900">@sua_loja</p>
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online · IA ativa
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-slate-50/50 h-[340px] overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                  <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-slate-800">Oi! Vi a foto do vestido floral. Tem no P?</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="flex items-start justify-end gap-2"
                >
                  <div className="bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-white">
                      Oi! Sim, temos no P 💜 R$ 189,90 — quer o link pra finalizar?
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.1 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                  <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-slate-800">Pode mandar! 🛍️</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.5 }}
                  className="flex items-start justify-end gap-2"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-200 to-pink-200" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-900">Vestido Floral P</p>
                        <p className="text-[10px] text-fuchsia-600 font-bold">R$ 189,90</p>
                      </div>
                    </div>
                    <button className="w-full text-[10px] font-semibold bg-fuchsia-600 text-white py-1.5 rounded-md">
                      Comprar agora
                    </button>
                  </div>
                </motion.div>
              </div>

              <div className="px-3 py-2 border-t border-slate-100 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full px-3 py-1.5">
                  <p className="text-[10px] text-slate-400">Mensagem...</p>
                </div>
                <Heart size={16} className="text-slate-400" />
                <Send size={16} className="text-fuchsia-500" />
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2 flex items-center gap-2"
            >
              <MessageCircle size={14} className="text-fuchsia-500" />
              <div>
                <p className="text-[10px] font-semibold text-slate-900">+47 DMs</p>
                <p className="text-[9px] text-slate-500">respondidas hoje</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
