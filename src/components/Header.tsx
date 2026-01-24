'use client';

import { Menu, Sun, Moon, Bell } from 'lucide-react';

import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Header() {
  const { activeTab, menuItems, setMobileMenuOpen } = useSidebar();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-200 hidden md:block">
          {menuItems.find((i) => i.id === activeTab)?.text || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-100 dark:border-emerald-800/50">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Whatsapp Conectado
          </div>
          <div className="flex items-center gap-2 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400 px-3 py-1.5 rounded-full text-xs font-medium border border-fuchsia-100 dark:border-fuchsia-800/50">
            <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse"></div>
            Instagram Conectado
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

        <button
          onClick={toggleTheme}
          className="text-slate-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative text-slate-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-800"></span>
        </button>
      </div>
    </header>
  );
}
