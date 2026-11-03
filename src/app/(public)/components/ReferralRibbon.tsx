'use client';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { referralService } from '@/services/referral.service';
import type { ReferralCodeInfo } from '@/types/Referral';
import { readReferralCookie } from '@/utils/referralCode';

/** Lembra, na landing, que quem chegou por um link de indicação tem desconto. Some se o código não valer. */
export default function ReferralRibbon() {
  const [info, setInfo] = useState<ReferralCodeInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const code = readReferralCookie();
    if (!code) return;
    let active = true;
    referralService.getCodeInfo(code)
      .then((result) => {
        if (active) setInfo(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  if (!info || dismissed) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 flex justify-center sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-white/95 px-4 py-3 shadow-lg shadow-indigo-100 backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-300">
        <p className="text-sm text-slate-700">
          {info.referrerFirstName ? `${info.referrerFirstName} te indicou: ` : 'Você foi indicado: '}
          <strong className="font-semibold text-slate-900">{info.refereePercent}% de desconto na primeira fatura.</strong>
        </p>
        <Link
          href={`/register?ref=${encodeURIComponent(info.code)}`}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Criar conta
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar aviso de indicação"
          className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <X size={16} aria-hidden="true"/>
        </button>
      </div>
    </div>
  );
}
