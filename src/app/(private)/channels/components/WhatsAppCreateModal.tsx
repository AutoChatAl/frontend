'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { authService } from '@/services/auth.service';
import type { WhatsappConnectResponse } from '@/types/Channel';

interface WhatsAppCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name?: string; autoConnect?: boolean }) => Promise<{ channel: { id: string } }>;
  onConnect: (channelId: string, phone?: string) => Promise<WhatsappConnectResponse>;
}

type ModalState = 'form' | 'creating' | 'connecting' | 'connected';

export default function WhatsAppCreateModal({
  isOpen,
  onClose,
  onCreate,
  onConnect,
}: WhatsAppCreateModalProps) {
  const [state, setState] = useState<ModalState>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createdChannelId = useRef<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isOpen) {
      esRef.current?.close();
      esRef.current = null;
      setTimeout(() => {
        setState('form');
        setName('');
        setPhone('');
        setQrCode(null);
        setPairingCode(null);
        setError(null);
        createdChannelId.current = null;
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (state !== 'connecting' || !createdChannelId.current) return;
    const token = authService.getToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${apiUrl}/channels/whatsapp/${createdChannelId.current}/events?token=${encodeURIComponent(token || '')}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('connected', () => {
      setState('connected');
      es.close();
      setTimeout(() => onClose(), 2000);
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [state, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Por favor, insira um nome para a instância');
      return;
    }

    try {
      setState('creating');
      setError(null);

      const response = await onCreate({
        name: name.trim(),
        autoConnect: false,
      });

      createdChannelId.current = response.channel.id;
      setState('connecting');
      const phoneNumber = phone.trim() || undefined;
      const connectResponse = await onConnect(response.channel.id, phoneNumber);

      if (connectResponse.ok && connectResponse.result?.raw?.instance) {
        const { instance } = connectResponse.result.raw;
        const qr = instance.qrcode && instance.qrcode.trim() !== '' ? instance.qrcode : null;
        const pair = instance.paircode && typeof instance.paircode === 'string' && instance.paircode.trim() !== '' ? instance.paircode : null;

        setQrCode(qr);
        setPairingCode(pair);

        const isConnected = instance.status === 'open' || connectResponse.result.raw.connected === true;
        if (isConnected) {
          setState('connected');
        }
      } else {
        setError('Erro ao obter código de conexão');
        setState('form');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado, tente novamente mais tarde.');
      setState('form');
    }
  };

  const renderContent = () => {
    switch (state) {
    case 'form':
      return (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="name"
            label="Nome da Instância *"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Atendimento Principal"
            required
          />

          <div>
            <Input
              id="phone"
              label="Número do WhatsApp (opcional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 5511999999999"
            />
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {phone ? '📱 Será gerado um código de pareamento numérico' : '📸 Será gerado um QR Code para escanear'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <Button type="button" onClick={onClose} variant="secondary" className="flex-1 justify-center">
                Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1 justify-center">
                Criar Instância
            </Button>
          </div>
        </form>
      );

    case 'creating':
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="relative w-16 h-16 text-emerald-500 animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Criando instância...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Aguarde alguns instantes</p>
        </div>
      );

    case 'connecting':
      return (
        <div className="flex flex-col items-center py-6">
          {qrCode && (
            <div className="w-full max-w-sm">
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800 mb-6">
                <div className="bg-white p-4 rounded-xl mb-4 shadow-inner">
                  <img src={qrCode} alt="QR Code" className="w-full h-auto" />
                </div>
                <div className="space-y-3">
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
              </div>
            </div>
          )}

          {pairingCode && (
            <div className="w-full max-w-sm">
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
                    <p className="text-sm text-gray-700 dark:text-gray-300">Escolha <span className="font-semibold">"Conectar com número de telefone"</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Digite o código: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{pairingCode}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!qrCode && !pairingCode && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-xl animate-pulse"></div>
                <Loader2 className="relative w-16 h-16 text-emerald-500 animate-spin" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Gerando código de conexão...</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Aguarde alguns instantes</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 rounded-lg w-full mt-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}
        </div>
      );

    case 'connected':
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-2xl animate-pulse"></div>
            <CheckCircle className="relative w-20 h-20 text-emerald-500" />
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
        </div>
      );
    }
  };

  const getTitle = () => {
    switch (state) {
    case 'form':
      return 'Nova Instância WhatsApp';
    case 'creating':
      return 'Criando Instância';
    case 'connecting':
      return 'Conectar WhatsApp';
    case 'connected':
      return 'Sucesso!';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="p-6">
        {renderContent()}
      </div>
    </Modal>
  );
}
