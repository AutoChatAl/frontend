'use client';

import { Filter, MoreVertical, Plus } from 'lucide-react';

import { columns } from './components/CampaignsColumns';

import Table from '@/components/Table';
import { CampaignStatus, type Campaign } from '@/types/Campaign';

export default function CampaignsPage() {
  const campaignsData: Campaign[] = [
    { id: 1, name: 'Promoção Relâmpago VIP', channel: 'whatsapp', sent: 1540, opened: '92%', status: CampaignStatus.SUCCESS, date: 'Hoje, 10:00' },
    { id: 2, name: 'Recuperação de Carrinho', channel: 'instagram', sent: 45, opened: '68%', status: CampaignStatus.PROCESSING, date: 'Automático' },
    { id: 3, name: 'Lançamento Coleção Inverno', channel: 'whatsapp', sent: 5200, opened: '85%', status: CampaignStatus.SUCCESS, date: 'Ontem' },
    { id: 4, name: 'Boas-vindas Novos Leads', channel: 'instagram', sent: 12, opened: '45%', status: CampaignStatus.WARNING, date: 'Automático' },
    { id: 5, name: 'Aviso de Manutenção', channel: 'whatsapp', sent: 890, opened: '98%', status: CampaignStatus.SUCCESS, date: '02/05/2024' },
  ];

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
        data={campaignsData}
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
              onClick: () => {},
              variant: 'primary',
            },
          ],
        }}
        renderActions={() => (
          <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <MoreVertical size={16} />
          </button>
        )}
      />
    </div>
  );
}
