'use client';

import { Bot, Menu, Sparkles, LogOut, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSidebar, type MenuItem } from '@/contexts/SidebarContext';
import { authService } from '@/services/auth.service';

interface SidebarItemProps {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    text: string;
    active: boolean;
    onClick: () => void;
    collapsed: boolean;
}

interface SidebarProps {
    brandName?: string;
    userName?: string;
    userRole?: string;
    userInitials?: string;
    planName?: string;
    planUsage?: string;
    planProgress?: number;
}

const SidebarItem = ({ icon: Icon, text, active, onClick, collapsed }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-all duration-200 relative
        ${active
      ? 'bg-indigo-100/65 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 '
    }
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      <div className="flex items-center gap-3 w-full">
        <Icon size={20} className="shrink-0" />
        {!collapsed && (
          <>
            <span className={`text-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>{text}</span>
            {active && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-700 dark:bg-indigo-400 shrink-0" />
            )}
          </>
        )}
      </div>
    </button>
  );
};

export default function Sidebar({
  brandName = 'Synq',
  userName = 'John Doe',
  userRole = 'Admin',
  userInitials = 'JD',
  planName = 'Plano Pro',
  planUsage = '7.5k / 10k mensagens',
  planProgress = 70,
}: SidebarProps) {
  const router = useRouter();

  const {
    activeTab,
    sidebarCollapsed,
    mobileMenuOpen,
    menuItems,
    setActiveTab,
    toggleSidebar,
    setMobileMenuOpen,
  } = useSidebar();

  const handleMenuClick = (item: MenuItem) => {
    setActiveTab(item.id);
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  return (
    <>
      <aside
        className={`
          hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-20
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-slate-700 px-4">
          <div className="flex items-center gap-2 w-full overflow-hidden">
            <div className="w-8 h-8 bg-linear-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200 dark:shadow-none">
              <Bot size={18} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">
                {brandName}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-y-auto mt-2">
          {menuItems.map((item: MenuItem) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              text={item.text}
              active={activeTab === item.id}
              onClick={() => handleMenuClick(item)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          {!sidebarCollapsed && (
            <div className="bg-linear-to-r from-indigo-50 to-violet-50 dark:from-slate-700 dark:to-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-600 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{planName}</span>
              </div>
              <div className="w-full bg-white dark:bg-slate-600 rounded-full h-1.5 mb-1 overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${planProgress}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{planUsage}</p>
            </div>
          )}

          {sidebarCollapsed ? (
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-full p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          ) : (
            <div className="flex items-center w-full gap-3 p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <div
                onClick={toggleSidebar}
                className="flex items-center gap-3 flex-1 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-600">
                  {userInitials}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{userName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{userRole}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="hover:text-rose-500 transition-colors shrink-0"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      <aside className={`
        fixed inset-y-0 left-0 bg-white dark:bg-slate-800 w-64 z-50 transform transition-transform duration-300 md:hidden border-r border-slate-200 dark:border-slate-700
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-700">
          <span className="font-bold text-xl text-slate-800 dark:text-white">{brandName}</span>
          <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-4">
          {menuItems.map((item: MenuItem) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              text={item.text}
              active={activeTab === item.id}
              onClick={() => {
                handleMenuClick(item);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
