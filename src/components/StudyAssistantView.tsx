import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Layers,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { Memory, QuizQuestion, Flashcard, RevisionSummary, StudySession } from '../types';
import { api } from '../lib/api';

interface StudyAssistantViewProps {
  memories: Memory[];
  initialMemoryId?: string;
}

export const StudyAssistantView: React.FC<StudyAssistantViewProps> = ({
  memories,
  initialMemoryId,
}) => {
  const [selectedType, setSelectedType] = useState<'quiz' | 'flashcards' | 'revision'>('quiz');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>(
    initialMemoryId ? [initialMemoryId] : []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Session State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  // Revision Summary State
  const [revisionSummary, setRevisionSummary] = useState<RevisionSummary | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Past Sessions
  const [pastSessions, setPastSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    loadPastSessions();
  }, []);

  const loadPastSessions = async () => {
    try {
      const sessions = await api.getStudySessions();
      setPastSessions(sessions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (memories.length === 0) {
      setErrorMessage('Please save some memories or documents first before generating study materials.');
      return;
    }
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const title =
        selectedMemoryIds.length === 1
          ? `Study: ${memories.find((m) => m.id === selectedMemoryIds[0])?.title}`
          : `Comprehensive Study Session (${selectedType})`;

      const res = await api.generateStudy(selectedType, selectedMemoryIds, title);
      setActiveSessionId(res.sessionId);

      if (selectedType === 'quiz') {
        setQuizQuestions(res.data);
        setCurrentQuizIndex(0);
        setSelectedAnswers({});
        setQuizSubmitted(false);
      } else if (selectedType === 'flashcards') {
        setFlashcards(res.data);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setMasteredCards(new Set());
      } else if (selectedType === 'revision') {
        setRevisionSummary(res.data);
      }

      loadPastSessions();
    } catch (err: any) {
      setErrorMessage(err.message || 'Study material generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Quiz Answer Selection
  const handleSelectQuizOption = (optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuizIndex]: optionIndex,
    }));
  };

  const handleFinishQuiz = async () => {
    setQuizSubmitted(true);
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    if (activeSessionId) {
      await api.recordQuizScore(activeSessionId, correctCount, quizQuestions.length);
      loadPastSessions();
    }

    if (correctCount >= Math.ceil(quizQuestions.length * 0.7)) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const currentQ = quizQuestions[currentQuizIndex];
  const totalScore = quizQuestions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Visual Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xs">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/study_assistant_concept_1793590166896.jpg"
            alt="Study synthesis knowledge core"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-8 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
            <span>Active Recall & Spaced Repetition</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            AI Study Assistant
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Transform notes, PDF manuals, and research papers into interactive quizzes, concept flashcards, and high-yield revision summaries powered by Gemini.
          </p>
        </div>
      </div>

      {/* Control Panel: Mode Selection & Memory Scope */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Choose Study Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('quiz')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedType === 'quiz'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <HelpCircle className="w-4 h-4 mb-1 text-purple-600 dark:text-purple-400" />
                <span>5-Question Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('flashcards')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedType === 'flashcards'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4 mb-1 text-indigo-600 dark:text-indigo-400" />
                <span>Flashcards</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('revision')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedType === 'revision'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="w-4 h-4 mb-1 text-blue-600 dark:text-blue-400" />
                <span>Revision Sheet</span>
              </button>
            </div>
          </div>

          {/* Target Memories Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Source Material Scope
            </label>
            <select
              value={selectedMemoryIds[0] || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setSelectedMemoryIds([]);
                } else {
                  setSelectedMemoryIds([val]);
                }
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">All Saved Memories & Documents (Synthesized)</option>
              {memories.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.category})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {selectedMemoryIds.length === 0
                ? 'Synthesizes insights across your entire memory vault.'
                : `Focuses strictly on the chosen document.`}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || memories.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  Generate {selectedType === 'quiz' ? 'Interactive Quiz' : selectedType === 'flashcards' ? 'Active Recall Cards' : 'Master Revision Sheet'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---------------- MODE 1: INTERACTIVE QUIZ ---------------- */}
      {selectedType === 'quiz' && quizQuestions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-6">
          {/* Quiz Header & Progress */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Question {currentQuizIndex + 1} of {quizQuestions.length}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium font-mono tabular-nums">
                Score: {totalScore} / {quizQuestions.length}
              </span>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1">
              {quizQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuizIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-colors ${
                    currentQuizIndex === idx
                      ? 'bg-purple-600 text-white font-bold'
                      : selectedAnswers[idx] !== undefined
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Current Question */}
          {currentQ && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentQuizIndex] === optIdx;
                  const isCorrect = currentQ.correctIndex === optIdx;

                  let optionStyles = 'border-slate-200 dark:border-slate-800 hover:border-purple-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      optionStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium';
                    } else if (isSelected && !isCorrect) {
                      optionStyles = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
                    }
                  } else if (isSelected) {
                    optionStyles = 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-100 font-semibold';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectQuizOption(optIdx)}
                      className={`w-full p-3.5 text-left rounded-xl border text-xs md:text-sm transition-all flex items-start gap-3 ${optionStyles}`}
                    >
                      <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 leading-relaxed">{option}</span>
                      {quizSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {quizSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (Shown when submitted or option answered) */}
              {quizSubmitted && (
                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs space-y-1">
                  <div className="font-bold text-indigo-700 dark:text-indigo-300">
                    Explanation:
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Navigation Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentQuizIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuizIndex === 0}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {!quizSubmitted ? (
                  currentQuizIndex === quizQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleFinishQuiz}
                      className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                    >
                      Submit Quiz & Check Score
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentQuizIndex((prev) => Math.min(quizQuestions.length - 1, prev + 1))}
                      className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswers({});
                      setQuizSubmitted(false);
                      setCurrentQuizIndex(0);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MODE 2: FLASHCARDS ---------------- */}
      {selectedType === 'flashcards' && flashcards.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Card {currentCardIndex + 1} of {flashcards.length}
            </span>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Mastered: {masteredCards.size} / {flashcards.length}
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="group relative h-72 w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 p-8 flex flex-col justify-between items-center text-center cursor-pointer shadow-sm hover:border-purple-400 transition-all select-none"
          >
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {flashcards[currentCardIndex]?.category || 'Concept Card'}
              </span>
              <span>{isFlipped ? 'Answer (Click to flip)' : 'Question (Click to flip)'}</span>
            </div>

            <div className="my-auto px-4">
              {!isFlipped ? (
                <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {flashcards[currentCardIndex]?.front}
                </div>
              ) : (
                <div className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {flashcards[currentCardIndex]?.back}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 group-hover:text-purple-500 transition-colors">
              Click anywhere on card or press Space to flip
            </div>
          </div>

          {/* Card Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentCardIndex === 0}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const card = flashcards[currentCardIndex];
                  if (card) {
                    setMasteredCards((prev) => {
                      const next = new Set(prev);
                      next.has(card.id) ? next.delete(card.id) : next.add(card.id);
                      return next;
                    });
                  }
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  masteredCards.has(flashcards[currentCardIndex]?.id)
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {masteredCards.has(flashcards[currentCardIndex]?.id) ? 'Mastered ✓' : 'Mark as Mastered'}
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-xl"
              >
                Flip
              </button>
            </div>

            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
              }}
              disabled={currentCardIndex === flashcards.length - 1}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 disabled:opacity-30"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MODE 3: REVISION SUMMARY ---------------- */}
      {selectedType === 'revision' && revisionSummary && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {revisionSummary.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grounded executive cheat sheet synthesized across selected memories
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(revisionSummary, null, 2));
                setCopiedSummary(true);
                setTimeout(() => setCopiedSummary(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied' : 'Copy Sheet'}</span>
            </button>
          </div>

          {/* Overview */}
          <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            {revisionSummary.overview}
          </div>

          {/* High Yield Key Points */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              High-Yield Key Points
            </h3>
            <ul className="space-y-2">
              {revisionSummary.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="text-purple-600 font-bold shrink-0">·</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Terms & Definitions */}
          {revisionSummary.importantTerms && revisionSummary.importantTerms.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Essential Vocabulary & Definitions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {revisionSummary.importantTerms.map((termObj, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1"
                  >
                    <div className="font-bold text-purple-700 dark:text-purple-300">
                      {termObj.term}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {termObj.definition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study & Application Tips */}
          {revisionSummary.studyTips && revisionSummary.studyTips.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Cognitive Study Tips
              </h3>
              <ul className="space-y-1.5">
                {revisionSummary.studyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Past Study Sessions History */}
      {pastSessions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Past Study Sessions
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {pastSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {session.title}
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono">
                    <span className="capitalize">{session.type}</span> ·{' '}
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {session.score !== undefined && session.totalQuestions && (
                  <div className="font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
                    Score: {session.score} / {session.totalQuestions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
