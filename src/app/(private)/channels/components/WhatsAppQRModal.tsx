'use client';
import { CheckCircle, KeyRound, Loader2, QrCode, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { useToast, ToastContainer } from '@/components/Toast';
import { channelsService } from '@/services/channels.service';
import type { WhatsappConnectResponse, WhatsAppStatusResponse, WhatsAppQRCodeRawResponse } from '@/types/Channel';
import { extractPhoneDigits, formatPhoneNumber } from '@/utils/phone';

import WhatsAppConnectGuide from './WhatsAppConnectGuide';
import { useIsMobileDevice } from '../hooks/useIsMobileDevice';

interface WhatsAppQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    channelId: string;
    onGetQRCode: (channelId: string) => Promise<WhatsAppQRCodeRawResponse>;
    onCheckStatus: (channelId: string) => Promise<WhatsAppStatusResponse>;
    onConnect?: (channelId: string, phone?: string) => Promise<WhatsappConnectResponse>;
    phoneNumber?: string | undefined;
}

type View = 'qr' | 'phone';

const PHONE_MIN_DIGITS = 12;
const DEFAULT_COUNTRY_CODE = '55';

function pickText(value: string | null | undefined): string | null {
  return value && value.trim() !== '' ? value : null;
}

function isConnectedStatus(response: WhatsAppStatusResponse): boolean {
  return response.ok && (response.connected === true || response.status?.state === 'open' || !!response.status?.jid);
}

export default function WhatsAppQRModal({ isOpen, onClose, channelId, onGetQRCode, onCheckStatus, onConnect, phoneNumber }: WhatsAppQRModalProps) {
  const isMobile = useIsMobileDevice();
  const canUseCode = !!onConnect;
  const [view, setView] = useState<View>(isMobile && canUseCode ? 'phone' : 'qr');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [phone, setPhone] = useState(() => extractPhoneDigits(phoneNumber ?? '') || DEFAULT_COUNTRY_CODE);
  const [phoneError, setPhoneError] = useState('');
  const { toasts, addToast, removeToast } = useToast();
  const onCloseRef = useRef(onClose);
  const onGetQRCodeRef = useRef(onGetQRCode);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
    onGetQRCodeRef.current = onGetQRCode;
  });

  useEffect(() => () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  }, []);

  const markConnected = useCallback(() => {
    setIsConnected(true);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => onCloseRef.current(), 2000);
  }, []);

  const loadQRCode = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    setPairingCode(null);
    try {
      const response = await onGetQRCodeRef.current(channelId);
      if (!response.ok) {
        setFailed(true);
        return;
      }
      setQrCode(pickText(response.qr) ?? pickText(response.raw?.instance?.qrcode));
      const status = response.raw?.instance?.status ?? response.raw?.status;
      if (status === 'open') {
        markConnected();
      }
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Não foi possível gerar o QR Code.');
      setFailed(true);
    }
    finally {
      setLoading(false);
    }
  }, [channelId, markConnected, addToast]);

  useEffect(() => {
    if (isOpen && channelId && view === 'qr') {
      void loadQRCode();
    }
  }, [isOpen, channelId, view, loadQRCode]);

  useEffect(() => {
    if (!isOpen || !channelId || isConnected) {
      return;
    }
    const es = new EventSource(channelsService.getWhatsAppEventsUrl(channelId));
    es.addEventListener('connected', () => {
      es.close();
      markConnected();
    });
    return () => es.close();
  }, [isOpen, channelId, isConnected, markConnected]);

  const requestPairingCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!onConnect) {
      return;
    }
    if (phone.length < PHONE_MIN_DIGITS) {
      setPhoneError('Digite o número completo, com DDD. Ex.: +55 (11) 99999-9999');
      return;
    }
    setPhoneError('');
    setLoading(true);
    setFailed(false);
    try {
      const response = await onConnect(channelId, phone);
      const instance = response.ok ? response.result?.raw?.instance : undefined;
      const code = pickText(instance?.paircode);
      if (!code) {
        addToast('error', 'Não conseguimos gerar o código. Confira o número e tente de novo.');
        return;
      }
      setQrCode(null);
      setPairingCode(code);
      if (instance?.status === 'open' || response.result?.raw?.connected === true) {
        markConnected();
      }
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Não foi possível gerar o código.');
    }
    finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await onCheckStatus(channelId);
      if (isConnectedStatus(response)) {
        markConnected();
      }
      else {
        addToast('error', 'Ainda não recebemos a confirmação. Siga os passos no celular e tente de novo.');
      }
    }
    catch {
      addToast('error', 'Não foi possível verificar a conexão agora.');
    }
    finally {
      setCheckingStatus(false);
    }
  };

  const switchView = (next: View) => {
    setView(next);
    setPairingCode(null);
    setQrCode(null);
    setFailed(false);
  };

  const renderBody = () => {
    if (isConnected) {
      return (<div className="flex flex-col items-center justify-center py-6 text-center">
        <CheckCircle className="mb-4 h-14 w-14 text-emerald-500"/>
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
          WhatsApp conectado de novo!
        </h3>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Tudo pronto. As mensagens e automações desse número voltaram a funcionar.
        </p>
      </div>);
    }
    if (loading) {
      return (<div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin"/>
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          {view === 'qr' ? 'Gerando o QR Code...' : 'Gerando o código...'}
        </p>
      </div>);
    }
    if (view === 'phone' && !pairingCode) {
      return (<form onSubmit={requestPairingCode} className="space-y-5">
        <Input id="reconnect-phone" label="Qual é o número do WhatsApp?" type="tel" inputMode="numeric" autoComplete="tel" value={formatPhoneNumber(phone)} onChange={(event) => {
          setPhone(extractPhoneDigits(event.target.value));
          setPhoneError('');
        }} placeholder="+55 (11) 99999-9999" hint="Com DDD. Use o mesmo número que estava conectado." error={phoneError} required/>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="button" variant="secondary" icon={<QrCode size={16}/>} onClick={() => switchView('qr')} className="justify-center">
            Usar QR Code
          </Button>
          <Button type="submit" variant="primary" className="flex-1 justify-center">
            Gerar código
          </Button>
        </div>
      </form>);
    }
    if (failed) {
      return (<div className="space-y-4 py-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">Não conseguimos gerar o QR Code agora.</p>
        <Button onClick={() => void loadQRCode()} variant="primary" icon={<RefreshCw size={16}/>} className="mx-auto">
          Tentar de novo
        </Button>
      </div>);
    }
    return (<div className="space-y-5">
      {isMobile && view === 'qr' && canUseCode && (<Callout tone="warning">
        Está no celular? Não dá para escanear a tela do próprio aparelho. Toque em &ldquo;Receber um código&rdquo;.
      </Callout>)}
      <WhatsAppConnectGuide qrCode={qrCode} pairingCode={pairingCode}/>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {view === 'qr' && canUseCode && (<Button variant="secondary" icon={<KeyRound size={16}/>} onClick={() => switchView('phone')} className="justify-center">
          Receber um código
        </Button>)}
        <Button variant="secondary" icon={<RefreshCw size={16}/>} onClick={() => (view === 'qr' ? void loadQRCode() : switchView('phone'))} className="justify-center">
          {view === 'qr' ? 'Gerar novo QR Code' : 'Gerar novo código'}
        </Button>
        <Button variant="primary" onClick={() => void checkStatus()} loading={checkingStatus} loadingText="Verificando..." className="justify-center">
          Já conectei
        </Button>
      </div>
    </div>);
  };

  return (<Modal isOpen={isOpen} onClose={onClose} title="Reconectar WhatsApp" size="sm">
    <ToastContainer toasts={toasts} onRemove={removeToast}/>
    {renderBody()}
  </Modal>);
}
