'use client';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import BrandLogo from '@/components/BrandLogo';
import Illustration from '@/components/Illustration';
import { referralService } from '@/services/referral.service';
import type { ReferralCodeInfo } from '@/types/Referral';
import { clearReferralCookie, isPlausibleReferralCode } from '@/utils/referralCode';

type InviteState = { status: 'loading' } | { status: 'valid'; info: ReferralCodeInfo } | { status: 'invalid' };

const STEPS = [
  { image: '/referral/step-share.png', title: 'Crie sua conta', text: 'Teste o Synq grátis por 7 dias, sem cartão.' },
  { image: '/referral/step-subscribe.png', title: 'Conecte seus canais', text: 'Ligue seu WhatsApp ou Instagram e deixe a IA atender seus clientes.' },
  { image: '/referral/step-earn.png', title: 'Assine com desconto', text: 'O desconto de indicação já entra na primeira fatura do plano.' },
];

interface InviteLandingProps {
  code: string;
}

/** Landing do convite — clara como a landing principal (DESIGN_SYSTEM.md §9.6). */
export default function InviteLanding({ code }: InviteLandingProps) {
  const [state, setState] = useState<InviteState>({ status: 'loading' });
  useEffect(() => {
    if (!isPlausibleReferralCode(code)) {
      setState({ status: 'invalid' });
      clearReferralCookie();
      return;
    }
    let active = true;
    referralService.getCodeInfo(code)
      .then((info) => {
        if (!active) return;
        if (info) {
          setState({ status: 'valid', info });
        }
        else {
          setState({ status: 'invalid' });
          clearReferralCookie();
        }
      })
      // Falha de rede não invalida o convite: o cadastro confere o código de novo.
      .catch(() => active && setState({ status: 'valid', info: { code, referrerFirstName: null, refereePercent: 5 } }));
    return () => {
      active = false;
    };
  }, [code]);

  const valid = state.status === 'valid' ? state.info : null;
  const percent = valid?.refereePercent ?? 5;
  const headline = state.status === 'invalid'
    ? 'Este convite não está mais ativo'
    : valid?.referrerFirstName
      ? `${valid.referrerFirstName} te convidou para o Synq`
      : 'Você foi convidado para o Synq';

  return (
    <div className="min-h-screen bg-white text-slate-900" data-theme="light">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[linear-gradient(to_bottom,#eef2ff_0%,#f4f6ff_45%,#ffffff_100%)]"/>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <header className="flex h-20 items-center">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={36} on="light"/>
            <span className="text-lg font-bold text-slate-900">Synq</span>
          </Link>
        </header>

        <main className="grid items-center gap-10 pb-16 pt-6 lg:grid-cols-2 lg:gap-16 lg:pt-12">
          <section className="space-y-6">
            {state.status !== 'invalid' && (
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Convite especial</p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {state.status === 'loading' ? <span className="inline-block h-12 w-80 max-w-full animate-pulse rounded-lg bg-slate-100"/> : headline}
            </h1>
            {state.status === 'invalid' ? (
              <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                O código de indicação deste link não existe mais. Você ainda pode criar sua conta e testar o Synq grátis por 7 dias.
              </p>
            ) : (
              <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                Teste grátis por 7 dias e, quando assinar, ganhe <strong className="font-semibold text-slate-900">{percent}% de desconto na primeira fatura</strong>.
                Atendimento com IA, campanhas e automações no WhatsApp e no Instagram, tudo num lugar só.
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={state.status === 'invalid' ? '/register' : `/register?ref=${encodeURIComponent(code)}`}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95"
              >
                {state.status === 'invalid' ? 'Criar conta grátis' : `Criar conta com ${percent}% de desconto`}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5"/>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Conhecer o Synq
              </Link>
            </div>
            {state.status !== 'invalid' && (
              <p className="text-xs text-slate-500">
                Código {code} · o desconto vale para quem assina o Synq pela primeira vez.
              </p>
            )}
          </section>

          <div className="flex justify-center lg:justify-end">
            <Illustration src="/referral/invite.png" width={560} height={467} priority className="h-auto w-full max-w-md lg:max-w-lg"/>
          </div>
        </main>

        {state.status !== 'invalid' && (
          <section className="mb-16 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900">Como funciona</h2>
            <ol className="mt-3 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.title} className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                    <Illustration src={step.image} width={48} height={48} className="max-h-12 w-auto"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
