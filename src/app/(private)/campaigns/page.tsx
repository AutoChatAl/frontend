'use client';

import { AlertCircle, Filter, Loader2, MoreVertical, Play, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { columns } from './components/CampaignsColumns';
import CreateCampaignModal from './components/CreateCampaignModal';

import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import PageLoader from '@/components/PageLoader';
import Table from '@/components/Table';
import { ToastContainer, useToast } from '@/components/Toast';
import { campaignService } from '@/services/campaign.service';
import { type Campaign } from '@/types/Campaign';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningCampaign, setRunningCampaign] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCampaign = async (campaignId: string) => {
    try {
      setRunningCampaign(campaignId);
      const run = await campaignService.runCampaign(campaignId);
      const stats = await campaignService.processJobs({ runId: run.id });
      await loadCampaigns();
      addToast(
        'success',
        `Campanha disparada! ${stats.sent} enviada${stats.sent !== 1 ? 's' : ''}, ${stats.skipped} ignorada${stats.skipped !== 1 ? 's' : ''}, ${stats.failed} falha${stats.failed !== 1 ? 's' : ''}.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao executar campanha';
      addToast('error', msg);
    } finally {
      setRunningCampaign(null);
    }
  };

  if (loading) {
    return <PageLoader message="Carregando campanhas..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button onClick={loadCampaigns} size="sm">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Campanhas de Disparo</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Gerencie envios em massa para WhatsApp e Instagram
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<Play size={20} />}
          title="Nenhuma campanha criada ainda"
          action={{
            label: 'Criar primeira campanha',
            icon: <Plus size={16} />,
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      ) : (
        <Table
          columns={columns}
          data={campaigns}
          actions={{
            buttons: [
              {
                label: 'Filtros',
                icon: <Filter size={16} />,
                onClick: () => {},
                variant: 'secondary',
              },
              {
                label: 'Nova Campanha',
                icon: <Plus size={16} />,
                onClick: () => setIsCreateModalOpen(true),
                variant: 'primary',
              },
            ],
          }}
          renderActions={(row: Campaign) => (
            <div className="flex justify-end gap-2">
              <IconButton
                icon={runningCampaign === row.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                onClick={() => handleRunCampaign(row.id)}
                disabled={runningCampaign === row.id || row.status !== 'ACTIVE'}
                title={row.status !== 'ACTIVE' ? 'Campanha não está ativa' : 'Disparar campanha'}
                variant="primary"
                size="md"
                className={row.status === 'ACTIVE' ? 'text-indigo-600 dark:text-indigo-400' : ''}
              />
              <IconButton
                icon={<MoreVertical size={16} />}
              />
            </div>
          )}
        />
      )}

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadCampaigns()}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
