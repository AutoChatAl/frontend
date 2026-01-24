'use client';

import { MoreVertical, Plus } from 'lucide-react';

import { columns } from './components/ContactColumns';

import Table from '@/components/Table';
import { useFilter } from '@/hooks/SearchHook';
import type { Contact } from '@/types/Contact';

export default function ContactsPage() {

  const mockContacts: Contact[] = [
    { id: 1, name: 'Ana Silva', contact: '+55 11 99999-9999', channels: ['whatsapp'], tags: ['VIP', 'Cliente Novo'], lastInteraction: 'Hoje, 14:30' },
    { id: 2, name: 'Carlos Dev', contact: '@carlos_dev', channels: ['instagram'], tags: ['Influencer', 'Tecnologia'], lastInteraction: 'Ontem' },
    { id: 3, name: 'Marcos Oliveira', contact: '+55 11 98888-7777', channels: ['whatsapp', 'instagram'], tags: ['Lead Quente'], lastInteraction: '2 dias atrás' },
    { id: 4, name: 'Fernanda Souza', contact: '@nanda_souza', channels: ['instagram'], tags: [], lastInteraction: '1 semana atrás' },
    { id: 5, name: 'Empresa XYZ', contact: '+55 21 97777-6666', channels: ['whatsapp'], tags: ['Corporativo', 'Em Negociação'], lastInteraction: '30 min atrás' },
  ];

  const { query, setQuery, filtered } = useFilter(mockContacts);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Contatos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Gerencie sua base de contatos e leads
          </p>
        </div>
      </header>

      <Table
        columns={columns}
        data={filtered}
        actions={{
          searchBar: {
            placeholder: 'Buscar contato...',
            value: query,
            onChange: setQuery,
          },
          buttons: [
            {
              label: 'Novo Contato',
              icon: <Plus size={16} />,
              onClick: () => {},
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
