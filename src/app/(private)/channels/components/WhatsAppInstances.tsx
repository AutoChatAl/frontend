'use client';

import { MessageCircle } from 'lucide-react';

import AddChannelCard from './AddChannelCard';
import ChannelInstanceCard from './ChannelInstanceCard';

export default function WhatsAppInstances() {
  const whatsappInstances = [
    { id: 1, name: 'Atendimento Principal', number: '+55 11 99999-9999', status: 'connected' as const, battery: 85 },
    { id: 2, name: 'Vendas Diretas', number: '+55 11 98888-8888', status: 'disconnected' as const, battery: 0 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AddChannelCard
        title="Nova Instância"
        subtitle="Escanear QR Code"
        colorClass="emerald"
        onClick={() => {}}
      />

      {whatsappInstances.map((inst) => (
        <ChannelInstanceCard
          key={inst.id}
          id={inst.id}
          icon={
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageCircle size={24} />
            </div>
          }
          title={inst.name}
          subtitle={inst.number}
          status={inst.status}
          colorClass="emerald"
          onRefresh={(_id) => {}}
          onDelete={(_id) => {}}
        />
      ))}
    </div>
  );
}
