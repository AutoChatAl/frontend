import { useEffect, useState } from 'react';

import { channelsService } from '@/services/channels.service';
import type { InstagramAccount, WhatsAppInstance, WhatsappConnectResponse, WhatsAppStatusResponse, WhatsAppQRCodeRawResponse } from '@/types/Channel';
import { getErrorMessage } from '@/utils/ErrorHandling';

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
      setError(getErrorMessage(err, 'Erro ao carregar instâncias'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const createInstance = async (data: { name?: string; systemName?: string; autoConnect?: boolean }) => {
    try {
      const response = await channelsService.createWhatsAppInstance(data);
      setInstances((prev) => [...prev, response.channel]);
      return response;
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Erro ao criar instância');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const connectInstance = async (channelId: string, phone?: string): Promise<WhatsappConnectResponse> => {
    try {
      const response = await channelsService.connectWhatsAppInstance(channelId, phone);
      await fetchInstances();
      return response;
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Erro ao conectar instância');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getQRCode = async (channelId: string): Promise<WhatsAppQRCodeRawResponse> => {
    try {
      return await channelsService.getWhatsAppQRCode(channelId);
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Erro ao obter QR Code');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getStatus = async (channelId: string): Promise<WhatsAppStatusResponse> => {
    try {
      const status = await channelsService.getWhatsAppStatus(channelId);
      await fetchInstances();
      return status;
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Erro ao verificar status');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      await channelsService.deleteWhatsAppInstance(id);
      setInstances((prev) => prev.filter((inst) => inst.id !== id));
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Erro ao deletar instância');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  return {
    instances,
    loading,
    error,
    refetch: fetchInstances,
    createInstance,
    connectInstance,
    getQRCode,
    getStatus,
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
      setError(getErrorMessage(err, 'Erro ao carregar contas'));
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
      const errorMsg = getErrorMessage(err, 'Erro ao deletar conta');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getOAuthUrl = async () => {
    try {
      const { url } = await channelsService.getInstagramOAuthUrl();
      return url;
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Erro ao obter URL de autenticação');
      setError(errorMsg);
      throw new Error(errorMsg);
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
