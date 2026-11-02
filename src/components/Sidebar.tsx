import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  MessageSquare,
  GraduationCap,
  Settings,
  Sun,
  Moon,
  Database,
  X,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { User } from '../types';

export type NavTab = 'dashboard' | 'memories' | 'upload' | 'chat' | 'study' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  user: User | null;
  onOpenAuth: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalMemoriesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  user,
  onOpenAuth,
  isOpenMobile,
  onCloseMobile,
  totalMemoriesCount,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'memories' as NavTab, label: 'My Memories', icon: FolderOpen },
    { id: 'upload' as NavTab, label: 'Save & Ingest', icon: PlusCircle },
    { id: 'chat' as NavTab, label: 'AI Chat Assistant', icon: MessageSquare },
    { id: 'study' as NavTab, label: 'Study Assistant', icon: GraduationCap },
    { id: 'settings' as NavTab, label: 'Settings & Docs', icon: Settings },
  ];

  const handleNav = (tab: NavTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <span className="font-bold text-sm tracking-tight">MV</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                MindVault
              </span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                AI Memory Assistant
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick New Ingestion Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => handleNav('upload')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xs transition-all duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Save Information</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.id === 'memories' && totalMemoriesCount > 0 && (
                  <span className="ml-auto text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {totalMemoriesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Vault Status Box */}
        <div className="p-3 mx-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              SQLite Memory Bank
            </span>
            <span className="font-mono tabular-nums text-[11px] text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {totalMemoriesCount} items indexed & grounded
          </div>
        </div>

        {/* Theme & User Profile Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-md transition-colors"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Moon className="w-3.5 h-3.5 text-purple-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
            </span>
            <span className="text-[11px] text-slate-400">Toggle</span>
          </button>

          {/* User info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || '/src/assets/images/default_user_avatar_1793590168049.jpg'}
                alt={user?.name || 'User avatar'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name || 'Alex Chen'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'alex.chen@mindvault.ai'}
                </div>
              </div>
            </div>
            <button
              onClick={onOpenAuth}
              title="Account Settings"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
