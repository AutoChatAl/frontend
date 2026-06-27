'use client';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Tag,
  Users,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Bot,
    title: 'IA treinável',
    description: 'Cadastre produtos, regras e tom de voz. A IA aprende e responde como sua marca.',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    icon: MessageSquare,
    title: 'Auto-resposta',
    description: 'Regras por palavra-chave e horário para responder DM, comentários e mensagens.',
    color: 'from-fuchsia-500 to-pink-600',
  },
  {
    icon: Zap,
    title: 'Campanhas em massa',
    description: 'Dispare mensagens segmentadas com controle de cadência anti-bloqueio.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Users,
    title: 'CRM integrado',
    description: 'Contatos, tags, grupos e histórico unificado de cada cliente.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Calendar,
    title: 'Agendamento',
    description: 'IA marca compromissos no calendário da equipe e envia lembretes automáticos.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: BarChart3,
    title: 'Dashboard em tempo real',
    description: 'Mensagens, conversões, recuperações e ROI em uma única visão.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Tag,
    title: 'Automação de comentários',
    description: 'Responda comentários do Instagram com regras e direcione para a DM automaticamente.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: ShieldCheck,
    title: 'Conexão estável',
    description: 'Integrações com Instagram via API Meta e WhatsApp com controle de cadência para operar com segurança.',
    color: 'from-slate-700 to-slate-900',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">
            Tudo no mesmo lugar
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Uma plataforma. <span className="text-indigo-600">Toda sua operação.</span>
          </h2>
          <p className="text-base text-slate-600">
            Substitua múltiplas ferramentas por uma única central de atendimento, vendas e marketing.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all"
              >
                <div
                  className={`inline-flex w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
