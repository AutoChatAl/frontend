'use client';

import { Users, Settings, LayoutDashboard, Layers, Share2, Send, Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface MenuItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string;
  href?: string;
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
}

export function SidebarProvider({
  children,
  defaultActiveTab = 'dashboard',
  menuItems: customMenuItems,
}: SidebarProviderProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentTab = pathname.split('/')[1] || 'dashboard';
    setActiveTab(currentTab);
  }, [pathname]);

  const defaultMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, text: 'Visão Geral', href: '/dashboard' },
    { id: 'groups', icon: Layers, text: 'Grupos', href: '/groups' },
    { id: 'channels', icon: Share2, text: 'Canais', href: '/channels' },
    { id: 'campaigns', icon: Send, text: 'Campanhas', href: '/campaigns' },
    { id: 'contacts', icon: Users, text: 'Contatos', href: '/contacts' },
    { id: 'ia', icon: Bot, text: 'IA', href: '/ia' },
    { id: 'settings', icon: Settings, text: 'Configurações', href: '/settings' },
  ];

  const menuItems = customMenuItems || defaultMenuItems;

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
