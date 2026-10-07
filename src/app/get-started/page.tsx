'use client';
import { ArrowLeft, ArrowRight, Bot, Instagram, Lock, MessageCircle, MessagesSquare, PartyPopper, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import AutomationModal from '@/app/(private)/auto-replies/components/AutomationModal';
import { RECIPE_DESTINATION_LABEL, type AutomationRecipe } from '@/app/(private)/auto-replies/recipes';
import InstagramConnectCheckModal from '@/app/(private)/channels/components/InstagramConnectCheckModal';
import WhatsAppCreateModal from '@/app/(private)/channels/components/WhatsAppCreateModal';
import { useInstagramOAuthPopup } from '@/app/(private)/channels/hooks/useInstagramOAuthPopup';
import BrandLogo from '@/components/BrandLogo';
import Button from '@/components/Button';
import { ToastContainer, useToast } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWhatsAppInstances } from '@/hooks/ChannelHook';
import { useWorkspaceChannels } from '@/hooks/WorkspaceChannelsHook';
import { authService } from '@/services/auth.service';
import { channelsService } from '@/services/channels.service';
import { setupOnboardingService } from '@/services/setup-onboarding.service';
import { BUSINESS_TYPE_LABELS, type BusinessType } from '@/types/BusinessType';
import type { WhatsAppInstance } from '@/types/Channel';

import AiSetupModal from './components/AiSetupModal';
import AiTestModal from './components/AiTestModal';
import BusinessTypePicker from './components/BusinessTypePicker';
import NextSteps from './components/NextSteps';
import SetupStepCard, { type SetupStepAction } from './components/SetupStepCard';
import { useSetupProgress } from './hooks/useSetupProgress';
import { pickStarterRecipe, SETUP_STEP_TITLES } from './setupSteps';

interface RecipeModalRequest {
  recipe: AutomationRecipe;
}

const CONNECTED = 'CONNECTED';

export default function GetStartedPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { hasAiPlan, loading: subscriptionLoading } = useSubscription();

  const { instances, refetch: refetchWhatsApp, createInstance, connectInstance, deleteInstance, getStatus } = useWhatsAppInstances();
  const { channels: workspaceChannels, loading: workspaceChannelsLoading, reload: reloadChannels } = useWorkspaceChannels();

  const liveChannelDone = workspaceChannels.some((channel) => channel.status === CONNECTED)
    || instances.some((instance) => instance.status === CONNECTED);
  const hasInstagram = workspaceChannels.some((channel) => channel.type === 'INSTAGRAM' && channel.status === CONNECTED);

  const progress = useSetupProgress({ liveDone: { channel: liveChannelDone } });
  const { loading, businessType, done, completedCount, total, nextStep, refresh, markStepDone, chooseBusinessType, markFinished } = progress;

  const refetchWaRef = useRef(refetchWhatsApp);
  const reloadChannelsRef = useRef(reloadChannels);
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refetchWaRef.current = refetchWhatsApp;
    reloadChannelsRef.current = reloadChannels;
    refreshRef.current = refresh;
  });

  const [firstName, setFirstName] = useState('');
  const [changingType, setChangingType] = useState(false);
  const [savingType, setSavingType] = useState<BusinessType | null>(null);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [instagramCheckOpen, setInstagramCheckOpen] = useState(false);
  const [aiSetupOpen, setAiSetupOpen] = useState(false);
  const [aiTestOpen, setAiTestOpen] = useState(false);
  const [recipeModal, setRecipeModal] = useState<RecipeModalRequest | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const user = authService.getUser();
    setFirstName(user?.name?.trim().split(' ')[0] ?? '');
    setupOnboardingService.update({ started: true }).catch(() => {});
  }, []);

  const { connecting: connectingInstagram, start: startInstagramLogin } = useInstagramOAuthPopup({
    getOAuthUrl: async () => (await channelsService.getInstagramOAuthUrl()).url,
    onFinished: () => {
      setInstagramCheckOpen(false);
      void reloadChannelsRef.current();
    },
    onError: (message) => addToast('error', message),
  });

  const checkWhatsAppConnection = useCallback(async () => {
    const list = await channelsService.getWhatsAppInstances().catch(() => [] as WhatsAppInstance[]);
    const pending = list.filter((instance) => instance.status !== CONNECTED);
    if (pending.length > 0) {
      await Promise.all(pending.map((instance) => channelsService.getWhatsAppStatus(instance.id).catch(() => null)));
    }
    await refetchWaRef.current().catch(() => {});
  }, []);

  useEffect(() => {
    if (!waModalOpen) return;
    const interval = setInterval(() => void checkWhatsAppConnection(), 3000);
    return () => clearInterval(interval);
  }, [waModalOpen, checkWhatsAppConnection]);

  useEffect(() => {
    const onFocus = () => {
      void checkWhatsAppConnection();
      void reloadChannelsRef.current();
      void refreshRef.current();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkWhatsAppConnection]);

  const handlePickType = useCallback(async (type: BusinessType) => {
    setSavingType(type);
    const ok = await chooseBusinessType(type);
    setSavingType(null);
    if (!ok) {
      addToast('error', 'Não foi possível salvar o tipo de negócio. Tente de novo.');
      return;
    }
    setChangingType(false);
  }, [chooseBusinessType, addToast]);

  const goToDashboard = useCallback(async () => {
    if (!done.channel) return;
    setLeaving(true);
    await markFinished();
    router.push('/dashboard');
  }, [done.channel, markFinished, router]);

  const closeAiSetup = useCallback(() => {
    setAiSetupOpen(false);
    void refresh();
  }, [refresh]);

  const closeAiTest = useCallback(() => {
    setAiTestOpen(false);
  }, []);

  const handleAiReplied = useCallback(() => {
    markStepDone('ai-test');
  }, [markStepDone]);

  const openAiSetup = useCallback(() => {
    if (!subscriptionLoading && !hasAiPlan) {
      router.push('/ia');
      return;
    }
    setAiSetupOpen(true);
  }, [subscriptionLoading, hasAiPlan, router]);

  const starterRecipe = pickStarterRecipe(businessType, hasInstagram || !done.channel);

  const openRecipe = useCallback((recipe: AutomationRecipe) => {
    const { target } = recipe;
    if (target.type === 'automation') {
      setRecipeModal({ recipe });
      return;
    }
    if (target.type === 'flow') {
      router.push(`/flows?template=${encodeURIComponent(target.templateId)}`);
      return;
    }
    if (target.type === 'cart-recovery') {
      router.push('/cart-recovery');
      return;
    }
    router.push('/ia');
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-indigo-400" />
      </div>
    );
  }

  const showTypePicker = !businessType || changingType;
  const allDone = completedCount === total;
  const percent = Math.round((completedCount / total) * 100);
  const suggestInstagram = businessType === 'infoproduct';
  const aiLocked = !subscriptionLoading && !hasAiPlan;

  const whatsappAction: SetupStepAction = {
    label: 'Conectar WhatsApp',
    accent: 'emerald',
    icon: <MessageCircle size={16} />,
    outline: suggestInstagram,
    onClick: () => setWaModalOpen(true),
    ...(suggestInstagram ? {} : { hint: 'Recomendado para você' }),
  };
  const instagramAction: SetupStepAction = {
    label: connectingInstagram ? 'Abrindo o Instagram...' : 'Conectar Instagram',
    accent: 'fuchsia',
    icon: <Instagram size={16} />,
    outline: !suggestInstagram,
    loading: connectingInstagram,
    onClick: () => setInstagramCheckOpen(true),
    ...(suggestInstagram ? { hint: 'Recomendado para você' } : {}),
  };

  const recipeActions: SetupStepAction[] = starterRecipe
    ? [
      { label: 'Ativar esta automação', accent: 'amber', icon: <Zap size={16} />, onClick: () => openRecipe(starterRecipe) },
      { label: 'Ver outras ideias', accent: 'amber', outline: true, icon: <ArrowRight size={16} />, onClick: () => router.push('/auto-replies') },
    ]
    : [{ label: 'Escolher uma automação', accent: 'amber', icon: <Zap size={16} />, onClick: () => router.push('/auto-replies') }];

  const RecipeIcon = starterRecipe?.icon;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrandLogo size={22} />
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Synq</span>
          </div>
          {done.channel && !showTypePicker && (
            <button
              type="button"
              onClick={() => void goToDashboard()}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Ir para o painel <ArrowRight size={12} />
            </button>
          )}
        </div>

        {showTypePicker ? (
          <section className="mt-8 sm:mt-12">
            {changingType && (
              <button
                type="button"
                onClick={() => setChangingType(false)}
                className="mb-4 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                <ArrowLeft size={12} /> Voltar aos primeiros passos
              </button>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {firstName ? `Olá, ${firstName}!` : 'Olá!'}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Qual é o seu tipo de negócio?</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
              Assim mostramos os passos e as automações que mais ajudam você a vender. Dá para trocar depois.
            </p>
            <div className="mt-6">
              <BusinessTypePicker value={businessType} saving={savingType} onPick={(type) => void handlePickType(type)} />
            </div>
          </section>
        ) : (
          <>
            <header className="mt-8">
              {allDone ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <PartyPopper size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                      Tudo pronto{firstName ? `, ${firstName}` : ''}!
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                      {aiLocked
                        ? 'Seu canal está conectado e a primeira automação já está ativa.'
                        : 'Seu canal está conectado, a IA conhece o seu negócio e a primeira automação já está ativa.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                    Bem-vindo{firstName ? `, ${firstName}` : ''}!
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                    Em {total} passos rápidos o Synq começa a atender e vender por você. Comece conectando um canal.
                  </p>
                </>
              )}
              {businessType && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Passos pensados para: <span className="font-semibold text-slate-700 dark:text-slate-200">{BUSINESS_TYPE_LABELS[businessType]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setChangingType(true)}
                    className="cursor-pointer font-medium text-indigo-600 underline-offset-2 transition-colors hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Trocar tipo de negócio
                  </button>
                </p>
              )}
            </header>

            <div className="mt-6" role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={total} aria-label="Progresso dos primeiros passos">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{completedCount} de {total} concluídos</span>
                <span>{percent}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SetupStepCard
                step={1}
                icon={<MessagesSquare size={22} />}
                accent="emerald"
                title={SETUP_STEP_TITLES.channel}
                description="Um canal basta para começar. É por ele que a IA e as automações vão conversar com seus clientes."
                done={done.channel}
                current={nextStep === 'channel'}
                actions={suggestInstagram ? [instagramAction, whatsappAction] : [whatsappAction, instagramAction]}
                doneHint="Pronto! Seu canal está conectado e já pode receber mensagens."
                doneAction={{ label: 'Conectar outro canal', onClick: () => router.push('/channels') }}
              />

              <SetupStepCard
                step={2}
                icon={<Bot size={22} />}
                accent="violet"
                title={SETUP_STEP_TITLES.ai}
                description="Responda 3 perguntas rápidas: o que você vende, o horário de atendimento e onde estão os preços. A IA usa isso para atender sozinha."
                done={done.ai}
                current={nextStep === 'ai'}
                actions={[{
                  label: aiLocked ? 'Conhecer a IA' : 'Responder as perguntas',
                  accent: 'violet',
                  icon: <Sparkles size={16} />,
                  onClick: openAiSetup,
                }]}
                doneHint="A IA já conhece o seu negócio. Você pode ajustar as respostas quando quiser."
                doneAction={{ label: 'Revisar as respostas', onClick: openAiSetup }}
              >
                {aiLocked && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Lock size={12} /> Seu plano ainda não inclui a IA. Toque no botão para ver como ativar.
                  </p>
                )}
              </SetupStepCard>

              <SetupStepCard
                step={3}
                icon={<MessageCircle size={22} />}
                accent="indigo"
                title={SETUP_STEP_TITLES['ai-test']}
                description="Faça de conta que é um cliente e veja como a IA responde. Nada é enviado para ninguém."
                done={done['ai-test']}
                current={nextStep === 'ai-test'}
                locked={aiLocked}
                lockedHint="Disponível quando a IA estiver ativa no seu plano."
                actions={[{ label: 'Testar a IA', accent: 'indigo', icon: <MessageCircle size={16} />, onClick: () => setAiTestOpen(true) }]}
                doneHint="Você já viu a IA em ação. Teste de novo sempre que mudar as respostas."
                doneAction={{ label: 'Testar de novo', onClick: () => setAiTestOpen(true) }}
              />

              <SetupStepCard
                step={4}
                icon={<Zap size={22} />}
                accent="amber"
                title={SETUP_STEP_TITLES.recipe}
                description="Escolhemos uma automação pronta para o seu tipo de negócio. É só revisar e salvar."
                done={done.recipe}
                current={nextStep === 'recipe'}
                locked={!done.channel}
                lockedHint="Conecte um canal no passo 1 para liberar."
                actions={recipeActions}
                doneHint="Sua primeira automação já está funcionando."
                doneAction={{ label: 'Ver minhas automações', onClick: () => router.push('/auto-replies') }}
              >
                {!done.recipe && starterRecipe && RecipeIcon && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 dark:bg-slate-800 dark:text-amber-400">
                      <RecipeIcon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {starterRecipe.title}
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                          {RECIPE_DESTINATION_LABEL[starterRecipe.target.type]}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{starterRecipe.description}</p>
                    </div>
                  </div>
                )}
              </SetupStepCard>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                onClick={() => void goToDashboard()}
                variant="primary"
                size="lg"
                loading={leaving}
                loadingText="Abrindo o painel..."
                disabled={!done.channel}
                icon={<ArrowRight size={16} />}
                className="w-full justify-center sm:w-auto"
              >
                Ir para o painel
              </Button>
              {!done.channel ? (
                <p className="inline-flex items-center gap-1.5 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Lock size={12} /> Conecte o WhatsApp ou o Instagram para continuar.
                </p>
              ) : (
                !allDone && (
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Os passos que faltam continuam aqui. Você pode voltar pelo painel a qualquer momento.
                  </p>
                )
              )}
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-700">
              <NextSteps businessType={businessType} />
            </div>
          </>
        )}
      </div>

      {waModalOpen && (
        <WhatsAppCreateModal
          isOpen={waModalOpen}
          onClose={() => {
            setWaModalOpen(false);
            void checkWhatsAppConnection();
            void reloadChannels();
          }}
          onCreate={createInstance}
          onConnect={connectInstance}
          onDelete={deleteInstance}
          onCheckStatus={getStatus}
        />
      )}

      <InstagramConnectCheckModal
        isOpen={instagramCheckOpen}
        onClose={() => setInstagramCheckOpen(false)}
        onContinue={() => void startInstagramLogin()}
        loading={connectingInstagram}
      />

      {aiSetupOpen && <AiSetupModal onClose={closeAiSetup} />}

      {aiTestOpen && <AiTestModal onClose={closeAiTest} onReplied={handleAiReplied} />}

      {recipeModal && recipeModal.recipe.target.type === 'automation' && (
        <AutomationModal
          isOpen
          kind={recipeModal.recipe.target.kind}
          initialDraft={recipeModal.recipe.target.draft}
          requireLink={recipeModal.recipe.target.requiresLink}
          messagePlaceholder={recipeModal.recipe.target.messagePlaceholder}
          intro={recipeModal.recipe.target.note}
          title={recipeModal.recipe.title}
          channels={workspaceChannels}
          channelsLoading={workspaceChannelsLoading}
          onClose={() => setRecipeModal(null)}
          onSuccess={() => {
            setRecipeModal(null);
            markStepDone('recipe');
            addToast('success', 'Automação criada e ativada!');
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
