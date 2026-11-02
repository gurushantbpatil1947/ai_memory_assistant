import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileText,
  FileCode,
  Link2,
  Image as ImageIcon,
  Pin,
  Star,
  Sparkles,
  ExternalLink,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { Memory, MemoryCategory, MemoryType } from '../types';

interface MemoriesViewProps {
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  onUpdateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onNavigateToUpload: () => void;
  onAskAI: (query: string) => void;
  onStartQuiz: (memoryId: string) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  memories,
  onSelectMemory,
  onUpdateMemory,
  onDeleteMemory,
  onNavigateToUpload,
  onAskAI,
  onStartQuiz,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Work', 'Study', 'Research', 'Technology', 'Personal', 'Finance'];

  const typeFilters = [
    { id: 'all', label: 'All Items' },
    { id: 'note', label: 'Notes' },
    { id: 'documents', label: 'Documents & PDFs' },
    { id: 'link', label: 'Web Links' },
    { id: 'image', label: 'Images' },
  ];

  // Filtering
  const filteredMemories = memories.filter((mem) => {
    if (selectedCategory !== 'All' && mem.category !== selectedCategory) return false;
    if (selectedType !== 'all') {
      if (selectedType === 'documents' && mem.type !== 'pdf' && mem.type !== 'document') {
        return false;
      } else if (selectedType !== 'documents' && mem.type !== selectedType) {
        return false;
      }
    }
    if (showOnlyFavorites && !mem.isFavorite) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = mem.title.toLowerCase().includes(q);
      const matchContent = mem.content.toLowerCase().includes(q);
      const matchSummary = (mem.summary || '').toLowerCase().includes(q);
      const matchTags = mem.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchSummary && !matchTags) return false;
    }

    return true;
  });

  // Sorting
  const sortedMemories = [...filteredMemories].sort((a, b) => {
    // Pinned always on top
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    if (sortOption === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortOption === 'title') {
      return a.title.localeCompare(b.title);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getTypeIcon = (type: MemoryType) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileCode className="w-4 h-4 text-indigo-500" />;
      case 'link':
        return <Link2 className="w-4 h-4 text-blue-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, keyword, summary, or concept..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Favorites Toggle */}
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                showOnlyFavorites
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Favorites</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {/* View Grid/List toggle */}
            <div className="flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="List view"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={onNavigateToUpload}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Memory</span>
            </button>
          </div>
        </div>

        {/* Interactive Segmented Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Type filters */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs overflow-x-auto">
            {typeFilters.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedType(tf.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  selectedType === tf.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 mr-1 hidden md:inline">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memories Container: Grid or List */}
      {sortedMemories.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMemories.map((mem) => (
              <div
                key={mem.id}
                onClick={() => onSelectMemory(mem)}
                className="group relative flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-purple-300 dark:hover:border-purple-800/80 transition-all cursor-pointer shadow-xs"
              >
                <div className="space-y-3">
                  {/* Card Header: Type icon & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        {getTypeIcon(mem.type)}
                      </div>
                      {/* Zero-Pill text metadata with typographic separator */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {mem.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{mem.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {mem.isPinned && (
                        <span title="Pinned to top">
                          <Pin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </span>
                      )}
                      <button
                        onClick={() => onUpdateMemory(mem.id, { isFavorite: !mem.isFavorite })}
                        className={`p-1 rounded-md transition-colors ${
                          mem.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
                        }`}
                        title="Toggle favorite"
                      >
                        <Star className={`w-3.5 h-3.5 ${mem.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                    {mem.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {mem.summary || mem.content}
                  </p>

                  {/* Zero-Pill Tags */}
                  {mem.tags && mem.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1">
                      {mem.tags.slice(0, 3).map((tag, idx) => (
                        <span key={tag}>
                          #{tag}
                          {idx < Math.min(mem.tags.length, 3) - 1 ? ' ·' : ''}
                        </span>
                      ))}
                      {mem.tags.length > 3 && (
                        <span>+{mem.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    {new Date(mem.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAskAI(`Explain key takeaways from "${mem.title}"`)}
                      className="p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                      title="Ask AI about this"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectMemory(mem)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this memory?')) {
                          onDeleteMemory(mem.id);
                        }
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* High-Density Dense List View */
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
            {sortedMemories.map((mem) => (
              <div
                key={mem.id}
                onClick={() => onSelectMemory(mem)}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getTypeIcon(mem.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {mem.title}
                      </span>
                      {mem.isPinned && (
                        <Pin className="w-3 h-3 text-purple-600 shrink-0" />
                      )}
                    </div>
                    {/* Zero-Pill text metadata with · separator */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {mem.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{mem.type}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(mem.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onAskAI(`What are the core ideas of "${mem.title}"?`)}
                    className="p-1.5 text-xs rounded-md text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    title="Ask AI"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateMemory(mem.id, { isFavorite: !mem.isFavorite })}
                    className="p-1.5 rounded-md text-slate-400 hover:text-amber-500"
                    title="Favorite"
                  >
                    <Star className={`w-4 h-4 ${mem.isFavorite ? 'fill-current text-amber-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete memory?')) onDeleteMemory(mem.id);
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 p-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Filter className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No matching memories found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No memories matched "${searchQuery}". Try clearing filters or searching for different keywords.`
                : 'Your vault is currently empty. Save your first note, PDF, or website link to start building your personal AI knowledge vault.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onNavigateToUpload}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
            >
              Save Your First Memory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
