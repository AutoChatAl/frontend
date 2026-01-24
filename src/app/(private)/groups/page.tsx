'use client';

import { Plus } from 'lucide-react';

import AddGroupCard from './components/AddGroupCard';
import GroupCard from './components/GroupCard';

import Button from '@/components/Button';

export default function GroupsPage() {
  const groups = [
    { id: 1, name: 'VIP Black Friday', platforms: ['whatsapp', 'instagram'], count: 2450, lastSent: '2 dias atrás' },
    { id: 2, name: 'Leads Frios - Outubro', platforms: ['instagram'], count: 120, lastSent: 'Nunca' },
    { id: 3, name: 'Clientes Recorrentes', platforms: ['whatsapp'], count: 850, lastSent: 'Ontem' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Grupos de Contatos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Organize listas de transmissão para seus disparos</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => {}}>
          Novo Grupo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            id={group.id}
            name={group.name}
            platforms={group.platforms}
            count={group.count}
            lastSent={group.lastSent}
            onManage={(_id) => {}}
            onOptions={(_id) => {}}
          />
        ))}

        <AddGroupCard onClick={() => {}} />
      </div>
    </div>
  );
}
