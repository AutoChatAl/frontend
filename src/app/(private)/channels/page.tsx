'use client';
import { ArrowUpRight, BadgeCheck, CircleHelp, Instagram, MessageCircle, RefreshCw, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import Callout from '@/components/Callout';
import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Modal from '@/components/Modal';
import { ToastContainer, useToast } from '@/components/Toast';
import { useChannelStatus } from '@/contexts/ChannelStatusContext';
import { hasPermission } from '@/contexts/SidebarContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useInstagramAccounts, useWhatsAppInstances } from '@/hooks/ChannelHook';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useWhatsAppOfficialInstances, useWhatsAppOfficialSignup } from '@/hooks/WhatsAppOfficialHook';
import { channelsService } from '@/services/channels.service';
import type { ChannelMessageStats } from '@/types/Channel';

import ChannelTypeCard, { type ChannelRow } from './components/ChannelTypeCard';
import ExtraInstancesCard from './components/ExtraInstancesCard';
import InstagramConnectCheckModal from './components/InstagramConnectCheckModal';
import RenameChannelModal from './components/RenameChannelModal';
import WhatsAppCreateModal from './components/WhatsAppCreateModal';
import WhatsAppKindChooser from './components/WhatsAppKindChooser';
import WhatsAppQRModal from './components/WhatsAppQRModal';
import { useInstagramOAuthPopup } from './hooks/useInstagramOAuthPopup';

type ChannelKind = 'whatsapp' | 'whatsapp-official' | 'instagram';

interface ChannelTarget {
    kind: ChannelKind;
    id: string;
    name: string;
    hint: string;
}

const QUALITY_LABELS: Record<string, string> = {
  GREEN: 'Qualidade alta',
  YELLOW: 'Qualidade média',
  RED: 'Qualidade baixa',
  UNKNOWN: 'Qualidade pendente',
};

interface QrTarget {
    id: string;
    phoneNumber?: string | undefined;
}

function hasExpired(isoDate: string | null | undefined): boolean {
  if (!isoDate) {
    return false;
  }
  const time = new Date(isoDate).getTime();
  return !Number.isNaN(time) && time < Date.now();
}

/** Travessão enquanto o resumo não chega — zero seria uma informação falsa. */
function formatStat(value: number | undefined): string {
  return value === undefined ? '—' : value.toLocaleString('pt-BR');
}

interface StatProps {
    label: string;
    value: ReactNode;
    hint: string;
    /** Link opcional no fim da linha do hint. */
    action?: ReactNode;
}

/**
 * Mesma anatomia do MetricCard do dashboard: título em negrito no topo e o
 * número ancorado embaixo, para os valores alinharem mesmo com títulos de
 * alturas diferentes.
 */
function Stat({ label, value, hint, action }: StatProps) {
  return (<Card className="p-3 sm:p-3.5 min-w-0 flex flex-col">
    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{label}</p>
    <div className="mt-auto pt-2">
      <p className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
      <div className="mt-0.5 flex items-center justify-between gap-2 min-w-0">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{hint}</p>
        {action}
      </div>
    </div>
  </Card>);
}

export default function ChannelsPage() {
  // A página serve dois grupos de canais com permissões distintas: WhatsApp por
  // QR Code e Instagram sob `channels`, API Oficial sob `whatsapp-official`.
  // Quem tem só uma delas vê só os cards correspondentes, em vez de tomar 403.
  // Resolvido antes dos hooks de dados porque eles usam isso para decidir se
  // buscam — e via useAuthUser para acompanhar o /me, não um cache congelado.
  const user = useAuthUser();
  const canManage = hasPermission(user, 'channels');
  const canSeeOfficial = hasPermission(user, 'whatsapp-official');
  const {
    instances,
    loading: loadingWhats,
    createInstance,
    connectInstance,
    disconnectInstance,
    renameInstance,
    getQRCode,
    getStatus,
    deleteInstance,
    refetch: refetchWhatsList,
  } = useWhatsAppInstances({ enabled: canManage });
  const {
    instances: officialInstances,
    loading: loadingOfficial,
    error: officialError,
    refetch: refetchOfficial,
    deleteInstance: deleteOfficial,
    renameInstance: renameOfficial,
    refreshHealth: refreshOfficialHealth,
  } = useWhatsAppOfficialInstances({ enabled: canSeeOfficial });
  const {
    accounts,
    loading: loadingInstagram,
    deleteAccount,
    renameAccount,
    getOAuthUrl,
    refetch: refetchInstagramList,
  } = useInstagramAccounts({ enabled: canManage });
  const { refetchWhatsApp, refetchInstagram } = useChannelStatus();
  const { isInactive, status, usage } = useSubscription();
  const { toasts, addToast, removeToast } = useToast();
  const [messageStats, setMessageStats] = useState<ChannelMessageStats | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);
  const [modeChooserOpen, setModeChooserOpen] = useState(false);
  const [kindChooserOpen, setKindChooserOpen] = useState(false);
  const [instagramCheckOpen, setInstagramCheckOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ChannelTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelTarget | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { connecting: connectingOfficial, connect: connectOfficial } = useWhatsAppOfficialSignup({
    instanceCount: officialInstances.length,
    onSuccess: refetchOfficial,
    onToast: addToast,
    blocked: isInactive,
  });

  const loadMessageStats = useCallback(async () => {
    try {
      setMessageStats(await channelsService.getMessageStats(7));
    }
    catch {
      // O resumo é acessório: se falhar, os cards mostram travessão e a página segue.
      setMessageStats(null);
    }
  }, []);

  useEffect(() => {
    loadMessageStats();
  }, [loadMessageStats]);

  const whatsappRows = useMemo<ChannelRow[]>(() => instances.map((instance) => {
    const connected = instance.status === 'CONNECTED';
    const connecting = instance.status === 'CONNECTING';
    const number = instance.number || 'Número ainda não conectado';
    return {
      id: instance.id,
      name: instance.name,
      subtitle: connecting
        ? 'Conectando...'
        : connected ? number : `${number} · Desconectado`,
      connected,
      ownerName: instance.ownerName ?? null,
      canManage: instance.canManage ?? true,
      statusLabel: connecting ? 'Conectando' : 'Desconectado',
      attention: !connected && !connecting,
    };
  }), [instances]);

  const officialRows = useMemo<ChannelRow[]>(() => officialInstances.map((instance) => {
    const config = instance.whatsappOfficial;
    const quality = QUALITY_LABELS[config.qualityRating ?? 'UNKNOWN'] ?? 'Qualidade pendente';
    return {
      id: instance.id,
      name: config.verifiedName || instance.name,
      subtitle: `${config.displayPhoneNumber || 'Número oficial'} · ${quality}`,
      connected: instance.status === 'CONNECTED',
      ownerName: instance.ownerName ?? null,
      canManage: instance.canManage ?? true,
    };
  }), [officialInstances]);

  const instagramRows = useMemo<ChannelRow[]>(() => accounts.map((account) => {
    const { username, tokenExpiresAt } = account.instagram;
    const expired = hasExpired(tokenExpiresAt);
    const connected = account.status === 'CONNECTED' && !expired;
    const handle = username ? `@${username}` : 'Perfil sem @ informado';
    const statusLabel = expired ? 'Acesso expirado' : 'Desconectado';
    return {
      id: account.id,
      name: account.name || username || 'Conta do Instagram',
      subtitle: connected ? handle : `${handle} · ${statusLabel}`,
      connected,
      ownerName: account.ownerName ?? null,
      canManage: account.canManage ?? true,
      statusLabel,
      attention: !connected,
    };
  }), [accounts]);

  const allRows = [...whatsappRows, ...officialRows, ...instagramRows];
  // `maxTotalInstances` é a cota do workspace inteiro, somando os três tipos de
  // canal. Como esta página agora mostra só os tipos que a pessoa tem permissão
  // de ver, contar as linhas visíveis diria "1/5" num workspace lotado. O uso
  // vem do backend (`usage.instances`), que enxerga tudo; as linhas visíveis
  // servem só de fallback enquanto o resumo não carregou.
  const seesEveryChannelType = canManage && canSeeOfficial;
  const visibleConnectedCount = allRows.filter((row) => row.connected).length;
  const activeCount = seesEveryChannelType
    ? visibleConnectedCount
    : (usage?.instances?.used ?? visibleConnectedCount);
  const channelLimit = status?.limits?.maxTotalInstances ?? 0;
  const statsHint = messageStats ? `últimos ${messageStats.days} dias` : 'carregando...';
  const hasWhatsAppChoice = canManage || canSeeOfficial;
  const whatsAppListsReady = (!canManage || !loadingWhats) && (!canSeeOfficial || !loadingOfficial);
  const showInlineChooser = hasWhatsAppChoice && whatsAppListsReady && whatsappRows.length === 0 && officialRows.length === 0;

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchWhatsList(),
        refetchOfficial(),
        refetchInstagramList(),
        refetchWhatsApp(),
        refetchInstagram(),
        loadMessageStats(),
      ]);
    }
    finally {
      setRefreshing(false);
    }
  }, [refetchWhatsList, refetchOfficial, refetchInstagramList, refetchWhatsApp, refetchInstagram, loadMessageStats]);

  const guardSubscription = () => {
    if (isInactive) {
      addToast('error', 'Sua assinatura está inativa. Reative seu plano para gerenciar canais.');
      return false;
    }
    return true;
  };

  const handleAddWhatsApp = () => {
    if (guardSubscription()) {
      setShowCreateModal(true);
    }
  };

  const handleAddOfficial = () => {
    if (guardSubscription()) {
      setModeChooserOpen(true);
    }
  };

  const pickFromKindChooser = (action: () => void) => () => {
    setKindChooserOpen(false);
    action();
  };

  const { connecting: connectingInstagram, start: startInstagramLogin } = useInstagramOAuthPopup({
    getOAuthUrl,
    onFinished: () => {
      refetchInstagramList();
      refetchInstagram();
    },
    onError: (message) => addToast('error', message),
  });

  const handleConnectInstagram = () => {
    if (guardSubscription()) {
      setInstagramCheckOpen(true);
    }
  };

  const handleInstagramCheckContinue = () => {
    setInstagramCheckOpen(false);
    void startInstagramLogin();
  };

  /** Reabre a sessão do canal e mostra o QR — é o mesmo caminho de um canal novo. */
  const handleActivateWhatsApp = async (row: ChannelRow) => {
    if (!guardSubscription()) {
      return;
    }
    setBusyId(row.id);
    try {
      await connectInstance(row.id);
      setQrTarget({ id: row.id, phoneNumber: instances.find((item) => item.id === row.id)?.number });
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível reconectar o WhatsApp.');
    }
    finally {
      setBusyId(null);
    }
  };

  const handleDeactivateWhatsApp = async (row: ChannelRow) => {
    setBusyId(row.id);
    try {
      await disconnectInstance(row.id);
      await refetchWhatsApp();
      addToast('success', `${row.name} foi desativado. A conexão pode ser refeita a qualquer momento.`);
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível desativar o canal.');
    }
    finally {
      setBusyId(null);
    }
  };

  const handleRefreshOfficial = async (row: ChannelRow) => {
    setBusyId(row.id);
    try {
      await refreshOfficialHealth(row.id);
      addToast('success', 'Dados do número atualizados.');
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível atualizar os dados do número.');
    }
    finally {
      setBusyId(null);
    }
  };

  const handleRenameConfirm = async (name: string) => {
    if (!renameTarget) {
      return;
    }
    setRenaming(true);
    try {
      if (renameTarget.kind === 'whatsapp') {
        await renameInstance(renameTarget.id, name);
        await refetchWhatsApp();
      }
      else if (renameTarget.kind === 'whatsapp-official') {
        await renameOfficial(renameTarget.id, name);
      }
      else {
        await renameAccount(renameTarget.id, name);
        await refetchInstagram();
      }
      addToast('success', 'Nome atualizado.');
      setRenameTarget(null);
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível renomear o canal.');
    }
    finally {
      setRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'whatsapp') {
        await deleteInstance(deleteTarget.id);
        await refetchWhatsApp();
      }
      else if (deleteTarget.kind === 'whatsapp-official') {
        await deleteOfficial(deleteTarget.id);
      }
      else {
        await deleteAccount(deleteTarget.id);
        await refetchInstagram();
      }
      addToast('success', `${deleteTarget.name} foi removido do workspace.`);
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Não foi possível remover o canal.');
    }
    finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openRename = (kind: ChannelKind) => (row: ChannelRow) => {
    setRenameTarget({ kind, id: row.id, name: row.name, hint: row.subtitle });
  };

  const openDelete = (kind: ChannelKind) => (row: ChannelRow) => {
    setDeleteTarget({ kind, id: row.id, name: row.name, hint: row.subtitle });
  };

  const renderInstagramAvatar = (row: ChannelRow) => {
    const account = accounts.find((item) => item.id === row.id);
    const pictureUrl = account?.instagram.profilePictureUrl;
    return (<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-[6px] bg-white dark:bg-slate-800">
        {pictureUrl ? (<Image src={pictureUrl} alt={row.name} width={36} height={36} className="h-full w-full object-cover"/>) : (<User size={15} className="text-slate-400 dark:text-slate-500"/>)}
      </span>
    </span>);
  };

  const deleteMessages: Record<ChannelKind, string> = {
    whatsapp: `Remover "${deleteTarget?.name ?? ''}" apaga esta conexão, os contatos trazidos por ela e as respostas automáticas ligadas a ela. Esta ação não pode ser desfeita.`,
    'whatsapp-official': `Desconectar "${deleteTarget?.name ?? ''}" tira o número do Synq e apaga daqui os modelos de mensagem dele (na sua conta da Meta eles continuam salvos). Esta ação não pode ser desfeita.`,
    instagram: `Desconectar "${deleteTarget?.name ?? ''}" remove a conta e os contatos sincronizados por ela. Esta ação não pode ser desfeita.`,
  };

  return (<div className="w-full max-w-full space-y-3">
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Canais</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
          Os números e contas que enviam e recebem mensagens da sua empresa
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {hasWhatsAppChoice && !showInlineChooser && (<button type="button" onClick={() => setKindChooserOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer">
          <CircleHelp size={12}/>
          Qual WhatsApp é para mim?
        </button>)}
        <button type="button" onClick={refreshAll} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50">
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''}/>
          Atualizar
        </button>
      </div>
    </div>

    {showInlineChooser && (<Card className="p-4 sm:p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Qual WhatsApp é para mim?</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Escolha pelo que você quer fazer. Se precisar, dá para ter os dois.
        </p>
      </div>
      <WhatsAppKindChooser onPickQrCode={canManage ? handleAddWhatsApp : undefined} onPickOfficial={canSeeOfficial ? handleAddOfficial : undefined} officialLoading={connectingOfficial}/>
    </Card>)}

    <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
      <Stat label="Canais" hint="ativos · limite do plano" value={<>
        {activeCount.toLocaleString('pt-BR')}
        <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
          {channelLimit > 0 ? `/${channelLimit.toLocaleString('pt-BR')}` : ''}
        </span>
      </>}/>
      {canManage && <Stat label="Envios pelo QR Code" hint={statsHint} value={formatStat(messageStats?.WHATSAPP)}/>}
      {canSeeOfficial && <Stat label="Envios pelo WhatsApp Oficial" hint={statsHint} value={formatStat(messageStats?.WHATSAPP_OFFICIAL)} action={<Link href="/whatsapp-official" title="Como está o número, quem pode receber mensagem livre e quanto você gastou" className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
        Relatório completo
        <ArrowUpRight size={11} className="shrink-0"/>
      </Link>}/>}
      {canManage && <Stat label="Envios pelo Instagram" hint={statsHint} value={formatStat(messageStats?.INSTAGRAM)}/>}
      <div className="col-span-2 lg:col-span-2 min-w-0">
        <ExtraInstancesCard quantity={status?.subscription?.extraInstances ?? 0}/>
      </div>
    </div>

    <div data-tour="channels-cards" className="grid gap-2 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3 items-start">
      {canManage && <ChannelTypeCard title="WhatsApp" description="Atendimento e respostas automáticas, conectado pelo QR Code" icon={<MessageCircle size={18}/>} accent="emerald" rows={whatsappRows} loading={loadingWhats} canManage={canManage} addLabel="Conectar número" addTourId="channels-add" emptyMessage="Nenhum número conectado ainda" onAdd={handleAddWhatsApp} onActivate={handleActivateWhatsApp} onDeactivate={handleDeactivateWhatsApp} onRename={openRename('whatsapp')} onDelete={openDelete('whatsapp')} busyId={busyId}/>}

      {canSeeOfficial && <ChannelTypeCard title="WhatsApp Oficial" description="Envios para muitos contatos, com número aprovado pela Meta" icon={<BadgeCheck size={18}/>} accent="teal" rows={officialRows} loading={loadingOfficial} canManage={canSeeOfficial} addLabel="Conectar número" adding={connectingOfficial} emptyMessage="Nenhum número oficial conectado" errorMessage={officialError} onAdd={handleAddOfficial} onRefresh={handleRefreshOfficial} onRename={openRename('whatsapp-official')} onDelete={openDelete('whatsapp-official')} busyId={busyId}/>}

      {canManage && <ChannelTypeCard title="Instagram" description="Contas profissionais (Comercial ou Criador de conteúdo)" icon={<Instagram size={18}/>} accent="fuchsia" rows={instagramRows} loading={loadingInstagram} canManage={canManage} addLabel="Conectar conta" adding={connectingInstagram} emptyMessage="Nenhuma conta do Instagram conectada" onAdd={handleConnectInstagram} onActivate={handleConnectInstagram} onRename={openRename('instagram')} onDelete={openDelete('instagram')} busyId={busyId} renderAvatar={renderInstagramAvatar}/>}
    </div>

    {showCreateModal && (<WhatsAppCreateModal isOpen={showCreateModal} onClose={() => {
      setShowCreateModal(false);
      refetchWhatsList();
      refetchWhatsApp();
    }} onCreate={createInstance} onConnect={connectInstance} onDelete={deleteInstance} onCheckStatus={getStatus}/>)}

    {qrTarget && (<WhatsAppQRModal isOpen={!!qrTarget} onClose={() => {
      setQrTarget(null);
      refetchWhatsList();
      refetchWhatsApp();
    }} channelId={qrTarget.id} phoneNumber={qrTarget.phoneNumber} onGetQRCode={getQRCode} onCheckStatus={getStatus} onConnect={connectInstance}/>)}

    <Modal isOpen={kindChooserOpen} onClose={() => setKindChooserOpen(false)} title="Qual WhatsApp é para mim?" size="md">
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Escolha pelo que você quer fazer. Se precisar, dá para ter os dois.
        </p>
        <WhatsAppKindChooser onPickQrCode={canManage ? pickFromKindChooser(handleAddWhatsApp) : undefined} onPickOfficial={canSeeOfficial ? pickFromKindChooser(handleAddOfficial) : undefined} officialLoading={connectingOfficial}/>
      </div>
    </Modal>

    <Modal isOpen={modeChooserOpen} onClose={() => setModeChooserOpen(false)} title="Qual número você vai usar?" size="md">
      <div className="space-y-3">
        <Callout tone="warning">
          Você vai precisar entrar com a sua conta da Meta (a mesma do Facebook da empresa). Depois de conectar, as promoções só podem ser enviadas com modelos de mensagem aprovados pela Meta.
        </Callout>

        <button type="button" onClick={() => {
          setModeChooserOpen(false);
          connectOfficial('coexistence');
        }} className="w-full flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors text-left cursor-pointer">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">Um número que já uso no WhatsApp Business</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              O número continua funcionando no aplicativo do celular e passa a enviar também pelo Synq. Deixe o app atualizado: no meio do caminho vamos pedir para você ler um QR Code com o celular.
            </span>
          </span>
        </button>

        <button type="button" onClick={() => {
          setModeChooserOpen(false);
          connectOfficial('new');
        }} className="w-full flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors text-left cursor-pointer">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">Um número novo, que não está no WhatsApp</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Para um chip que ainda não usa o aplicativo do WhatsApp. Ele vai funcionar só pelo Synq, com a maior velocidade de envio.
            </span>
          </span>
        </button>
      </div>
    </Modal>

    <InstagramConnectCheckModal isOpen={instagramCheckOpen} onClose={() => setInstagramCheckOpen(false)} onContinue={handleInstagramCheckContinue} loading={connectingInstagram}/>

    <RenameChannelModal isOpen={!!renameTarget} currentName={renameTarget?.name ?? ''} hint={renameTarget?.hint ?? ''} loading={renaming} onClose={() => setRenameTarget(null)} onConfirm={handleRenameConfirm}/>

    <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} message={deleteTarget ? deleteMessages[deleteTarget.kind] : ''} confirmLabel={deleteTarget?.kind === 'whatsapp' ? 'Remover' : 'Desconectar'} loading={deleting}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
