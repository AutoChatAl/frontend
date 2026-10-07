'use client';
import { LifeBuoy, MessageCircle, MessagesSquare } from 'lucide-react';

import Button from '@/components/Button';

interface HelpContactCardProps {
  onTalkToSupport: () => void;
  whatsappLink: string | null;
  chatAvailable: boolean;
}

export default function HelpContactCard({ onTalkToSupport, whatsappLink, chatAvailable }: HelpContactCardProps) {
  if (!chatAvailable && !whatsappLink) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <LifeBuoy size={16}/>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Ainda precisa de ajuda?</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {whatsappLink
              ? 'Conte o que aconteceu. Pelo chat, uma pessoa da nossa equipe responde em até 24 horas. Como você está no teste grátis, também pode chamar a gente no WhatsApp.'
              : 'Conte o que aconteceu. Uma pessoa da nossa equipe responde por aqui em até 24 horas, e a conversa fica salva.'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {chatAvailable && (
          <Button size="sm" onClick={onTalkToSupport} icon={<MessagesSquare size={14}/>} className="flex-1 justify-center">
            Falar com o suporte
          </Button>
        )}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-emerald-200 transition-all hover:scale-105 hover:bg-emerald-700 active:scale-95 dark:shadow-none"
          >
            <MessageCircle size={14}/>
            Falar no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
