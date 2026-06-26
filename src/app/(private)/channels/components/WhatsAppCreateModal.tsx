'use client';
import { ArrowLeft, CheckCircle, KeyRound, Loader2, QrCode } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService } from '@/services/auth.service';
import type { WhatsappConnectResponse, WhatsAppStatusResponse } from '@/types/Channel';

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

const METHOD_OPTIONS: Array<{
    value: ConnectionMethod;
    icon: ReactNode;
    title: string;
    description: string;
}> = [
  {
    value: 'qr',
    icon: <QrCode size={20}/>,
    title: 'Conectar via QR Code',
    description: 'Escaneie um código com a câmera do WhatsApp.',
  },
  {
    value: 'code',
    icon: <KeyRound size={20}/>,
    title: 'Conectar via código',
    description: 'Receba um código para digitar no seu WhatsApp.',
  },
];

export default function WhatsAppCreateModal({ isOpen, onClose, onCreate, onConnect, onDelete, onCheckStatus }: WhatsAppCreateModalProps) {
  const [state, setState] = useState<ModalState>('form');
  const [method, setMethod] = useState<ConnectionMethod>('qr');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
    onDeleteRef.current(channelId).catch(() => {
    });
  };
  const markConnected = useCallback(() => {
    if (connectedRef.current)
      return;
    connectedRef.current = true;
    setState('connected');
    closeTimerRef.current = setTimeout(() => onCloseRef.current(), 5000);
  }, []);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (closeTimerRef.current)
        clearTimeout(closeTimerRef.current);
      if (createdChannelId.current && !connectedRef.current) {
        onDeleteRef.current(createdChannelId.current).catch(() => {
        });
        createdChannelId.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (!isOpen) {
      esRef.current?.close();
      esRef.current = null;
      setTimeout(() => {
        setState('form');
        setMethod('qr');
        setName('');
        setPhone('');
        setQrCode(null);
        setPairingCode(null);
        createdChannelId.current = null;
        connectedRef.current = false;
      }, 300);
    }
  }, [isOpen]);
  useEffect(() => {
    if (state !== 'connecting' || !createdChannelId.current)
      return;
    const channelId = createdChannelId.current;
    let active = true;
    let polling = false;
    const token = authService.getToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${apiUrl}/channels/whatsapp/${channelId}/events?token=${encodeURIComponent(token || '')}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.addEventListener('connected', () => {
      es.close();
      markConnected();
    });
    const poll = setInterval(async () => {
      if (!active || polling || connectedRef.current)
        return;
      polling = true;
      try {
        const res = await onCheckStatusRef.current(channelId);
        const isConnected = res.ok && (res.connected === true || res.status?.state === 'open' || !!res.status?.jid);
        if (isConnected)
          markConnected();
      }
      catch {
        // Ignora — tenta novamente no próximo ciclo.
      }
      finally {
        polling = false;
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
        name: name.trim(),
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
      if (connectResponse.ok && connectResponse.result?.raw?.instance) {
        const { instance } = connectResponse.result.raw;
        const qr = instance.qrcode && instance.qrcode.trim() !== '' ? instance.qrcode : null;
        const pair = instance.paircode && typeof instance.paircode === 'string' && instance.paircode.trim() !== '' ? instance.paircode : null;
        setQrCode(qr);
        setPairingCode(pair);
        const isConnected = instance.status === 'open' || connectResponse.result.raw.connected === true;
        if (isConnected) {
          markConnected();
        }
      }
      else {
        addToast('error', 'Erro ao obter código de conexão');
        setState(fallbackState);
      }
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Ocorreu um erro inesperado, tente novamente mais tarde.');
      setState(fallbackState);
    }
  };
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Por favor, insira um nome para a instância');
      return;
    }
    if (method === 'qr') {
      void startConnection();
    }
    else {
      setState('phone');
    }
  };
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      addToast('error', 'Por favor, insira o número do WhatsApp');
      return;
    }
    void startConnection(phone.trim());
  };
  const renderContent = () => {
    switch (state) {
    case 'form':
      return (<form onSubmit={handleFormSubmit} className="space-y-5">
        <Input id="name" label="Nome da Instância *" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Atendimento Principal" required/>

        <fieldset className="space-y-3">
          <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Como deseja conectar?</legend>
          {METHOD_OPTIONS.map((opt) => {
            const selected = method === opt.value;
            return (<label key={opt.value} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selected
              ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'}`}>
              <input type="radio" name="connection-method" value={opt.value} checked={selected} onChange={() => setMethod(opt.value)} className="sr-only"/>
              <span className={`shrink-0 mt-0.5 ${selected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{opt.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{opt.title}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.description}</span>
              </span>
              <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${selected ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                {selected && <span className="w-2 h-2 rounded-full bg-indigo-500"/>}
              </span>
            </label>);
          })}
        </fieldset>

        <ToastContainer toasts={toasts} onRemove={removeToast}/>
        <div className="flex gap-3 pt-6">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1 justify-center">
                Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 justify-center">
            {method === 'qr' ? 'Gerar QR Code' : 'Continuar'}
          </Button>
        </div>
      </form>);
    case 'phone':
      return (<form onSubmit={handlePhoneSubmit} className="space-y-5">
        <Input id="phone" label="Número do WhatsApp *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 5511999999999" hint="Inclua o código do país e o DDD, apenas números." required/>

        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            🔑 Vamos gerar um código de pareamento para você digitar no app do WhatsApp.
          </p>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast}/>
        <div className="flex gap-3 pt-6">
          <Button type="button" onClick={() => setState('form')} variant="secondary" icon={<ArrowLeft size={16}/>} className="justify-center">
                Voltar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 justify-center">
                Gerar código
          </Button>
        </div>
      </form>);
    case 'creating':
      return (<div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="relative w-16 h-16 text-emerald-500 animate-spin"/>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Criando instância...</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Aguarde alguns instantes</p>
      </div>);
    case 'connecting':
      return (<div className="flex flex-col items-center py-6">
        {qrCode && (<div className="w-full max-w-xs mb-6">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <Image src={qrCode} alt="QR Code" width={300} height={300} className="w-full h-auto"/>
          </div>
          <div className="space-y-3 mt-4 px-1">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Abra o WhatsApp no seu celular</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Toque em <span className="font-semibold">Mais opções</span> ou <span className="font-semibold">Configurações</span></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Selecione <span className="font-semibold">Aparelhos conectados</span></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Toque em <span className="font-semibold">Conectar um aparelho</span> e escaneie o QR Code</p>
            </div>
          </div>
        </div>)}

        {pairingCode && (<div className="w-full max-w-sm">
          <div className={`bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 ${qrCode ? 'mt-4' : ''}`}>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              {qrCode ? 'Ou conecte com código de pareamento' : 'Conecte com código de pareamento'}
            </h4>
            <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl mb-4 shadow-inner border-2 border-blue-200 dark:border-blue-700">
              <p className="text-3xl font-mono font-bold text-center text-blue-600 dark:text-blue-400 tracking-wider">
                {pairingCode}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Abra o WhatsApp no seu celular</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Toque em <span className="font-semibold">Mais opções</span> ou <span className="font-semibold">Configurações</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Selecione <span className="font-semibold">Aparelhos conectados</span> → <span className="font-semibold">Conectar um aparelho</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Escolha <span className="font-semibold">&ldquo;Conectar com número de telefone&rdquo;</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Digite o código: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{pairingCode}</span></p>
              </div>
            </div>
          </div>
        </div>)}

        {!qrCode && !pairingCode && (<div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="relative w-16 h-16 text-emerald-500 animate-spin"/>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Gerando código de conexão...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Aguarde alguns instantes</p>
        </div>)}

      </div>);
    case 'connected':
      return (<div className="flex flex-col items-center justify-center py-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-2xl animate-pulse"></div>
          <CheckCircle className="relative w-20 h-20 text-emerald-500"/>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Conectado com sucesso!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
              Sua instância do WhatsApp está conectada e pronta para uso.
        </p>
        <div className="mt-6 w-full max-w-sm">
          <Button onClick={onClose} variant="primary" className="w-full">
              Concluir
          </Button>
        </div>
      </div>);
    }
  };
  const getTitle = () => {
    switch (state) {
    case 'form':
      return 'Nova Instância WhatsApp';
    case 'phone':
      return 'Conectar via código';
    case 'creating':
      return 'Criando Instância';
    case 'connecting':
      return 'Conectar WhatsApp';
    case 'connected':
      return 'Sucesso!';
    }
  };
  return (<Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="sm">
    {renderContent()}
  </Modal>);
}
