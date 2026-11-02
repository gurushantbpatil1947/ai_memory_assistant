import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  BookOpen,
  Trash2,
  Copy,
  Check,
  FileCode,
  FileText,
  Link2,
  ExternalLink,
  Info,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, CitationSource, Memory } from '../types';
import { api } from '../lib/api';

interface ChatAssistantViewProps {
  initialQuery?: string;
  onOpenMemory: (memoryId: string) => void;
  onStartQuizFromTopic: (topic: string) => void;
  totalMemoriesCount: number;
}

export const ChatAssistantView: React.FC<ChatAssistantViewProps> = ({
  initialQuery,
  onOpenMemory,
  onStartQuizFromTopic,
  totalMemoriesCount,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // If initialQuery is passed and not yet sent, auto-fill or trigger
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setInputText(initialQuery);
    }
  }, [initialQuery]);

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      setMessages(history);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: 'temp-u-' + Date.now(),
      userId: 'user',
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await api.sendChatMessage(query);
      const assistantMsg: ChatMessage = {
        id: response.messageId || 'temp-a-' + Date.now(),
        userId: 'assistant',
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      scrollToBottom();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        userId: 'assistant',
        role: 'assistant',
        content: 'Error communicating with MindVault AI: ' + (err.message || 'Unknown error'),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all conversation history?')) {
      try {
        await api.clearChatHistory();
        setMessages([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const starterQuestions = [
    'What are the core mechanics of Transformer self-attention?',
    'Summarize our Q4 product roadmap and latency goals',
    'What did I save about solid-state battery energy density?',
    'What neuroscience protocols did I note for memory retention?',
    'What is the capital of Mars?', // Test grounding: clearly unavailable!
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Chat Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                MindVault Grounded Assistant
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                gemini-3.8-flash
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounded exclusively in your {totalMemoriesCount} saved memories with citation provenance
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Message Thread Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty Chat View with Starters */
          <div className="py-8 max-w-xl mx-auto text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-950/60 dark:to-indigo-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                How can MindVault assist you today?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ask any question in natural language. MindVault searches your uploaded PDFs, notes, and website bookmarks, cites exact source documents, and admits when information is unavailable.
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="text-left space-y-2 pt-2">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Try asking about your saved memories:
              </div>
              <div className="space-y-1.5">
                {starterQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 bg-white dark:bg-slate-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                  >
                    <span>"{q}"</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 md:gap-4 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                }`}
              >
                {/* Content */}
                <div
                  className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap select-text ${
                    msg.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Grounded Citation Sources Box */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      <BookOpen className="w-3 h-3" />
                      <span>Cited Source Documents ({msg.sources.length})</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.sources.map((src, idx) => (
                        <div
                          key={idx}
                          onClick={() => onOpenMemory(src.id)}
                          className="group p-2.5 rounded-lg border border-purple-200/80 dark:border-purple-900/60 bg-white dark:bg-slate-900/90 hover:border-purple-400 cursor-pointer transition-all shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            <span className="truncate">{src.title}</span>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono shrink-0 ml-2">
                              {src.category}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                            "{src.excerpt}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant Message Actions */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="font-mono tabular-nums">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1 rounded hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => onStartQuizFromTopic(msg.content.slice(0, 100))}
                        className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Quiz on this topic
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 items-center text-xs text-purple-600 dark:text-purple-400">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning saved documents & synthesizing grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about your documents, notes, or research..."
            className="w-full pl-4 pr-12 py-3 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="absolute right-2 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40 shadow-xs"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
          <span>Grounded retrieval strictly checks your saved records before answering.</span>
          <span className="font-mono">Enter ↵ to send</span>
        </div>
      </div>
    </div>
  );
};
