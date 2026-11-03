'use client';
import { useEffect, useState } from 'react';

import Input from '@/components/Input';
import { referralService } from '@/services/referral.service';
import type { ReferralCodeInfo } from '@/types/Referral';
import { isPlausibleReferralCode, normalizeReferralCode } from '@/utils/referralCode';

export type ReferralCheckStatus = 'empty' | 'checking' | 'valid' | 'invalid';

/** Valida o código no backend com espera curta (a rota pública tem limite por IP). */
export function useReferralCodeCheck(code: string): { status: ReferralCheckStatus; info: ReferralCodeInfo | null } {
  const [status, setStatus] = useState<ReferralCheckStatus>('empty');
  const [info, setInfo] = useState<ReferralCodeInfo | null>(null);
  useEffect(() => {
    if (!code) {
      setStatus('empty');
      setInfo(null);
      return;
    }
    if (!isPlausibleReferralCode(code)) {
      setStatus('invalid');
      setInfo(null);
      return;
    }
    setStatus('checking');
    let active = true;
    const timer = setTimeout(() => {
      referralService.getCodeInfo(code)
        .then((result) => {
          if (!active) return;
          setInfo(result);
          setStatus(result ? 'valid' : 'invalid');
        })
        .catch(() => {
          // Sem conseguir validar (rede, limite), não acusa erro: o backend confere no cadastro.
          if (active) setStatus('valid');
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code]);
  return { status, info };
}

interface ReferralCodeFieldProps {
  code: string;
  onChange: (code: string) => void;
  status: ReferralCheckStatus;
  info: ReferralCodeInfo | null;
  /** Veio do link de convite: mostra o selo em vez do campo aberto. */
  fromLink: boolean;
  error?: string | undefined;
}

export default function ReferralCodeField({ code, onChange, status, info, fromLink, error }: ReferralCodeFieldProps) {
  const [open, setOpen] = useState(false);
  const isValid = status === 'valid' && !!code;

  if (isValid && (fromLink || !open)) {
    const referrer = info?.referrerFirstName;
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {referrer ? `Indicação de ${referrer}` : 'Código de indicação aplicado'}
          </p>
          <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
            Você ganha {info?.refereePercent ?? 5}% de desconto na primeira fatura do plano. Código {code}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange('');
            setOpen(true);
          }}
          className="shrink-0 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300"
        >
          Remover
        </button>
      </div>
    );
  }

  if (!open && !code) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Tenho um código de indicação
      </button>
    );
  }

  const fieldError = error ?? (status === 'invalid' ? 'Não encontramos este código. Confira ou deixe o campo vazio.' : undefined);
  return (
    <Input
      id="codigo-indicacao"
      label="Código de indicação (opcional)"
      name="referralCode"
      value={code}
      onChange={(e) => onChange(normalizeReferralCode(e.target.value))}
      placeholder="Ex.: ANA7K4P"
      autoComplete="off"
      maxLength={40}
      hint={status === 'checking'
        ? 'Conferindo o código...'
        : isValid
          ? `${info?.referrerFirstName ? `Indicação de ${info.referrerFirstName}: ` : ''}${info?.refereePercent ?? 5}% de desconto na primeira fatura.`
          : 'Quem assina com um código ganha 5% de desconto na primeira fatura.'}
      error={fieldError}
    />
  );
}
