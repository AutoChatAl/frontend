'use client';

import { useEffect, useState, useCallback } from 'react';
import { QrCode, Clock, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { subscriptionService } from '@/services/subscription.service';

interface PixData {
  paymentIntentId: string;
  clientSecret: string;
  qrCodeImageUrl: string | null;
  qrCodeString: string | null;
  expiresAt: string | null;
  amount: number;
  planName: string;
}

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planSlug: string;
  planName?: string;
}

export default function PixPaymentModal({ isOpen, onClose, planSlug, planName }: PixPaymentModalProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const loadPixData = useCallback(async () => {
    if (!planSlug) return;
    setLoading(true);
    setError(null);
    setPixData(null);

    const data = await subscriptionService.createPixIntent(planSlug);
    if (data) {
      setPixData(data);
    } else {
      setError('Não foi possível gerar o QR Code PIX. Tente novamente.');
    }
    setLoading(false);
  }, [planSlug]);

  useEffect(() => {
    if (isOpen && planSlug) {
      loadPixData();
    }
  }, [isOpen, planSlug, loadPixData]);

  // Countdown timer
  useEffect(() => {
    if (!pixData?.expiresAt) return;

    const tick = () => {
      const now = Date.now();
      const expiry = new Date(pixData.expiresAt!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pixData?.expiresAt]);

  const handleCopy = async () => {
    if (!pixData?.qrCodeString) return;
    await navigator.clipboard.writeText(pixData.qrCodeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setPixData(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Pagar com PIX" size="sm">
      <div className="space-y-4">
        {/* Plan info */}
        <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide">Plano</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{planName || pixData?.planName}</p>
          </div>
          {pixData && (
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {formatBRL(pixData.amount)}<span className="text-xs font-normal text-slate-500">/mês</span>
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerando QR Code...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button size="sm" variant="secondary" onClick={loadPixData}>
              <RefreshCw size={14} className="mr-1" /> Tentar novamente
            </Button>
          </div>
        )}

        {/* QR Code */}
        {pixData && !loading && (
          <>
            <div className="flex flex-col items-center gap-3">
              {pixData.qrCodeImageUrl ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pixData.qrCodeImageUrl}
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
                  <QrCode size={80} className="text-slate-400" />
                  <p className="text-xs text-slate-500">Use o código copia e cola abaixo</p>
                </div>
              )}

              {/* Expiry countdown */}
              {timeLeft && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Clock size={12} />
                  <span>Expira em: <strong>{timeLeft}</strong></span>
                </div>
              )}
            </div>

            {/* Copy code */}
            {pixData.qrCodeString && (
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Código PIX copia e cola:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={pixData.qrCodeString}
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 truncate font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 shrink-0"
                    title="Copiar código"
                  >
                    {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Como pagar:</p>
              <ol className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-none">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escolha pagar com PIX</li>
                <li>3. Escaneie o QR Code ou use o código copia e cola</li>
                <li>4. Confirme o pagamento — ativação é automática</li>
              </ol>
            </div>
          </>
        )}

        <Button variant="secondary" className="w-full justify-center" onClick={handleClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
}
