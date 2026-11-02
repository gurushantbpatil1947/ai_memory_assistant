import { Memory, MemoryCategory, MemoryType, ChatMessage, StudySession, User } from '../types';

export const api = {
  // Stats
  async getStats() {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Memories
  async getMemories(params?: {
    category?: string;
    type?: string;
    search?: string;
    sort?: string;
    favorite?: boolean;
  }): Promise<Memory[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.favorite) searchParams.set('favorite', 'true');

    const res = await fetch(`/api/memories?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async getMemory(id: string): Promise<Memory> {
    const res = await fetch(`/api/memories/${id}`);
    if (!res.ok) throw new Error('Failed to fetch memory');
    return res.json();
  },

  async createMemory(data: Partial<Memory> & { autoAnalyze?: boolean }): Promise<Memory> {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create memory' }));
      throw new Error(err.error || 'Failed to create memory');
    }
    return res.json();
  },

  async updateMemory(id: string, data: Partial<Memory>): Promise<Memory> {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  },

  async deleteMemory(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete memory');
    return res.json();
  },

  async autoOrganize(title: string, content: string) {
    const res = await fetch('/api/memories/auto-organize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Auto-organize failed' }));
      throw new Error(err.error || 'Auto-organize failed');
    }
    return res.json();
  },

  async parseUrl(url: string) {
    const res = await fetch('/api/parse-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to parse URL' }));
      throw new Error(err.error || 'Failed to parse URL');
    }
    return res.json();
  },

  async parsePdf(base64Data: string, fileName?: string) {
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, fileName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to parse PDF' }));
      throw new Error(err.error || 'Failed to parse PDF');
    }
    return res.json();
  },

  // AI Chat
  async sendChatMessage(query: string) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Chat failed' }));
      throw new Error(err.error || 'Chat request failed');
    }
    return res.json();
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const res = await fetch('/api/chat/history');
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  async clearChatHistory() {
    const res = await fetch('/api/chat/history', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear chat history');
    return res.json();
  },

  // Study Assistant
  async generateStudy(type: 'quiz' | 'flashcards' | 'revision', memoryIds?: string[], title?: string) {
    const res = await fetch('/api/study/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, memoryIds, title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Study generation failed' }));
      throw new Error(err.error || 'Study generation failed');
    }
    return res.json();
  },

  async getStudySessions(): Promise<StudySession[]> {
    const res = await fetch('/api/study/sessions');
    if (!res.ok) throw new Error('Failed to fetch study sessions');
    return res.json();
  },

  async recordQuizScore(sessionId: string, score: number, totalQuestions: number) {
    const res = await fetch(`/api/study/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, totalQuestions }),
    });
    if (!res.ok) throw new Error('Failed to record score');
    return res.json();
  },

  // User
  async getCurrentUser(): Promise<User> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateProfile(name: string, email: string): Promise<User> {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async resetSamples() {
    const res = await fetch('/api/admin/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset sample data');
    return res.json();
  },
};
