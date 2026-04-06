'use client';

import { Users, Settings, LayoutDashboard, Layers, Share2, Send, Bot, Reply, CalendarDays, LifeBuoy } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

import { authService, type Permission } from '@/services/auth.service';

export interface MenuItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string;
  href?: string;
  badgeCount?: number;
  permission?: Permission;
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
  { id: 'dashboard', icon: LayoutDashboard, text: 'Visão Geral', href: '/dashboard' },
  { id: 'groups', icon: Layers, text: 'Grupos', href: '/groups', permission: 'groups' },
  { id: 'channels', icon: Share2, text: 'Canais', href: '/channels', permission: 'channels' },
  { id: 'campaigns', icon: Send, text: 'Campanhas', href: '/campaigns', permission: 'campaigns' },
  { id: 'contacts', icon: Users, text: 'Contatos', href: '/contacts', permission: 'contacts' },
  { id: 'scheduling', icon: CalendarDays, text: 'Agendamentos', href: '/scheduling', permission: 'scheduling' },
  { id: 'auto-replies', icon: Reply, text: 'Auto-Respostas', href: '/auto-replies', permission: 'auto-replies' },
  { id: 'ia', icon: Bot, text: 'IA', href: '/ia', permission: 'ia' },
  { id: 'settings', icon: Settings, text: 'Configurações', href: '/settings' },
];

export function SidebarProvider({
  children,
  defaultActiveTab = 'dashboard',
  menuItems: customMenuItems,
  showSupportTab = true,
}: SidebarProviderProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentTab = pathname.split('/')[1] || 'dashboard';
    setActiveTab(currentTab);
  }, [pathname]);

  const menuItems = useMemo(() => {
    if (customMenuItems) return customMenuItems;

    const user = authService.getUser();
    const role = user?.role;
    const permissions = user?.permissions ?? [];

    let items: MenuItem[];

    if (!role || role === 'owner') {
      items = [...ALL_MENU_ITEMS];
    } else {
      items = ALL_MENU_ITEMS.filter((item) => {
        if (!item.permission) return true;
        return permissions.includes(item.permission);
      });
    }

    if (showSupportTab) {
      items.push({ id: 'suporte', icon: LifeBuoy, text: 'Suporte', href: '/suporte' });
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

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('Falha ao carregar a Sidebar.');
  }

  return context;
}
