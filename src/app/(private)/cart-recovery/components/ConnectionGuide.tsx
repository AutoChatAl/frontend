'use client';

import { Check, CheckCircle2, Copy, Loader2, RotateCcw, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Input from '@/components/Input';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import { PLATFORM_LABELS, type CartRecoveryIntegration } from '@/types/CartRecovery';

import { PLATFORM_GUIDES } from './platformGuides';

const POLL_INTERVAL_MS = 4000;
const WAIT_LIMIT_MS = 10 * 60 * 1000;

type TestState = 'idle' | 'waiting' | 'received' | 'rejected' | 'timeout';

interface ConnectionGuideProps {
  integration: CartRecoveryIntegration;
  secret: string;
  onSecretChange: (value: string) => void;
  onBeforeTest: () => Promise<boolean>;
  onEventReceived: (fresh: CartRecoveryIntegration) => void;
}

interface GuideStepProps {
  number: number;
  children: ReactNode;
}

function GuideStep({ number, children }: GuideStepProps) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white dark:bg-indigo-500">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2 pt-0.5 text-sm text-slate-700 dark:text-slate-300">{children}</div>
    </li>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ConnectionGuide({ integration, secret, onSecretChange, onBeforeTest, onEventReceived }: ConnectionGuideProps) {
  const guide = PLATFORM_GUIDES[integration.platform];
  const platformLabel = PLATFORM_LABELS[integration.platform];
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const [preparing, setPreparing] = useState(false);
  const baselineRef = useRef<{ event: string | undefined; rejected: string | undefined; startedAt: number }>({
    event: undefined,
    rejected: undefined,
    startedAt: 0,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(integration.webhookUrl);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const startTest = useCallback(async () => {
    setPreparing(true);
    try {
      const ready = await onBeforeTest();
      if (!ready) return;
      const fresh = await cartRecoveryService.getIntegration(integration.id).catch(() => integration);
      baselineRef.current = {
        event: fresh.lastEventAt,
        rejected: fresh.lastRejectedAt,
        startedAt: Date.now(),
      };
      setTestState('waiting');
    } finally {
      setPreparing(false);
    }
  }, [integration, onBeforeTest]);

  useEffect(() => {
    if (testState !== 'waiting') return undefined;
    let cancelled = false;

    const poll = async () => {
      try {
        const fresh = await cartRecoveryService.getIntegration(integration.id);
        if (cancelled) return;
        if (fresh.lastEventAt && fresh.lastEventAt !== baselineRef.current.event) {
          setTestState('received');
          onEventReceived(fresh);
          return;
        }
        if (fresh.lastRejectedAt && fresh.lastRejectedAt !== baselineRef.current.rejected) {
          setTestState('rejected');
          return;
        }
      } catch {
        if (cancelled) return;
      }
      if (Date.now() - baselineRef.current.startedAt > WAIT_LIMIT_MS) {
        setTestState('timeout');
      }
    };

    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [testState, integration.id, onEventReceived]);

  const codeStepNumber = guide.steps.length + 2;
  const testStepNumber = guide.codeStep ? codeStepNumber + 1 : codeStepNumber;

  return (
    <div className="space-y-4">
      {integration.lastEventAt && testState === 'idle' && (
        <Callout tone="success">
          Conexão funcionando. Último aviso da {platformLabel} recebido em {formatDateTime(integration.lastEventAt)}.
        </Callout>
      )}

      <ol className="space-y-4">
        <GuideStep number={1}>
          <p>Copie o endereço abaixo. É por ele que a {platformLabel} vai avisar o Synq sobre cada venda.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
              {integration.webhookUrl}
            </code>
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
              className="justify-center"
            >
              {copied ? 'Copiado!' : 'Copiar endereço'}
            </Button>
          </div>
          {copyFailed && (
            <p className="text-xs text-red-500 dark:text-red-400">Não conseguimos copiar sozinhos. Selecione o endereço acima e copie manualmente.</p>
          )}
        </GuideStep>

        {guide.steps.map((text, index) => (
          <GuideStep key={text} number={index + 2}>
            <p>{text}</p>
          </GuideStep>
        ))}

        {guide.codeStep && (
          <GuideStep number={codeStepNumber}>
            <p>{guide.codeStep}</p>
            <Input
              value={secret}
              onChange={(e) => onSecretChange(e.target.value)}
              maxLength={2048}
              placeholder={guide.codeRequired ? 'Cole o código aqui' : 'Opcional'}
              aria-label={guide.codeLabel ?? 'Código de segurança'}
            />
            {guide.codeRequired && !secret.trim() && (
              <Callout tone="warning">
                Sem este código, qualquer pessoa que descobrir o endereço poderia mandar avisos falsos. Cole o código para proteger sua conta.
              </Callout>
            )}
          </GuideStep>
        )}

        <GuideStep number={testStepNumber}>
          <p className="font-medium text-slate-900 dark:text-white">
            Teste agora: faça uma compra de teste ou gere um Pix na {platformLabel}.
          </p>

          {testState === 'idle' && (
            <Button size="sm" onClick={startTest} loading={preparing} loadingText="Preparando...">
              Começar o teste
            </Button>
          )}

          {testState === 'waiting' && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Loader2 size={14} className="shrink-0 animate-spin" />
              <span>Esperando o aviso da {platformLabel}... Pode deixar esta janela aberta enquanto faz o teste.</span>
            </div>
          )}

          {testState === 'received' && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Recebemos! Sua integração está funcionando.</span>
            </div>
          )}

          {testState === 'rejected' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                <span>
                  Chegou um aviso da {platformLabel}, mas o código de segurança não confere. Confira o código do passo {codeStepNumber} e teste de novo.
                </span>
              </div>
              <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={startTest} loading={preparing}>
                Testar de novo
              </Button>
            </div>
          )}

          {testState === 'timeout' && (
            <div className="space-y-2">
              <Callout tone="warning">
                Ainda não recebemos nada. Confira se o endereço foi colado inteiro na {platformLabel} e se os avisos de venda estão marcados.
              </Callout>
              <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={startTest} loading={preparing}>
                Testar de novo
              </Button>
            </div>
          )}
        </GuideStep>
      </ol>
    </div>
  );
}
