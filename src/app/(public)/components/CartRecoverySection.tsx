'use client';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

const STAGES = [
  {
    icon: ShoppingCart,
    title: 'Cliente abandona',
    subtitle: 'Detecção em tempo real',
    color: 'text-red-500',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
  },
  {
    icon: MessageCircle,
    title: 'Synq dispara',
    subtitle: 'WhatsApp ou Instagram',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    ring: 'ring-indigo-200',
  },
  {
    icon: CreditCard,
    title: 'Venda recuperada',
    subtitle: 'PIX, cartão ou boleto',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
  },
];

const INTEGRATIONS = ['Hotmart', 'Kiwify', 'Eduzz', 'Monetizze', 'PerfectPay'];

export default function CartRecoverySection() {
  return (
    <section
      id="carrinho"
      className="py-24 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden"
    >
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
            <TrendingUp size={14} />
            70% dos carrinhos são abandonados
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
            Recupere as vendas que estão{' '}
            <span className="bg-gradient-to-r from-amber-300 to-fuchsia-300 bg-clip-text text-transparent">
              escapando do seu checkout
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            A Synq conecta sua loja ao WhatsApp e Instagram e envia mensagens automáticas para quem
            abandonou o carrinho — com cupom, link e tudo que falta pra conversão acontecer.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-12 relative">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative"
              >
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] transition-colors">
                  <div className={`inline-flex w-12 h-12 rounded-xl ${stage.bg} items-center justify-center mb-4 ring-1 ${stage.ring}`}>
                    <Icon size={22} className={stage.color} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Etapa {i + 1}
                  </p>
                  <h3 className="text-lg font-bold text-white mb-1">{stage.title}</h3>
                  <p className="text-sm text-slate-400">{stage.subtitle}</p>
                </div>

                {i < STAGES.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 items-center justify-center bg-white rounded-full shadow-lg z-10">
                    <ArrowRight size={12} className="text-slate-700" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 space-y-4"
          >
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 ring-1 ring-red-500/30">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-0.5">14:22 · Carrinho abandonado</p>
                <p className="text-sm text-white">
                  <strong className="font-semibold">Mariana</strong> deixou R$ 247,90 no checkout —
                  tênis Air Max + meia esportiva
                </p>
              </div>
              <span className="text-[10px] font-bold text-red-300 bg-red-500/10 px-2 py-1 rounded-md self-start">
                PERDIDO
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-start gap-4 ml-6"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 ring-1 ring-indigo-500/30">
                <MessageCircle size={18} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-0.5">14:32 · Synq enviou no WhatsApp</p>
                <p className="text-sm text-white italic">
                  &ldquo;Oi Mariana! Vi que você gostou do Air Max 👟 Tá quase esgotando, garanto
                  pra você com <strong className="not-italic font-semibold">10% off no PIX</strong> →
                  link.synq/c/x9k2&rdquo;
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md self-start">
                ENVIADO
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-5 flex items-start gap-4 ml-12"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 ring-1 ring-emerald-400/40">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-emerald-200 mb-0.5">14:48 · Compra finalizada</p>
                <p className="text-sm text-white">
                  Pagamento PIX confirmado de <strong className="font-semibold">R$ 223,11</strong> —
                  venda recuperada em 26min
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-200 bg-emerald-500/20 px-2 py-1 rounded-md self-start">
                + R$ 223
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl p-6 shadow-2xl shadow-indigo-900/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
                Performance média
              </p>
              <p className="text-4xl font-bold text-white mb-1">+32%</p>
              <p className="text-sm text-indigo-100">
                de faturamento recuperado em lojas Synq nos primeiros 30 dias
              </p>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Integrações nativas
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEGRATIONS.map((name) => (
                  <span
                    key={name}
                    className="px-2.5 py-1 text-xs font-medium bg-white/[0.06] text-slate-200 rounded-md border border-white/10"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                + webhook genérico para qualquer plataforma
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
