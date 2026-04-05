'use client';

import { usePathname } from 'next/navigation';
import { Bell, Loader2, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { notificationService, type Notification, type NotificationType } from '@/services/notification.service';

const READ_IDS_KEY = 'notifications:readIds';

function getTypeLabel(type?: NotificationType): string {
  if (type === 'maintenance') return 'Manutenção';
  if (type === 'bugfix') return 'Correção de bug';
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
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function NotificationDropdown() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.list();
      setNotifications(data);
    } catch {
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...notifications.map((n) => n.id)]));
      localStorage.setItem(READ_IDS_KEY, JSON.stringify(next));
      return next;
    });
  }, [notifications]);

  const unreadCount = notifications.reduce((total, notification) => {
    return readIds.includes(notification.id) ? total : total + 1;
  }, 0);

  useEffect(() => {
    const saved = localStorage.getItem(READ_IDS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          setReadIds(parsed.filter((v): v is string => typeof v === 'string'));
        }
      } catch {
        localStorage.removeItem(READ_IDS_KEY);
      }
    }
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadNotifications();
    }
  }, [isOpen, hasLoaded, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
      markAllAsRead();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const refreshOnFocus = () => {
      loadNotifications();
    };
    const refreshOnVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisibility);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisibility);
    };
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [pathname, loadNotifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative text-slate-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full border border-white dark:border-slate-800 flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Notificações</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && !hasLoaded ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                <Bell size={24} className="mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
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
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
