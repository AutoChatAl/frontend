/* eslint-disable no-console */
'use client';

import { Filter, MoreVertical, Play, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { columns } from './components/CampaignsColumns';
import CreateCampaignModal from './components/CreateCampaignModal';

import Table from '@/components/Table';
import { campaignService } from '@/services/campaign.service';
import { type Campaign } from '@/types/Campaign';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningCampaign, setRunningCampaign] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      console.error('Erro ao carregar campanhas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCampaign = async (campaignId: string) => {
    try {
      setRunningCampaign(campaignId);
      await campaignService.runCampaign(campaignId);

      await campaignService.processJobs();

      await loadCampaigns();

      alert('Campanha disparada com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao disparar campanha');
      console.error('Erro ao disparar campanha:', err);
    } finally {
      setRunningCampaign(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Carregando campanhas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Campanhas de Disparo</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie envios em massa para WhatsApp e Instagram</p>
        </div>
      </div>

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
            <button
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded text-indigo-600 dark:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleRunCampaign(row.id)}
              disabled={runningCampaign === row.id || row.status !== 'ACTIVE'}
              title={row.status !== 'ACTIVE' ? 'Campanha não está ativa' : 'Disparar campanha'}
            >
              {runningCampaign === row.id ? (
                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
              ) : (
                <Play size={16} />
              )}
            </button>
            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        )}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadCampaigns()}
      />
    </div>
  );
}
