'use client';
import { Check, Copy, Mail, MessageCircle, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import Illustration from '@/components/Illustration';
import Input from '@/components/Input';

interface ShareCardProps {
  code: string;
  link: string;
  isActive: boolean;
  refereePercent: number;
  onCopied: (what: 'link' | 'code') => void;
  onCopyFailed: () => void;
  className?: string;
}

function shareMessage(link: string, refereePercent: number): string {
  return `Estou usando o Synq para atender clientes no WhatsApp e no Instagram com IA. Crie sua conta pelo meu link e ganhe ${refereePercent}% de desconto na primeira fatura: ${link}`;
}

export default function ShareCard({ code, link, isActive, refereePercent, onCopied, onCopyFailed, className = '' }: ShareCardProps) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);
  const copy = async (what: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(what === 'link' ? link : code);
      setCopied(what);
      onCopied(what);
      setTimeout(() => setCopied(null), 2000);
    }
    catch {
      onCopyFailed();
    }
  };
  const message = shareMessage(link, refereePercent);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(`Ganhe ${refereePercent}% de desconto no Synq`)}&body=${encodeURIComponent(message)}`;

  return (
    <Card className={`flex gap-5 p-4 sm:p-5 ${className}`}>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Seu link de indicação</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Envie para outros negócios. Quem criar a conta pelo link já leva o seu código.
        </p>

        {!isActive && (
          <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            Seu código está desativado e não gera novas indicações. Fale com o suporte para entender o motivo.
          </p>
        )}

        <div className="mt-3 space-y-3">
          <Input
            id="link-indicacao"
            aria-label="Link de indicação"
            value={link}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            rightElement={(
              <button
                type="button"
                onClick={() => copy('link')}
                aria-label="Copiar link"
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                {copied === 'link' ? <Check size={16} aria-hidden="true"/> : <Copy size={16} aria-hidden="true"/>}
              </button>
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Código</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[13px] font-semibold tracking-wider text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              {code}
            </span>
            <Button variant="ghost" size="sm" icon={copied === 'code' ? <Check size={14}/> : <Copy size={14}/>} onClick={() => copy('code')}>
              {copied === 'code' ? 'Copiado' : 'Copiar código'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 dark:shadow-none"
            >
              <MessageCircle size={14} aria-hidden="true"/>
              Enviar no WhatsApp
            </a>
            <a
              href={emailHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              <Mail size={14} aria-hidden="true"/>
              Enviar por e-mail
            </a>
            {canNativeShare && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Share2 size={14}/>}
                onClick={() => {
                  navigator.share({ title: 'Synq', text: message, url: link }).catch(() => undefined);
                }}
              >
                Compartilhar
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="hidden w-40 shrink-0 items-center justify-center xl:flex">
        <Illustration src="/referral/hero.png" width={160} height={96} className="h-auto w-full"/>
      </div>
    </Card>
  );
}
