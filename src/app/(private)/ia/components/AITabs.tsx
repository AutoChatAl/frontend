'use client';
import { BookOpen, CalendarDays, Settings, Share2, ShieldCheck, ShoppingBag, Trello, Zap } from 'lucide-react';

import type { AITab } from '@/types/AI';

/**
 * "Catálogo" saiu de dentro de "Geral": a tabela de produtos é a maior seção da
 * página e brigava por espaço com os campos de identidade. O backend não conhece
 * essa aba, então ela herda a visibilidade de "Geral".
 */
const ALL_TABS: AITab[] = [
  { id: 'general', label: 'Geral', icon: Settings },
  { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
  { id: 'knowledge', label: 'Conhecimento', icon: BookOpen },
  { id: 'channels', label: 'Canais', icon: Share2 },
  { id: 'triggers', label: 'Gatilhos', icon: Zap },
  { id: 'guardrails', label: 'Limites', icon: ShieldCheck },
  { id: 'scheduling', label: 'Agendamento', icon: CalendarDays },
  { id: 'funnel', label: 'Funil', icon: Trello },
];

/** Ids liberados, na ordem do menu. Usado também para validar o `?tab=` da URL. */
export function resolveAiTabs(visibleTabs?: string[]): AITab[] {
  if (!visibleTabs) {
    return ALL_TABS;
  }
  const allowed = new Set(visibleTabs);
  if (allowed.has('general')) {
    allowed.add('catalog');
    // Como "Catálogo", a base de conhecimento não existe no backend como aba e
    // herda a visibilidade de "Geral".
    allowed.add('knowledge');
    allowed.add('guardrails');
  }
  return ALL_TABS.filter((tab) => allowed.has(tab.id));
}

interface AITabsProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    visibleTabs?: string[];
}

/**
 * Navegação lateral no desktop, fila rolável no mobile — mesmo padrão de
 * Agendamentos. Seis itens empilhados numa tela de celular roubariam a altura
 * que o conteúdo precisa.
 */
export default function AITabs({ activeTab, onTabChange, visibleTabs }: AITabsProps) {
  const tabs = resolveAiTabs(visibleTabs);
  return (
    <nav
      aria-label="Seções da IA"
      className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors lg:w-full ${
              active
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon size={16} className="shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
