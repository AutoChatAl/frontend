'use client';

import {
  CheckCircle,
  Download,
  MessageSquare,
  Megaphone,
  Reply,
  MessageCircle,
  MonitorSmartphone,
  Users,
  Contact,
  Bot,
  Plus,
  Minus,
  Crown,
  AlertTriangle,
  CreditCard,
  BarChart2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import CardPaymentModal from '@/components/CardPaymentModal';
import Modal from '@/components/Modal';
import PlanCheckoutModal from '@/components/PlanCheckoutModal';
import { useToast, ToastContainer } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService } from '@/services/subscription.service';
import type { Plan, AiPlan, Invoice, UpcomingInvoice } from '@/types/Subscription';

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function formatNumber(n: number) {
  if (n === -1) return 'Ilimitado';
  return n.toLocaleString('pt-BR');
}

export default function BillingTab() {
  const { status, usage, planName, hasAiPlan, aiPlan, plan, isTrialing, refresh } = useSubscription();
  const { toasts, addToast, removeToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [aiPlans, setAiPlans] = useState<AiPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState<UpcomingInvoice | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    subscriptionService.getInvoices().then(setInvoices).catch(() => {});
    subscriptionService.getUpcomingInvoice().then(setUpcomingInvoice).catch(() => {});
    Promise.all([subscriptionService.getPlans(), subscriptionService.getAiPlans()])
      .then(([p, a]) => { setPlans(p); setAiPlans(a); })
      .catch(() => {});
  }, []);

  const handleChangePlan = async (selectedPlan: Plan) => {
    const hasActiveSub = !!(sub?.stripeSubscriptionId?.trim());
    if (hasActiveSub && !isTrialing) {
      setLoading(true);
      try {
        const result = await subscriptionService.changePlan(selectedPlan.slug);
        if (result.success) {
          await refresh();
          setShowPlanModal(false);
        } else {
          addToast('error', result.error ?? 'Erro ao alterar plano.');
        }
      } catch (err: any) {
        addToast('error', err?.message ?? 'Erro ao alterar plano.');
      } finally {
        setLoading(false);
      }
    } else {
      setCheckoutPlan(selectedPlan);
      setShowPlanModal(false);
      setShowCheckoutModal(true);
    }
  };

  const handleAddExtra = async (type: 'instance' | 'collaborator') => {
    setLoading(true);
    try {
      const result = type === 'instance'
        ? await subscriptionService.addExtraInstance()
        : await subscriptionService.addExtraCollaborator();
      if (result.success) {
        await refresh();
      } else {
        addToast('error', result.error ?? 'Erro ao adicionar recurso extra.');
      }
    } catch (err: any) {
      addToast('error', err?.message ?? 'Erro ao adicionar recurso extra.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExtra = async (type: 'instance' | 'collaborator') => {
    setLoading(true);
    const result = type === 'instance'
      ? await subscriptionService.removeExtraInstance()
      : await subscriptionService.removeExtraCollaborator();
    if (result.success) {
      await refresh();
    } else {
      addToast('error', result.error ?? 'Erro ao remover recurso extra.');
    }
    setLoading(false);
  };

  const handleAiPlan = async (aiPlanSlug: string) => {
    setLoading(true);
    const result = await subscriptionService.addOrChangeAiPlan(aiPlanSlug);
    if (result.success) {
      await refresh();
      setShowAiModal(false);
    } else {
      addToast('error', result.error ?? 'Erro ao ativar plano de IA.');
    }
    setLoading(false);
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    const result = await subscriptionService.cancelSubscription();
    if (result.success) {
      await refresh();
      setConfirmCancel(false);
      setShowManageModal(false);
      addToast('success', 'Assinatura cancelada. Você mantém acesso até o fim do período.');
    } else {
      addToast('error', result.error ?? 'Erro ao cancelar assinatura.');
    }
    setLoading(false);
  };

  const handleReactivate = async () => {
    setLoading(true);
    const result = await subscriptionService.reactivateSubscription();
    if (result.success) {
      await refresh();
      setShowManageModal(false);
      addToast('success', 'Assinatura reativada com sucesso!');
    } else {
      addToast('error', result.error ?? 'Erro ao reativar assinatura.');
    }
    setLoading(false);
  };

  const sub = status?.subscription;
  const isPaidActive = !isTrialing && sub?.status === 'active';

  const usageItems = [
    { label: 'Mensagens', icon: MessageSquare, used: usage?.messages?.used ?? 0, limit: usage?.messages?.limit ?? 0 },
    { label: 'Campanhas', icon: Megaphone, used: usage?.campaigns?.used ?? 0, limit: usage?.campaigns?.limit ?? 0 },
    { label: 'Auto Respostas', icon: Reply, used: usage?.autoReplies?.used ?? 0, limit: usage?.autoReplies?.limit ?? 0 },
    { label: 'Instâncias', icon: MonitorSmartphone, used: usage?.instances?.used ?? 0, limit: usage?.instances?.limit ?? 0 },
    { label: 'Contatos', icon: Contact, used: usage?.contacts?.used ?? 0, limit: usage?.contacts?.limit ?? 0 },
    { label: 'Colaboradores', icon: Users, used: usage?.collaborators?.used ?? 0, limit: usage?.collaborators?.limit ?? 0 },
    { label: 'Comentários', icon: MessageCircle, used: usage?.commentAutomations?.used ?? 0, limit: usage?.commentAutomations?.limit ?? 0 },
    { label: 'Msgs IA', icon: Bot, used: usage?.aiMessages?.used ?? 0, limit: usage?.aiMessages?.limit ?? 0 },
  ];

  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider font-semibold">Plano Atual</p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-white flex items-center gap-2">
              {planName}
              {isTrialing && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Trial
                </span>
              )}
            </h3>
            {sub?.cancelAtPeriodEnd && (
              <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 text-xs">
                <AlertTriangle size={12} />
                <span>Cancela ao fim do período</span>
              </div>
            )}
          </div>
          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium self-start">
            {plan ? formatBRL(plan.priceCents) + '/mês' : 'Gratuito'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1 justify-center" onClick={() => setShowPlanModal(true)}>
            <Crown size={15} /> Alterar Plano
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setConfirmCancel(false); setShowManageModal(true); }}>
            <BarChart2 size={15} /> Gerenciar
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowCardModal(true)}>
            <CreditCard size={15} />
            {sub?.stripePaymentMethodLast4 ? `•••• ${sub.stripePaymentMethodLast4}` : 'Adicionar Cartão'}
          </Button>
        </div>
      </Card>

      {/* AI Plan Section - only for paid active subscriptions */}
      {isPaidActive && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Bot size={18} /> Plano de IA
          </h3>
          {hasAiPlan ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{aiPlan?.name ?? 'IA Incluída'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {aiPlan ? formatBRL(aiPlan.priceCents) + '/mês' : 'Incluído no plano'}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setShowAiModal(true)}>Gerenciar</Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Nenhum plano de IA ativo</p>
              <Button size="sm" onClick={() => setShowAiModal(true)}>
                <Bot size={14} /> Ativar IA
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Extra Add-ons - only for paid active subscriptions */}
      {isPaidActive && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Recursos Extras</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Instâncias Extras</p>
                <p className="text-xs text-slate-500">R$ 24,90/mês cada</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleRemoveExtra('instance')} disabled={loading || (sub?.extraInstances ?? 0) === 0}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30">
                  <Minus size={16} />
                </button>
                <span className="text-sm font-bold w-6 text-center text-slate-700 dark:text-slate-200">{sub?.extraInstances ?? 0}</span>
                <button onClick={() => handleAddExtra('instance')} disabled={loading}
                  className="p-1 rounded-lg text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-30">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Colaboradores Extras</p>
                <p className="text-xs text-slate-500">R$ 19,90/mês cada</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleRemoveExtra('collaborator')} disabled={loading || (sub?.extraCollaborators ?? 0) === 0}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30">
                  <Minus size={16} />
                </button>
                <span className="text-sm font-bold w-6 text-center text-slate-700 dark:text-slate-200">{sub?.extraCollaborators ?? 0}</span>
                <button onClick={() => handleAddExtra('collaborator')} disabled={loading}
                  className="p-1 rounded-lg text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-30">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Invoice History */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Histórico de Faturas</h3>
        <div className="space-y-2">
          {upcomingInvoice && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Próxima cobrança</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {upcomingInvoice.date ? new Date(upcomingInvoice.date).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 ml-11 sm:ml-0">
                {formatBRL(upcomingInvoice.amountCents)}
              </span>
            </div>
          )}
          {invoices.length === 0 && !upcomingInvoice ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma fatura encontrada</p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${inv.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{inv.number || inv.id.slice(-8)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {inv.date ? new Date(inv.date).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-11 sm:ml-0">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatBRL(inv.amountCents)}
                  </span>
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1">
                      <Download size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Manage Subscription Modal */}
      <Modal isOpen={showManageModal} onClose={() => setShowManageModal(false)} title="Gerenciar Assinatura" size="md">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Uso do período atual</p>
        <div className="space-y-1 mb-6">
          {usageItems.map(({ label, icon: Icon, used, limit }) => {
            const isUnlimited = limit === -1;
            const pct = isUnlimited || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
            const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500';
            return (
              <div key={label} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatNumber(used)}{isUnlimited ? '' : ` / ${formatNumber(limit)}`}
                    </span>
                  </div>
                  {!isUnlimited && limit > 0 && (
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1">
                      <div className={`h-1 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                {!isUnlimited && limit > 0 && (
                  <span className={`text-xs font-medium w-9 text-right tabular-nums ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-slate-400'}`}>{pct}%</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          {sub?.cancelAtPeriodEnd ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Assinatura cancelada{periodEnd ? ` — acesso até ${periodEnd}` : ''}.
                </p>
              </div>
              <Button onClick={handleReactivate} loading={loading} loadingText="Reativando...">
                Reativar Assinatura
              </Button>
            </div>
          ) : !confirmCancel ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">Cancela ao fim do período atual</p>
              <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>
                Cancelar assinatura
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Confirmar cancelamento?</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/70">
                  Você manterá acesso até o fim do período{periodEnd ? ` (${periodEnd})` : ''}. Após isso, todos os recursos serão bloqueados.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={handleCancelSubscription} loading={loading} loadingText="Cancelando...">
                  Sim, cancelar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmCancel(false)} disabled={loading}>
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Plan Comparison Modal */}
      <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title="Escolher Plano" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isCurrent = p.id === sub?.planId;
            return (
              <div key={p.id} className={`border rounded-xl p-4 ${isCurrent ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">{p.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{p.description}</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                  {formatBRL(p.priceCents)}<span className="text-sm font-normal text-slate-500">/mês</span>
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                  <li>• {p.limits.maxInstances} instâncias</li>
                  <li>• {p.limits.maxCampaigns} campanhas</li>
                  <li>• {formatNumber(p.limits.maxContacts)} contatos</li>
                  <li>• {formatNumber(p.limits.maxMessagesPerMonth)} msgs/mês</li>
                  <li>• {p.limits.maxAutoReplies} auto respostas</li>
                  <li>• {p.limits.maxCollaborators} colaboradores</li>
                  {p.aiIncluded && <li>• IA inclusa</li>}
                  <li>• Suporte {p.limits.supportLevel === 'vip' ? 'VIP' : '24h'}</li>
                </ul>
                {isCurrent ? (
                  <Button size="sm" className="w-full justify-center" disabled>Plano Atual</Button>
                ) : (
                  <Button size="sm" className="w-full justify-center" onClick={() => handleChangePlan(p)} disabled={loading}>
                    Escolher
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>

      {/* AI Plan Modal */}
      <Modal isOpen={showAiModal} onClose={() => setShowAiModal(false)} title="Planos de IA" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiPlans.map((ap) => {
            const isCurrent = ap.id === sub?.aiPlanId;
            return (
              <div key={ap.id} className={`border rounded-xl p-4 ${isCurrent ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">{ap.name}</h4>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 my-3">
                  {formatBRL(ap.priceCents)}<span className="text-sm font-normal text-slate-500">/mês</span>
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                  <li>• {ap.limits.maxChannels} {ap.limits.maxChannels === 1 ? 'canal' : 'canais'}</li>
                  <li>• {formatNumber(ap.limits.maxAiMessagesPerMonth)} msgs IA/mês</li>
                  <li>• Consultar agenda</li>
                  {ap.limits.schedulingBookingEnabled && <li>• Agendamento</li>}
                  <li>• {ap.limits.maxProducts === -1 ? 'Produtos ilimitados' : `${ap.limits.maxProducts} produtos`}</li>
                  <li>• Regras até {formatNumber(ap.limits.maxCustomRulesChars)} caracteres</li>
                </ul>
                {isCurrent ? (
                  <Button size="sm" className="w-full justify-center" variant="secondary" disabled>Plano Atual</Button>
                ) : (
                  <Button size="sm" className="w-full justify-center" onClick={() => handleAiPlan(ap.slug)} disabled={loading}>
                    {hasAiPlan ? 'Mudar' : 'Ativar'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Card Payment Modal */}
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onSuccess={() => refresh()}
      />

      {/* Plan Checkout Modal (card + PIX) */}
      {checkoutPlan && (
        <PlanCheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => { setShowCheckoutModal(false); setCheckoutPlan(null); }}
          plan={checkoutPlan}
          initialPersonal={{
            name: sub?.customerName ?? '',
            cpf: sub?.customerCpf ?? '',
            phone: sub?.customerPhone ?? '',
          }}
          onSuccess={() => refresh()}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
