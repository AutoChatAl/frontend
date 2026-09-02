'use client';
import { Users, Workflow, KanbanSquare, Settings, LayoutDashboard, Layers, Share2, Send, Bot, Reply, CalendarDays, LifeBuoy, MessagesSquare, ShoppingCart, BadgeCheck, TicketPercent, BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

import { authService, type Permission } from '@/services/auth.service';
import { HIDDEN_FEATURES, LOCKED_FEATURES } from '@lib/featureFlags';

export type MenuGroupId = 'main' | 'audience' | 'engagement' | 'automation' | 'system';

export interface MenuGroup {
    id: MenuGroupId;
    label: string | null;
}

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
    /**
     * Permissão exigida. Uma lista significa "basta uma delas" — é o caso de
     * /channels, que serve tanto os canais por QR Code quanto a API Oficial,
     * cada um com a sua permissão e o seu card na página.
     */
    permission?: Permission | Permission[];
    locked?: boolean;
    beta?: boolean;
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
  { id: 'dashboard', icon: LayoutDashboard, text: 'Visão Geral', href: '/dashboard', permission: 'dashboard', group: 'main' },
  { id: 'channels', icon: Share2, text: 'Canais', href: '/channels', permission: ['channels', 'whatsapp-official'], group: 'main' },
  { id: 'whatsapp-official', icon: BadgeCheck, text: 'API Oficial', href: '/whatsapp-official', permission: 'whatsapp-official', group: 'main' },
  // Público — quem você alcança.
  { id: 'inbox', icon: MessagesSquare, text: 'Chat', href: '/inbox', permission: 'inbox', group: 'audience', beta: true },
  { id: 'contacts', icon: Users, text: 'Contatos', href: '/contacts', permission: 'contacts', group: 'audience' },
  { id: 'groups', icon: Layers, text: 'Grupos', href: '/groups', permission: 'groups', group: 'audience' },
  // Engajamento — disparos e ações proativas.
  { id: 'campaigns', icon: Send, text: 'Campanhas', href: '/campaigns', permission: 'campaigns', group: 'engagement', locked: LOCKED_FEATURES.campaigns },
  // Templates saiu da sidebar: a listagem vive na página da API Oficial, e a
  // rota /templates segue acessível por lá (card "Templates" → Ver todos).
  { id: 'funnel', icon: KanbanSquare, text: 'Funil', href: '/funnel', permission: 'funnel', group: 'engagement' },
  { id: 'cart-recovery', icon: ShoppingCart, text: 'Recuperação', href: '/cart-recovery', permission: 'cart-recovery', group: 'engagement' },
  { id: 'scheduling', icon: CalendarDays, text: 'Agendamentos', href: '/scheduling', permission: 'scheduling', group: 'engagement' },
  // Automação — respostas e IA.
  { id: 'auto-replies', icon: Reply, text: 'Auto-Respostas', href: '/auto-replies', permission: 'auto-replies', group: 'automation' },
  { id: 'flows', icon: Workflow, text: 'Fluxos', href: '/flows', permission: 'auto-replies', group: 'automation' },
  { id: 'ia', icon: Bot, text: 'Inteligência Artificial', href: '/ia', permission: 'ia', group: 'automation' },
  // Sistema.
  { id: 'settings', icon: Settings, text: 'Configurações', href: '/settings', group: 'system' },
];
// IDs ocultados da navegacao (ver HIDDEN_FEATURES em @lib/featureFlags).
// Os itens continuam definidos acima e as rotas seguem funcionando por URL
// direta -- eles apenas nao sao renderizados na sidebar.
const HIDDEN_MENU_IDS = new Set<string>([
  ...(HIDDEN_FEATURES.cartRecovery ? ['cart-recovery'] : []),
]);
const FULL_ACCESS_ROLES = ['owner', 'admin'];

/** Dono e admin passam por tudo; colaborador precisa da permissão explícita. */
export function canAccessMenuItem(
  user: { role?: string; permissions?: Permission[] } | null | undefined,
  item: Pick<MenuItem, 'permission'>,
): boolean {
  if (!item.permission) return true;
  const role = user?.role;
  if (!role || FULL_ACCESS_ROLES.includes(role)) return true;
  const owned = user?.permissions ?? [];
  const required = Array.isArray(item.permission) ? item.permission : [item.permission];
  return required.some((permission) => owned.includes(permission));
}

/**
 * Primeira rota que o usuário realmente consegue abrir, na ordem da sidebar.
 * O dono cai sempre em /dashboard; um colaborador sem a permissão `dashboard`
 * cai na primeira área liberada para ele — sem isso, o login jogaria essa
 * pessoa numa página que só responde 403.
 */
export function resolveLandingRoute(
  user: { role?: string; permissions?: Permission[] } | null | undefined,
): string {
  const firstAllowed = ALL_MENU_ITEMS.find(
    (item) => !!item.href && !item.locked && !HIDDEN_MENU_IDS.has(item.id) && canAccessMenuItem(user, item),
  );
  return firstAllowed?.href ?? '/settings';
}

/**
 * Rotas que existem mas não têm item próprio na sidebar — alcançadas por link
 * de dentro de outra página. Sem elas o guard de rota não sabe qual permissão
 * cobrar e a pessoa cai numa tela que só devolve 403.
 */
const EXTRA_ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // O backend aceita qualquer uma das duas (requireAnyPermission).
  '/templates': ['whatsapp-official', 'campaigns'],
};

export function hasPermission(
  user: { role?: string; permissions?: Permission[] } | null | undefined,
  permission: Permission,
): boolean {
  return canAccessMenuItem(user, { permission });
}

/** Permissão exigida pela rota informada (ex.: '/funnel/123' -> 'funnel'). */
export function canAccessPathname(
  user: { role?: string; permissions?: Permission[] } | null | undefined,
  pathname: string,
): boolean {
  const root = `/${pathname.split('/').filter(Boolean)[0] ?? ''}`;
  const menuItem = ALL_MENU_ITEMS.find((item) => item.href === root);
  if (menuItem) return canAccessMenuItem(user, menuItem);
  const anyOf = EXTRA_ROUTE_PERMISSIONS[root];
  if (!anyOf) return true;
  return canAccessMenuItem(user, { permission: anyOf });
}

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
    if (!role || FULL_ACCESS_ROLES.includes(role)) {
      items = [...ALL_MENU_ITEMS];
    }
    else {
      items = ALL_MENU_ITEMS.filter((item) => canAccessMenuItem({ role, permissions }, item));
    }
    if (showSupportTab) {
      items.push({ id: 'suporte', icon: LifeBuoy, text: 'Suporte', href: '/suporte', group: 'system' });
      items.push({ id: 'cupons', icon: TicketPercent, text: 'Cupons', href: '/cupons', group: 'system' });
      items.push({ id: 'gastos-ia', icon: BarChart3, text: 'Gastos IA', href: '/gastos-ia', group: 'system' });
    }
    return items.filter((item) => !HIDDEN_MENU_IDS.has(item.id));
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
