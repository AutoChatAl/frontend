'use client';
import { Users, KanbanSquare, Settings, LayoutDashboard, Layers, Share2, Send, Bot, Reply, CalendarDays, LifeBuoy, MessageSquare, ShoppingCart, LayoutTemplate, BadgeCheck, TicketPercent } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

import { authService, type Permission } from '@/services/auth.service';
import { LOCKED_FEATURES } from '@lib/featureFlags';

export type MenuGroupId = 'main' | 'audience' | 'engagement' | 'automation' | 'system';

export interface MenuGroup {
    id: MenuGroupId;
    label: string | null;
}

/**
 * Ordem e rótulos das seções da sidebar. A seção `main` não tem rótulo —
 * agrupa a visão geral e a conexão de canais (base do workspace).
 */
export const MENU_GROUPS: MenuGroup[] = [
  { id: 'main', label: null },
  { id: 'audience', label: 'Público' },
  { id: 'engagement', label: 'Engajamento' },
  { id: 'automation', label: 'Automação' },
  { id: 'system', label: 'Sistema' },
];

export interface MenuItem {
    id: string;
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
    text: string;
    group: MenuGroupId;
    href?: string;
    badgeCount?: number;
    permission?: Permission;
    /** Quando true, o item aparece com cadeado e não navega (feature ainda não oficial). */
    locked?: boolean;
}
interface SidebarContextType {
    activeTab: string;
    sidebarCollapsed: boolean;
    mobileMenuOpen: boolean;
    menuItems: MenuItem[];
    setActiveTab: (tab: string) => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (open: boolean) => void;
}
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
interface SidebarProviderProps {
    children: ReactNode;
    defaultActiveTab?: string;
    menuItems?: MenuItem[];
    showSupportTab?: boolean;
}
const ALL_MENU_ITEMS: MenuItem[] = [
  // Base do workspace — sem rótulo de seção.
  { id: 'dashboard', icon: LayoutDashboard, text: 'Visão Geral', href: '/dashboard', group: 'main' },
  { id: 'channels', icon: Share2, text: 'Canais', href: '/channels', permission: 'channels', group: 'main' },
  { id: 'whatsapp-official', icon: BadgeCheck, text: 'API Oficial', href: '/whatsapp-official', permission: 'channels', group: 'main' },
  // Público — quem você alcança.
  { id: 'contacts', icon: Users, text: 'Contatos', href: '/contacts', permission: 'contacts', group: 'audience' },
  { id: 'groups', icon: Layers, text: 'Grupos', href: '/groups', permission: 'groups', group: 'audience' },
  // Engajamento — disparos e ações proativas.
  { id: 'campaigns', icon: Send, text: 'Campanhas', href: '/campaigns', permission: 'campaigns', group: 'engagement', locked: LOCKED_FEATURES.campaigns },
  { id: 'templates', icon: LayoutTemplate, text: 'Templates', href: '/templates', permission: 'campaigns', group: 'engagement' },
  { id: 'funnel', icon: KanbanSquare, text: 'Funil', href: '/funnel', permission: 'contacts', group: 'engagement' },
  { id: 'cart-recovery', icon: ShoppingCart, text: 'Recuperação', href: '/cart-recovery', permission: 'campaigns', group: 'engagement' },
  { id: 'scheduling', icon: CalendarDays, text: 'Agendamentos', href: '/scheduling', permission: 'scheduling', group: 'engagement' },
  // Automação — respostas e IA.
  { id: 'auto-replies', icon: Reply, text: 'Auto-Respostas', href: '/auto-replies', permission: 'auto-replies', group: 'automation' },
  { id: 'comment-automations', icon: MessageSquare, text: 'Comentários IG', href: '/comment-automations', permission: 'auto-replies', group: 'automation' },
  { id: 'ia', icon: Bot, text: 'IA', href: '/ia', permission: 'ia', group: 'automation' },
  // Sistema.
  { id: 'settings', icon: Settings, text: 'Configurações', href: '/settings', group: 'system' },
];
export function SidebarProvider({ children, defaultActiveTab = 'dashboard', menuItems: customMenuItems, showSupportTab = true }: SidebarProviderProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const currentTab = pathname.split('/')[1] || 'dashboard';
    setActiveTab(currentTab);
  }, [pathname]);
  const menuItems = useMemo(() => {
    if (customMenuItems)
      return customMenuItems;
    const user = authService.getUser();
    const role = user?.role;
    const permissions = user?.permissions ?? [];
    let items: MenuItem[];
    if (!role || role === 'owner' || role === 'admin') {
      items = [...ALL_MENU_ITEMS];
    }
    else {
      items = ALL_MENU_ITEMS.filter((item) => {
        if (!item.permission)
          return true;
        return permissions.includes(item.permission);
      });
    }
    // Abas exclusivas do admin do sistema (showSupportTab = isAdmin no layout privado).
    if (showSupportTab) {
      items.push({ id: 'suporte', icon: LifeBuoy, text: 'Suporte', href: '/suporte', group: 'system' });
      items.push({ id: 'cupons', icon: TicketPercent, text: 'Cupons', href: '/cupons', group: 'system' });
    }
    return items;
  }, [customMenuItems, showSupportTab]);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const value: SidebarContextType = {
    activeTab,
    sidebarCollapsed,
    mobileMenuOpen,
    menuItems,
    setActiveTab,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileMenu,
    setMobileMenuOpen,
  };
  return (<SidebarContext.Provider value={value}>
    {children}
  </SidebarContext.Provider>);
}
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('Falha ao carregar a Sidebar.');
  }
  return context;
}
