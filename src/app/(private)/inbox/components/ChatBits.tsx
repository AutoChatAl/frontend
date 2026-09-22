'use client';
import { BadgeCheck, ExternalLink, Instagram, MessageCircle } from 'lucide-react';
import { useState } from 'react';

import Badge from '@/components/Badge';
import type { InboxChannelType, InboxMessageInteractive } from '@/types/Inbox';
import { getInitials } from '@/utils/displayName';

// Vem do utilitário compartilhado: a versão que vivia aqui indexava por unidade
// UTF-16 e cortava emoji e letra decorativa no meio. Reexportado porque a inbox
// inteira já importa estes nomes daqui.
export { getInitials, normalizeDisplayName } from '@/utils/displayName';

export function Avatar({
  name,
  identifier,
  avatarUrl,
  size = 44,
}: {
    name?: string | null | undefined;
    identifier?: string | null | undefined;
    avatarUrl?: string | null | undefined;
    size?: number;
}) {
  // Guarda a URL que falhou, não um booleano: o avatar do cabeçalho e o do painel
  // de detalhes são a mesma instância enquanto se troca de conversa, e um flag
  // simples ficava preso em `true` — uma foto quebrada derrubava a de todas as
  // conversas abertas depois dela.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!avatarUrl && failedUrl !== avatarUrl;
  return (<div className="shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center" style={{ width: size, height: size }}>
    {showImage ? (
      // eslint-disable-next-line @next/next/no-img-element -- URLs de avatar de CDN dinâmico (IG/WhatsApp) não suportam next/image
      <img key={avatarUrl} src={avatarUrl as string} alt={name || 'Contato'} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setFailedUrl(avatarUrl ?? null)}/>
    ) : (<span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
      {getInitials(name, identifier)}
    </span>)}
  </div>);
}

export const CHANNEL_LABEL: Record<InboxChannelType, string> = {
  WHATSAPP: 'WhatsApp',
  WHATSAPP_OFFICIAL: 'WhatsApp Oficial',
  INSTAGRAM: 'Instagram',
};

/**
 * O rótulo identifica o canal que recebeu a mensagem — o ícone já diz a
 * plataforma. Sem um rótulo disponível (canal apagado), cai no nome da
 * plataforma para não ficar um selo vazio.
 */
export function channelBadge(type: InboxChannelType, channelLabel?: string | null) {
  const label = channelLabel?.trim() || CHANNEL_LABEL[type];
  if (type === 'INSTAGRAM') {
    return <Badge type="instagram" text={label} icon={Instagram} pill/>;
  }
  // Mesma cor do WhatsApp (é o mesmo app para o contato), com selo distinguindo
  // a API Oficial da conexão via QR Code.
  if (type === 'WHATSAPP_OFFICIAL') {
    return <Badge type="whatsapp" text={label} icon={BadgeCheck} pill/>;
  }
  return <Badge type="whatsapp" text={label} icon={MessageCircle} pill/>;
}

/**
 * Marcador que o provider do WhatsApp manda ao anunciar um álbum: uma mensagem
 * própria, sem mídia, com um texto em inglês do tipo "Album: 2 images". As fotos
 * chegam logo depois, uma mensagem cada — exibir o marcador só repetiria em outro
 * idioma o que o próprio balão seguinte mostra.
 *
 * O webhook já descarta os novos; esta checagem esconde os que ficaram gravados
 * antes disso.
 */
const ALBUM_PLACEHOLDER = /^album:\s*\d+\s*(images?|photos?|videos?|items?|medias?)$/i;

export function isAlbumPlaceholder(message: { body: string; mediaType?: string | null }): boolean {
  if (message.mediaType) return false;
  return ALBUM_PLACEHOLDER.test(message.body.trim());
}

/**
 * Com o card desenhado, o marcador textual que a automação grava no corpo
 * (`[Saber mais: https://…]`) vira ruído — o botão já mostra a mesma coisa.
 */
export function stripInteractiveMarker(body: string): string {
  return body.replace(/\s*\[[^\]]+\]\s*$/, '').trim();
}

/**
 * Texto que sobra para o balão depois do card.
 *
 * No Instagram o generic template substitui a mensagem de texto — o título do
 * card já é o texto enviado, então repetir acima duplicaria a frase. No botão de
 * URL do WhatsApp é o contrário: o texto é a mensagem e o botão vem anexado.
 */
export function bodyForBubble(body: string, interactive?: InboxMessageInteractive | null): string {
  if (!interactive) return body;
  // Só o template que substituiu a mensagem some daqui; card enviado depois de um
  // texto (resposta da IA) mantém as duas partes, como o contato viu.
  if (interactive.replacesBody) return '';
  return stripInteractiveMarker(body);
}

/**
 * Desenha o botão/card exatamente como o contato viu na plataforma: botão de URL
 * no WhatsApp, generic template no Instagram.
 */
export function InteractiveContent({
  interactive,
  outgoing,
}: {
    interactive: InboxMessageInteractive;
    outgoing: boolean;
}) {
  // Resposta rápida não é card: são chips que o contato toca, soltos sob a mensagem.
  if (interactive.kind === 'quick_replies') {
    const chip = `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${outgoing
      ? 'border-white/40 text-white hover:bg-white/10'
      : 'border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`;
    return (<div className="mt-2 flex flex-wrap gap-1.5">
      {interactive.buttons.map((button, index) => (button.url ? (
        <a key={`${button.label}-${index}`} href={button.url} target="_blank" rel="noreferrer" className={chip}>
          {button.label}
        </a>
      ) : (
        <span key={`${button.label}-${index}`} className={chip}>{button.label}</span>
      )))}
    </div>);
  }

  const hasHeader = interactive.kind === 'card' && !!(interactive.imageUrl || interactive.title || interactive.subtitle);
  const shell = outgoing
    ? 'border-white/25 bg-white/10'
    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40';
  const divider = outgoing ? 'divide-white/20' : 'divide-slate-200 dark:divide-slate-700';
  const topBorder = outgoing ? 'border-white/20' : 'border-slate-200 dark:border-slate-700';

  return (<div className={`mt-1.5 overflow-hidden rounded-xl border ${shell}`}>
    {interactive.kind === 'card' && interactive.imageUrl && (
      // eslint-disable-next-line @next/next/no-img-element -- imagem de card vinda do provider, sem host fixo
      <img src={interactive.imageUrl} alt={interactive.title || 'Card'} className="h-32 w-full object-cover"/>
    )}
    {hasHeader && (interactive.title || interactive.subtitle) && (<div className="px-3 py-2">
      {interactive.title && (<p className={`text-[13px] font-semibold ${outgoing ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
        {interactive.title}
      </p>)}
      {interactive.subtitle && (<p className={`text-xs ${outgoing ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
        {interactive.subtitle}
      </p>)}
    </div>)}
    <div className={`divide-y ${divider} ${hasHeader ? `border-t ${topBorder}` : ''}`}>
      {interactive.buttons.map((button, index) => (button.url ? (<a key={`${button.label}-${index}`} href={button.url} target="_blank" rel="noreferrer" className={`flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors ${outgoing
        ? 'text-white hover:bg-white/10'
        : 'text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
        <ExternalLink size={13} className="shrink-0"/>
        {button.label}
      </a>) : (<span key={`${button.label}-${index}`} className={`block px-3 py-2 text-center text-[13px] font-medium ${outgoing ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
        {button.label}
      </span>)))}
    </div>
  </div>);
}

/** No balão sempre a hora: a data de cada bloco vive na badge de dia. */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** Na listagem: hora no dia corrente, "Ontem" no anterior, data nos mais antigos. */
export function formatConversationTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return formatMessageTime(iso);
  if (isSameDay(date, yesterday)) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Hoje';
  if (isSameDay(date, yesterday)) return 'Ontem';
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString('pt-BR', sameYear
    ? { day: '2-digit', month: 'long' }
    : { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Contagem regressiva do TTL da conversa: "23 h 12 min", "48 min", "expirada".
 * A janela é de 24h a partir da última mensagem e é renovada a cada nova.
 */
export function formatCountdown(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'expirada';
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days} d ${remainingHours} h` : `${days} d`;
  }
  if (hours >= 1) return `${hours} h ${minutes} min`;
  return `${Math.max(totalMinutes, 1)} min`;
}

/** "há 5 min", "há 2 h", "há 3 d" — usado nos rótulos de atendimento. */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}
