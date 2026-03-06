/* eslint-disable no-console */
'use client';

import { AlertCircle, CheckCircle2, Filter, Loader2, MoreVertical, Play, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { columns } from './components/CampaignsColumns';
import CreateCampaignModal from './components/CreateCampaignModal';

import Table from '@/components/Table';
import { campaignService } from '@/services/campaign.service';
import { type Campaign } from '@/types/Campaign';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningCampaign, setRunningCampaign] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

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
      const stats = await campaignService.processJobs();
      await loadCampaigns();
      addToast(
        'success',
        `Campanha disparada! ${stats.sent} enviada${stats.sent !== 1 ? 's' : ''}, ${stats.skipped} ignorada${stats.skipped !== 1 ? 's' : ''}, ${stats.failed} falha${stats.failed !== 1 ? 's' : ''}.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao executar campanha';
      addToast('error', msg);
      console.error('Erro ao executar campanha:', err);
    } finally {
      setRunningCampaign(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={loadCampaigns}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto max-w-sm animate-in slide-in-from-right-4 duration-300 ${
              toast.type === 'success'
                ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Campanhas de Disparo</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Gerencie envios em massa para WhatsApp e Instagram
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Play size={20} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Nenhuma campanha criada ainda
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
          >
            <Plus size={16} />
            Criar primeira campanha
          </button>
        </div>
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
              <button
                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => handleRunCampaign(row.id)}
                disabled={runningCampaign === row.id || row.status !== 'ACTIVE'}
                title={row.status !== 'ACTIVE' ? 'Campanha não está ativa' : 'Disparar campanha'}
              >
                {runningCampaign === row.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
              </button>
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          )}
        />
      )}

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadCampaigns()}
      />
    </div>
  );
}
