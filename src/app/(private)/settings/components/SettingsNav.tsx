'use client';
import { Bell, CreditCard, Shield, User, Users, type LucideIcon } from 'lucide-react';

interface SettingsNavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    ownerOnly: boolean;
}
const ALL_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'account', label: 'Conta', icon: User, ownerOnly: false },
  { id: 'notifications', label: 'Notificações', icon: Bell, ownerOnly: true },
  { id: 'security', label: 'Segurança', icon: Shield, ownerOnly: false },
  { id: 'billing', label: 'Faturamento', icon: CreditCard, ownerOnly: true },
  { id: 'members', label: 'Membros', icon: Users, ownerOnly: true },
];

/** Seções liberadas para o papel, na ordem do menu. Serve também para validar o `?tab=` da URL. */
export function resolveSettingsTabs(role: string): SettingsNavItem[] {
  return ALL_NAV_ITEMS.filter((item) => !(item.ownerOnly && role === 'collaborator'));
}

interface SettingsNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    role: string;
}

/**
 * Navegação lateral no desktop, chips que quebram em linhas no celular — mesmo
 * padrão de Agendamentos e IA. O papel vem da página para não haver duas fontes
 * de verdade sobre o que o colaborador enxerga.
 */
export default function SettingsNav({ activeTab, onTabChange, role }: SettingsNavProps) {
  const items = resolveSettingsTabs(role);
  return (
    <nav aria-label="Seções das configurações" className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
      {items.map((item) => {
        const active = item.id === activeTab;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors lg:w-full ${
              active
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
          >
            <item.icon size={16} className="shrink-0"/>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
