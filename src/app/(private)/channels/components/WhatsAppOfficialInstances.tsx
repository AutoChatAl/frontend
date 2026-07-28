'use client';
import { BadgeCheck, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Modal from '@/components/Modal';
import { ToastContainer, useToast } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { authService } from '@/services/auth.service';
import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import type { WhatsAppOfficialInstance } from '@/types/WhatsAppOfficial';

import AddChannelCard from './AddChannelCard';
import ChannelInstanceCard from './ChannelInstanceCard';

type ConnectMode = 'new' | 'coexistence';

const QUALITY_LABELS: Record<string, string> = {
  GREEN: 'Qualidade alta',
  YELLOW: 'Qualidade média',
  RED: 'Qualidade baixa',
  UNKNOWN: 'Qualidade pendente',
};

export default function WhatsAppOfficialInstances() {
  const [instances, setInstances] = useState<WhatsAppOfficialInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [modeChooserOpen, setModeChooserOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const { isInactive } = useSubscription();
  const { toasts, addToast, removeToast } = useToast();
  const sdkLoadedRef = useRef(false);
  const signupDataRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});
  const signupFinishedRef = useRef(false);
  const codeReceivedRef = useRef(false);
  const preConnectCountRef = useRef(0);
  const pollRef = useRef<((previousCount: number) => Promise<boolean>) | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      const data = await whatsappOfficialService.getInstances();
      setInstances(data);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao carregar canais oficiais.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const user = authService.getUser();
    setIsOwner(!user?.role || user.role === 'owner' || user.role === 'admin' || (user.permissions ?? []).includes('channels'));
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.data) {
            const next: { wabaId?: string; phoneNumberId?: string } = {};
            if (data.data.waba_id) next.wabaId = String(data.data.waba_id);
            if (data.data.phone_number_id) next.phoneNumberId = String(data.data.phone_number_id);
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
      } catch {
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const loadFacebookSdk = useCallback(async (appId: string, graphVersion: string): Promise<FacebookSdk> => {
    if (window.FB && sdkLoadedRef.current) return window.FB;
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
    if (!window.FB) throw new Error('SDK da Meta indisponível.');
    window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version: graphVersion });
    sdkLoadedRef.current = true;
    return window.FB;
  }, []);

  const pollForNewInstance = useCallback(async (previousCount: number) => {
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        const data = await whatsappOfficialService.getInstances();
        if (data.length > previousCount) {
          setInstances(data);
          addToast('success', 'Conta oficial conectada com sucesso!');
          return true;
        }
      } catch {
      }
    }
    return false;
  }, [addToast]);

  useEffect(() => {
    pollRef.current = pollForNewInstance;
  }, [pollForNewInstance]);

  const handleConnect = useCallback(async (mode: ConnectMode) => {
    if (isInactive) {
      addToast('error', 'Sua assinatura está inativa. Reative seu plano para conectar canais.');
      return;
    }
    setModeChooserOpen(false);
    setConnecting(true);
    signupDataRef.current = {};
    signupFinishedRef.current = false;
    codeReceivedRef.current = false;
    preConnectCountRef.current = instances.length;
    const previousCount = instances.length;
    try {
      const config = await whatsappOfficialService.getSignupConfig();
      const fb = await loadFacebookSdk(config.appId, config.graphVersion);
      const extras: Record<string, unknown> = mode === 'coexistence'
        ? { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' }
        : { setup: {}, sessionInfoVersion: '3' };
      fb.login(
        (response) => {
          const code = response.authResponse?.code;
          if (code) codeReceivedRef.current = true;
          if (!code) {
            if (signupFinishedRef.current) {
              addToast('success', 'Cadastro concluído na Meta — sincronizando o canal...');
              (async () => {
                const found = await pollForNewInstance(previousCount);
                if (!found) {
                  addToast('error', 'O canal não apareceu ainda. Recarregue a página em instantes.');
                  await fetchInstances();
                }
                setConnecting(false);
              })();
              return;
            }
            setConnecting(false);
            addToast('error', 'Conexão cancelada antes de concluir o cadastro na Meta.');
            return;
          }
          (async () => {
            try {
              const payload: { code: string; wabaId?: string; phoneNumberId?: string } = { code };
              if (signupDataRef.current.wabaId) payload.wabaId = signupDataRef.current.wabaId;
              if (signupDataRef.current.phoneNumberId) payload.phoneNumberId = signupDataRef.current.phoneNumberId;
              await whatsappOfficialService.connect(payload);
              addToast('success', 'Conta oficial conectada com sucesso!');
              await fetchInstances();
            } catch (error) {
              addToast('error', error instanceof Error ? error.message : 'Erro ao concluir a conexão.');
              await pollForNewInstance(previousCount);
            } finally {
              setConnecting(false);
            }
          })();
        },
        {
          config_id: config.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras,
        },
      );
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao iniciar a conexão com a Meta.');
      setConnecting(false);
    }
  }, [isInactive, addToast, loadFacebookSdk, fetchInstances, instances.length, pollForNewInstance]);

  const handleRefresh = useCallback(async (id: string | number) => {
    try {
      await whatsappOfficialService.refreshHealth(String(id));
      await fetchInstances();
      addToast('success', 'Informações da conta atualizadas.');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao atualizar a conta.');
    }
  }, [fetchInstances, addToast]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await whatsappOfficialService.deleteInstance(deleteTarget);
      addToast('success', 'Conta oficial desconectada.');
      await fetchInstances();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao desconectar a conta.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading && instances.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isOwner && (
          <AddChannelCard
            title="Conectar API Oficial"
            subtitle="WhatsApp Business Platform (Meta)"
            colorClass="emerald"
            icon={<ShieldCheck size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />}
            onClick={() => setModeChooserOpen(true)}
            disabled={connecting}
          />
        )}

        {instances.map((instance) => {
          const config = instance.whatsappOfficial;
          const quality = config.qualityRating ?? 'UNKNOWN';
          const qualityLabel = QUALITY_LABELS[quality] ?? QUALITY_LABELS.UNKNOWN;
          return (
            <ChannelInstanceCard
              key={instance.id}
              id={instance.id}
              icon={(
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                  <BadgeCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              title={config.verifiedName || instance.name}
              subtitle={config.displayPhoneNumber || 'Número oficial'}
              status={instance.status === 'CONNECTED' ? 'connected' : 'disconnected'}
              statusLabel={`${qualityLabel}${config.messagingLimitTier ? ` · ${config.messagingLimitTier.replace('TIER_', 'Tier ')}` : ''}`}
              colorClass="emerald"
              createdBy={instance.createdBy}
              ownerName={instance.ownerName}
              onRefresh={handleRefresh}
              onDelete={(id) => setDeleteTarget(String(id))}
            />
          );
        })}
      </div>

      <Modal isOpen={modeChooserOpen} onClose={() => setModeChooserOpen(false)} title="Como você quer conectar?" size="md">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleConnect('new')}
            className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm">Número novo na Cloud API</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Para números que não estão em uso no aplicativo do WhatsApp. Registro direto na API Oficial, com throughput máximo.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleConnect('coexistence')}
            className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Smartphone size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm">Número que já uso no app WhatsApp Business</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Coexistência: o número continua funcionando no aplicativo e passa a funcionar também pela API Oficial.
                Requer app WhatsApp Business atualizado — o fluxo pedirá a leitura de um QR code no celular.
              </p>
            </div>
          </button>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        message="Deseja desconectar esta conta oficial? Os templates sincronizados serão removidos do sistema (permanecem na Meta)."
        confirmLabel="Desconectar"
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
