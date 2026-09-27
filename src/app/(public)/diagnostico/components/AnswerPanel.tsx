'use client';
import { SendHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { formatLocalPhone } from '../questions';
import type { ChoiceOption, ChoiceStep, InputStep, Step } from '../types';

interface ChoiceListProps {
  step: ChoiceStep;
  onChoose: (step: ChoiceStep, option: ChoiceOption) => void;
}

/**
 * Um toque já responde: não há botão de confirmar, a conversa segue na hora. A
 * partir do tablet as opções vão para duas colunas, para o painel não ocupar a tela.
 */
function ChoiceList({ step, onChoose }: ChoiceListProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {step.options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onChoose(step, option)}
          className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-left text-base text-slate-900 outline-none transition-colors hover:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:border-emerald-500 active:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-emerald-500 dark:active:bg-emerald-500/10"
        >
          <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

interface ContactInputProps {
  step: InputStep;
  onSubmit: (step: InputStep, value: string) => void;
}

function ContactInput({ step, onSubmit }: ContactInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (raw: string) => {
    setValue(step.inputType === 'tel' ? formatLocalPhone(raw) : raw);
    if (error) setError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!step.validate(trimmed)) {
      setError(step.error);
      inputRef.current?.focus();
      return;
    }
    if (step.requiresConsent && !consent) {
      setConsentError(true);
      return;
    }
    onSubmit(step, trimmed);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="sm:max-w-xl">
      <div
        className={`flex items-center gap-2 rounded-full border bg-white py-1.5 pl-5 pr-1.5 transition-colors dark:bg-slate-800 ${
          error
            ? 'border-red-400'
            : 'border-slate-200 focus-within:border-emerald-500 dark:border-slate-700 dark:focus-within:border-emerald-500'
        }`}
      >
        <input
          ref={inputRef}
          type={step.inputType}
          inputMode={step.inputType}
          autoComplete={step.autoComplete}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={step.placeholder}
          maxLength={step.maxLength}
          aria-label={step.label}
          aria-invalid={error !== ''}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-all hover:bg-emerald-700 active:scale-95"
        >
          <SendHorizontal size={18} />
        </button>
      </div>
      {error && <p className="mt-2 pl-5 text-xs text-red-500">{error}</p>}

      {step.requiresConsent && (
        <>
          <label
            className={`mt-3 flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 transition-colors dark:bg-slate-800 ${
              consent
                ? 'border-emerald-500 dark:border-emerald-500'
                : consentError
                  ? 'border-red-400 dark:border-red-400'
                  : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                if (event.target.checked) setConsentError(false);
              }}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-emerald-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              <strong className="font-semibold text-slate-900 dark:text-white">Autorizo o contato da Synq</strong> pelos
              dados informados e o uso deles para elaborar meu diagnóstico. Posso pedir a exclusão a qualquer momento
              (
              <Link href="/privacidade" target="_blank" className="text-emerald-700 underline dark:text-emerald-400">
                política de privacidade
              </Link>
              ).
            </span>
          </label>
          {consentError && (
            <p className="mt-2 text-xs text-red-500">Marque a autorização para receber seu diagnóstico.</p>
          )}
        </>
      )}
    </form>
  );
}

interface AnswerPanelProps {
  step: Step;
  onChoose: (step: ChoiceStep, option: ChoiceOption) => void;
  onSubmit: (step: InputStep, value: string) => void;
}

/** Painel fixo abaixo da conversa, no lugar do teclado do WhatsApp. */
export default function AnswerPanel({ step, onChoose, onSubmit }: AnswerPanelProps) {
  return (
    <div className="relative shrink-0 animate-bubble-in">
      {/* Esfuma o fim da conversa por trás do painel, em vez de cortar o balão em linha reta. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-slate-100 dark:from-slate-900"
      />
      <div className="max-h-[60dvh] overflow-y-auto bg-slate-100 px-4 pb-6 pt-2 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {step.label}
          </p>
          {step.kind === 'choice' ? (
            <ChoiceList step={step} onChoose={onChoose} />
          ) : (
            <ContactInput step={step} onSubmit={onSubmit} />
          )}
        </div>
      </div>
    </div>
  );
}
