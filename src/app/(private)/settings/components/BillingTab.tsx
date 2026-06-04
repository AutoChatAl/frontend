'use client';
import { CheckCircle, Download, MessageSquare, Megaphone, Reply, MessageCircle, MonitorSmartphone, Users, Contact, Bot, Plus, Minus, Crown, AlertTriangle, CreditCard, BarChart2, Loader2, ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
  if (n === -1)
    return 'Ilimitado';
  return n.toLocaleString('pt-BR');
}
// Preço por mensagem excedente (centavos fracionados, ex.: 1.8 => R$ 0,018/msg).
function formatPricePerMsg(cents: number) {
  return `R$ ${(cents / 100).toFixed(3).replace('.', ',')}`;
}
export default function BillingTab() {
  const { status, usage, planName, hasAiPlan, aiPlan, plan, isTrialing, isCanceled, refresh, refreshAfterPurchase } = useSubscription();
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
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState<null | 'instance' | 'collaborator'>(null);
  const [confirmExtra, setConfirmExtra] = useState<{
    type: 'instance' | 'collaborator';
  } | null>(null);
  const [confirmRemoveExtra, setConfirmRemoveExtra] = useState<{
    type: 'instance' | 'collaborator';
  } | null>(null);
  const [confirmPlanChange, setConfirmPlanChange] = useState<Plan | null>(null);
  const [confirmAiPlan, setConfirmAiPlan] = useState<AiPlan | null>(null);
  const [showCancelImmediatelyModal, setShowCancelImmediatelyModal] = useState(false);
  const [regularizingCard, setRegularizingCard] = useState(false);
  const [cancelStep, setCancelStep] = useState<1 | 2>(1);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const [cancelConfirmText, setCancelConfirmText] = useState('');
  const [showCancelAiModal, setShowCancelAiModal] = useState(false);
  const reloadBilling = useCallback(async () => {
    try {
      const [inv, upcoming] = await Promise.all([
        subscriptionService.getInvoices(),
        subscriptionService.getUpcomingInvoice(),
      ]);
      setInvoices(inv);
      setUpcomingInvoice(upcoming);
    }
    catch { /* histórico é não-crítico — falha silenciosa */ }
  }, []);
  useEffect(() => {
    reloadBilling();
    Promise.all([subscriptionService.getPlans(), subscriptionService.getAiPlans()])
      .then(([p, a]) => { setPlans(p); setAiPlans(a); })
      .catch(() => { });
  }, [reloadBilling]);
  useEffect(() => {
    if (showManageModal) {
      refresh();
    }
  }, [showManageModal, refresh]);
  const handleChangePlan = (selectedPlan: Plan) => {
    const hasActiveSub = !!(sub?.stripeSubscriptionId?.trim());
    if (hasActiveSub && !isTrialing && !isCanceled) {
      setShowPlanModal(false);
      setConfirmPlanChange(selectedPlan);
    }
    else {
      setCheckoutPlan(selectedPlan);
      setShowPlanModal(false);
      setShowCheckoutModal(true);
    }
  };
  const handleConfirmPlanChange = async () => {
    if (!confirmPlanChange)
      return;
    setLoading(true);
    try {
      const result = await subscriptionService.changePlan(confirmPlanChange.slug);
      if (result.success) {
        await refresh();
        await reloadBilling();
        setConfirmPlanChange(null);
        addToast('success', `Plano alterado para ${confirmPlanChange.name} com sucesso!`);
      }
      else {
        addToast('error', result.error ?? 'Erro ao alterar plano.');
      }
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao alterar plano.');
    }
    finally {
      setLoading(false);
    }
  };
  const handleAddExtra = async (type: 'instance' | 'collaborator') => {
    setLoadingExtra(type);
    try {
      const result = type === 'instance'
        ? await subscriptionService.addExtraInstance()
        : await subscriptionService.addExtraCollaborator();
      if (result.success) {
        await refresh();
        await reloadBilling();
        addToast('success', type === 'instance' ? 'Instância extra adicionada com sucesso!' : 'Colaborador extra adicionado com sucesso!');
      }
      else {
        addToast('error', result.error ?? 'Erro ao adicionar recurso extra.');
      }
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao adicionar recurso extra.');
    }
    finally {
      setLoadingExtra(null);
    }
  };
  const handleRemoveExtra = async (type: 'instance' | 'collaborator') => {
    setLoadingExtra(type);
    try {
      const result = type === 'instance'
        ? await subscriptionService.removeExtraInstance()
        : await subscriptionService.removeExtraCollaborator();
      if (result.success) {
        await refresh();
        await reloadBilling();
        addToast('success', type === 'instance' ? 'Instância extra removida com sucesso!' : 'Colaborador extra removido com sucesso!');
      }
      else {
        addToast('error', result.error ?? 'Erro ao remover recurso extra.');
      }
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao remover recurso extra.');
    }
    finally {
      setLoadingExtra(null);
    }
  };
  const handleSelectAiPlan = (selectedAiPlan: AiPlan) => {
    setShowAiModal(false);
    setConfirmAiPlan(selectedAiPlan);
  };
  const handleConfirmAiPlan = async () => {
    if (!confirmAiPlan)
      return;
    setLoading(true);
    const result = await subscriptionService.addOrChangeAiPlan(confirmAiPlan.slug);
    if (result.success) {
      await refresh();
      await reloadBilling();
      addToast('success', hasAiPlan ? `Plano de IA alterado para ${confirmAiPlan.name} com sucesso!` : `Plano de IA ${confirmAiPlan.name} ativado com sucesso!`);
      setConfirmAiPlan(null);
    }
    else {
      addToast('error', result.error ?? 'Erro ao ativar plano de IA.');
    }
    setLoading(false);
  };
  const handleCancelAiPlan = async () => {
    setLoading(true);
    const result = await subscriptionService.removeAiPlan();
    if (result.success) {
      await refresh();
      await reloadBilling();
      setShowCancelAiModal(false);
      setShowAiModal(false);
      addToast('success', 'Plano de IA cancelado. Seu plano principal continua ativo.');
    }
    else {
      addToast('error', result.error ?? 'Erro ao cancelar plano de IA.');
    }
    setLoading(false);
  };
  const handleCancelSubscription = async () => {
    setLoading(true);
    const result = await subscriptionService.cancelSubscription();
    if (result.success) {
      await refresh();
      await reloadBilling();
      setShowManageModal(false);
      closeCancelModal();
      addToast('success', 'Assinatura cancelada com efeito imediato.');
    }
    else {
      addToast('error', result.error ?? 'Erro ao cancelar assinatura.');
    }
    setLoading(false);
  };
  useEffect(() => {
    if (!showCancelImmediatelyModal || cancelStep !== 1 || cancelCountdown === 0)
      return;
    const t = setTimeout(() => setCancelCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showCancelImmediatelyModal, cancelStep, cancelCountdown]);
  const openCancelModal = () => {
    setCancelStep(1);
    setCancelCountdown(5);
    setCancelConfirmText('');
    setShowCancelImmediatelyModal(true);
  };
  const closeCancelModal = () => {
    setShowCancelImmediatelyModal(false);
    setCancelStep(1);
    setCancelCountdown(5);
    setCancelConfirmText('');
  };
  const sub = status?.subscription;
  const isPaidActive = !isTrialing && sub?.status === 'active';
  const hasFailedPayment = sub?.status === 'failed_payment';
  const usageItems = [
    { label: 'Mensagens', icon: MessageSquare, used: usage?.messages?.used ?? 0, limit: usage?.messages?.limit ?? 0 },
    { label: 'Msgs extras', icon: MessageSquare, used: usage?.extraMessages?.used ?? 0, limit: usage?.extraMessages?.limit ?? -1 },
    { label: 'Campanhas', icon: Megaphone, used: usage?.campaigns?.used ?? 0, limit: usage?.campaigns?.limit ?? 0 },
    { label: 'Auto Respostas', icon: Reply, used: usage?.autoReplies?.used ?? 0, limit: usage?.autoReplies?.limit ?? 0 },
    { label: 'Instâncias', icon: MonitorSmartphone, used: usage?.instances?.used ?? 0, limit: usage?.instances?.limit ?? 0 },
    { label: 'Contatos', icon: Contact, used: usage?.contacts?.used ?? 0, limit: usage?.contacts?.limit ?? 0 },
    { label: 'Colaboradores', icon: Users, used: usage?.collaborators?.used ?? 0, limit: usage?.collaborators?.limit ?? 0 },
    { label: 'Comentários', icon: MessageCircle, used: usage?.commentAutomations?.used ?? 0, limit: usage?.commentAutomations?.limit ?? 0 },
    { label: 'Recuperação carrinho', icon: ShoppingCart, used: usage?.cartRecoveryIntegrations?.used ?? 0, limit: usage?.cartRecoveryIntegrations?.limit ?? 0 },
    { label: 'Msgs IA', icon: Bot, used: usage?.aiMessages?.used ?? 0, limit: usage?.aiMessages?.limit ?? 0 },
    { label: 'Msgs IA extras', icon: Bot, used: usage?.extraAiMessages?.used ?? 0, limit: usage?.extraAiMessages?.limit ?? -1 },
  ];
  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const periodStart = sub?.currentPeriodStart
    ? new Date(sub.currentPeriodStart).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  return (<div className="space-y-6">

    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <p className="text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider font-semibold">Plano Atual</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-white flex items-center gap-2">
            {isCanceled ? 'Nenhum plano ativo' : planName}
            {isTrialing && (<span className="text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
              Período de Teste
            </span>)}
            {isCanceled && (<span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
              Cancelado
            </span>)}
          </h3>
        </div>
        {!isCanceled && (<span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium self-start">
          {plan ? formatBRL(plan.priceCents) + '/mês' : 'Gratuito'}
        </span>)}
      </div>

      {hasFailedPayment && (
        <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="w-full">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Falha no pagamento da assinatura</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Identificamos falha no pagamento. Regularize a assinatura para voltar a usar todos os recursos do seu plano.
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="justify-center"
                  onClick={() => {
                    setRegularizingCard(true);
                    setShowCardModal(true);
                  }}
                >
                  <CreditCard size={14} /> Atualizar cartão
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Assinatura cancelada</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                O acesso aos recursos pagos foi encerrado. Assine um plano para criar instâncias, campanhas, canais e disparar mensagens novamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {isCanceled ? (
        <Button className="w-full justify-center" onClick={() => setShowPlanModal(true)}>
          <Crown size={15} /> Assinar novamente
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1 justify-center" onClick={() => setShowPlanModal(true)}>
            <Crown size={15} /> Alterar Plano
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowManageModal(true)}>
            <BarChart2 size={15} /> Gerenciar
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowCardModal(true)}>
            <CreditCard size={15} />
            {sub?.stripePaymentMethodLast4 ? `•••• ${sub.stripePaymentMethodLast4}` : 'Adicionar Cartão'}
          </Button>
        </div>
      )}
    </Card>

    {isPaidActive && (<Card className="p-4 sm:p-6">
      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Bot size={18} /> Plano de IA
      </h3>
      {hasAiPlan ? (<div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{aiPlan?.name ?? 'IA Incluída'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {aiPlan ? formatBRL(aiPlan.priceCents) + '/mês' : 'Incluído no plano'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={() => setShowAiModal(true)}>Gerenciar</Button>
          {aiPlan && (<Button size="sm" variant="danger" onClick={() => setShowCancelAiModal(true)}>
            Cancelar IA
          </Button>)}
        </div>
      </div>) : (<div className="text-center py-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Nenhum plano de IA ativo</p>
        <Button size="sm" onClick={() => setShowAiModal(true)}>
          <Bot size={14} /> Ativar IA
        </Button>
      </div>)}
    </Card>)}

    {isPaidActive && (<Card className="p-4 sm:p-6">
      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Recursos Extras</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Instâncias Extras</p>
            <p className="text-xs text-slate-500">R$ 24,90/mês cada</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmRemoveExtra({ type: 'instance' })} disabled={loadingExtra !== null || (sub?.extraInstances ?? 0) === 0} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30">
              {loadingExtra === 'instance' ? <Loader2 size={16} className="animate-spin" /> : <Minus size={16} />}
            </button>
            <span className="text-sm font-bold w-6 text-center text-slate-700 dark:text-slate-200">{sub?.extraInstances ?? 0}</span>
            <button onClick={() => setConfirmExtra({ type: 'instance' })} disabled={loadingExtra !== null} className="p-1 rounded-lg text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-30">
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
            <button onClick={() => setConfirmRemoveExtra({ type: 'collaborator' })} disabled={loadingExtra !== null || (sub?.extraCollaborators ?? 0) === 0} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30">
              {loadingExtra === 'collaborator' ? <Loader2 size={16} className="animate-spin" /> : <Minus size={16} />}
            </button>
            <span className="text-sm font-bold w-6 text-center text-slate-700 dark:text-slate-200">{sub?.extraCollaborators ?? 0}</span>
            <button onClick={() => setConfirmExtra({ type: 'collaborator' })} disabled={loadingExtra !== null} className="p-1 rounded-lg text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-30">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </Card>)}

    <Card className="p-4 sm:p-6">
      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Histórico de Faturas</h3>
      <div className="space-y-2">
        {upcomingInvoice && (<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
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
        </div>)}
        {invoices.length === 0 && !upcomingInvoice ? (<p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma fatura encontrada</p>) : (invoices.map((inv) => (<div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
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
            {inv.pdfUrl && (<a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1">
              <Download size={16} />
            </a>)}
          </div>
        </div>)))}
      </div>
    </Card>

    {sub && sub.status !== 'canceled' && (<Card className="p-4 sm:p-6 border border-red-200 dark:border-red-900/60">
      <h3 className="text-base font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
        <AlertTriangle size={16} /> Zona de Perigo
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Cancele sua assinatura com efeito imediato.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/40">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Cancelar plano</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            O acesso ao plano e aos recursos pagos é encerrado imediatamente.
          </p>
        </div>
        <Button variant="danger" size="sm" className="shrink-0" onClick={openCancelModal} disabled={loading}>
          Cancelar plano
        </Button>
      </div>
    </Card>)}

    <Modal isOpen={showManageModal} onClose={() => setShowManageModal(false)} title="Gerenciar Assinatura" size="md">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Uso do período atual</p>
        {periodStart && periodEnd && (<p className="text-xs text-slate-400 dark:text-slate-500">{periodStart} – {periodEnd}</p>)}
      </div>
      <div className="space-y-1 mb-6">
        {usageItems.map(({ label, icon: Icon, used, limit }) => {
          const isUnlimited = limit === -1;
          const pct = isUnlimited || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
          const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500';
          return (<div key={label} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {formatNumber(used)}{isUnlimited ? '' : ` / ${formatNumber(limit)}`}
                </span>
              </div>
              {!isUnlimited && limit > 0 && (<div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1">
                <div className={`h-1 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
              </div>)}
            </div>
            {!isUnlimited && limit > 0 && (<span className={`text-xs font-medium w-9 text-right tabular-nums ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-slate-400'}`}>{pct}%</span>)}
          </div>);
        })}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">Cancelamento com efeito imediato</p>
          <Button variant="danger" size="sm" onClick={() => {
            setShowManageModal(false);
            openCancelModal();
          }}>
            Cancelar assinatura
          </Button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title="Escolher Plano" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isCurrent = !isTrialing && !isCanceled && p.id === sub?.planId;
          return (<div key={p.id} className={`border rounded-xl p-4 ${isCurrent ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{p.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{p.description}</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
              {formatBRL(p.priceCents)}<span className="text-sm font-normal text-slate-500">/mês</span>
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
              <li>• {p.limits.maxInstances} instâncias</li>
              <li>• {p.limits.maxCampaigns} campanhas</li>
              <li>• {formatNumber(p.limits.maxContacts)} contatos</li>
              <li>• {formatNumber(p.limits.maxMessagesPerMonth)} msgs/mês <span className="text-indigo-500">*</span></li>
              <li>• {p.limits.maxAutoReplies} auto respostas</li>
              <li>• {p.limits.maxCartRecoveryIntegrations ?? 0} integraç{(p.limits.maxCartRecoveryIntegrations ?? 0) === 1 ? 'ão' : 'ões'} de recuperação</li>
              <li>• {p.limits.maxCollaborators} colaboradores</li>
              {p.aiIncluded && <li>• IA inclusa</li>}
              <li>• Suporte {p.limits.supportLevel === 'vip' ? 'VIP' : '24h'}</li>
            </ul>
            <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500 mb-3">
              <span className="text-indigo-500">*</span> Mensagens que excederem o limite mensal são cobradas como excedente: {formatPricePerMsg(p.limits.extraMessagePriceCents)}/msg.
            </p>
            {isCurrent ? (<Button size="sm" className="w-full justify-center" disabled>Plano Atual</Button>) : (<Button size="sm" className="w-full justify-center" onClick={() => handleChangePlan(p)} disabled={loading}>
              Escolher
            </Button>)}
          </div>);
        })}
      </div>
    </Modal>

    <Modal isOpen={showAiModal} onClose={() => setShowAiModal(false)} title="Planos de IA" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiPlans.map((ap) => {
          const isCurrent = ap.id === sub?.aiPlanId;
          return (<div key={ap.id} className={`border rounded-xl p-4 ${isCurrent ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{ap.name}</h4>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 my-3">
              {formatBRL(ap.priceCents)}<span className="text-sm font-normal text-slate-500">/mês</span>
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
              <li>• {ap.limits.maxChannels} {ap.limits.maxChannels === 1 ? 'canal' : 'canais'}</li>
              <li>• {formatNumber(ap.limits.maxAiMessagesPerMonth)} msgs IA/mês <span className="text-violet-500">*</span></li>
              <li>• Consultar agenda</li>
              {ap.limits.schedulingBookingEnabled && <li>• Agendamento</li>}
              <li>• {ap.limits.maxProducts === -1 ? 'Produtos ilimitados' : `${ap.limits.maxProducts} produtos`}</li>
              <li>• Regras até {formatNumber(ap.limits.maxCustomRulesChars)} caracteres</li>
            </ul>
            <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500 mb-3">
              <span className="text-violet-500">*</span> Mensagens de IA que excederem o limite mensal são cobradas como excedente: {formatPricePerMsg(ap.limits.extraAiMessagePriceCents)}/msg.
            </p>
            {isCurrent ? (<Button size="sm" className="w-full justify-center" variant="secondary" disabled>Plano Atual</Button>) : (<Button size="sm" className="w-full justify-center" onClick={() => handleSelectAiPlan(ap)} disabled={loading}>
              {hasAiPlan ? 'Mudar' : 'Ativar'}
            </Button>)}
          </div>);
        })}
      </div>
    </Modal>

    {checkoutPlan && (<PlanCheckoutModal isOpen={showCheckoutModal} onClose={() => { setShowCheckoutModal(false); setCheckoutPlan(null); }} plan={checkoutPlan} initialPersonal={{
      name: sub?.customerName ?? '',
      cpf: sub?.customerCpf ?? '',
      phone: sub?.customerPhone ?? '',
    }} onSuccess={async () => {
      await refreshAfterPurchase({
        expectPlanId: checkoutPlan.id,
        expectActive: true,
      });
      await reloadBilling();
    }} />)}

    <Modal isOpen={!!confirmExtra} onClose={() => setConfirmExtra(null)} title={confirmExtra?.type === 'instance' ? 'Adicionar instância extra?' : 'Adicionar colaborador extra?'} size="sm">
      {confirmExtra && (<div className="space-y-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            {confirmExtra.type === 'instance' ? 'Instância Extra' : 'Colaborador Extra'}
          </p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {confirmExtra.type === 'instance' ? 'R$ 24,90' : 'R$ 19,90'}
            <span className="text-sm font-normal text-slate-500">/mês</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Total após adição:{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {confirmExtra.type === 'instance'
                ? (sub?.extraInstances ?? 0) + 1
                : (sub?.extraCollaborators ?? 0) + 1}{' '}
              {confirmExtra.type === 'instance' ? 'instância(s) extra' : 'colaborador(es) extra'}
            </span>
          </p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Será cobrado o valor proporcional aos dias restantes do ciclo atual. A partir do próximo ciclo, o valor será incluído integralmente na sua fatura.
        </p>
        <div className="flex gap-2">
          <Button className="flex-1 justify-center" onClick={async () => {
            const { type } = confirmExtra;
            setConfirmExtra(null);
            await handleAddExtra(type);
          }} loading={loadingExtra !== null} loadingText="Adicionando...">
            Confirmar
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setConfirmExtra(null)} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>)}
    </Modal>

    <Modal isOpen={!!confirmRemoveExtra} onClose={() => setConfirmRemoveExtra(null)} title={confirmRemoveExtra?.type === 'instance' ? 'Remover instância extra?' : 'Remover colaborador extra?'} size="sm">
      {confirmRemoveExtra && (<div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
              Sem crédito proporcional
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 opacity-80">
              {confirmRemoveExtra.type === 'instance' ? 'A instância extra' : 'O colaborador extra'} será removido e não haverá crédito ou estorno pelo período já pago. A cobrança apenas deixa de ser incluída a partir da próxima fatura.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setConfirmRemoveExtra(null)} disabled={loadingExtra !== null}>
            Manter
          </Button>
          <Button variant="danger" className="flex-1 justify-center" onClick={async () => {
            const { type } = confirmRemoveExtra;
            setConfirmRemoveExtra(null);
            await handleRemoveExtra(type);
          }} loading={loadingExtra !== null} loadingText="Removendo...">
            Remover
          </Button>
        </div>
      </div>)}
    </Modal>

    <Modal isOpen={!!confirmPlanChange} onClose={() => setConfirmPlanChange(null)} title="Confirmar troca de plano" size="sm">
      {confirmPlanChange && (<div className="space-y-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Plano atual</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{planName}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">Novo plano</p>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {confirmPlanChange.name} — {formatBRL(confirmPlanChange.priceCents)}/mês
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-slate-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {sub?.stripePaymentMethodLast4 ? `Cartão •••• ${sub.stripePaymentMethodLast4}` : 'Nenhum cartão cadastrado'}
            </span>
          </div>
          <button onClick={() => setShowCardModal(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            {sub?.stripePaymentMethodLast4 ? 'Alterar' : 'Adicionar'}
          </button>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 justify-center" onClick={handleConfirmPlanChange} loading={loading} loadingText="Alterando...">
            Confirmar troca
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setConfirmPlanChange(null)} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>)}
    </Modal>

    <Modal isOpen={!!confirmAiPlan} onClose={() => setConfirmAiPlan(null)} title={hasAiPlan ? 'Confirmar troca de plano de IA' : 'Confirmar ativação de IA'} size="sm">
      {confirmAiPlan && (<div className="space-y-4">
        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
          {hasAiPlan && (<div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Plano atual</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{aiPlan?.name}</p>
          </div>)}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">{hasAiPlan ? 'Novo plano' : 'Plano selecionado'}</p>
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
              {confirmAiPlan.name} — {formatBRL(confirmAiPlan.priceCents)}/mês
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-slate-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {sub?.stripePaymentMethodLast4 ? `Cartão •••• ${sub.stripePaymentMethodLast4}` : 'Nenhum cartão cadastrado'}
            </span>
          </div>
          <button onClick={() => setShowCardModal(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            {sub?.stripePaymentMethodLast4 ? 'Alterar' : 'Adicionar'}
          </button>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 justify-center" onClick={handleConfirmAiPlan} loading={loading} loadingText={hasAiPlan ? 'Alterando...' : 'Ativando...'}>
            {hasAiPlan ? 'Confirmar troca' : 'Ativar IA'}
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setConfirmAiPlan(null)} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>)}
    </Modal>

    <Modal isOpen={showCancelAiModal} onClose={() => setShowCancelAiModal(false)} title="Cancelar plano de IA?" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
          <Bot size={18} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-1">
              {aiPlan?.name ?? 'Plano de IA'}{aiPlan ? ` — ${formatBRL(aiPlan.priceCents)}/mês` : ''}
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400 opacity-80">
              Seu plano principal <span className="font-semibold">{planName}</span> continua ativo. Apenas os recursos de IA serão desativados e a cobrança da IA será removida da próxima fatura.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600 dark:text-amber-400 opacity-90">
            Seus recursos de IA serão cancelados imediatamente. A cobrança deixará de ser incluída a partir da próxima fatura. Para ter acesso aos recursos de IA novamente, será necessário escolher um plano de IA ativo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowCancelAiModal(false)} disabled={loading}>
            Manter IA
          </Button>
          <Button variant="danger" className="flex-1 justify-center" onClick={handleCancelAiPlan} loading={loading} loadingText="Cancelando...">
            Cancelar plano de IA
          </Button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={showCancelImmediatelyModal && cancelStep === 1} onClose={closeCancelModal} title="Você está prestes a perder tudo isso" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ao cancelar seu plano <span className="font-semibold text-gray-700 dark:text-gray-200">{plan?.name}</span>, você perde acesso imediato a:
        </p>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {[
            { icon: <MonitorSmartphone size={16} />, label: 'Instâncias WhatsApp/Instagram', value: plan ? `${plan.limits.maxInstances} instâncias` : '—' },
            { icon: <Megaphone size={16} />, label: 'Campanhas de disparo', value: plan ? `${plan.limits.maxCampaigns} campanhas` : '—' },
            { icon: <Contact size={16} />, label: 'Contatos', value: plan ? formatNumber(plan.limits.maxContacts) : '—' },
            { icon: <Reply size={16} />, label: 'Respostas automáticas', value: plan ? `${plan.limits.maxAutoReplies} respostas` : '—' },
            { icon: <ShoppingCart size={16} />, label: 'Integrações de recuperação de carrinho', value: plan ? `${plan.limits.maxCartRecoveryIntegrations ?? 0} integraç${(plan.limits.maxCartRecoveryIntegrations ?? 0) === 1 ? 'ão' : 'ões'}` : '—' },
            { icon: <Users size={16} />, label: 'Colaboradores', value: plan ? `${plan.limits.maxCollaborators} colaboradores` : '—' },
            { icon: <MessageSquare size={16} />, label: 'Mensagens por mês', value: plan ? formatNumber(plan.limits.maxMessagesPerMonth) : '—' },
            ...(plan?.aiIncluded || hasAiPlan ? [{ icon: <Bot size={16} />, label: 'IA integrada (agente virtual)', value: 'Incluído no plano' }] : []),
          ].map((item, i) => (<div key={i} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-500">{item.icon}</span>
              {item.label}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.value}</span>
          </div>))}
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-900/15 px-3.5 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
            <p className="font-semibold">Esta ação é irreversível.</p>
            <p>
              Ao cancelar, o seu <span className="font-semibold">plano de IA também será cancelado</span> e
              {' '}<span className="font-semibold">todos os colaboradores e instâncias (canais conectados) serão removidos</span> permanentemente.
              Ao reassinar, será necessário reconvidar os colaboradores e reconectar os canais.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1 justify-center" onClick={closeCancelModal}>
            Quero manter meu plano
          </Button>
          <Button variant="danger" className="flex-1 justify-center" onClick={() => setCancelStep(2)} disabled={cancelCountdown > 0}>
            {cancelCountdown > 0 ? `Continuar (${cancelCountdown}s)` : 'Continuar mesmo assim'}
          </Button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={showCancelImmediatelyModal && cancelStep === 2} onClose={closeCancelModal} title="Confirmar cancelamento" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
              Cancelamento com efeito imediato
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 opacity-80">
              Seu acesso aos recursos pagos será encerrado assim que você confirmar.
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
            Digite <span className="font-mono font-semibold">confirmar</span> para prosseguir
          </label>
          <input type="text" value={cancelConfirmText} onChange={(e) => setCancelConfirmText(e.target.value)} placeholder="confirmar" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setCancelStep(1)} disabled={loading}>
            Voltar
          </Button>
          <Button variant="danger" className="flex-1 justify-center" onClick={handleCancelSubscription} loading={loading} loadingText="Cancelando..." disabled={cancelConfirmText !== 'confirmar'}>
            Cancelar plano
          </Button>
        </div>
      </div>
    </Modal>

    <CardPaymentModal
      isOpen={showCardModal}
      hasExistingCard={!!sub?.stripePaymentMethodLast4}
      onClose={() => {
        setShowCardModal(false);
        setRegularizingCard(false);
      }}
      onSuccess={async ({ paymentRecovered }) => {
        await refresh();
        if (regularizingCard) {
          if (paymentRecovered) {
            addToast('success', 'Pagamento regularizado e assinatura liberada com sucesso!');
          }
          else {
            addToast('success', 'Cartão atualizado com sucesso.');
          }
        }
      }}
    />

    <ToastContainer toasts={toasts} onRemove={removeToast} />
  </div>);
}
