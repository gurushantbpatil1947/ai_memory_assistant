import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Link2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import { Memory, MemoryCategory, MemoryType } from '../types';
import { api } from '../lib/api';

interface UploadViewProps {
  onMemoryCreated: (newMemory: Memory) => void;
  onNavigateToMemories: () => void;
  initialType?: 'note' | 'pdf' | 'link' | 'image';
}

export const UploadView: React.FC<UploadViewProps> = ({
  onMemoryCreated,
  onNavigateToMemories,
  initialType = 'note',
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'pdf' | 'link' | 'image'>(initialType);

  // Common form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMemory, setSuccessMemory] = useState<Memory | null>(null);

  // Note Tab State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<MemoryCategory>('Study');
  const [noteTags, setNoteTags] = useState('notes, concept');

  // PDF Tab State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfExtractedData, setPdfExtractedData] = useState<{
    title: string;
    content: string;
    category: MemoryCategory;
    tags: string[];
    summary: string;
    keyTakeaways: string[];
    pages?: number;
    fileSize?: number;
  } | null>(null);

  // Link Tab State
  const [urlInput, setUrlInput] = useState('');
  const [urlExtractedData, setUrlExtractedData] = useState<{
    title: string;
    content: string;
    category: MemoryCategory;
    tags: string[];
    summary: string;
    keyTakeaways: string[];
    sourceUrl: string;
  } | null>(null);

  // Image Tab State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageNotes, setImageNotes] = useState('');
  const [imageCategory, setImageCategory] = useState<MemoryCategory>('Personal');
  const [imageTags, setImageTags] = useState('diagram, visual');

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

  // 1. Handle Note AI Auto-Organize
  const handleAutoOrganizeNote = async () => {
    if (!noteContent.trim()) {
      setErrorMessage('Please type some content first for AI to analyze.');
      return;
    }
    setErrorMessage(null);
    setIsAiAnalyzing(true);
    try {
      const res = await api.autoOrganize(noteTitle || 'Untitled Note', noteContent);
      setNoteCategory(res.category);
      setNoteTags(res.tags.join(', '));
      if (!noteTitle && res.summary) {
        setNoteTitle(res.summary.slice(0, 45) + '...');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Auto-organization failed');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // 2. Handle Save Note
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      setErrorMessage('Both title and content are required');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const tagsArray = noteTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const created = await api.createMemory({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        type: 'note',
        category: noteCategory,
        tags: tagsArray,
        autoAnalyze: true,
      });

      setSuccessMemory(created);
      onMemoryCreated(created);
      // Reset form
      setNoteTitle('');
      setNoteContent('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle PDF File Selection & Extraction
  const handlePdfUpload = async (file: File) => {
    setPdfFile(file);
    setErrorMessage(null);
    setIsAiAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          // If it's a plain text or markdown file, parse directly as text
          if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const rawText = atob(base64.split(',')[1]);
            const organized = await api.autoOrganize(file.name, rawText);
            setPdfExtractedData({
              title: file.name.replace(/\.[^/.]+$/, ''),
              content: rawText,
              category: organized.category,
              tags: organized.tags,
              summary: organized.summary,
              keyTakeaways: organized.keyTakeaways,
              fileSize: file.size,
            });
          } else {
            // PDF file
            const parsed = await api.parsePdf(base64, file.name);
            setPdfExtractedData({
              title: parsed.title,
              content: parsed.content,
              category: parsed.category,
              tags: parsed.tags,
              summary: parsed.summary,
              keyTakeaways: parsed.keyTakeaways,
              pages: parsed.pages,
              fileSize: parsed.fileSize,
            });
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to extract text from document');
        } finally {
          setIsAiAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read file');
      setIsAiAnalyzing(false);
    }
  };

  const handleSavePdf = async () => {
    if (!pdfExtractedData) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await api.createMemory({
        title: pdfExtractedData.title,
        content: pdfExtractedData.content,
        summary: pdfExtractedData.summary,
        category: pdfExtractedData.category,
        tags: pdfExtractedData.tags,
        keyTakeaways: pdfExtractedData.keyTakeaways,
        type: pdfFile?.name.endsWith('.pdf') ? 'pdf' : 'document',
        fileName: pdfFile?.name,
        fileSize: pdfExtractedData.fileSize,
      });

      setSuccessMemory(created);
      onMemoryCreated(created);
      setPdfFile(null);
      setPdfExtractedData(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Link Fetching & Extraction
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please enter a valid website URL');
      return;
    }
    setErrorMessage(null);
    setIsAiAnalyzing(true);

    try {
      let finalUrl = urlInput.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      const parsed = await api.parseUrl(finalUrl);
      setUrlExtractedData(parsed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to scrape website');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!urlExtractedData) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await api.createMemory({
        title: urlExtractedData.title,
        content: urlExtractedData.content,
        summary: urlExtractedData.summary,
        category: urlExtractedData.category,
        tags: urlExtractedData.tags,
        keyTakeaways: urlExtractedData.keyTakeaways,
        sourceUrl: urlExtractedData.sourceUrl,
        type: 'link',
      });

      setSuccessMemory(created);
      onMemoryCreated(created);
      setUrlInput('');
      setUrlExtractedData(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        if (!imageTitle) {
          setImageTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageTitle.trim() || !imageNotes.trim()) {
      setErrorMessage('Please provide a title and notes/description for this image.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const tagsArray = imageTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const created = await api.createMemory({
        title: imageTitle.trim(),
        content: imageNotes.trim(),
        category: imageCategory,
        tags: tagsArray,
        imageUrl: imagePreview || undefined,
        fileName: imageFile?.name,
        fileSize: imageFile?.size,
        type: 'image',
        autoAnalyze: true,
      });

      setSuccessMemory(created);
      onMemoryCreated(created);
      setImageFile(null);
      setImagePreview(null);
      setImageTitle('');
      setImageNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save image memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Save & Ingest Information
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Save notes, upload PDF research files, bookmark web articles, or store diagram images. Gemini AI extracts concepts, summarizes content, and organizes your vault automatically.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMemory && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold">Memory Successfully Indexed!</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                "{successMemory.title}" was saved into category <strong>{successMemory.category}</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={onNavigateToMemories}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0 transition-colors"
          >
            <span>View in Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Ingestion Tabs (Segmented Buttons) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-medium border border-slate-200/60 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('note');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            activeTab === 'note'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Text Note</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pdf');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            activeTab === 'pdf'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4 text-indigo-500" />
          <span>PDF / Document</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('link');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            activeTab === 'link'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Link2 className="w-4 h-4 text-blue-500" />
          <span>Website URL</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('image');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            activeTab === 'image'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-500" />
          <span>Image / Diagram</span>
        </button>
      </div>

      {/* ---------------- TAB 1: TEXT NOTE ---------------- */}
      {activeTab === 'note' && (
        <form
          onSubmit={handleSaveNote}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Note Title
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g., Deep Learning Optimization Protocols"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as MemoryCategory)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                placeholder="ai, architecture, algorithms"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Note Content
              </label>
              <button
                type="button"
                onClick={handleAutoOrganizeNote}
                disabled={isAiAnalyzing || !noteContent.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 disabled:opacity-40 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiAnalyzing ? 'Analyzing with Gemini...' : 'AI Auto-Detect Category & Tags'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write or paste your note, code snippets, meeting minutes, thoughts, or book summaries here..."
              className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileUp className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Note to Vault'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ---------------- TAB 2: PDF & DOCUMENT ---------------- */}
      {activeTab === 'pdf' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePdfUpload(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer"
            onClick={() => document.getElementById('pdf-file-input')?.click()}
          >
            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePdfUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Click to select or drag and drop document
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports PDF research papers, Markdown (.md), and plain text (.txt) files
            </p>
          </div>

          {/* Processing Indicator */}
          {isAiAnalyzing && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 flex items-center gap-3 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              <span>Extracting document text and running Gemini AI semantic summarizer...</span>
            </div>
          )}

          {/* Document Preview & Confirmation */}
          {pdfExtractedData && !isAiAnalyzing && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {pdfExtractedData.title}
                  </h3>
                  {/* Zero-Pill text metadata with · separator */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {pdfExtractedData.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {pdfExtractedData.pages ? `${pdfExtractedData.pages} pages · ` : ''}
                      {pdfExtractedData.fileSize ? `${(pdfExtractedData.fileSize / 1024).toFixed(1)} KB` : ''}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSavePdf}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save to Vault'}</span>
                </button>
              </div>

              {/* AI Generated Summary */}
              {pdfExtractedData.summary && (
                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs space-y-1">
                  <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Executive Summary</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {pdfExtractedData.summary}
                  </p>
                </div>
              )}

              {/* Key Takeaways */}
              {pdfExtractedData.keyTakeaways && pdfExtractedData.keyTakeaways.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Key Concepts Extracted:
                  </div>
                  <ul className="space-y-1">
                    {pdfExtractedData.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-indigo-500 font-bold">·</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Text Preview */}
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Extracted Content Preview:
                </div>
                <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {pdfExtractedData.content.slice(0, 1500)}...
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: WEBSITE URL ---------------- */}
      {activeTab === 'link' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enter Website URL to Ingest & Summarize
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/Quantum_computing"
                className="flex-1 px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={isAiAnalyzing || !urlInput.trim()}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiAnalyzing ? 'Scraping...' : 'Fetch & Analyze'}</span>
              </button>
            </div>

            {/* Quick demo links */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span>Try sample:</span>
              <button
                type="button"
                onClick={() => setUrlInput('https://arxiv.org/abs/1706.03762')}
                className="underline hover:text-blue-600 cursor-pointer"
              >
                arXiv Transformer Paper
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setUrlInput('https://en.wikipedia.org/wiki/Solid-state_battery')}
                className="underline hover:text-blue-600 cursor-pointer"
              >
                Solid-State Battery
              </button>
            </div>
          </div>

          {/* Analyzing state */}
          {isAiAnalyzing && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 flex items-center gap-3 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>Fetching web article and running Gemini AI semantic summarizer...</span>
            </div>
          )}

          {/* URL Extracted Preview */}
          {urlExtractedData && !isAiAnalyzing && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {urlExtractedData.title}
                  </h3>
                  {/* Zero-Pill text metadata with · separator */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {urlExtractedData.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-sm">{urlExtractedData.sourceUrl}</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveUrl}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save to Vault'}</span>
                </button>
              </div>

              {/* AI Summary */}
              {urlExtractedData.summary && (
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1">
                  <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Executive Summary</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {urlExtractedData.summary}
                  </p>
                </div>
              )}

              {/* Takeaways */}
              {urlExtractedData.keyTakeaways && urlExtractedData.keyTakeaways.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Key Insights:
                  </div>
                  <ul className="space-y-1">
                    {urlExtractedData.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-blue-500 font-bold">·</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: IMAGE MEMORY ---------------- */}
      {activeTab === 'image' && (
        <form
          onSubmit={handleSaveImage}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs space-y-5"
        >
          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Image / Diagram File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-950/40 dark:file:text-purple-300 hover:file:bg-purple-100"
            />
          </div>

          {imagePreview && (
            <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Memory Title
            </label>
            <input
              type="text"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder="e.g., Transformer Multi-Head Attention Architecture Diagram"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={imageCategory}
                onChange={(e) => setImageCategory(e.target.value as MemoryCategory)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tags
              </label>
              <input
                type="text"
                value={imageTags}
                onChange={(e) => setImageTags(e.target.value)}
                placeholder="diagram, blueprint, visual"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Visual Description & Content Notes
            </label>
            <textarea
              rows={4}
              value={imageNotes}
              onChange={(e) => setImageNotes(e.target.value)}
              placeholder="Describe the key diagrams, flowchart steps, formulas, or context in this image for AI search retrieval..."
              className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Image Memory'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
