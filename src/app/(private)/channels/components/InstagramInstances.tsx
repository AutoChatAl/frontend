'use client';

import { User } from 'lucide-react';

import AddChannelCard from './AddChannelCard';
import ChannelInstanceCard from './ChannelInstanceCard';

import { useInstagramAccounts } from '@/hooks/ChannelHook';

export default function InstagramInstances() {
  const { accounts, loading, deleteAccount, getOAuthUrl } = useInstagramAccounts();

  const handleConnectInstagram = async () => {
    try {
      const url = await getOAuthUrl();
      window.location.href = url;
    } catch (_error) {
      alert('Erro ao conectar com Instagram. Tente novamente.');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Deseja realmente desconectar esta conta do Instagram?')) {
      try {
        await deleteAccount(String(id));
      } catch (_error) {
        alert('Erro ao desconectar conta. Tente novamente.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AddChannelCard
        title="Conectar Conta"
        subtitle="Login Instagram"
        colorClass="fuchsia"
        onClick={handleConnectInstagram}
      />

      {accounts.map((account) => {
        const username = account.instagram.username || account.name || 'Sem nome';
        const displayUsername = username.startsWith('@') ? username : `@${username}`;

        return (
          <ChannelInstanceCard
            key={account.id}
            id={account.id}
            icon={
              <div className="w-12 h-12 bg-linear-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-0.5">
                <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full p-0.5">
                  {account.instagram.profilePictureUrl ? (
                    <img
                      src={account.instagram.profilePictureUrl}
                      alt={displayUsername}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <User size={20} />
                    </div>
                  )}
                </div>
              </div>
            }
            title={displayUsername}
            subtitle={account.name}
            status={account.status === 'CONNECTED' ? 'connected' : 'disconnected'}
            colorClass="fuchsia"
            onRefresh={(_id) => {}}
            onDelete={handleDelete}
          />
        );
      })}
    </div>
  );
}
