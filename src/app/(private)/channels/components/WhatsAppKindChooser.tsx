'use client';
import { ArrowRight, BadgeCheck, Loader2, MessageCircle, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import Badge from '@/components/Badge';

interface WhatsAppKindChooserProps {
    onPickQrCode?: (() => void) | undefined;
    onPickOfficial?: (() => void) | undefined;
    officialLoading?: boolean;
}

interface ChoiceProps {
    icon: ReactNode;
    iconClass: string;
    title: string;
    description: string;
    tag: string;
    footer?: ReactNode;
    loading?: boolean;
    onClick: () => void;
}

function Choice({ icon, iconClass, title, description, tag, footer, loading = false, onClick }: ChoiceProps) {
  return (<button type="button" onClick={onClick} disabled={loading} className="group flex w-full min-w-0 flex-col gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-left transition-colors cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 disabled:opacity-50 disabled:cursor-not-allowed">
    <span className="flex items-start gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconClass}`}>
        {loading ? <Loader2 size={16} className="animate-spin"/> : icon}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        <Badge type="neutral" text={tag} pill/>
      </span>
      <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-indigo-500 dark:group-hover:text-indigo-400"/>
    </span>
    <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
    {footer}
  </button>);
}

export default function WhatsAppKindChooser({ onPickQrCode, onPickOfficial, officialLoading = false }: WhatsAppKindChooserProps) {
  return (<div className={`grid gap-2 sm:gap-3 ${onPickQrCode && onPickOfficial ? 'md:grid-cols-2' : ''}`}>
    {onPickQrCode && (<Choice icon={<MessageCircle size={16}/>} iconClass="border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Quero atender e responder clientes automaticamente" tag="WhatsApp pelo QR Code" description="Use o número que você já tem no celular. Ideal para conversar com clientes, responder dúvidas e mandar mensagens do dia a dia. Fica pronto em 1 minuto." onClick={onPickQrCode}/>)}

    {onPickOfficial && (<Choice icon={<BadgeCheck size={16}/>} iconClass="border-teal-100 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400" title="Quero enviar promoções para muitos contatos" tag="WhatsApp Oficial" description="O WhatsApp Oficial da Meta, feito para disparos em grande quantidade com menos risco de bloqueio." loading={officialLoading} onClick={onPickOfficial} footer={<span className="flex items-start gap-1.5 rounded-lg border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300">
      <TriangleAlert size={13} className="mt-0.5 shrink-0"/>
      <span>Exige uma conta de empresa na Meta e modelos de mensagem aprovados por ela antes de enviar.</span>
    </span>}/>)}
  </div>);
}
