'use client';
import { motion } from 'framer-motion';
import { Check, Clock, MessageCircle, Phone, Video } from 'lucide-react';

const FEATURES = [
  'Disparo de campanhas em massa com controle anti-bloqueio',
  'Respostas automáticas com IA treinada nos seus produtos',
  'Múltiplas instâncias para times comerciais',
  'Agendamento automático e lembretes de compromissos',
];

export default function WhatsAppSection() {
  return (
    <section id="whatsapp" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="relative mx-auto max-w-sm">
            <div className="relative bg-[#0a1a14] rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 border-[10px] border-slate-900 overflow-hidden">
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Synq IA</p>
                  <p className="text-[10px] text-emerald-200">online · digitando…</p>
                </div>
                <Video size={16} className="text-white" />
                <Phone size={16} className="text-white" />
              </div>

              <div
                className="bg-[#ECE5DD] p-3 space-y-2.5 h-[380px] overflow-hidden"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                  backgroundSize: '12px 12px',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-start"
                >
                  <div className="bg-white rounded-lg rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-slate-800">Oi, vi a promoção. Vocês têm em estoque?</p>
                    <p className="text-[9px] text-slate-400 text-right mt-0.5">09:42</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-end"
                >
                  <div className="bg-[#DCF8C6] rounded-lg rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-slate-800">
                      Olá! Sim, temos em estoque 🎉 Quer no PIX (5% off) ou cartão?
                    </p>
                    <p className="text-[9px] text-slate-500 text-right mt-0.5">
                      09:42 <span className="text-emerald-600">✓✓</span>
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white rounded-lg rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-slate-800">PIX! Manda o código</p>
                    <p className="text-[9px] text-slate-400 text-right mt-0.5">09:43</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.4 }}
                  className="flex justify-end"
                >
                  <div className="bg-[#DCF8C6] rounded-lg rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
                    <div className="bg-white/60 rounded-md p-2 mb-1">
                      <p className="text-[10px] font-semibold text-slate-900">PIX gerado</p>
                      <p className="text-[10px] text-slate-600">R$ 142,40 · expira em 30min</p>
                      <div className="mt-1.5 grid grid-cols-6 gap-0.5">
                        {Array.from({ length: 24 }).map((_, k) => (
                          <div
                            key={k}
                            className={`aspect-square ${k % 3 === 0 ? 'bg-slate-900' : 'bg-slate-200'} rounded-sm`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 text-right">
                      09:43 <span className="text-emerald-600">✓✓</span>
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.8 }}
                  className="flex justify-center"
                >
                  <div className="bg-emerald-500/90 text-white text-[10px] px-3 py-1 rounded-full font-medium shadow-sm">
                    💰 Venda confirmada · R$ 142,40
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2 flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Clock size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-900">Resposta em 1.2s</p>
                <p className="text-[9px] text-slate-500">Média da sua conta</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
            <MessageCircle size={14} />
            Canal WhatsApp
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 tracking-tight">
            Atendimento, vendas e cobrança{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              direto no WhatsApp
            </span>
          </h2>

          <p className="text-base text-slate-600 mb-8 leading-relaxed">
            Sua equipe ganha um operador virtual que nunca dorme. A IA da Synq qualifica leads, envia
            links de pagamento, gera PIX e fecha vendas — tudo na conversa em que o cliente já está.
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
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-emerald-600" strokeWidth={3} />
                </div>
                <span className="text-sm text-slate-700">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <div className="text-center grid grid-cols-3 gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div>
              <p className="text-2xl font-bold text-emerald-700">1.2s</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Tempo médio de resposta</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">24/7</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Atendimento contínuo</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">3x</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Mais conversão</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
