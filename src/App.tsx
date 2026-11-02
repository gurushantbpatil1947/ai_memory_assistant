import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { MemoriesView } from './components/MemoriesView';
import { UploadView } from './components/UploadView';
import { ChatAssistantView } from './components/ChatAssistantView';
import { StudyAssistantView } from './components/StudyAssistantView';
import { SettingsView } from './components/SettingsView';
import { MemoryDetailModal } from './components/MemoryDetailModal';
import { AuthModal } from './components/AuthModal';
import { Memory, User } from './types';
import { api } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('mv_theme') === 'dark' ||
      (!('mv_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [user, setUser] = useState<User | null>({
    id: 'user-alex-101',
    email: 'alex.chen@mindvault.ai',
    name: 'Alex Chen',
    avatar: '/src/assets/images/default_user_avatar_1793590168049.jpg',
  });

  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modal & Transition State
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [uploadInitialType, setUploadInitialType] = useState<'note' | 'pdf' | 'link' | 'image'>('note');
  const [studyInitialMemoryId, setStudyInitialMemoryId] = useState<string | undefined>(undefined);

  // Sync theme with HTML root class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mv_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mv_theme', 'light');
    }
  }, [isDark]);

  // Global Keyboard Shortcuts (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('memories');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [fetchedMemories, fetchedStats, fetchedUser] = await Promise.all([
        api.getMemories(),
        api.getStats(),
        api.getCurrentUser().catch(() => null),
      ]);
      setMemories(fetchedMemories);
      setStats(fetchedStats);
      if (fetchedUser) setUser(fetchedUser);
    } catch (err) {
      console.error('Failed to load MindVault data', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Actions
  const handleSelectMemory = (mem: Memory) => {
    setSelectedMemory(mem);
  };

  const handleAskQuestion = (query: string) => {
    setChatInitialQuery(query);
    setActiveTab('chat');
  };

  const handleQuickUploadType = (type: 'note' | 'pdf' | 'link' | 'image') => {
    setUploadInitialType(type);
    setActiveTab('upload');
  };

  const handleStartQuiz = (memoryId: string) => {
    setStudyInitialMemoryId(memoryId);
    setActiveTab('study');
  };

  const handleMemoryCreated = (newMemory: Memory) => {
    setMemories((prev) => [newMemory, ...prev]);
    // Refresh stats
    api.getStats().then(setStats).catch(console.error);
  };

  const handleUpdateMemory = async (id: string, updates: Partial<Memory>) => {
    const updated = await api.updateMemory(id, updates);
    setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
    if (selectedMemory?.id === id) {
      setSelectedMemory(updated);
    }
    api.getStats().then(setStats).catch(console.error);
  };

  const handleDeleteMemory = async (id: string) => {
    await api.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    if (selectedMemory?.id === id) {
      setSelectedMemory(null);
    }
    api.getStats().then(setStats).catch(console.error);
  };

  const handleResetData = async () => {
    await api.resetSamples();
    await loadAllData();
  };

  const handleUpdateUser = async (name: string, email: string) => {
    const updated = await api.updateProfile(name, email);
    setUser(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        totalMemoriesCount={memories.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <TopBar
          activeTab={activeTab}
          onOpenMobileNav={() => setIsOpenMobile(true)}
          onQuickUpload={() => setActiveTab('upload')}
          onQuickChat={() => {
            setChatInitialQuery('');
            setActiveTab('chat');
          }}
          onSearchFocus={() => setActiveTab('memories')}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              onNavigate={setActiveTab}
              onSelectMemory={handleSelectMemory}
              onAskQuestion={handleAskQuestion}
              onQuickUploadType={handleQuickUploadType}
            />
          )}

          {activeTab === 'memories' && (
            <MemoriesView
              memories={memories}
              onSelectMemory={handleSelectMemory}
              onUpdateMemory={handleUpdateMemory}
              onDeleteMemory={handleDeleteMemory}
              onNavigateToUpload={() => setActiveTab('upload')}
              onAskAI={handleAskQuestion}
              onStartQuiz={handleStartQuiz}
            />
          )}

          {activeTab === 'upload' && (
            <UploadView
              initialType={uploadInitialType}
              onMemoryCreated={handleMemoryCreated}
              onNavigateToMemories={() => setActiveTab('memories')}
            />
          )}

          {activeTab === 'chat' && (
            <ChatAssistantView
              initialQuery={chatInitialQuery}
              onOpenMemory={(memId) => {
                const found = memories.find((m) => m.id === memId);
                if (found) setSelectedMemory(found);
              }}
              onStartQuizFromTopic={(topic) => {
                setActiveTab('study');
              }}
              totalMemoriesCount={memories.length}
            />
          )}

          {activeTab === 'study' && (
            <StudyAssistantView
              memories={memories}
              initialMemoryId={studyInitialMemoryId}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              onUpdateUser={handleUpdateUser}
              isDark={isDark}
              toggleTheme={toggleTheme}
              onResetData={handleResetData}
              totalMemoriesCount={memories.length}
            />
          )}
        </main>
      </div>

      {/* Memory Detail Modal */}
      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onUpdate={handleUpdateMemory}
        onDelete={handleDeleteMemory}
        onAskAI={handleAskQuestion}
        onStartQuiz={handleStartQuiz}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onLogin={(loggedInUser) => setUser(loggedInUser)}
      />
    </div>
  );
}
