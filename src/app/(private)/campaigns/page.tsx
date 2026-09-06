'use client';
import { AlertCircle, BadgeCheck, Edit2, Filter, Loader2, MessageCircle, MoreVertical, Play, Plus, Search, Smartphone, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import Input from '@/components/Input';
import MetricCard from '@/components/MetricCard';
import PageLoader from '@/components/PageLoader';
import { SkeletonPage, SkeletonRows, SkeletonStats } from '@/components/Skeleton';
import Table from '@/components/Table';
import { ToastContainer, useToast } from '@/components/Toast';
import { campaignService } from '@/services/campaign.service';
import { type Campaign } from '@/types/Campaign';
import { HIDDEN_FEATURES, LOCKED_FEATURES } from '@lib/featureFlags';

import { columns } from './components/CampaignsColumns';
import CreateCampaignModal from './components/CreateCampaignModal';
import EditCampaignModal from './components/EditCampaignModal';
import ScheduleGrid from './components/ScheduleGrid';

function ActionsDropdown({ campaign, onEdit, onDelete }: {
    campaign: Campaign;
    onEdit: (campaign: Campaign) => void;
    onDelete: (campaign: Campaign) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const updatePosition = useCallback(() => {
    if (!buttonRef.current)
      return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right - 176,
    });
  }, []);
  // Calcula a posição ANTES de abrir (no mesmo batch do setOpen), para o menu já renderizar
  // sob o botão — sem o flash em (0,0) no canto superior esquerdo.
  const handleToggle = useCallback(() => {
    if (!open)
      updatePosition();
    setOpen((prev) => !prev);
  }, [open, updatePosition]);
  useLayoutEffect(() => {
    if (!open)
      return;
    updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, updatePosition]);
  return (<div ref={buttonRef}>
    <IconButton icon={<MoreVertical size={16}/>} onClick={handleToggle}/>
    {open && createPortal(<div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }} className="w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150">
      <button type="button" onClick={() => {
        setOpen(false);
        onEdit(campaign);
      }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <Edit2 size={15} className="text-slate-400"/>
            Editar
      </button>
      <button type="button" onClick={() => {
        setOpen(false);
        onDelete(campaign);
      }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <Trash2 size={15}/>
            Excluir
      </button>
    </div>, document.body)}
  </div>);
}
function DeleteConfirmModal({ isOpen, campaignName, loading, onConfirm, onCancel }: {
    isOpen: boolean;
    campaignName: string;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
  if (!isOpen)
    return null;
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onCancel}/>
    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Trash2 size={24} className="text-red-500"/>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Excluir campanha</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
              Tem certeza que deseja excluir a campanha <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{campaignName}&quot;</span>? Esta ação não pode ser desfeita. Todas as execuções e jobs associados também serão removidos.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button type="button" onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50">
              Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  </div>);
}
export default function CampaignsPage() {
  const router = useRouter();
  // Guarda de bloqueio da aba. Hoje LOCKED_FEATURES.campaigns é false (liberada);
  // se voltar a ser true, a rota volta a redirecionar para o dashboard.
  useEffect(() => {
    if (LOCKED_FEATURES.campaigns) {
      router.replace('/dashboard');
    }
  }, [router]);

  if (LOCKED_FEATURES.campaigns) {
    return <PageLoader message="Redirecionando..."/>;
  }

  return <CampaignsPageContent/>;
}

type CampaignChannelFilter = 'ALL' | 'WHATSAPP_OFFICIAL' | 'WHATSAPP' | 'INSTAGRAM';

function CampaignsPageContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scheduleKey, setScheduleKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningCampaign, setRunningCampaign] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState<CampaignChannelFilter>('ALL');
  const { toasts, addToast, removeToast } = useToast();
  useEffect(() => {
    loadCampaigns();
  }, []);
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignService.listCampaigns();
      setCampaigns(data);
      // A agenda depende do agendamento das campanhas: recarrega junto.
      setScheduleKey((prev) => prev + 1);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    }
    finally {
      setLoading(false);
    }
  };
  const handleRunCampaign = async (campaignId: string) => {
    try {
      setRunningCampaign(campaignId);
      const run = await campaignService.runCampaign(campaignId);
      const stats = await campaignService.processJobs({ runId: run.id });
      await loadCampaigns();
      addToast('success', `Campanha disparada! ${stats.sent} enviada${stats.sent !== 1 ? 's' : ''}, ${stats.skipped} ignorada${stats.skipped !== 1 ? 's' : ''}, ${stats.failed} falha${stats.failed !== 1 ? 's' : ''}.`);
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao executar campanha';
      addToast('error', msg);
    }
    finally {
      setRunningCampaign(null);
    }
  };
  const handleDeleteCampaign = async () => {
    if (!deletingCampaign)
      return;
    try {
      setDeletingLoading(true);
      await campaignService.deleteCampaign(deletingCampaign.id);
      addToast('success', `Campanha "${deletingCampaign.name}" excluída com sucesso.`);
      setDeletingCampaign(null);
      await loadCampaigns();
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir campanha';
      addToast('error', msg);
    }
    finally {
      setDeletingLoading(false);
    }
  };
  const filteredCampaigns = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesName = query === '' || campaign.name.toLowerCase().startsWith(query);
      const matchesChannel = channelFilter === 'ALL'
        || (campaign.channels ?? []).some((ch) => ch.channel?.type === channelFilter);
      return matchesName && matchesChannel;
    });
  }, [campaigns, nameFilter, channelFilter]);
  const campaignStats = useMemo(() => {
    const today = new Date();
    const isToday = (iso?: string | null): boolean => {
      if (!iso)
        return false;
      const d = new Date(iso);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };
    let dispatchesToday = 0;
    for (const campaign of campaigns) {
      for (const run of campaign.runs ?? []) {
        if (isToday(run.startedAt ?? run.scheduledFor))
          dispatchesToday++;
      }
    }
    return {
      active: campaigns.filter((c) => c.status === 'ACTIVE').length,
      paused: campaigns.filter((c) => c.status === 'PAUSED').length,
      completed: campaigns.filter((c) => c.status === 'COMPLETED').length,
      dispatchesToday,
    };
  }, [campaigns]);
  const hasActiveFilters = nameFilter.trim() !== '' || channelFilter !== 'ALL';
  if (loading) {
    return <SkeletonPage><SkeletonStats count={4}/><SkeletonRows count={5}/></SkeletonPage>;
  }
  if (error) {
    return (<div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={20}/>
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button onClick={loadCampaigns} size="sm">Tentar novamente</Button>
      </div>
    </div>);
  }
  return (<div className="w-full max-w-full space-y-3">

    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Campanhas de Disparo</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
          {HIDDEN_FEATURES.campaignNonOfficialChannels
            ? 'Gerencie envios em massa pela API Oficial do WhatsApp'
            : 'Gerencie envios em massa para WhatsApp e Instagram'}
        </p>
      </div>
      {campaigns.length > 0 && (<div className="flex flex-wrap gap-2" data-tour="campaigns-new">
        <Button onClick={() => setShowFilters((prev) => !prev)} icon={<Filter size={16}/>} variant="secondary">Filtros</Button>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus size={16}/>} variant="primary">Nova Campanha</Button>
      </div>)}
    </div>

    {campaigns.length > 0 && (<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      <MetricCard title="Ativas" value={campaignStats.active.toLocaleString('pt-BR')} hint="prontas para disparar"/>
      <MetricCard title="Pausadas" value={campaignStats.paused.toLocaleString('pt-BR')} hint="não disparam até reativar"/>
      <MetricCard title="Concluídas" value={campaignStats.completed.toLocaleString('pt-BR')} hint="campanhas encerradas"/>
      <MetricCard title="Disparos Hoje" value={campaignStats.dispatchesToday.toLocaleString('pt-BR')} hint="executados ou agendados"/>
    </div>)}

    {campaigns.length === 0 ? (<div data-tour="campaigns-new"><EmptyState icon={<Play size={20}/>} title="Nenhuma campanha criada ainda" action={{
      label: 'Criar primeira campanha',
      icon: <Plus size={16}/>,
      onClick: () => setIsCreateModalOpen(true),
    }}/></div>) : (<div className="space-y-3">
      {showFilters && (<Card className="p-4 animate-in fade-in duration-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome da campanha" leftIcon={<Search size={16}/>} placeholder="Filtrar por nome..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)}/>
          <Dropdown label="Canal" value={channelFilter} onChange={(v) => setChannelFilter(v as CampaignChannelFilter)} options={[
            { value: 'ALL', label: 'Todos os canais' },
            { value: 'WHATSAPP_OFFICIAL', label: 'WhatsApp Oficial', icon: <BadgeCheck size={15}/> },
            ...(HIDDEN_FEATURES.campaignNonOfficialChannels ? [] : [
              { value: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle size={15}/> },
              { value: 'INSTAGRAM', label: 'Instagram', icon: <Smartphone size={15}/> },
            ]),
          ]}/>
        </div>
        {hasActiveFilters && (<button type="button" onClick={() => { setNameFilter(''); setChannelFilter('ALL'); }} className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Limpar filtros
        </button>)}
      </Card>)}
      <Table columns={columns} data={filteredCampaigns} renderActions={(row: Campaign) => (<div className="flex justify-end gap-2">
        <IconButton icon={runningCampaign === row.id ? <Loader2 size={16} className="animate-spin"/> : <Play size={16}/>} onClick={() => handleRunCampaign(row.id)} disabled={runningCampaign === row.id || row.status !== 'ACTIVE'} title={row.status !== 'ACTIVE' ? 'Campanha não está ativa' : 'Disparar campanha'} variant="primary" size="md" className={row.status === 'ACTIVE' ? 'text-indigo-600 dark:text-indigo-400' : ''}/>
        <ActionsDropdown campaign={row} onEdit={(c) => setEditingCampaign(c)} onDelete={(c) => setDeletingCampaign(c)}/>
      </div>)} renderMobileCard={(row: Campaign) => (<Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{row.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {new Date(row.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <IconButton icon={runningCampaign === row.id ? <Loader2 size={16} className="animate-spin"/> : <Play size={16}/>} onClick={() => handleRunCampaign(row.id)} disabled={runningCampaign === row.id || row.status !== 'ACTIVE'} title={row.status !== 'ACTIVE' ? 'Campanha não está ativa' : 'Disparar campanha'} variant="primary" size="sm"/>
            <ActionsDropdown campaign={row} onEdit={(c) => setEditingCampaign(c)} onDelete={(c) => setDeletingCampaign(c)}/>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge type={row.status === 'ACTIVE' ? 'success' : row.status === 'PAUSED' ? 'warning' : 'neutral'} text={row.status === 'ACTIVE' ? 'Ativa' : row.status === 'PAUSED' ? 'Pausada' : 'Concluída'}/>
          {row.channels && row.channels.length > 0 && row.channels.map((ch) => {
            if (!ch.channel)
              return null;
            const isOfficial = ch.channel.type === 'WHATSAPP_OFFICIAL';
            const isWhatsApp = ch.channel.type === 'WHATSAPP';
            return (<Badge key={ch.channelId} type={isOfficial || isWhatsApp ? 'whatsapp' : 'instagram'} text={isOfficial ? 'WhatsApp Oficial' : isWhatsApp ? 'WhatsApp' : 'Instagram'} icon={isOfficial ? BadgeCheck : isWhatsApp ? MessageCircle : Smartphone}/>);
          })}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {row.runs ? row.runs.length : 0} execução{(row.runs?.length ?? 0) !== 1 ? 'ões' : ''}
          </span>
        </div>

        {row.message && (<p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
          {row.message}
        </p>)}
      </Card>)}/>
      {filteredCampaigns.length === 0 && (<p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
        Nenhuma campanha encontrada com os filtros aplicados.
      </p>)}

      <ScheduleGrid refreshKey={scheduleKey}/>
    </div>)}

    <CreateCampaignModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => loadCampaigns()} addToast={addToast}/>

    <EditCampaignModal isOpen={!!editingCampaign} campaign={editingCampaign} onClose={() => setEditingCampaign(null)} onSuccess={() => loadCampaigns()}/>

    <DeleteConfirmModal isOpen={!!deletingCampaign} campaignName={deletingCampaign?.name || ''} loading={deletingLoading} onConfirm={handleDeleteCampaign} onCancel={() => setDeletingCampaign(null)}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
