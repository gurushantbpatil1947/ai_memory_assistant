import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: 'user-' + Date.now(),
      email: email.trim() || 'user@mindvault.ai',
      name: name.trim() || (email ? email.split('@')[0] : 'MindVault Member'),
      avatar: '/src/assets/images/default_user_avatar_1793590168049.jpg',
    };
    onLogin(newUser);
    onClose();
  };

  const handleDemoSignIn = () => {
    onLogin({
      id: 'user-alex-101',
      email: 'alex.chen@mindvault.ai',
      name: 'Alex Chen',
      avatar: '/src/assets/images/default_user_avatar_1793590168049.jpg',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <span className="font-bold text-sm">MV</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Sign In to MindVault' : 'Create Your MindVault'}
              </h2>
              <span className="text-[11px] text-slate-500">Personal AI Memory Assistant</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo User Fast Access */}
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-200">
            <span>Instant Access Profile</span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100">
              Demo
            </span>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-300">
            Sign in as researcher <strong>Alex Chen</strong> with pre-indexed Transformer papers, roadmaps, and clean energy notes.
          </p>
          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Continue as Alex Chen</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-100 dark:border-slate-800" />
          <span className="absolute bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 font-medium">
            or with credentials
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{mode === 'login' ? 'Sign In to Vault' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
