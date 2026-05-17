'use client';

import { Bot, MessageSquare, Calendar, Package, Check, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import { useToast, ToastContainer } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService } from '@/services/subscription.service';
import type { AiPlan } from '@/types/Subscription';

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default function AiPlanGate() {
  const { refresh } = useSubscription();
  const { toasts, addToast, removeToast } = useToast();
  const [aiPlans, setAiPlans] = useState<AiPlan[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    subscriptionService.getAiPlans().then(setAiPlans).catch(() => {});
  }, []);

  const handleActivate = async (slug: string) => {
    setLoading(slug);
    const result = await subscriptionService.addOrChangeAiPlan(slug);
    if (result.success) {
      await refresh();
    } else {
      addToast('error', result.error ?? 'Erro ao ativar plano de IA.');
    }
    setLoading(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-linear-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200 dark:shadow-none">
          <Bot size={32} className="text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Desbloqueie o poder da IA para seu negócio
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Automatize respostas, qualifique leads, agende compromissos e muito mais com a inteligência artificial do Synq.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: 'Respostas Automáticas', desc: 'IA responde seus clientes 24h' },
          { icon: Sparkles, label: 'Qualificação de Leads', desc: 'Identifica e prioriza oportunidades' },
          { icon: Calendar, label: 'Agendamento', desc: 'Marca compromissos automaticamente' },
          { icon: Package, label: 'Catálogo de Produtos', desc: 'Apresenta seus produtos e serviços' },
        ].map(({ icon: Icon, label, desc }) => (
          <Card key={label} className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-2">
              <Icon size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
          </Card>
        ))}
      </div>

      {/* AI Plans */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-4">Escolha seu nível de IA</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiPlans.map((ap) => (
            <Card key={ap.id} className={`p-5 flex flex-col ${ap.slug === 'ai-nivel-2' ? 'ring-2 ring-violet-500' : ''}`}>
              {ap.slug === 'ai-nivel-2' && (
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">Recomendado</span>
              )}
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{ap.name}</h3>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 my-3">
                {formatBRL(ap.priceCents)}<span className="text-sm font-normal text-slate-500">/mês</span>
              </p>
              <ul className="space-y-2 flex-1 mb-4">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  {ap.limits.maxChannels} {ap.limits.maxChannels === 1 ? 'canal conectado' : 'canais conectados'}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  {ap.limits.maxAiMessagesPerMonth} mensagens IA
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  Consultar agenda
                </li>
                {ap.limits.schedulingBookingEnabled && (
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    Agendamento
                  </li>
                )}
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  {ap.limits.maxProducts === -1 ? 'Produtos ilimitados' : `${ap.limits.maxProducts} produtos`}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  Regras até {ap.limits.maxCustomRulesChars} caracteres
                </li>
              </ul>
              <Button
                className="w-full justify-center"
                onClick={() => handleActivate(ap.slug)}
                disabled={loading === ap.slug}
              >
                {loading === ap.slug ? 'Ativando...' : 'Ativar IA'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
