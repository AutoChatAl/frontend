'use client';
import {
  BadgeCheck,
  CircleX,
  FileText,
  MousePointerClick,
  Pointer,
  Send,
  ShoppingCart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';

import Button from '@/components/Button';
import CardEmptyState from '@/components/CardEmptyState';
import { SkeletonRows } from '@/components/Skeleton';
import type { JourneyEvent, JourneyTimeline } from '@/types/Journey';

import {
  BROWSER_LABELS,
  DEVICE_LABELS,
  IN_APP_LABELS,
  ORDER_EVENT_META,
  OS_LABELS,
  formatCount,
  formatDayHeading,
  formatLocation,
  formatMoney,
  formatTime,
  sourceLabel,
  type OrderTone,
} from './meta';

interface JourneyTimelineViewProps {
  timeline: JourneyTimeline | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface EventPresentation {
  icon: LucideIcon;
  tone: string;
  title: string;
  detail: string | null;
}

const TONES = {
  neutral: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
  link: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  site: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  positive: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  negative: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  pending: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

const ORDER_ICONS: Record<OrderTone, LucideIcon> = {
  positive: BadgeCheck,
  negative: CircleX,
  pending: ShoppingCart,
};

function joinDetails(parts: (string | null | undefined)[]): string | null {
  const filled = parts.filter((part): part is string => !!part);
  return filled.length > 0 ? filled.join(' · ') : null;
}

function present(event: JourneyEvent): EventPresentation {
  switch (event.type) {
  case 'LINK_SENT':
    return {
      icon: Send,
      tone: TONES.neutral,
      title: 'Recebeu um link',
      detail: joinDetails([event.target, sourceLabel(event.source), event.campaign]),
    };
  case 'LINK_CLICKED':
    return {
      icon: MousePointerClick,
      tone: TONES.link,
      title: 'Clicou no link',
      detail: joinDetails([
        event.target,
        `${DEVICE_LABELS[event.device]} ${OS_LABELS[event.os]}`,
        event.inApp ? IN_APP_LABELS[event.inApp] : BROWSER_LABELS[event.browser],
        formatLocation(event.city, event.region, event.country),
      ]),
    };
  case 'SITE_EVENT':
    if (event.siteEvent === 'PAGE_VIEW') {
      return {
        icon: FileText,
        tone: TONES.site,
        title: `Visitou ${event.title ?? event.path}`,
        detail: joinDetails([`${event.host}${event.path}`, event.referrerHost ? `veio de ${event.referrerHost}` : null]),
      };
    }
    return {
      icon: event.siteEvent === 'CLICK' ? Pointer : Sparkles,
      tone: TONES.site,
      title: event.siteEvent === 'CLICK' ? `Clicou em "${event.name ?? 'elemento'}"` : `Evento "${event.name ?? 'personalizado'}"`,
      detail: `${event.host}${event.path}`,
    };
  case 'ORDER': {
    const meta = ORDER_EVENT_META[event.orderEvent];
    return {
      icon: ORDER_ICONS[meta.tone],
      tone: TONES[meta.tone],
      title: meta.label,
      detail: joinDetails([
        event.productName,
        event.valueCents !== null ? formatMoney(event.valueCents, event.currency) : null,
        event.platform.charAt(0) + event.platform.slice(1).toLowerCase(),
      ]),
    };
  }
  }
}

function groupByDay(events: JourneyEvent[]): { day: string; events: JourneyEvent[] }[] {
  const groups: { day: string; events: JourneyEvent[] }[] = [];
  for (const event of events) {
    const day = new Date(event.at).toDateString();
    const current = groups[groups.length - 1];
    if (current && current.day === day) current.events.push(event);
    else groups.push({ day, events: [event] });
  }
  return groups;
}

function countEvents(events: JourneyEvent[]) {
  return {
    linksSent: events.filter((event) => event.type === 'LINK_SENT').length,
    clicks: events.filter((event) => event.type === 'LINK_CLICKED').length,
    pageViews: events.filter((event) => event.type === 'SITE_EVENT' && event.siteEvent === 'PAGE_VIEW').length,
    purchases: events.filter((event) => event.type === 'ORDER' && ORDER_EVENT_META[event.orderEvent].tone === 'positive').length,
  };
}

export default function JourneyTimelineView({ timeline, loading, error, onRetry }: JourneyTimelineViewProps) {
  const groups = useMemo(() => (timeline ? groupByDay(timeline.events) : []), [timeline]);
  const counts = useMemo(() => countEvents(timeline?.events ?? []), [timeline]);

  if (loading && !timeline) return <SkeletonRows count={6} />;

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <p className="text-sm font-medium text-red-500">{error}</p>
        <Button size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!timeline) return <CardEmptyState message="Escolha um contato para ver a jornada" className="min-h-48" />;

  const stats = [
    { label: 'links recebidos', value: counts.linksSent },
    { label: 'cliques', value: counts.clicks },
    { label: 'páginas vistas', value: counts.pageViews },
    { label: 'compras', value: counts.purchases },
  ];

  return (
    <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{timeline.contact.displayName || 'Sem nome'}</h2>
        {timeline.contact.identifier && (
          <p className="text-[13px] text-slate-500 dark:text-slate-400">{timeline.contact.identifier}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {stats.map((stat) => (
            <span
              key={stat.label}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300"
            >
              <span className="tabular-nums">{formatCount(stat.value)}</span> {stat.label}
            </span>
          ))}
        </div>
      </div>

      {timeline.events.length === 0 ? (
        <CardEmptyState message="Nenhum link, clique, visita ou pedido deste contato nos últimos 7 dias" />
      ) : (
        <ol className="space-y-5">
          {groups.map((group) => (
            <li key={group.day}>
              <p className="mb-2 text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                {formatDayHeading(group.events[0]?.at ?? '')}
              </p>
              <ol className="ml-3.5 space-y-3 border-l border-slate-200 pl-5 dark:border-slate-700">
                {group.events.map((event) => {
                  const { icon: Icon, tone, title, detail } = present(event);
                  return (
                    <li key={event.id} className="relative">
                      <span className={`absolute -left-9 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-800 ${tone}`}>
                        <Icon size={14} />
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-900 dark:text-white">{title}</p>
                          {detail && <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">{detail}</p>}
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">{formatTime(event.at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
