'use client';
import { Check, Lock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { whatsappHref } from '@/app/(public)/components/whatsappContact';

import { buildWhatsappMessage, DIAGNOSES } from '../diagnosis';
import type { DiagnosisOutcome } from '../types';
import HealthGauge from './HealthGauge';
import RichText from './RichText';

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
        <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-emerald-500" />
        {title}
      </h2>
      {children}
    </section>
  );
}

interface DiagnosisResultProps {
  outcome: DiagnosisOutcome;
}

/**
 * Tela final: cobre a conversa com o diagnóstico. Curta de propósito — nota,
 * o que foi identificado, quanto custa, como o Synq resolve e o que fica para a
 * conversa, e logo em seguida o botão do WhatsApp.
 *
 * No celular é uma coluna só. No computador o medidor vai para a esquerda e
 * acompanha a rolagem, enquanto o texto e o botão ficam à direita.
 */
export default function DiagnosisResult({ outcome }: DiagnosisResultProps) {
  const diagnosis = DIAGNOSES[outcome.primary];
  const secondary = outcome.secondary ? DIAGNOSES[outcome.secondary] : null;
  const chips = [diagnosis.tag, secondary?.tag].filter((chip): chip is string => chip !== undefined);
  const firstName = outcome.name.trim().split(/\s+/)[0] ?? '';

  const handleWhatsappClick = () => {
    window.dataLayer?.push({ event: 'diagnostico_whatsapp_click', diagnostico_perfil: outcome.primary });
  };

  return (
    <section
      aria-label="Resultado do diagnóstico"
      className="absolute inset-0 z-20 animate-bubble-in overflow-y-auto bg-slate-100 dark:bg-slate-900"
    >
      <div className="bg-emerald-700 text-white dark:bg-slate-800">
        <div className="mx-auto max-w-5xl px-5 pb-14 pt-8 lg:px-8 lg:pb-20 lg:pt-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200 dark:text-emerald-400">
            Diagnóstico de {firstName}
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight lg:max-w-3xl lg:text-3xl">{diagnosis.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50 lg:max-w-2xl lg:text-base dark:text-slate-400">
            {diagnosis.lead}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:px-8">
        <HealthGauge
          score={outcome.healthScore}
          className="relative mx-4 -mt-8 lg:sticky lg:top-6 lg:col-span-2 lg:mx-0 lg:-mt-12"
        />

        <div className="space-y-7 px-5 pb-10 pt-7 lg:col-span-3 lg:px-0 lg:pt-8">
          <ResultSection title="O que identificamos">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{diagnosis.summary}</p>
            {secondary && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Também apareceu um segundo ponto de atenção:{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">{secondary.tag.toLowerCase()}</strong>.
              </p>
            )}
          </ResultSection>

          <ResultSection title="O que isso está custando">
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-4 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
              {diagnosis.costs.map((cost) => (
                <li key={cost} className="flex items-start gap-3 py-3 text-sm text-slate-600 dark:text-slate-400">
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  {cost}
                </li>
              ))}
            </ul>
          </ResultSection>

          <ResultSection title="Como o Synq resolve">
            <ul className="space-y-2">
              {diagnosis.solutions.map((solution) => (
                <li
                  key={solution}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {solution}
                </li>
              ))}
            </ul>
          </ResultSection>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Lock size={12} />
              O que fica para a conversa
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <RichText text={diagnosis.meeting} />
            </p>
          </div>

          <div>
            <a
              href={whatsappHref(buildWhatsappMessage(outcome))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsappClick}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 dark:shadow-none"
            >
              <MessageCircle size={20} />
              Falar com a gente no WhatsApp
            </a>
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              Abre o WhatsApp com sua mensagem pronta. É só tocar em enviar.
            </p>
            <Link
              href="/"
              className="mt-4 block rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-center text-sm text-slate-600 transition-colors hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              Prefiro conhecer a plataforma primeiro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
