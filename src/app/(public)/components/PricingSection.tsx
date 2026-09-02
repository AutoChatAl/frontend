'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import BillingCycleSelector from '@/components/BillingCycleSelector';
import { subscriptionService } from '@/services/subscription.service';
import type { BillingCycle, Plan, PlanSlug } from '@/types/Subscription';
import { BILLING_CYCLES, DEFAULT_BILLING_CYCLE, cycleChargeSummary, planMonthlyEquivalentCents } from '@lib/billingCycles';
import { HIDDEN_FEATURES } from '@lib/featureFlags';

import { whatsappHref } from './whatsappContact';

function formatBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(n: number): string {
  if (n === -1) return 'Ilimitado';
  return n.toLocaleString('pt-BR');
}

const PLAN_META: Record<PlanSlug, { tagline: string }> = {
  impulso: {
    tagline: 'Para começar a vender no automático',
  },
  crescimento: {
    tagline: 'Para escalar atendimento e campanhas',
  },
  dominio: {
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
  const [cycle, setCycle] = useState<BillingCycle>(DEFAULT_BILLING_CYCLE);
  useEffect(() => {
    subscriptionService
      .getPlans()
      .then((p) => setPlans(p.sort((x, y) => x.sortOrder - y.sortOrder)))
      .catch(() => {});
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
    <section id="precos" className="py-24">
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
            Preço acessível e que atende desde ao pequeno comércio à grandes operações.
          </p>
          <div className="mt-7 flex flex-col items-center gap-2">
            <BillingCycleSelector value={cycle} onChange={setCycle} theme="light" />
            {BILLING_CYCLES[cycle].discountPercent > 0 && (
              <p className="text-xs text-slate-500">
                Economize {BILLING_CYCLES[cycle].discountPercent}% pagando {BILLING_CYCLES[cycle].label.toLowerCase()}
              </p>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayPlans.map((plan, i) => {
            const meta = PLAN_META[plan.slug] ?? PLAN_META.impulso;
            const isFeatured = plan.slug === featuredSlug;
            const features = buildFeatures(plan);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative flex flex-col rounded-2xl bg-white p-6 text-slate-900 lg:p-8 ${
                  isFeatured ? 'border-2 border-indigo-600' : 'border border-slate-200'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Mais escolhido
                  </span>
                )}

                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mb-5 text-sm text-slate-500">{meta.tagline}</p>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-slate-500">R$</span>
                    <span className="text-4xl font-bold text-slate-900">
                      {formatBRL(planMonthlyEquivalentCents(plan, cycle))}
                    </span>
                    <span className="text-sm text-slate-500">/mês</span>
                  </div>
                  {cycle !== 'monthly' && (
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="text-slate-400 line-through">R$ {formatBRL(plan.priceCents)}</span>{' '}
                      · {cycleChargeSummary(plan, cycle)}
                    </p>
                  )}
                  {plan.limits.extraMessagePriceCents > 0 && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Excedente: R$ {(plan.limits.extraMessagePriceCents / 100).toFixed(3).replace('.', ',')} / mensagem
                    </p>
                  )}
                </div>

                <Link
                  href="/register"
                  className="mb-6 block w-full rounded-lg bg-indigo-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Começar 7 dias grátis
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {features.map((feat, k) => (
                    <li key={k} className="flex items-start gap-2.5 text-sm">
                      <span
                        aria-hidden="true"
                        className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                      />
                      <span className="text-slate-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-sm text-slate-500">
            Precisa de algo customizado?{' '}
            <a
              href={whatsappHref(
                'Olá! Vim pelo site da Synq e queria falar sobre um plano customizado.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              Fale com nosso time
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
