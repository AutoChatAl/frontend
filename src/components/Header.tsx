'use client';
import { Menu, Sun, Moon } from 'lucide-react';

import HeaderSearch from '@/components/HeaderSearch';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useChannelStatus } from '@/contexts/ChannelStatusContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Header() {
  const { setMobileMenuOpen } = useSidebar();
  const { darkMode, toggleTheme } = useTheme();
  const { whatsappInstances, instagramAccounts } = useChannelStatus();
  const hasWhatsAppConnected = whatsappInstances.some((i) => i.status === 'CONNECTED');
  const hasInstagramConnected = instagramAccounts.some((a) => a.status === 'CONNECTED');
  return (<header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 sm:gap-3 px-4 md:px-6 z-10 sticky top-0 transition-colors duration-300">
    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
      <button onClick={() => setMobileMenuOpen(true)} className="md:hidden shrink-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-1">
        <Menu size={20}/>
      </button>
      <HeaderSearch />
    </div>

    {/* No mobile os selos ficam só com o ponto colorido — o rótulo volta a partir de sm. */}
    <div className="flex items-center gap-2 md:gap-3 shrink-0">
      <div className="flex items-center gap-1 sm:gap-1.5">
        {hasWhatsAppConnected && (<div title="WhatsApp conectado" aria-label="WhatsApp conectado" className="flex items-center sm:gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 sm:px-2.5 py-1 rounded-full text-[11px] font-medium border border-emerald-100 dark:border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">WhatsApp</span>
        </div>)}
        {hasInstagramConnected && (<div title="Instagram conectado" aria-label="Instagram conectado" className="flex items-center sm:gap-1.5 bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 px-1.5 sm:px-2.5 py-1 rounded-full text-[11px] font-medium border border-fuchsia-100 dark:border-fuchsia-500/20">
          <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">Instagram</span>
        </div>)}
      </div>
      {(hasWhatsAppConnected || hasInstagramConnected) && (<div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>)}

      <button onClick={toggleTheme} className="text-slate-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
        {darkMode ? <Sun size={17}/> : <Moon size={17}/>}
      </button>

      <NotificationDropdown />
    </div>
  </header>);
}
