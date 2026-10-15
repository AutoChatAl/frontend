'use client';
import { Check, Copy } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import ConnectStepList, { StepHighlight } from './ConnectStepList';

interface WhatsAppConnectGuideProps {
  qrCode?: string | null;
  pairingCode?: string | null;
  className?: string;
}

const QR_STEPS: ReactNode[] = [
  'Abra o WhatsApp no seu celular.',
  <>Toque em <StepHighlight>Mais opções</StepHighlight> ou em <StepHighlight>Configurações</StepHighlight>.</>,
  <>Entre em <StepHighlight>Aparelhos conectados</StepHighlight> e toque em <StepHighlight>Conectar um aparelho</StepHighlight>.</>,
  'Aponte a câmera do celular para este QR Code.',
];

const CODE_STEPS: ReactNode[] = [
  'Abra o WhatsApp no celular do número que você informou.',
  <>Toque em <StepHighlight>Mais opções</StepHighlight> ou em <StepHighlight>Configurações</StepHighlight> e entre em <StepHighlight>Aparelhos conectados</StepHighlight>.</>,
  <>Toque em <StepHighlight>Conectar um aparelho</StepHighlight> e depois em <StepHighlight>Conectar com número de telefone</StepHighlight>.</>,
  'Digite o código que aparece acima.',
];

export default function WhatsAppConnectGuide({ qrCode, pairingCode, className = '' }: WhatsAppConnectGuideProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
  }, []);

  const handleCopy = () => {
    if (!pairingCode || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(pairingCode).then(() => {
      setCopied(true);
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  if (!qrCode && !pairingCode) {
    return null;
  }

  return (<div className={`space-y-5 ${className}`}>
    {pairingCode && (<div className="space-y-4">
      <div className="rounded-lg border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-center">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Seu código de conexão</p>
        <p className="mt-1 select-all font-mono text-2xl font-bold tracking-widest text-slate-900 dark:text-white">{pairingCode}</p>
        <button type="button" onClick={handleCopy} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
          {copied ? <Check size={14}/> : <Copy size={14}/>}
          {copied ? 'Código copiado' : 'Copiar código'}
        </button>
      </div>
      <ConnectStepList steps={CODE_STEPS}/>
    </div>)}

    {qrCode && (<div className="space-y-4">
      {pairingCode && (<div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">ou escaneie o QR Code</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
      </div>)}
      <div className="mx-auto w-full max-w-60 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-white p-3">
        <Image src={qrCode} alt="QR Code para conectar o WhatsApp" width={240} height={240} className="h-auto w-full"/>
      </div>
      <ConnectStepList steps={QR_STEPS}/>
    </div>)}

    <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400" role="status">
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" aria-hidden/>
      Esperando você confirmar no celular. Esta tela atualiza sozinha.
    </div>
  </div>);
}
