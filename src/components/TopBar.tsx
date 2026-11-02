import React from 'react';
import { Menu, Plus, Sparkles, Search } from 'lucide-react';
import { NavTab } from './Sidebar';

interface TopBarProps {
  activeTab: NavTab;
  onOpenMobileNav: () => void;
  onQuickUpload: () => void;
  onQuickChat: () => void;
  onSearchFocus: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileNav,
  onQuickUpload,
  onQuickChat,
  onSearchFocus,
}) => {
  const getTabLabel = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview';
      case 'memories':
        return 'Memory Repository';
      case 'upload':
        return 'Save & Ingest Documents';
      case 'chat':
        return 'AI Grounded Chat';
      case 'study':
        return 'Study Assistant & Quiz';
      case 'settings':
        return 'Settings & Local Setup';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      {/* Zone 1: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100">MindVault</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-slate-700 dark:text-slate-300">{getTabLabel(activeTab)}</span>
        </div>
      </div>

      {/* Zone 2: Fast Quick-Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onSearchFocus}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 rounded-md hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          title="Search memories"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="font-normal">Search vault...</span>
          <kbd className="text-[10px] font-mono px-1 rounded bg-slate-200 dark:bg-slate-700">⌘K</kbd>
        </button>

        <button
          onClick={onQuickChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-md transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">Ask AI Assistant</span>
          <span className="sm:hidden">Ask AI</span>
        </button>

        <button
          onClick={onQuickUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-md transition-colors whitespace-nowrap shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save Item</span>
        </button>
      </div>
    </header>
  );
};
