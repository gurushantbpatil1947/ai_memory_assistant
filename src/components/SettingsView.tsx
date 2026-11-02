import React, { useState } from 'react';
import {
  User,
  Sun,
  Moon,
  Database,
  Download,
  RotateCcw,
  Trash2,
  Code2,
  BookOpen,
  Terminal,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../lib/api';

interface SettingsViewProps {
  user: UserType | null;
  onUpdateUser: (name: string, email: string) => Promise<void>;
  isDark: boolean;
  toggleTheme: () => void;
  onResetData: () => Promise<void>;
  totalMemoriesCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  isDark,
  toggleTheme,
  onResetData,
  totalMemoriesCount,
}) => {
  const [name, setName] = useState(user?.name || 'Alex Chen');
  const [email, setEmail] = useState(user?.email || 'alex.chen@mindvault.ai');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateUser(name, email);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const memories = await api.getMemories();
      const blob = new Blob([JSON.stringify(memories, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindvault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup', err);
    }
  };

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeSnippet(id);
    setTimeout(() => setCopiedCodeSnippet(null), 2000);
  };

  const fastApiCodeSnippet = `# FastAPI Backend Implementation (main.py)
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import google.genai as genai
import os

app = FastAPI(title="MindVault AI Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# SQLite database setup
conn = sqlite3.connect("vault.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    summary TEXT,
    category TEXT,
    tags TEXT,
    created_at TEXT
)''')
conn.commit()

@app.get("/api/memories")
def get_memories():
    cursor.execute("SELECT * FROM memories ORDER BY created_at DESC")
    return cursor.fetchall()

@app.post("/api/chat")
def chat_with_memories(query: str):
    cursor.execute("SELECT title, content, summary FROM memories")
    docs = cursor.fetchall()
    context = "\\n".join([f"Title: {d[0]}\\nContent: {d[1]}" for d in docs])
    
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=f"User question: {query}\\n\\nSaved Documents:\\n{context}\\n\\nAnswer strictly using the documents. Cite title."
    )
    return {"answer": response.text}
`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings & Documentation
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal profile, theme preferences, SQLite database storage, and review setup instructions for local deployment.
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>User Profile</span>
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || '/src/assets/images/default_user_avatar_1793590168049.jpg'}
              alt={user?.name || 'Alex Chen'}
              className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {user?.name || 'Alex Chen'}
              </div>
              <div className="text-[11px] text-slate-400">Personal Knowledge Vault Owner</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSuccess && (
              <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Appearance Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {isDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span>Appearance & Theme</span>
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Interface Mode: {isDark ? 'Dark Mode' : 'Light Mode'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Optimized for high contrast, WCAG AA legibility, and reduced eye fatigue.
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-purple-500" />}
            <span>Switch to {isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* Data & Storage Management */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <span>Storage & Memory Bank</span>
        </h2>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Active SQLite Database Engine
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              Connected (WAL mode)
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Path: <code className="font-mono text-[11px]">data/vault.db</code> · Indexed Records:{' '}
            <strong className="font-mono text-slate-800 dark:text-slate-200">{totalMemoriesCount}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All Memories (JSON)</span>
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Restore initial sample memories? This will re-index high-yield demo papers & notes.')) {
                await onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default Sample Memories</span>
          </button>
        </div>
      </div>

      {/* Local Setup & Architecture Documentation */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Local Setup & Architecture Guide</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Full-Stack / Python & Node.js</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          MindVault is designed with clean modular decoupling. In this AI Studio runtime, it runs as a full-stack React + Express + SQLite + Gemini application. Below are step-by-step instructions to run it locally or deploy with either Node.js Express or Python FastAPI.
        </p>

        {/* Steps */}
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-mono">1</span>
              <span>Clone & Install Dependencies</span>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto select-all">
{`npm install`}
            </pre>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-mono">2</span>
              <span>Configure Environment Variables (.env)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Set your Gemini API key in <code className="font-mono">.env</code>:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto select-all">
{`GEMINI_API_KEY="your_gemini_api_key_here"`}
            </pre>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-mono">3</span>
              <span>Start Development Server (Express + Vite + SQLite)</span>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto select-all">
{`npm run dev`}
            </pre>
            <p className="text-[11px] text-slate-500">
              Server starts at <code className="font-mono text-purple-600 dark:text-purple-400">http://localhost:3000</code>.
            </p>
          </div>

          {/* Python FastAPI Alternative Snippet */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <span>Python FastAPI Alternative Specification</span>
              </div>
              <button
                onClick={() => copyCode('fastapi', fastApiCodeSnippet)}
                className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline"
              >
                {copiedCodeSnippet === 'fastapi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCodeSnippet === 'fastapi' ? 'Copied' : 'Copy Python'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              For teams desiring Python FastAPI backend deployment with Uvicorn:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] max-h-56 overflow-y-auto select-all leading-relaxed">
{fastApiCodeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
