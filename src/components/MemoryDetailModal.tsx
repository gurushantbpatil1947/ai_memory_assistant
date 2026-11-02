import React, { useState } from 'react';
import {
  X,
  FileText,
  FileCode,
  Link2,
  Image as ImageIcon,
  ExternalLink,
  Edit2,
  Check,
  Trash2,
  Sparkles,
  Share2,
  Pin,
  Star,
  Copy,
} from 'lucide-react';
import { Memory, MemoryCategory } from '../types';

interface MemoryDetailModalProps {
  memory: Memory | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Memory>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAskAI: (query: string) => void;
  onStartQuiz: (memoryId: string) => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory,
  onClose,
  onUpdate,
  onDelete,
  onAskAI,
  onStartQuiz,
}) => {
  if (!memory) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(memory.title);
  const [content, setContent] = useState(memory.content);
  const [category, setCategory] = useState<MemoryCategory>(memory.category);
  const [tagsInput, setTagsInput] = useState(memory.tags.join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const categories: MemoryCategory[] = [
    'Work',
    'Study',
    'Research',
    'Personal',
    'Finance',
    'Technology',
    'Health',
    'Other',
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      await onUpdate(memory.id, {
        title,
        content,
        category,
        tags: parsedTags,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${memory.title}\n\n${memory.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = () => {
    switch (memory.type) {
      case 'pdf':
      case 'document':
        return <FileCode className="w-5 h-5 text-indigo-500" />;
      case 'link':
        return <Link2 className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              {getTypeIcon()}
            </div>
            <div>
              {/* Zero-Pill text metadata with typographic separator */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-purple-600 dark:text-purple-400">{memory.category}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{memory.type}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {new Date(memory.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {memory.fileSize && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {(memory.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdate(memory.id, { isFavorite: !memory.isFavorite })}
              className={`p-1.5 rounded-lg border transition-colors ${
                memory.isFavorite
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Toggle favorite"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => onUpdate(memory.id, { isPinned: !memory.isPinned })}
              className={`p-1.5 rounded-lg border transition-colors ${
                memory.isPinned
                  ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Toggle pin"
            >
              <Pin className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Copy text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Edit memory"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this memory?')) {
                  onDelete(memory.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              title="Delete memory"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MemoryCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Full Content
                </label>
                <textarea
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title & External Link */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {memory.title}
                </h2>
                {memory.sourceUrl && (
                  <a
                    href={memory.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{memory.sourceUrl}</span>
                  </a>
                )}
              </div>

              {/* AI Executive Summary Box */}
              {memory.summary && (
                <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Executive Summary</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {memory.summary}
                  </p>
                </div>
              )}

              {/* Key Takeaways */}
              {memory.keyTakeaways && memory.keyTakeaways.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Key Takeaways & Core Concepts
                  </h3>
                  <ul className="space-y-1.5">
                    {memory.keyTakeaways.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        <span className="text-purple-500 font-bold shrink-0">·</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags (Zero-Pill: inline text with separators) */}
              {memory.tags && memory.tags.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Indexed Keywords & Tags
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {memory.tags.map((tag, i) => (
                      <React.Fragment key={tag}>
                        <span>#{tag}</span>
                        {i < memory.tags.length - 1 && <span aria-hidden="true">·</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Preview if type is image */}
              {memory.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-80 object-cover"
                  />
                </div>
              )}

              {/* Full Content */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Document Content
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-text">
                  {memory.content}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAskAI(`What are the key implications and insights of "${memory.title}"?`);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Ask in AI Chat</span>
            </button>

            <button
              onClick={() => {
                onStartQuiz(memory.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span>Test Knowledge Quiz</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
