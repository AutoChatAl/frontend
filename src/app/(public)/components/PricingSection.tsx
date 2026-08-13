'use client';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { subscriptionService } from '@/services/subscription.service';
import type { AiPlan, Plan, PlanSlug } from '@/types/Subscription';
import { HIDDEN_FEATURES } from '@lib/featureFlags';

function formatBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(n: number): string {
  if (n === -1) return 'Ilimitado';
  return n.toLocaleString('pt-BR');
}

const PLAN_META: Record<PlanSlug, { icon: typeof Zap; gradient: string; tagline: string }> = {
  impulso: {
    icon: Zap,
    gradient: 'from-blue-500 to-indigo-600',
    tagline: 'Para começar a vender no automático',
  },
  crescimento: {
    icon: Sparkles,
    gradient: 'from-indigo-500 to-fuchsia-600',
    tagline: 'Para escalar atendimento e campanhas',
  },
  dominio: {
    icon: Crown,
    gradient: 'from-fuchsia-500 to-pink-600',
    tagline: 'Operação completa com IA inclusa',
  },
};

function buildFeatures(plan: Plan): string[] {
  const l = plan.limits;
  return [
    `${l.maxWhatsappInstances} WhatsApp + ${l.maxInstagramInstances} Instagram`,
    `${formatNumber(l.maxMessagesPerMonth)} mensagens/mês`,
    `${l.maxCampaigns} campanhas ativas`,
    `${formatNumber(l.maxContacts)} contatos no CRM`,
    `${l.maxAutoReplies} auto-respostas e ${l.maxCommentAutomations} automações de comentários`,
    ...(HIDDEN_FEATURES.cartRecovery ? [] : [`${l.maxCartRecoveryIntegrations} integração${l.maxCartRecoveryIntegrations > 1 ? 'ões' : ''} de recuperação de carrinho`]),
    l.maxCollaborators > 0 ? `${l.maxCollaborators} colaboradores incluídos` : 'Usuário principal',
    l.supportLevel === 'vip' ? 'Suporte VIP prioritário' : 'Suporte padrão',
    plan.aiIncluded ? 'IA Synq inclusa neste plano' : 'IA disponível como add-on',
  ];
}

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [aiPlans, setAiPlans] = useState<AiPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([subscriptionService.getPlans(), subscriptionService.getAiPlans()])
      .then(([p, a]) => {
        setPlans(p.sort((x, y) => x.sortOrder - y.sortOrder));
        setAiPlans(a.sort((x, y) => x.sortOrder - y.sortOrder));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featuredSlug: PlanSlug = 'crescimento';

  const fallbackPlans = useMemo<Plan[]>(
    () => [
      {
        id: 'impulso',
        slug: 'impulso',
        name: 'Impulso',
        description: 'O começo da sua jornada',
        priceCents: 10990,
        stripePriceId: '',
        aiIncluded: null,
        isActive: true,
        sortOrder: 1,
        limits: {
          maxInstances: 2,
          maxWhatsappInstances: 1,
          maxInstagramInstances: 1,
          maxCampaigns: 2,
          maxContacts: 500,
          maxSchedules: 1,
          schedulesPerMember: false,
          maxCollaborators: 0,
          maxAutoReplies: 2,
          maxCommentAutomations: 2,
          maxCartRecoveryIntegrations: 1,
          maxMessagesPerMonth: 1250,
          extraMessagePriceCents: 2.3,
          extraAiMessagePriceCents: 4,
          supportLevel: 'standard',
        },
      },
      {
        id: 'crescimento',
        slug: 'crescimento',
        name: 'Crescimento',
        description: 'Para negócios em expansão',
        priceCents: 16990,
        stripePriceId: '',
        aiIncluded: null,
        isActive: true,
        sortOrder: 2,
        limits: {
          maxInstances: 4,
          maxWhatsappInstances: 2,
          maxInstagramInstances: 2,
          maxCampaigns: 4,
          maxContacts: 1000,
          maxSchedules: 1,
          schedulesPerMember: true,
          maxCollaborators: 2,
          maxAutoReplies: 4,
          maxCommentAutomations: 4,
          maxCartRecoveryIntegrations: 2,
          maxMessagesPerMonth: 3250,
          extraMessagePriceCents: 1.8,
          extraAiMessagePriceCents: 3.3,
          supportLevel: 'standard',
        },
      },
      {
        id: 'dominio',
        slug: 'dominio',
        name: 'Domínio',
        description: 'Controle total do seu negócio',
        priceCents: 27990,
        stripePriceId: '',
        aiIncluded: 'ai-nivel-1',
        isActive: true,
        sortOrder: 3,
        limits: {
          maxInstances: 8,
          maxWhatsappInstances: 4,
          maxInstagramInstances: 4,
          maxCampaigns: 8,
          maxContacts: -1,
          maxSchedules: 1,
          schedulesPerMember: true,
          maxCollaborators: 4,
          maxAutoReplies: 8,
          maxCommentAutomations: 8,
          maxCartRecoveryIntegrations: 4,
          maxMessagesPerMonth: 8250,
          extraMessagePriceCents: 1.5,
          extraAiMessagePriceCents: 2.6,
          supportLevel: 'vip',
        },
      },
    ],
    [],
  );

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  return (
    <section id="precos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">Preços</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Planos honestos, do <span className="text-indigo-600">primeiro cliente ao milésimo</span>
          </h2>
          <p className="text-base text-slate-600">
            7 dias grátis em qualquer plano. Sem cartão. Cancele quando quiser.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayPlans.map((plan, i) => {
            const meta = PLAN_META[plan.slug] ?? PLAN_META.impulso;
            const Icon = meta.icon;
            const isFeatured = plan.slug === featuredSlug;
            const features = buildFeatures(plan);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative rounded-2xl p-6 lg:p-8 flex flex-col ${
                  isFeatured
                    ? 'bg-slate-900 text-white shadow-2xl shadow-indigo-900/20 ring-1 ring-indigo-500/30 scale-100 lg:scale-105'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                    Mais escolhido
                  </span>
                )}

                <div
                  className={`inline-flex w-11 h-11 rounded-xl bg-gradient-to-br ${meta.gradient} items-center justify-center mb-4 shadow-md`}
                >
                  <Icon size={20} className="text-white" />
                </div>

                <h3 className={`text-xl font-bold ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-5 ${isFeatured ? 'text-slate-400' : 'text-slate-500'}`}>
                  {meta.tagline}
                </p>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-sm ${isFeatured ? 'text-slate-400' : 'text-slate-500'}`}>R$</span>
                    <span className={`text-4xl font-bold ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                      {formatBRL(plan.priceCents)}
                    </span>
                    <span className={`text-sm ${isFeatured ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
                  </div>
                  {plan.limits.extraMessagePriceCents > 0 && (
                    <p className={`text-[11px] mt-1 ${isFeatured ? 'text-slate-500' : 'text-slate-400'}`}>
                      Excedente: R$ {(plan.limits.extraMessagePriceCents / 100).toFixed(3).replace('.', ',')} / mensagem
                    </p>
                  )}
                </div>

                <Link
                  href="/register"
                  className={`block w-full text-center py-3 rounded-lg font-semibold text-sm mb-6 transition-all ${
                    isFeatured
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-indigo-600'
                  }`}
                >
                  Começar 7 dias grátis
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {features.map((feat, k) => (
                    <li key={k} className="flex items-start gap-2.5 text-sm">
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isFeatured ? 'bg-indigo-500/20' : 'bg-emerald-100'
                        }`}
                      >
                        <Check
                          size={10}
                          strokeWidth={3}
                          className={isFeatured ? 'text-indigo-300' : 'text-emerald-600'}
                        />
                      </div>
                      <span className={isFeatured ? 'text-slate-300' : 'text-slate-700'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {!loading && aiPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 border border-violet-200 rounded-2xl p-6 lg:p-8">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">Add-on Synq IA</h3>
                  <p className="text-sm text-slate-600">
                    Adicione inteligência artificial em qualquer plano. Plug & play, treinável e com tom da sua marca.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {aiPlans.map((ai) => (
                  <div
                    key={ai.id}
                    className="bg-white rounded-xl p-4 border border-violet-100 hover:border-violet-300 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-900">{ai.name}</p>
                    <p className="text-2xl font-bold text-violet-600 my-1">
                      R$ {formatBRL(ai.priceCents)}
                      <span className="text-xs text-slate-500 font-normal">/mês</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {ai.limits.maxChannels} canal{ai.limits.maxChannels > 1 ? 'is' : ''} ·{' '}
                      {formatNumber(ai.limits.maxAiMessagesPerMonth)} mensagens IA
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-sm text-slate-500">
            Precisa de algo customizado?{' '}
            <a href="mailto:contato@synq.com" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Fale com nosso time
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
