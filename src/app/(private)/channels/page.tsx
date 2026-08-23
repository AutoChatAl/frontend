'use client';
import { ArrowUpRight, BadgeCheck, Instagram, MessageCircle, RefreshCw, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Modal from '@/components/Modal';
import { ToastContainer, useToast } from '@/components/Toast';
import { useChannelStatus } from '@/contexts/ChannelStatusContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useInstagramAccounts, useWhatsAppInstances } from '@/hooks/ChannelHook';
import { useWhatsAppOfficialInstances, useWhatsAppOfficialSignup } from '@/hooks/WhatsAppOfficialHook';
import { authService } from '@/services/auth.service';
import { channelsService } from '@/services/channels.service';
import type { ChannelMessageStats } from '@/types/Channel';

import ChannelTypeCard, { type ChannelRow } from './components/ChannelTypeCard';
import ExtraInstancesCard from './components/ExtraInstancesCard';
import RenameChannelModal from './components/RenameChannelModal';
import WhatsAppCreateModal from './components/WhatsAppCreateModal';
import WhatsAppQRModal from './components/WhatsAppQRModal';

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
  } = useWhatsAppInstances();
  const {
    instances: officialInstances,
    loading: loadingOfficial,
    error: officialError,
    refetch: refetchOfficial,
    deleteInstance: deleteOfficial,
    renameInstance: renameOfficial,
    refreshHealth: refreshOfficialHealth,
  } = useWhatsAppOfficialInstances();
  const {
    accounts,
    loading: loadingInstagram,
    deleteAccount,
    renameAccount,
    getOAuthUrl,
    refetch: refetchInstagramList,
  } = useInstagramAccounts();
  const { refetchWhatsApp, refetchInstagram } = useChannelStatus();
  const { isInactive, status } = useSubscription();
  const { toasts, addToast, removeToast } = useToast();
  const [messageStats, setMessageStats] = useState<ChannelMessageStats | null>(null);

  const [canManage, setCanManage] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrChannelId, setQrChannelId] = useState<string | null>(null);
  const [modeChooserOpen, setModeChooserOpen] = useState(false);
  const [connectingInstagram, setConnectingInstagram] = useState(false);
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
    const user = authService.getUser();
    setCanManage(!user?.role || user.role === 'owner' || user.role === 'admin' || (user.permissions ?? []).includes('channels'));
    loadMessageStats();
  }, [loadMessageStats]);

  const whatsappRows = useMemo<ChannelRow[]>(() => instances.map((instance) => ({
    id: instance.id,
    name: instance.name,
    subtitle: instance.status === 'CONNECTING'
      ? 'Conectando...'
      : instance.number || 'Número ainda não pareado',
    connected: instance.status === 'CONNECTED',
    ownerName: instance.ownerName ?? null,
  })), [instances]);

  const officialRows = useMemo<ChannelRow[]>(() => officialInstances.map((instance) => {
    const config = instance.whatsappOfficial;
    const quality = QUALITY_LABELS[config.qualityRating ?? 'UNKNOWN'] ?? 'Qualidade pendente';
    return {
      id: instance.id,
      name: config.verifiedName || instance.name,
      subtitle: `${config.displayPhoneNumber || 'Número oficial'} · ${quality}`,
      connected: instance.status === 'CONNECTED',
      ownerName: instance.ownerName ?? null,
    };
  }), [officialInstances]);

  const instagramRows = useMemo<ChannelRow[]>(() => accounts.map((account) => {
    const { username } = account.instagram;
    return {
      id: account.id,
      name: account.name || username || 'Conta do Instagram',
      subtitle: username ? `@${username}` : 'Perfil sem @ informado',
      connected: account.status === 'CONNECTED',
      ownerName: account.ownerName ?? null,
    };
  }), [accounts]);

  const allRows = [...whatsappRows, ...officialRows, ...instagramRows];
  const activeCount = allRows.filter((row) => row.connected).length;
  const channelLimit = status?.limits?.maxTotalInstances ?? 0;
  const statsHint = messageStats ? `últimos ${messageStats.days} dias` : 'carregando...';

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

  const handleConnectInstagram = async () => {
    if (!guardSubscription()) {
      return;
    }
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
          refetchInstagramList();
          refetchInstagram();
        }
      }, 500);
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao conectar com o Instagram. Tente novamente.');
      setConnectingInstagram(false);
    }
  };

  /** Reabre a sessão do canal e mostra o QR — é o mesmo caminho de um canal novo. */
  const handleActivateWhatsApp = async (row: ChannelRow) => {
    if (!guardSubscription()) {
      return;
    }
    setBusyId(row.id);
    try {
      await connectInstance(row.id);
      setQrChannelId(row.id);
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao ativar o canal.');
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
      addToast('error', error instanceof Error ? error.message : 'Erro ao desativar o canal.');
    }
    finally {
      setBusyId(null);
    }
  };

  const handleRefreshOfficial = async (row: ChannelRow) => {
    setBusyId(row.id);
    try {
      await refreshOfficialHealth(row.id);
      addToast('success', 'Dados sincronizados com a Meta.');
    }
    catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao sincronizar com a Meta.');
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
      addToast('error', error instanceof Error ? error.message : 'Erro ao renomear o canal.');
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
      addToast('error', error instanceof Error ? error.message : 'Erro ao deletar o canal.');
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
    whatsapp: `Deletar "${deleteTarget?.name ?? ''}" remove a instância, os contatos sincronizados e as auto-respostas ligadas a ela. Esta ação não pode ser desfeita.`,
    'whatsapp-official': `Desconectar "${deleteTarget?.name ?? ''}" remove o número do sistema e os templates sincronizados (eles permanecem na Meta). Esta ação não pode ser desfeita.`,
    instagram: `Desconectar "${deleteTarget?.name ?? ''}" remove a conta e os contatos sincronizados por ela. Esta ação não pode ser desfeita.`,
  };

  return (<div className="w-full max-w-full space-y-3">
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Canais</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            As contas que enviam e recebem mensagens pelo seu workspace
        </p>
      </div>
      <button type="button" onClick={refreshAll} disabled={refreshing} className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50">
        <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''}/>
        Atualizar
      </button>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
      <Stat label="Canais" hint="ativos · limite do plano" value={<>
        {activeCount.toLocaleString('pt-BR')}
        <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
          {channelLimit > 0 ? `/${channelLimit.toLocaleString('pt-BR')}` : ''}
        </span>
      </>}/>
      <Stat label="Envios pelo QR Code" hint={statsHint} value={formatStat(messageStats?.WHATSAPP)}/>
      <Stat label="Envios pelo WhatsApp Oficial" hint={statsHint} value={formatStat(messageStats?.WHATSAPP_OFFICIAL)} action={<Link href="/whatsapp-official" title="Saúde do número, janela de 24h e consumo" className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
        Relatório completo
        <ArrowUpRight size={11} className="shrink-0"/>
      </Link>}/>
      <Stat label="Envios pelo Instagram" hint={statsHint} value={formatStat(messageStats?.INSTAGRAM)}/>
      <div className="col-span-2 lg:col-span-2 min-w-0">
        <ExtraInstancesCard quantity={status?.subscription?.extraInstances ?? 0}/>
      </div>
    </div>

    <div data-tour="channels-cards" className="grid gap-2 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3 items-start">
      <ChannelTypeCard title="WhatsApp" description="Instâncias pareadas por QR Code" icon={<MessageCircle size={18}/>} accent="emerald" rows={whatsappRows} loading={loadingWhats} canManage={canManage} addLabel="Nova instância" addTourId="channels-add" emptyMessage="Nenhuma instância conectada ainda" onAdd={handleAddWhatsApp} onActivate={handleActivateWhatsApp} onDeactivate={handleDeactivateWhatsApp} onRename={openRename('whatsapp')} onDelete={openDelete('whatsapp')} busyId={busyId}/>

      <ChannelTypeCard title="WhatsApp Oficial" description="Números verificados na API Oficial da Meta" icon={<BadgeCheck size={18}/>} accent="teal" rows={officialRows} loading={loadingOfficial} canManage={canManage} addLabel="Conectar número" adding={connectingOfficial} emptyMessage="Nenhum número oficial conectado" errorMessage={officialError} onAdd={handleAddOfficial} onRefresh={handleRefreshOfficial} onRename={openRename('whatsapp-official')} onDelete={openDelete('whatsapp-official')} busyId={busyId}/>

      <ChannelTypeCard title="Instagram" description="Contas autorizadas pelo login da Meta" icon={<Instagram size={18}/>} accent="fuchsia" rows={instagramRows} loading={loadingInstagram} canManage={canManage} addLabel="Conectar conta" adding={connectingInstagram} emptyMessage="Nenhuma conta do Instagram conectada" onAdd={handleConnectInstagram} onActivate={handleConnectInstagram} onRename={openRename('instagram')} onDelete={openDelete('instagram')} busyId={busyId} renderAvatar={renderInstagramAvatar}/>
    </div>

    {showCreateModal && (<WhatsAppCreateModal isOpen={showCreateModal} onClose={() => {
      setShowCreateModal(false);
      refetchWhatsList();
      refetchWhatsApp();
    }} onCreate={createInstance} onConnect={connectInstance} onDelete={deleteInstance} onCheckStatus={getStatus}/>)}

    {qrChannelId && (<WhatsAppQRModal isOpen={!!qrChannelId} onClose={() => {
      setQrChannelId(null);
      refetchWhatsList();
      refetchWhatsApp();
    }} channelId={qrChannelId} onGetQRCode={getQRCode} onCheckStatus={getStatus}/>)}

    <Modal isOpen={modeChooserOpen} onClose={() => setModeChooserOpen(false)} title="Como você quer conectar?" size="md">
      <div className="space-y-3">
        <button type="button" onClick={() => {
          setModeChooserOpen(false);
          connectOfficial('new');
        }} className="w-full flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors text-left cursor-pointer">

          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">Número novo na Cloud API</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Para números que não estão em uso no aplicativo do WhatsApp. Registro direto na API Oficial, com throughput máximo.
            </span>
          </span>
        </button>

        <button type="button" onClick={() => {
          setModeChooserOpen(false);
          connectOfficial('coexistence');
        }} className="w-full flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors text-left cursor-pointer">

          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">Número que já uso no app WhatsApp Business</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Coexistência: o número continua funcionando no aplicativo e passa a funcionar também pela API Oficial. Requer o app atualizado, o fluxo pedirá a leitura de um QR Code no celular.
            </span>
          </span>
        </button>
      </div>
    </Modal>

    <RenameChannelModal isOpen={!!renameTarget} currentName={renameTarget?.name ?? ''} hint={renameTarget?.hint ?? ''} loading={renaming} onClose={() => setRenameTarget(null)} onConfirm={handleRenameConfirm}/>

    <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} message={deleteTarget ? deleteMessages[deleteTarget.kind] : ''} confirmLabel={deleteTarget?.kind === 'whatsapp' ? 'Deletar' : 'Desconectar'} loading={deleting}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
