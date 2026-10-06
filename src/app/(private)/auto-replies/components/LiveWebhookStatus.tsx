'use client';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import Button from '@/components/Button';
import { channelsService } from '@/services/channels.service';
import type { InstagramWebhookSubscription } from '@/types/Channel';

type Status = 'loading' | 'active' | 'missing' | 'unknown';

function statusOf(subscription: InstagramWebhookSubscription): Status {
  if (subscription.fields === null) return 'unknown';
  return subscription.fields.includes('live_comments') ? 'active' : 'missing';
}

const TONE: Record<Exclude<Status, 'loading'>, string> = {
  active: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  missing: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  unknown: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
};

/**
 * Diz, antes de salvar, se a conta escolhida vai receber os comentários da live.
 *
 * A Meta só entrega `live_comments` para a conta que assinou o campo. Conta conectada
 * antes da feature não assinou, e a automação ficava em silêncio sem nenhuma pista —
 * aqui o problema aparece junto do botão que o resolve. Quando a Meta não responde a
 * leitura, a tela diz que não conseguiu confirmar em vez de afirmar que está desligado:
 * salvar a regra reassina de qualquer jeito.
 */
export default function LiveWebhookStatus({ channelId }: { channelId: string }) {
  const [status, setStatus] = useState<Status>('loading');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    channelsService
      .getInstagramWebhookSubscription(channelId)
      .then((subscription) => {
        if (!cancelled) setStatus(statusOf(subscription));
      })
      .catch(() => {
        if (!cancelled) setStatus('unknown');
      });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const activate = useCallback(async () => {
    setActivating(true);
    setError('');
    try {
      const subscription = await channelsService.resubscribeInstagramWebhooks(channelId);
      // A assinatura foi aceita (senão o backend devolve erro). Leitura indisponível
      // depois disso não é motivo para continuar dizendo "não confirmado".
      setStatus(subscription.fields === null ? 'active' : statusOf(subscription));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ativar a escuta de comentários.');
    } finally {
      setActivating(false);
    }
  }, [channelId]);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Verificando se a conta escuta comentários de live...
      </div>
    );
  }

  const copy = {
    active: {
      icon: <CheckCircle2 size={15} className="mt-0.5 shrink-0" />,
      title: 'Conta pronta para a live',
      text: 'Esta conta já escuta os comentários das suas transmissões.',
      button: null,
    },
    missing: {
      icon: <AlertTriangle size={15} className="mt-0.5 shrink-0" />,
      title: 'Esta conta ainda não escuta comentários de live',
      text: 'Sem isso a automação nunca dispara. Ative a escuta antes de começar a transmissão.',
      button: 'Ativar escuta',
    },
    unknown: {
      icon: <RefreshCw size={15} className="mt-0.5 shrink-0" />,
      title: 'Não foi possível confirmar a escuta de live',
      text: 'A Meta não respondeu à verificação. Ao salvar, a escuta é reativada automaticamente — ou reative agora.',
      button: 'Reativar escuta',
    },
  }[status];

  return (
    <div className={`rounded-xl border p-3 ${TONE[status]}`}>
      <div className="flex items-start gap-2.5">
        {copy.icon}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{copy.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed opacity-90">{copy.text}</p>
          {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
        </div>
        {copy.button && (
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={13} />}
            loading={activating}
            loadingText="Ativando..."
            onClick={() => void activate()}
            className="shrink-0"
          >
            {copy.button}
          </Button>
        )}
      </div>
    </div>
  );
}
