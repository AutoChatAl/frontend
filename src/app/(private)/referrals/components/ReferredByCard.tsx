'use client';
import { useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import { referralService } from '@/services/referral.service';
import type { ReferredBy, ReferralRules } from '@/types/Referral';
import { normalizeReferralCode } from '@/utils/referralCode';

interface ReferredByCardProps {
  referredBy: ReferredBy | null;
  canAttach: boolean;
  rules: ReferralRules;
  onChanged: (message: string) => Promise<void>;
  onError: (message: string) => void;
}

function discountLine(referredBy: ReferredBy, refereePercent: number): string {
  switch (referredBy.refereeDiscountStatus) {
  case 'used':
    return `Você ganhou ${refereePercent}% de desconto na primeira fatura.`;
  case 'forfeited':
    return 'A primeira fatura saiu sem o desconto de indicação, por isso ele não vale mais.';
  default:
    return `Seus ${refereePercent}% de desconto entram na primeira fatura quando você assinar.`;
  }
}

/** "Quem te indicou": mostra o benefício de quem foi indicado ou deixa aplicar um código. */
export default function ReferredByCard({ referredBy, canAttach, rules, onChanged, onError }: ReferredByCardProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  if (referredBy) {
    const remove = async () => {
      setLoading(true);
      try {
        await referralService.detach();
        await onChanged('Código de indicação removido.');
      }
      catch (e) {
        onError(e instanceof Error ? e.message : 'Não foi possível remover o código.');
      }
      finally {
        setLoading(false);
      }
    };
    return (
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {referredBy.referrerFirstName ? `Você foi indicado por ${referredBy.referrerFirstName}` : 'Você foi indicado'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{discountLine(referredBy, rules.refereePercent)}</p>
        </div>
        {referredBy.canChange && (
          <Button variant="ghost" size="sm" loading={loading} onClick={remove}>Remover código</Button>
        )}
      </Card>
    );
  }

  if (!canAttach) return null;

  const attach = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeReferralCode(code);
    if (normalized.length < 4) {
      setError('Digite o código de indicação que você recebeu.');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await referralService.attach(normalized, 'settings');
      setCode('');
      await onChanged(`Código aplicado. Você ganha ${rules.refereePercent}% na primeira fatura.`);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aplicar o código.');
    }
    finally {
      setLoading(false);
    }
  };
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recebeu um código de indicação?</h2>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        Aplique antes de assinar para ganhar {rules.refereePercent}% de desconto na primeira fatura.
      </p>
      <form onSubmit={attach} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          id="aplicar-codigo-indicacao"
          aria-label="Código de indicação"
          value={code}
          onChange={(e) => {
            setCode(normalizeReferralCode(e.target.value));
            setError(undefined);
          }}
          placeholder="Ex.: ANA7K4P"
          maxLength={40}
          autoComplete="off"
          error={error}
          wrapperClassName="flex-1"
        />
        <Button type="submit" loading={loading} loadingText="Aplicando...">Aplicar código</Button>
      </form>
    </Card>
  );
}
