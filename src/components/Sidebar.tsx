'use client';
import { Bot, Menu, Sparkles, LogOut, X, ChevronDown, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import Badge from '@/components/Badge';
import { useSidebar, MENU_GROUPS, type MenuItem, type MenuGroupId } from '@/contexts/SidebarContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { authService } from '@/services/auth.service';
import { contactService } from '@/services/contact.service';
import { supportChatService } from '@/services/support-chat.service';

interface SidebarItemProps {
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
    text: string;
    active: boolean;
    onClick: () => void;
    collapsed: boolean;
    badgeCount?: number | undefined;
    tourId?: string;
    locked?: boolean | undefined;
    beta?: boolean | undefined;
}
interface SidebarProps {
    brandName?: string;
    userName?: string;
    userRole?: string;
    userInitials?: string;
}
const SidebarItem = ({ icon: Icon, text, active, onClick, collapsed, badgeCount, tourId, locked, beta }: SidebarItemProps) => {
  return (<button onClick={locked ? undefined : onClick} aria-disabled={locked || undefined} title={locked ? 'Em breve — indisponível' : undefined} {...(tourId ? { 'data-tour': tourId } : {})} className={`
        flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-md transition-colors duration-150 relative
        ${locked
      ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
      : active
        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'}
        ${collapsed ? 'justify-center' : ''}
      `}>
    <div className="flex items-center gap-2.5 w-full">
      <Icon size={16} className="shrink-0"/>
      {!collapsed && (<>
        <span className={`text-[13px] truncate ${active && !locked ? 'font-semibold' : 'font-medium'}`}>{text}</span>
        {beta && (<span className="shrink-0">
          <Badge type="beta" text="BETA" pill/>
        </span>)}
        {locked
          ? (<Lock size={12} className="ml-auto shrink-0 text-slate-400 dark:text-slate-500"/>)
          : (<>
            {!!badgeCount && badgeCount > 0 && (<span className="ml-auto min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-semibold flex items-center justify-center">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>)}
          </>)}
      </>)}
    </div>
  </button>);
};
interface SidebarSectionsProps {
    items: MenuItem[];
    activeTab: string;
    collapsed: boolean;
    collapsedGroups: Set<MenuGroupId>;
    onItemClick: (item: MenuItem) => void;
    onToggleGroup: (id: MenuGroupId) => void;
}
const SidebarSections = ({ items, activeTab, collapsed, collapsedGroups, onItemClick, onToggleGroup }: SidebarSectionsProps) => {
  return (<>
    {MENU_GROUPS.map((group) => {
      const groupItems = items.filter((item) => item.group === group.id);
      if (groupItems.length === 0)
        return null;
      // Só seções com rótulo e fora do modo ícone podem recolher.
      const hasHeader = !!group.label && !collapsed;
      const groupCollapsed = hasHeader && collapsedGroups.has(group.id);
      return (<div key={group.id} className="space-y-0.5 mt-3 first:mt-0">
        {group.label && (collapsed
          ? (<div className="mx-2 mb-2 border-t border-slate-100 dark:border-slate-700/60" aria-hidden/>)
          : (<button type="button" onClick={() => onToggleGroup(group.id)} aria-expanded={!groupCollapsed} className="flex items-center justify-between w-full px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors select-none">
            <span>{group.label}</span>
            <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${groupCollapsed ? '-rotate-90' : ''}`}/>
          </button>))}
        {!groupCollapsed && groupItems.map((item) => (<SidebarItem key={item.id} icon={item.icon} text={item.text} active={activeTab === item.id} onClick={() => onItemClick(item)} collapsed={collapsed} badgeCount={item.badgeCount} tourId={`sidebar-${item.id}`} locked={item.locked} beta={item.beta}/>))}
      </div>);
    })}
  </>);
};
function getReadableRole(role?: string): string {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'admin')
    return 'Administrador';
  if (normalized === 'owner')
    return 'Usuário';
  if (normalized === 'member')
    return 'Usuário';
  if (normalized === 'collaborator')
    return 'Colaborador';
  return role || 'Usuário';
}
export default function Sidebar({ brandName = 'Synq', userName = 'John Doe', userRole = 'Admin', userInitials = 'JD' }: SidebarProps) {
  const router = useRouter();
  const { planName, usage, isTrialing, isCanceled, trialDaysRemaining: _trialDaysRemaining } = useSubscription();
  const formatCount = (n: number) => n.toLocaleString('pt-BR');
  const msgUsed = usage?.messages?.used ?? 0;
  const msgLimit = usage?.messages?.limit ?? 0;
  const planUsage = msgLimit > 0 ? `${formatCount(msgUsed)} / ${formatCount(msgLimit)} mensagens` : '';
  const planProgress = msgLimit > 0 ? Math.min(100, Math.round((msgUsed / msgLimit) * 100)) : 0;
  const { activeTab, sidebarCollapsed, mobileMenuOpen, menuItems, setActiveTab, toggleSidebar, setMobileMenuOpen } = useSidebar();
  const [humanQueueCount, setHumanQueueCount] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  // Grupos recolhidos pelo usuário — começa vazio, todas as seções abertas.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<MenuGroupId>>(new Set());
  const toggleGroup = (groupId: MenuGroupId) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      }
      else {
        next.add(groupId);
      }
      return next;
    });
  };
  const hasSupportTab = useMemo(() => menuItems.some((item) => item.id === 'suporte'), [menuItems]);
  useEffect(() => {
    let mounted = true;
    const loadQueueSummary = async () => {
      try {
        const summary = await contactService.getHumanQueueSummary();
        if (mounted)
          setHumanQueueCount(summary.waitingCount || 0);
      }
      catch {
        if (mounted)
          setHumanQueueCount(0);
      }
    };
    loadQueueSummary();
    const timer = setInterval(loadQueueSummary, 30000);
    const onDecrement = () => setHumanQueueCount((c) => Math.max(0, c - 1));
    window.addEventListener('human-queue-decrement', onDecrement);
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener('human-queue-decrement', onDecrement);
    };
  }, []);
  useEffect(() => {
    if (!hasSupportTab) {
      setSupportUnreadCount(0);
      return;
    }
    let mounted = true;
    let source: EventSource | null = null;
    const loadSupportSummary = async () => {
      try {
        const summary = await supportChatService.getAdminSummary();
        if (mounted)
          setSupportUnreadCount(summary.unreadCount || 0);
      }
      catch {
      }
    };
    const refreshSupportSummary = () => {
      loadSupportSummary().catch(() => { });
    };
    const handleWindowFocus = () => {
      refreshSupportSummary();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSupportSummary();
      }
    };
    const handleSupportEvent = () => {
      refreshSupportSummary();
    };
    refreshSupportSummary();
    const timer = setInterval(refreshSupportSummary, 60000);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const token = authService.getToken();
    if (token) {
      source = new EventSource(supportChatService.getWorkspaceEventsUrl());
      source.addEventListener('conversation.created', handleSupportEvent);
      source.addEventListener('conversation.updated', handleSupportEvent);
      source.onerror = () => {
        source?.close();
        source = null;
      };
    }
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (source) {
        source.removeEventListener('conversation.created', handleSupportEvent);
        source.removeEventListener('conversation.updated', handleSupportEvent);
        source.close();
      }
    };
  }, [activeTab, hasSupportTab]);
  const menuItemsWithBadges = useMemo(() => {
    return menuItems.map((item) => item.id === 'contacts'
      ? { ...item, badgeCount: humanQueueCount }
      : item.id === 'suporte'
        ? { ...item, badgeCount: supportUnreadCount }
        : item);
  }, [menuItems, humanQueueCount, supportUnreadCount]);
  const handleMenuClick = (item: MenuItem) => {
    // Itens bloqueados (feature ainda não oficial) não navegam.
    if (item.locked) {
      return;
    }
    setActiveTab(item.id);
    if (item.href) {
      router.push(item.href);
    }
  };
  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };
  return (<>
    <aside className={`
          hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-20
          ${sidebarCollapsed ? 'w-16' : 'w-60'}
        `}>
      <div className="h-14 flex items-center justify-center border-b border-slate-100 dark:border-slate-700 px-3">
        <div className={`flex items-center gap-2 w-full overflow-hidden ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 bg-linear-to-br from-indigo-600 to-violet-600 rounded-md flex items-center justify-center shrink-0">
            <Bot size={15} className="text-white"/>
          </div>
          {!sidebarCollapsed && (<span className="font-semibold text-[15px] text-slate-900 dark:text-white tracking-tight">
            {brandName}
          </span>)}
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <SidebarSections items={menuItemsWithBadges} activeTab={activeTab} collapsed={sidebarCollapsed} collapsedGroups={collapsedGroups} onItemClick={handleMenuClick} onToggleGroup={toggleGroup}/>
      </nav>

      <div className="p-2.5 border-t border-slate-100 dark:border-slate-700">
        {!sidebarCollapsed && (<div onClick={() => router.push('/settings?tab=billing')} className="bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 mb-2 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-500 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0"/>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{isCanceled ? 'Plano cancelado' : planName}</span>
            {isTrialing && (<span className="text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">
                    Teste
            </span>)}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1 mb-1 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${planProgress}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{planUsage}</p>
        </div>)}

        {sidebarCollapsed ? (<button onClick={toggleSidebar} className="flex items-center justify-center w-full p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors">
          <Menu size={18}/>
        </button>) : (<div className="flex items-center w-full gap-2.5 p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors overflow-hidden">
          <div onClick={toggleSidebar} className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-[10px] border border-slate-200 dark:border-slate-600 shrink-0">
              {userInitials}
            </div>
            <div className="text-left overflow-hidden min-w-0 flex-1">
              <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{userName}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{getReadableRole(userRole)}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="hover:text-rose-500 transition-colors shrink-0">
            <LogOut size={15}/>
          </button>
        </div>)}
      </div>
    </aside>

    {mobileMenuOpen && (<div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>)}
    <aside className={`
        fixed inset-y-0 left-0 bg-white dark:bg-slate-800 w-64 z-50 transform transition-transform duration-300 md:hidden border-r border-slate-200 dark:border-slate-700
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-700">
        <span className="font-semibold text-base text-slate-900 dark:text-white">{brandName}</span>
        <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
          <X size={20}/>
        </button>
      </div>
      <nav className="p-3 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
        <SidebarSections items={menuItemsWithBadges} activeTab={activeTab} collapsed={false} collapsedGroups={collapsedGroups} onItemClick={(item) => {
          handleMenuClick(item);
          setMobileMenuOpen(false);
        }} onToggleGroup={toggleGroup}/>
      </nav>
    </aside>
  </>);
}
