'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import PlanCheckoutModal from '@/components/PlanCheckoutModal';
import { useToast, ToastContainer } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService } from '@/services/subscription.service';
import type { Plan } from '@/types/Subscription';

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function formatNumber(n: number) {
  if (n === -1) return 'Ilimitado';
  return n.toLocaleString('pt-BR');
}

const PLAN_ICONS: Record<string, typeof Zap> = {
  impulso: Zap,
  crescimento: Sparkles,
  dominio: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  impulso: 'from-blue-500 to-indigo-600',
  crescimento: 'from-indigo-500 to-violet-600',
  dominio: 'from-violet-500 to-purple-700',
};

export default function PlansPage() {
  const { status, isTrialing, refresh, refreshAfterPurchase } = useSubscription();
  const { toasts, addToast, removeToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    subscriptionService.getPlans().then(setPlans).catch(() => {});
  }, []);

  const handleSelect = async (plan: Plan) => {
    // Users in trial → open checkout modal with card/PIX flow
    if (isTrialing || !status?.subscription?.stripeSubscriptionId) {
      setSelectedPlan(plan);
      setShowCheckoutModal(true);
      return;
    }

    // Already subscribed → direct plan change (no payment needed)
    setLoading(plan.slug);
    const result = await subscriptionService.changePlan(plan.slug);
    if (result.success) {
      await refresh();
    } else {
      addToast('error', result.error ?? 'Erro ao alterar plano.');
    }
    setLoading(null);
  };

  const currentPlanId = status?.subscription?.planId;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Escolha seu plano</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Escale seu negócio com o plano ideal para você</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isHighlighted = plan.slug === 'crescimento';
          const Icon = PLAN_ICONS[plan.slug] ?? Sparkles;
          const gradient = PLAN_COLORS[plan.slug] ?? 'from-indigo-500 to-violet-600';

          return (
            <Card key={plan.id} className={`relative p-6 flex flex-col ${isHighlighted ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}>
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Mais Popular
                </span>
              )}

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                <Icon size={20} className="text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatBRL(plan.priceCents)}</span>
                <span className="text-sm text-slate-500">/mês</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  {plan.limits.maxWhatsappInstances} WhatsApp + {plan.limits.maxInstagramInstances} Instagram
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  {plan.limits.maxCampaigns} campanhas
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  {formatNumber(plan.limits.maxContacts)} contatos
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  {formatNumber(plan.limits.maxMessagesPerMonth)} mensagens/mês
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  {plan.limits.maxAutoReplies} auto respostas
                </li>
                {plan.limits.maxCollaborators > 0 && (
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    {plan.limits.maxCollaborators} colaboradores
                  </li>
                )}
                {plan.aiIncluded && (
                  <li className="flex items-start gap-2 text-sm text-violet-600 dark:text-violet-400 font-medium">
                    <Check size={16} className="text-violet-500 shrink-0 mt-0.5" />
                    IA Nível 1 incluída
                  </li>
                )}
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  Suporte {plan.limits.supportLevel === 'vip' ? 'VIP' : '24h'}
                </li>
              </ul>

              {isCurrent ? (
                <Button className="w-full justify-center" disabled>Plano Atual</Button>
              ) : (
                <Button
                  className="w-full justify-center"
                  variant={isHighlighted ? 'primary' : 'secondary'}
                  onClick={() => handleSelect(plan)}
                  disabled={loading === plan.slug}
                >
                  {loading === plan.slug ? 'Aguarde...' : 'Escolher Plano'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {selectedPlan && (
        <PlanCheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => { setShowCheckoutModal(false); setSelectedPlan(null); }}
          plan={selectedPlan}
          initialPersonal={{
            name: status?.subscription?.customerName ?? '',
            cpf: status?.subscription?.customerCpf ?? '',
            phone: status?.subscription?.customerPhone ?? '',
          }}
          onSuccess={async () => {
            // Poll for the new plan id / cleared trial so the UI shows the new plan
            // even before the Stripe webhook lands.
            await refreshAfterPurchase({
              expectPlanId: selectedPlan.id,
              expectActive: true,
            });
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
