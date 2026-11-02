export type MemoryType = 'note' | 'pdf' | 'document' | 'link' | 'image';

export type MemoryCategory = 
  | 'Work' 
  | 'Study' 
  | 'Research' 
  | 'Personal' 
  | 'Finance' 
  | 'Technology' 
  | 'Health'
  | 'Other';

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  title: string;
  content: string;
  summary: string;
  category: MemoryCategory;
  tags: string[];
  keyTakeaways: string[];
  sourceUrl?: string;
  fileName?: string;
  fileSize?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isFavorite: boolean;
}

export interface CitationSource {
  id: string;
  title: string;
  category: string;
  type: MemoryType;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: CitationSource[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
}

export interface RevisionSummary {
  title: string;
  overview: string;
  keyPoints: string[];
  importantTerms: { term: string; definition: string }[];
  studyTips: string[];
}

export interface StudySession {
  id: string;
  userId: string;
  memoryIds: string[];
  type: 'quiz' | 'flashcards' | 'revision';
  title: string;
  quizData?: QuizQuestion[];
  flashcardsData?: Flashcard[];
  revisionData?: RevisionSummary;
  score?: number;
  totalQuestions?: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}
