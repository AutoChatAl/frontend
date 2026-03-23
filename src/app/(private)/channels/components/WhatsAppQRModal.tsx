'use client';

import { RefreshCw, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { authService } from '@/services/auth.service';
import type { WhatsAppStatusResponse, WhatsAppQRCodeRawResponse } from '@/types/Channel';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  onGetQRCode: (channelId: string) => Promise<WhatsAppQRCodeRawResponse>;
  onCheckStatus: (channelId: string) => Promise<WhatsAppStatusResponse>;
}

export default function WhatsAppQRModal({
  isOpen,
  onClose,
  channelId,
  onGetQRCode,
  onCheckStatus,
}: WhatsAppQRModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (isOpen && channelId) {
      loadQRCode();
    }
    if (!isOpen) {
      esRef.current?.close();
      esRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, channelId]);

  useEffect(() => {
    if (!isOpen || !channelId || isConnected) return;
    const token = authService.getToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${apiUrl}/channels/whatsapp/${channelId}/events?token=${encodeURIComponent(token || '')}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('connected', () => {
      setIsConnected(true);
      es.close();
      setTimeout(() => onClose(), 2000);
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isOpen, channelId, isConnected, onClose]);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await onGetQRCode(channelId);

      if (response.ok) {
        const qr = response.qr || response.raw?.instance?.qrcode || null;
        const paircode = response.raw?.instance?.paircode || response.raw?.paircode;

        setQrCode(qr);
        setPairingCode(
          typeof paircode === 'string' && paircode.trim() !== ''
            ? paircode
            : null,
        );

        const status = response.raw?.instance?.status || response.raw?.status;
        setIsConnected(status === 'open');
      } else {
        setError('Erro ao obter QR Code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter QR Code');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await onCheckStatus(channelId);

      if (response.ok) {
        if (response.connected) {
          setIsConnected(true);
          setTimeout(() => {
            onClose();
          }, 2000);
        } else if (response.status) {
          const { state } = response.status;
          if (state === 'open' || response.status.jid) {
            setIsConnected(true);
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }
      }
    } catch (_err) {
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleRefresh = () => {
    loadQRCode();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conectar WhatsApp">
      <div className="p-6">
        {isConnected ? (
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
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Carregando...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
                <Button onClick={handleRefresh} variant="primary">
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {qrCode && (
                  <div className="w-full max-w-sm mb-6">
                    <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="bg-white p-4 rounded-xl mb-4 shadow-inner">
                        <Image
                          src={qrCode}
                          alt="QR Code"
                          width={300}
                          height={300}
                          className="w-full h-auto"
                        />
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
                  <div className="w-full max-w-sm mb-6">
                    <div className={`bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 ${qrCode ? 'mt-4' : ''}`}>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                        {qrCode ? 'Ou use o código de pareamento' : 'Código de pareamento'}
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
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={handleRefresh}
                    variant="secondary"
                    icon={<RefreshCw size={16} />}
                    disabled={loading}
                  >
                    Atualizar
                  </Button>
                  <Button
                    onClick={checkStatus}
                    variant="primary"
                    disabled={checkingStatus}
                  >
                    {checkingStatus ? 'Verificando...' : 'Verificar Status'}
                  </Button>
                </div>

                {checkingStatus && (
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verificando conexão...
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
