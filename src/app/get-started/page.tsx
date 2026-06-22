'use client';
import { Bot, Instagram, Lock, MessageCircle, MessageSquare, PartyPopper, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import CreateAutoReplyModal from '@/app/(private)/auto-replies/components/CreateAutoReplyModal';
import CreateCampaignModal from '@/app/(private)/campaigns/components/CreateCampaignModal';
import WhatsAppCreateModal from '@/app/(private)/channels/components/WhatsAppCreateModal';
import CreateCommentAutomationModal from '@/app/(private)/comment-automations/components/CreateCommentAutomationModal';
import Button from '@/components/Button';
import { ToastContainer, useToast } from '@/components/Toast';
import { useInstagramAccounts, useWhatsAppInstances } from '@/hooks/ChannelHook';
import { authService } from '@/services/auth.service';
import { autoReplyService } from '@/services/auto-reply.service';
import { campaignService } from '@/services/campaign.service';
import { channelsService } from '@/services/channels.service';
import { commentAutomationService } from '@/services/comment-automation.service';
import { setupOnboardingService } from '@/services/setup-onboarding.service';
import type { WhatsAppInstance } from '@/types/Channel';

import SetupStepCard, { type SetupStepAccent, type SetupStepStatus } from './components/SetupStepCard';

interface StepDef {
  id: string;
  accent: SetupStepAccent;
  icon: ReactNode;
  title: string;
  description: string;
  done: boolean;
  actionLabel: string;
  onAction: () => void;
  canSkip?: boolean;
  locked?: boolean;
  lockedHint?: string;
  actionLoading?: boolean;
}

export default function GetStartedPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const { instances, refetch: refetchWhatsApp, createInstance, connectInstance } = useWhatsAppInstances();
  const { accounts, refetch: refetchInstagram, getOAuthUrl } = useInstagramAccounts();

  const refetchWaRef = useRef(refetchWhatsApp);
  const refetchIgRef = useRef(refetchInstagram);
  useEffect(() => {
    refetchWaRef.current = refetchWhatsApp;
    refetchIgRef.current = refetchInstagram;
  });

  const [checking, setChecking] = useState(true);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [persisted, setPersisted] = useState<Set<string>>(new Set());
  const [firstName, setFirstName] = useState('');

  const [autoReplyCount, setAutoReplyCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);

  const [waModalOpen, setWaModalOpen] = useState(false);
  const [autoReplyModalOpen, setAutoReplyModalOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadAutomations = useCallback(async () => {
    const [autoReplies, comments, campaigns] = await Promise.all([
      autoReplyService.list().catch(() => []),
      commentAutomationService.list().catch(() => []),
      campaignService.listCampaigns().catch(() => []),
    ]);
    setAutoReplyCount(autoReplies.length);
    setCommentCount(comments.length);
    setCampaignCount(campaigns.length);
  }, []);

  useEffect(() => {
    const user = authService.getUser();
    setFirstName(user?.name?.trim().split(' ')[0] ?? '');

    let cancelled = false;
    (async () => {
      const state = await setupOnboardingService.fetch();
      if (cancelled) return;
      if (state.finishedAt) {
        router.replace('/dashboard');
        return;
      }
      setSkipped(new Set(state.skippedSteps));
      setPersisted(new Set(state.completedSteps));
      setChecking(false);
      setupOnboardingService.update({ started: true }).catch(() => {});
    })();
    void loadAutomations();
    return () => {
      cancelled = true;
    };
  }, [router, loadAutomations]);

  const whatsappDone = instances.some((i) => i.status === 'CONNECTED');
  const instagramDone = accounts.some((a) => a.status === 'CONNECTED');
  const autoReplyDone = autoReplyCount > 0;
  const commentDone = commentCount > 0;
  const campaignDone = campaignCount > 0;
  const hasAnyChannel = whatsappDone || instagramDone;

  useEffect(() => {
    const doneById: Record<string, boolean> = {
      whatsapp: whatsappDone,
      instagram: instagramDone,
      'auto-reply': autoReplyDone,
      'comment-automation': commentDone,
      campaign: campaignDone,
    };
    const newlyDone = Object.keys(doneById).filter((id) => doneById[id] && !persisted.has(id));
    if (newlyDone.length === 0) return;
    setPersisted((prev) => new Set([...prev, ...newlyDone]));
    setSkipped((prev) => {
      if (!newlyDone.some((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      newlyDone.forEach((id) => next.delete(id));
      return next;
    });
    newlyDone.forEach((id) => {
      setupOnboardingService.update({ completeStep: id }).catch(() => {});
    });
  }, [whatsappDone, instagramDone, autoReplyDone, commentDone, campaignDone, persisted]);

  const handleSkip = useCallback((id: string) => {
    setSkipped((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setupOnboardingService.update({ skipStep: id }).catch(() => {});
  }, []);

  const handleConnectInstagram = useCallback(async () => {
    try {
      setConnectingInstagram(true);
      const url = await getOAuthUrl();
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(url, 'Instagram OAuth', `width=${width},height=${height},left=${left},top=${top}`);
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setConnectingInstagram(false);
          void refetchInstagram();
        }
      }, 500);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao conectar com Instagram. Tente novamente.');
      setConnectingInstagram(false);
    }
  }, [getOAuthUrl, refetchInstagram, addToast]);

  const goToDashboard = useCallback(async () => {
    if (!hasAnyChannel) return;
    setLeaving(true);
    await setupOnboardingService.update({ finished: true }).catch(() => {});
    router.push('/dashboard');
  }, [hasAnyChannel, router]);

  const checkWhatsAppConnection = useCallback(async () => {
    const list = await channelsService.getWhatsAppInstances().catch(() => [] as WhatsAppInstance[]);
    const pending = list.filter((i) => i.status !== 'CONNECTED');
    if (pending.length > 0) {
      await Promise.all(pending.map((i) => channelsService.getWhatsAppStatus(i.id).catch(() => null)));
    }
    await refetchWaRef.current().catch(() => {});
  }, []);

  useEffect(() => {
    if (!waModalOpen) return;
    const interval = setInterval(() => void checkWhatsAppConnection(), 3000);
    return () => clearInterval(interval);
  }, [waModalOpen, checkWhatsAppConnection]);

  useEffect(() => {
    if (whatsappDone && waModalOpen) setWaModalOpen(false);
  }, [whatsappDone, waModalOpen]);

  useEffect(() => {
    const onFocus = () => {
      void checkWhatsAppConnection();
      void refetchIgRef.current().catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkWhatsAppConnection]);

  const steps: StepDef[] = [
    {
      id: 'whatsapp',
      accent: 'emerald',
      icon: <MessageCircle size={22} />,
      title: 'Conecte seu WhatsApp',
      description: 'Escaneie um QR Code e comece a atender, automatizar respostas e disparar campanhas pelo WhatsApp.',
      done: whatsappDone,
      canSkip: false,
      actionLabel: 'Conectar WhatsApp',
      onAction: () => setWaModalOpen(true),
    },
    {
      id: 'instagram',
      accent: 'fuchsia',
      icon: <Instagram size={22} />,
      title: 'Conecte seu Instagram',
      description: 'Faça login com sua conta para responder DMs e automatizar comentários e mensagens diretas.',
      done: instagramDone,
      canSkip: false,
      actionLabel: connectingInstagram ? 'Abrindo...' : 'Conectar Instagram',
      actionLoading: connectingInstagram,
      onAction: () => void handleConnectInstagram(),
    },
    {
      id: 'auto-reply',
      accent: 'indigo',
      icon: <Bot size={22} />,
      title: 'Crie uma resposta automática',
      description: 'Responda na hora quando alguém enviar uma palavra-chave no seu WhatsApp ou Instagram.',
      done: autoReplyDone,
      locked: !hasAnyChannel,
      lockedHint: 'Conecte um canal acima para liberar esta etapa.',
      actionLabel: 'Criar resposta automática',
      onAction: () => setAutoReplyModalOpen(true),
    },
    {
      id: 'comment-automation',
      accent: 'violet',
      icon: <MessageSquare size={22} />,
      title: 'Automatize comentários do Instagram',
      description: 'Responda comentários e envie uma DM automática quando alguém comentar com uma palavra-chave.',
      done: commentDone,
      locked: !instagramDone,
      lockedHint: 'Conecte o Instagram para liberar esta etapa.',
      actionLabel: 'Criar automação',
      onAction: () => setCommentModalOpen(true),
    },
    {
      id: 'campaign',
      accent: 'amber',
      icon: <Send size={22} />,
      title: 'Crie sua primeira campanha',
      description: 'Envie uma mensagem para vários contatos do WhatsApp de uma vez, agora ou de forma agendada.',
      done: campaignDone,
      locked: !whatsappDone,
      lockedHint: 'Conecte o WhatsApp para liberar esta etapa.',
      actionLabel: 'Criar campanha',
      onAction: () => setCampaignModalOpen(true),
    },
  ];

  const total = steps.length;
  const completedCount = steps.filter((s) => s.done).length;
  const progress = Math.round((completedCount / total) * 100);
  const allDone = completedCount === total;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles size={18} />
          <span className="text-sm font-bold tracking-tight">Synq</span>
        </div>

        <header className="mt-8">
          {allDone ? (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <PartyPopper size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  Tudo pronto{firstName ? `, ${firstName}` : ''}!
                </h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  Você concluiu os primeiros passos. Agora é só começar a usar.
                </p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Bem-vindo{firstName ? `, ${firstName}` : ''}!
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Conecte pelo menos um canal (WhatsApp ou Instagram) para continuar. Os demais passos são
                opcionais — você pode configurá-los quando quiser pelo menu.
              </p>
            </>
          )}
        </header>

        {!allDone && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>
                {completedCount} de {total} concluídos
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {steps.map((step) => {
            const status: SetupStepStatus = step.done ? 'done' : skipped.has(step.id) ? 'skipped' : 'pending';
            return (
              <SetupStepCard
                key={step.id}
                icon={step.icon}
                accent={step.accent}
                title={step.title}
                description={step.description}
                status={status}
                actionLabel={step.actionLabel}
                onAction={step.onAction}
                onSkip={() => handleSkip(step.id)}
                canSkip={step.canSkip ?? true}
                locked={step.locked ?? false}
                {...(step.lockedHint ? { lockedHint: step.lockedHint } : {})}
                actionLoading={step.actionLoading ?? false}
              />
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            onClick={() => void goToDashboard()}
            variant="primary"
            size="lg"
            loading={leaving}
            loadingText="Abrindo painel..."
            disabled={!hasAnyChannel}
          >
            Ir para o painel
          </Button>
          {!hasAnyChannel ? (
            <p className="inline-flex items-center gap-1.5 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
              <Lock size={12} /> Conecte o WhatsApp ou o Instagram para continuar.
            </p>
          ) : (
            !allDone && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Os demais passos são opcionais e continuam disponíveis no menu a qualquer momento.
              </p>
            )
          )}
        </div>
      </div>

      {waModalOpen && (
        <WhatsAppCreateModal
          isOpen={waModalOpen}
          onClose={() => {
            setWaModalOpen(false);
            void checkWhatsAppConnection();
          }}
          onCreate={createInstance}
          onConnect={connectInstance}
        />
      )}

      <CreateAutoReplyModal
        isOpen={autoReplyModalOpen}
        onClose={() => setAutoReplyModalOpen(false)}
        onSuccess={() => void loadAutomations()}
      />

      <CreateCommentAutomationModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        onSuccess={() => void loadAutomations()}
      />

      <CreateCampaignModal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onSuccess={() => void loadAutomations()}
        addToast={addToast}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
