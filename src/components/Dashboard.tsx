import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Link2,
  Image,
  ArrowRight,
  Sparkles,
  BookOpen,
  Search,
  Upload,
  Clock,
  Layers,
} from 'lucide-react';
import { Memory } from '../types';
import { NavTab } from './Sidebar';

interface DashboardProps {
  stats: {
    totalMemories: number;
    notes: number;
    documents: number;
    links: number;
    images: number;
    categories: Array<{ category: string; count: number }>;
    recentMemories: Memory[];
    studySessionsCount: number;
  } | null;
  onNavigate: (tab: NavTab) => void;
  onSelectMemory: (memory: Memory) => void;
  onAskQuestion: (query: string) => void;
  onQuickUploadType: (type: 'note' | 'pdf' | 'link' | 'image') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onNavigate,
  onSelectMemory,
  onAskQuestion,
  onQuickUploadType,
}) => {
  const [quickQuery, setQuickQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    onAskQuestion(quickQuery.trim());
  };

  const statCards = [
    {
      label: 'Total Memories',
      value: stats?.totalMemories ?? 0,
      icon: Layers,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      action: () => onNavigate('memories'),
    },
    {
      label: 'PDFs & Documents',
      value: stats?.documents ?? 0,
      icon: FileCode,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      action: () => onQuickUploadType('pdf'),
    },
    {
      label: 'Saved Web Links',
      value: stats?.links ?? 0,
      icon: Link2,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      action: () => onQuickUploadType('link'),
    },
    {
      label: 'Notes & Snippets',
      value: stats?.notes ?? 0,
      icon: FileText,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      action: () => onQuickUploadType('note'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Visual Hero Section with Single Focal Anchor */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xs">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/vault_neural_mesh_1793590166959.jpg"
            alt="MindVault neural memory network"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-8 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI-Powered Personal Memory Assistant</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Ask questions. Retrieve anything. Study smarter.
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
            Save notes, research papers, PDF books, articles, and websites. MindVault indexes every concept into a private, grounded knowledge vault.
          </p>

          {/* Quick Search & Chat Input Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="relative flex items-center max-w-xl">
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Ask a question about your saved documents or notes..."
                className="w-full pl-10 pr-24 py-3 text-xs md:text-sm text-white placeholder-slate-400 bg-white/10 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg"
              />
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Metrics Row (Zero-Pill Tabular Figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {card.value}
              </div>
              <div className="mt-2 flex items-center text-[11px] text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                <span>View & manage</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Split: Recently Uploaded Files & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Uploaded / Saved Memories (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recently Saved Memories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest notes, documents, and web links parsed by Gemini
              </p>
            </div>
            <button
              onClick={() => onNavigate('memories')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {stats?.recentMemories && stats.recentMemories.length > 0 ? (
              stats.recentMemories.map((memory) => {
                const getIcon = () => {
                  switch (memory.type) {
                    case 'pdf':
                    case 'document':
                      return <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />;
                    case 'link':
                      return <Link2 className="w-4 h-4 text-blue-500 shrink-0" />;
                    case 'image':
                      return <Image className="w-4 h-4 text-amber-500 shrink-0" />;
                    default:
                      return <FileText className="w-4 h-4 text-emerald-500 shrink-0" />;
                  }
                };

                return (
                  <div
                    key={memory.id}
                    onClick={() => onSelectMemory(memory)}
                    className="py-3 group flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        {getIcon()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                          {memory.title}
                        </h3>
                        {/* Zero-Pill metadata with · separator */}
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{memory.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{memory.type}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {new Date(memory.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                          {memory.summary || memory.content.slice(0, 100)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskQuestion(`Summarize and test me on "${memory.title}"`);
                      }}
                      className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                      title="Ask AI about this"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No memories saved yet. Click "Save Information" to begin.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Categorized Memories */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Categorized Memories
            </h2>

            <div className="space-y-2.5">
              {stats?.categories && stats.categories.length > 0 ? (
                stats.categories.map((cat, i) => {
                  const percentage = stats.totalMemories
                    ? Math.round((cat.count / stats.totalMemories) * 100)
                    : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-300">
                          {cat.category}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {cat.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400">No categories indexed yet.</div>
              )}
            </div>
          </div>

          {/* Quick Ingest Shortcuts */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Quick Ingestion
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onQuickUploadType('note')}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 text-left text-slate-700 dark:text-slate-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">New Note</span>
              </button>
              <button
                onClick={() => onQuickUploadType('pdf')}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-left text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all"
              >
                <Upload className="w-4 h-4 text-indigo-500" />
                <span className="font-medium">Upload PDF</span>
              </button>
              <button
                onClick={() => onQuickUploadType('link')}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 text-left text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
              >
                <Link2 className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Save URL</span>
              </button>
              <button
                onClick={() => onNavigate('study')}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 text-left text-slate-700 dark:text-slate-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all"
              >
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Study Quiz</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
