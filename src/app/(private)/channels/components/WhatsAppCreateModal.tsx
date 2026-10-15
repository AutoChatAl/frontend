'use client';
import { ArrowLeft, CheckCircle, KeyRound, Loader2, QrCode, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService } from '@/services/auth.service';
import { channelsService } from '@/services/channels.service';
import type { WhatsappConnectResponse, WhatsAppStatusResponse } from '@/types/Channel';
import { extractPhoneDigits, formatPhoneNumber } from '@/utils/phone';

import WhatsAppConnectGuide from './WhatsAppConnectGuide';
import { useIsMobileDevice } from '../hooks/useIsMobileDevice';

interface WhatsAppCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: {
        name?: string;
        autoConnect?: boolean;
    }) => Promise<{
        channel: {
            id: string;
        };
    }>;
    onConnect: (channelId: string, phone?: string) => Promise<WhatsappConnectResponse>;
    onDelete: (channelId: string) => Promise<void>;
    onCheckStatus: (channelId: string) => Promise<WhatsAppStatusResponse>;
}

type ModalState = 'form' | 'phone' | 'creating' | 'connecting' | 'connected';
type ConnectionMethod = 'qr' | 'code';

interface MethodOption {
    value: ConnectionMethod;
    icon: ReactNode;
    title: string;
    description: string;
}

const QR_OPTION: MethodOption = {
  value: 'qr',
  icon: <QrCode size={20}/>,
  title: 'Escanear QR Code',
  description: 'Aponte a câmera do celular para a tela do computador.',
};

const CODE_OPTION: MethodOption = {
  value: 'code',
  icon: <KeyRound size={20}/>,
  title: 'Receber um código',
  description: 'Digite um código no WhatsApp do celular. Funciona mesmo se você está usando o Synq pelo celular.',
};

const NAME_MAX_LENGTH = 60;
const PHONE_MIN_DIGITS = 12;
const DEFAULT_COUNTRY_CODE = '55';

function buildChannelName(phone?: string): string {
  if (phone && phone.length >= 4) {
    return `WhatsApp final ${phone.slice(-4)}`;
  }
  const businessName = authService.getUser()?.workspace?.name?.trim();
  if (businessName) {
    return `WhatsApp ${businessName}`.slice(0, NAME_MAX_LENGTH).trim();
  }
  return 'WhatsApp';
}

function isConnectedStatus(response: WhatsAppStatusResponse): boolean {
  return response.ok && (response.connected === true || response.status?.state === 'open' || !!response.status?.jid);
}

export default function WhatsAppCreateModal({ isOpen, onClose, onCreate, onConnect, onDelete, onCheckStatus }: WhatsAppCreateModalProps) {
  const isMobile = useIsMobileDevice();
  const defaultMethod: ConnectionMethod = isMobile ? 'code' : 'qr';
  const [state, setState] = useState<ModalState>('form');
  const [method, setMethod] = useState<ConnectionMethod>(defaultMethod);
  const [phone, setPhone] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneError, setPhoneError] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const createdChannelId = useRef<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const connectedRef = useRef(false);
  const mountedRef = useRef(true);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  const onDeleteRef = useRef(onDelete);
  const onCheckStatusRef = useRef(onCheckStatus);

  useEffect(() => {
    onCloseRef.current = onClose;
    onDeleteRef.current = onDelete;
    onCheckStatusRef.current = onCheckStatus;
  });

  const rollbackInstance = (channelId: string) => {
    onDeleteRef.current(channelId).catch(() => {});
  };

  const markConnected = useCallback(() => {
    if (connectedRef.current) {
      return;
    }
    connectedRef.current = true;
    setState('connected');
    closeTimerRef.current = setTimeout(() => onCloseRef.current(), 5000);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (createdChannelId.current && !connectedRef.current) {
        onDeleteRef.current(createdChannelId.current).catch(() => {});
        createdChannelId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      return;
    }
    esRef.current?.close();
    esRef.current = null;
    const resetTimer = setTimeout(() => {
      setState('form');
      setMethod(defaultMethod);
      setPhone(DEFAULT_COUNTRY_CODE);
      setPhoneError('');
      setQrCode(null);
      setPairingCode(null);
      createdChannelId.current = null;
      connectedRef.current = false;
    }, 300);
    return () => clearTimeout(resetTimer);
  }, [isOpen, defaultMethod]);

  useEffect(() => {
    if (state !== 'connecting' || !createdChannelId.current) {
      return;
    }
    const channelId = createdChannelId.current;
    let active = true;
    let polling = false;
    const es = new EventSource(channelsService.getWhatsAppEventsUrl(channelId));
    esRef.current = es;
    es.addEventListener('connected', () => {
      es.close();
      markConnected();
    });
    const poll = setInterval(async () => {
      if (!active || polling || connectedRef.current) {
        return;
      }
      polling = true;
      const response = await onCheckStatusRef.current(channelId).catch(() => null);
      polling = false;
      if (response && isConnectedStatus(response)) {
        markConnected();
      }
    }, 3000);
    return () => {
      active = false;
      es.close();
      esRef.current = null;
      clearInterval(poll);
    };
  }, [state, markConnected]);

  const startConnection = async (phoneNumber?: string) => {
    const fallbackState: ModalState = phoneNumber ? 'phone' : 'form';
    try {
      setState('creating');
      const response = await onCreate({
        name: buildChannelName(phoneNumber),
        autoConnect: false,
      });
      createdChannelId.current = response.channel.id;
      if (!mountedRef.current) {
        createdChannelId.current = null;
        rollbackInstance(response.channel.id);
        return;
      }
      setState('connecting');
      const connectResponse = await onConnect(response.channel.id, phoneNumber);
      const instance = connectResponse.ok ? connectResponse.result?.raw?.instance : undefined;
      if (!instance) {
        addToast('error', 'Não conseguimos gerar o código de conexão. Tente de novo.');
        setState(fallbackState);
        return;
      }
      const qr = instance.qrcode && instance.qrcode.trim() !== '' ? instance.qrcode : null;
      const pair = typeof instance.paircode === 'string' && instance.paircode.trim() !== '' ? instance.paircode : null;
      setQrCode(qr);
      setPairingCode(pair);
      if (instance.status === 'open' || connectResponse.result?.raw?.connected === true) {
        markConnected();
      }
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Algo deu errado. Tente de novo em alguns instantes.');
      setState(fallbackState);
    }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (method === 'qr') {
      void startConnection();
      return;
    }
    setState('phone');
  };

  const handlePhoneSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (phone.length < PHONE_MIN_DIGITS) {
      setPhoneError('Digite o número completo, com DDD. Ex.: +55 (11) 99999-9999');
      return;
    }
    setPhoneError('');
    void startConnection(phone);
  };

  const methodOptions = isMobile ? [CODE_OPTION, QR_OPTION] : [QR_OPTION, CODE_OPTION];

  const renderLoading = (title: string) => (<div className="flex flex-col items-center justify-center py-10 text-center">
    <Loader2 className="h-10 w-10 text-emerald-500 animate-spin"/>
    <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-200">{title}</p>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Isso leva só alguns segundos.</p>
  </div>);

  const renderContent = () => {
    switch (state) {
    case 'form':
      return (<form onSubmit={handleFormSubmit} className="space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Use o número de WhatsApp que você já tem no celular. Ele continua funcionando normalmente no aparelho.
        </p>

        <fieldset className="space-y-3">
          <legend className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Como você prefere conectar?</legend>
          {methodOptions.map((option) => {
            const selected = method === option.value;
            const recommended = isMobile && option.value === 'code';
            return (<label key={option.value} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${selected
              ? 'border-indigo-400 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'}`}>
              <input type="radio" name="connection-method" value={option.value} checked={selected} onChange={() => setMethod(option.value)} className="sr-only"/>
              <span className={`mt-0.5 shrink-0 ${selected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{option.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{option.title}</span>
                  {recommended && <Badge type="success" text="Recomendado no celular" pill/>}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
              </span>
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                {selected && <span className="h-2 w-2 rounded-full bg-indigo-500"/>}
              </span>
            </label>);
          })}
        </fieldset>

        {isMobile && method === 'qr' && (<Callout tone="warning">
          Você está no celular? O QR Code precisa ser lido por outro aparelho. Se só tem este celular, escolha &ldquo;Receber um código&rdquo;.
        </Callout>)}

        <ToastContainer toasts={toasts} onRemove={removeToast}/>
        <div className="flex gap-3 pt-2">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1 justify-center">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 justify-center">
            {method === 'qr' ? 'Mostrar QR Code' : 'Continuar'}
          </Button>
        </div>
      </form>);
    case 'phone':
      return (<form onSubmit={handlePhoneSubmit} className="space-y-5">
        <Input id="phone" label="Qual é o número do WhatsApp?" type="tel" inputMode="numeric" autoComplete="tel" value={formatPhoneNumber(phone)} onChange={(event) => {
          setPhone(extractPhoneDigits(event.target.value));
          setPhoneError('');
        }} placeholder="+55 (11) 99999-9999" hint="Com DDD. O +55 já está preenchido para números do Brasil." error={phoneError} required/>

        <Callout tone="info" className="flex items-start gap-2">
          <Smartphone size={14} className="mt-0.5 shrink-0"/>
          <span>Vamos mostrar um código de letras e números. Você vai digitá-lo no WhatsApp desse número.</span>
        </Callout>

        <ToastContainer toasts={toasts} onRemove={removeToast}/>
        <div className="flex gap-3 pt-2">
          <Button type="button" onClick={() => setState('form')} variant="secondary" icon={<ArrowLeft size={16}/>} className="justify-center">
            Voltar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 justify-center">
            Gerar código
          </Button>
        </div>
      </form>);
    case 'creating':
      return renderLoading('Preparando a conexão...');
    case 'connecting':
      if (!qrCode && !pairingCode) {
        return renderLoading('Gerando o código de conexão...');
      }
      return (<div className="space-y-4">
        {isMobile && qrCode && !pairingCode && (<Callout tone="warning">
          Não dá para escanear a tela do próprio celular. Feche esta janela e escolha &ldquo;Receber um código&rdquo;.
        </Callout>)}
        <WhatsAppConnectGuide qrCode={qrCode} pairingCode={pairingCode}/>
      </div>);
    case 'connected':
      return (<div className="flex flex-col items-center justify-center py-6 text-center">
        <CheckCircle className="h-14 w-14 text-emerald-500"/>
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          Pronto! Seu WhatsApp está conectado.
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          O Synq já pode enviar e responder mensagens por esse número. Se quiser, mude o nome dele depois na tela de Canais.
        </p>
        <div className="mt-6 w-full max-w-sm">
          <Button onClick={onClose} variant="primary" className="w-full justify-center">
            Concluir
          </Button>
        </div>
      </div>);
    }
  };

  const titles: Record<ModalState, string> = {
    form: 'Conectar WhatsApp',
    phone: 'Conectar com código',
    creating: 'Preparando a conexão',
    connecting: 'Conectar WhatsApp',
    connected: 'WhatsApp conectado',
  };

  return (<Modal isOpen={isOpen} onClose={onClose} title={titles[state]} size="sm">
    {renderContent()}
  </Modal>);
}
