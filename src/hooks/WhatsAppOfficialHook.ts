'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import type { WhatsAppOfficialInstance } from '@/types/WhatsAppOfficial';
import { getErrorMessageFromCatch } from '@/utils/ErrorHandling';

/**
 * `new` registra um número direto na Cloud API; `coexistence` mantém o número
 * funcionando também no app do WhatsApp Business.
 */
export type WhatsAppOfficialConnectMode = 'new' | 'coexistence';

/**
 * @param options.enabled  `false` não busca nada e devolve lista vazia. Serve
 *   para quem não tem a permissão `whatsapp-official`: sem isso a página
 *   dispararia um 403 a cada carga só para descartar o resultado.
 */
export function useWhatsAppOfficialInstances(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [instances, setInstances] = useState<WhatsAppOfficialInstance[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    if (!enabled) {
      setInstances([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await whatsappOfficialService.getInstances();
      setInstances(data);
    }
    catch (err) {
      // Workspace sem API Oficial provisionada cai aqui — o card mostra o motivo
      // em vez de um estado vazio que sugeriria "é só clicar em conectar".
      setError(getErrorMessageFromCatch(err, 'Erro ao carregar canais da API Oficial'));
    }
    finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const deleteInstance = useCallback(async (id: string) => {
    try {
      await whatsappOfficialService.deleteInstance(id);
      setInstances((prev) => prev.filter((instance) => instance.id !== id));
    }
    catch (err) {
      throw new Error(getErrorMessageFromCatch(err, 'Erro ao desconectar a conta oficial'));
    }
  }, []);

  const renameInstance = useCallback(async (id: string, name: string) => {
    try {
      await whatsappOfficialService.renameInstance(id, name);
      setInstances((prev) => prev.map((instance) => (instance.id === id ? { ...instance, name } : instance)));
    }
    catch (err) {
      throw new Error(getErrorMessageFromCatch(err, 'Erro ao renomear a conta oficial'));
    }
  }, []);

  const refreshHealth = useCallback(async (id: string) => {
    try {
      const updated = await whatsappOfficialService.refreshHealth(id);
      setInstances((prev) => prev.map((instance) => (instance.id === id ? updated : instance)));
    }
    catch (err) {
      throw new Error(getErrorMessageFromCatch(err, 'Erro ao sincronizar a conta com a Meta'));
    }
  }, []);

  return {
    instances,
    loading,
    error,
    refetch: fetchInstances,
    deleteInstance,
    renameInstance,
    refreshHealth,
  };
}

interface SignupOptions {
    /** Quantos canais existem antes do fluxo — base para detectar o novo. */
    instanceCount: number;
    onSuccess: () => Promise<void> | void;
    onToast: (type: 'success' | 'error', message: string) => void;
    /** Assinatura inativa: o fluxo nem começa. */
    blocked: boolean;
}

/**
 * Embedded Signup da Meta. O fluxo tem dois desfechos possíveis: o popup
 * devolve um `code` (caminho feliz) ou fecha sem código depois de concluir o
 * cadastro — aí só resta perguntar ao backend até o canal aparecer.
 */
export function useWhatsAppOfficialSignup({ instanceCount, onSuccess, onToast, blocked }: SignupOptions) {
  const [connecting, setConnecting] = useState(false);
  const sdkLoadedRef = useRef(false);
  const signupDataRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});
  const signupFinishedRef = useRef(false);
  const codeReceivedRef = useRef(false);
  const preConnectCountRef = useRef(0);
  const pollRef = useRef<((previousCount: number) => Promise<boolean>) | null>(null);

  const pollForNewInstance = useCallback(async (previousCount: number) => {
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        const data = await whatsappOfficialService.getInstances();
        if (data.length > previousCount) {
          await onSuccess();
          onToast('success', 'Conta oficial conectada com sucesso!');
          return true;
        }
      }
      catch {
        // Uma tentativa que falha não encerra o polling: a próxima pode achar.
      }
    }
    return false;
  }, [onSuccess, onToast]);

  useEffect(() => {
    pollRef.current = pollForNewInstance;
  }, [pollForNewInstance]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) {
        return;
      }
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type !== 'WA_EMBEDDED_SIGNUP') {
          return;
        }
        if (data.data) {
          const next: { wabaId?: string; phoneNumberId?: string } = {};
          if (data.data.waba_id) {
            next.wabaId = String(data.data.waba_id);
          }
          if (data.data.phone_number_id) {
            next.phoneNumberId = String(data.data.phone_number_id);
          }
          signupDataRef.current = next;
        }
        if (typeof data.event === 'string' && data.event.startsWith('FINISH')) {
          signupFinishedRef.current = true;
          setTimeout(() => {
            if (!codeReceivedRef.current) {
              pollRef.current?.(preConnectCountRef.current);
            }
          }, 4000);
        }
      }
      catch {
        // Mensagem fora do formato esperado — ignorar é o certo aqui.
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadFacebookSdk = useCallback(async (appId: string, graphVersion: string): Promise<FacebookSdk> => {
    if (window.FB && sdkLoadedRef.current) {
      return window.FB;
    }
    await new Promise<void>((resolve, reject) => {
      if (document.getElementById('facebook-jssdk')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar o SDK da Meta. Verifique bloqueadores de anúncio.'));
      document.body.appendChild(script);
    });
    if (!window.FB) {
      throw new Error('SDK da Meta indisponível.');
    }
    window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version: graphVersion });
    sdkLoadedRef.current = true;
    return window.FB;
  }, []);

  const connect = useCallback(async (mode: WhatsAppOfficialConnectMode) => {
    if (blocked) {
      onToast('error', 'Sua assinatura está inativa. Reative seu plano para conectar canais.');
      return;
    }
    setConnecting(true);
    signupDataRef.current = {};
    signupFinishedRef.current = false;
    codeReceivedRef.current = false;
    preConnectCountRef.current = instanceCount;
    const previousCount = instanceCount;
    try {
      const config = await whatsappOfficialService.getSignupConfig();
      const fb = await loadFacebookSdk(config.appId, config.graphVersion);
      const extras: Record<string, unknown> = mode === 'coexistence'
        ? { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' }
        : { setup: {}, sessionInfoVersion: '3' };
      fb.login((response) => {
        const code = response.authResponse?.code;
        if (code) {
          codeReceivedRef.current = true;
        }
        if (!code) {
          if (signupFinishedRef.current) {
            onToast('success', 'Cadastro concluído na Meta — sincronizando o canal...');
            (async () => {
              const found = await pollForNewInstance(previousCount);
              if (!found) {
                onToast('error', 'O canal não apareceu ainda. Recarregue a página em instantes.');
                await onSuccess();
              }
              setConnecting(false);
            })();
            return;
          }
          setConnecting(false);
          onToast('error', 'Conexão cancelada antes de concluir o cadastro na Meta.');
          return;
        }
        (async () => {
          try {
            const payload: { code: string; wabaId?: string; phoneNumberId?: string } = { code };
            if (signupDataRef.current.wabaId) {
              payload.wabaId = signupDataRef.current.wabaId;
            }
            if (signupDataRef.current.phoneNumberId) {
              payload.phoneNumberId = signupDataRef.current.phoneNumberId;
            }
            await whatsappOfficialService.connect(payload);
            onToast('success', 'Conta oficial conectada com sucesso!');
            await onSuccess();
          }
          catch (error) {
            onToast('error', error instanceof Error ? error.message : 'Erro ao concluir a conexão.');
            await pollForNewInstance(previousCount);
          }
          finally {
            setConnecting(false);
          }
        })();
      }, {
        config_id: config.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras,
      });
    }
    catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Erro ao iniciar a conexão com a Meta.');
      setConnecting(false);
    }
  }, [blocked, instanceCount, loadFacebookSdk, onSuccess, onToast, pollForNewInstance]);

  return { connecting, connect };
}
