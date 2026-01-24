import { useEffect, useState } from 'react';

import { channelsService } from '@/services/channels.service';
import type { InstagramAccount, WhatsAppInstance } from '@/types/Channel';

export function useWhatsAppInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await channelsService.getWhatsAppInstances();
      setInstances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const createInstance = async (data: { name: string; evolutionInstance: string }) => {
    try {
      setLoading(true);
      const newInstance = await channelsService.createWhatsAppInstance(data);
      setInstances((prev) => [...prev, newInstance]);
      return newInstance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar instância');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      await channelsService.deleteWhatsAppInstance(id);
      setInstances((prev) => prev.filter((inst) => inst.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar instância');
      throw err;
    }
  };

  return {
    instances,
    loading,
    error,
    refetch: fetchInstances,
    createInstance,
    deleteInstance,
  };
}

export function useInstagramAccounts() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await channelsService.getInstagramAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const deleteAccount = async (id: string) => {
    try {
      await channelsService.deleteInstagramAccount(id);
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar conta');
      throw err;
    }
  };

  const getOAuthUrl = async () => {
    try {
      const { url } = await channelsService.getInstagramOAuthUrl();
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter URL de autenticação');
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    deleteAccount,
    getOAuthUrl,
  };
}
