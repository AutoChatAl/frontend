'use client';
import { Bell, Loader2, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { authService } from '@/services/auth.service';
import { inboxService } from '@/services/inbox.service';
import { notificationService, type Notification, type NotificationType } from '@/services/notification.service';
import { subscribeToEvents } from '@/utils/SharedEventSource';

function getTypeLabel(type?: NotificationType): string {
  if (type === 'maintenance')
    return 'Manutenção';
  if (type === 'bugfix')
    return 'Correção de bug';
  return 'Feature';
}
function getTypeClassName(type?: NotificationType): string {
  if (type === 'maintenance') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  }
  if (type === 'bugfix') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
  }
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
}
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1)
    return 'Agora';
  if (diffMin < 60)
    return `${diffMin}min atrás`;
  if (diffHours < 24)
    return `${diffHours}h atrás`;
  if (diffDays < 7)
    return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Espelho de `isOpen` para o handler do SSE, que é registrado uma vez só.
  const openRef = useRef(false);
  openRef.current = isOpen;
  const loadNotifications = useCallback(async (): Promise<Notification[]> => {
    setLoading(true);
    try {
      const data = await notificationService.list();
      setNotifications(data);
      return data;
    }
    catch {
      return [];
    }
    finally {
      setLoading(false);
    }
  }, []);
  const markAllAsRead = useCallback(async (items: Notification[]) => {
    if (items.length === 0)
      return;
    const next = Array.from(new Set([...readIds, ...items.map((n) => n.id)]));
    setReadIds(next);
    try {
      const persisted = await notificationService.saveReadState(next);
      setReadIds(persisted);
    }
    catch {
    }
  }, [readIds]);
  const unreadCount = notifications.reduce((total, notification) => {
    return readIds.includes(notification.id) ? total : total + 1;
  }, 0);
  /**
   * Carga inicial do sino.
   *
   * Os dois pedidos vão juntos de propósito: resolvidos em separado, a lista chegava
   * antes do estado de leitura e o badge piscava com o total inteiro antes de se
   * corrigir — parecia contador errado aparecendo sozinho.
   *
   * E, na primeira vez, o histórico entra como já lido. O badge nunca chegou a
   * funcionar antes (a lista só era buscada ao abrir o sino, então a contagem vivia
   * em zero), então tudo que é anterior a agora nunca foi "não lido" para o usuário —
   * mostrar meses de avisos de uma vez seria ruído, não informação.
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [items, ids] = await Promise.all([
        notificationService.list().catch(() => [] as Notification[]),
        notificationService.getReadState().catch(() => [] as string[]),
      ]);
      if (cancelled) return;
      setNotifications(items);
      if (ids.length === 0 && items.length > 0) {
        const baseline = items.map((n) => n.id);
        setReadIds(baseline);
        notificationService.saveReadState(baseline).catch(() => {});
        return;
      }
      setReadIds(ids);
    })();
    return () => { cancelled = true; };
  }, []);

  /**
   * Aviso novo chega pelo stream do workspace — a mesma conexão que a lista de
   * conversas usa, e não uma só para o sino: cada stream extra rouba um dos 6
   * slots de conexão do navegador e põe as chamadas normais da API na fila.
   *
   * Boa parte dos avisos nasce em rotina do worker (token do Instagram vencendo,
   * sincronização do WhatsApp Oficial), então o evento só atravessa até aqui por
   * causa do barramento no backend.
   */
  useEffect(() => {
    if (!authService.getToken()) return undefined;
    return subscribeToEvents(inboxService.getInboxEventsUrl(), {
      'notification.created': (event) => {
        try {
          const { notification } = JSON.parse(event.data) as { notification?: Notification };
          if (!notification) return;
          setNotifications((prev) => (prev.some((n) => n.id === notification.id)
            ? prev
            : [notification, ...prev]));
          // Chegou com o painel aberto: o usuário está olhando, então já nasce lido —
          // senão o badge apareceria por cima da lista que ele acabou de ler.
          if (openRef.current) {
            setReadIds((prev) => (prev.includes(notification.id) ? prev : [...prev, notification.id]));
          }
        } catch {
          notificationService.list().then(setNotifications).catch(() => {});
        }
      },
    });
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setLoading(true);
      setIsOpen(true);
      loadNotifications().then((items) => markAllAsRead(items));
    }
    else {
      setIsOpen(false);
    }
  };
  return (<div className="relative" ref={dropdownRef}>
    <button onClick={handleToggle} className="relative text-slate-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
      <Bell size={20}/>
      {unreadCount > 0 && (<span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full border border-white dark:border-slate-800 flex items-center justify-center leading-none">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>)}
    </button>

    {isOpen && (<div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Notificações</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <X size={16}/>
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (<div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-slate-400"/>
        </div>) : notifications.length === 0 ? (<div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
          <Bell size={24} className="mb-2 opacity-50"/>
          <p className="text-sm">Nenhuma notificação</p>
        </div>) : (notifications.map((notification) => (<div key={notification.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${getTypeClassName(notification.type)}`}>
                  {getTypeLabel(notification.type)}
                </span>
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  {notification.title}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
                {formatDate(notification.date)}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap wrap-break-word">
                {notification.description}
              </p>
            </div>
          </div>
        </div>)))}
      </div>
    </div>)}
  </div>);
}
