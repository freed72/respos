'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Sparkles,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ChevronLeft
} from 'lucide-react';

interface AdminLoginGateProps {
  onAuthenticated: (user: { username: string; role: string }) => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onAuthenticated(data.user);
      } else {
        setErrorMsg(data.message || 'Invalid executive credentials. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setErrorMsg('Network or server connection error. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-zinc-800 selection:text-zinc-100">
      
      {/* Subtle Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-zinc-800/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="px-3.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Public Website</span>
        </Link>
      </div>

      {/* Main Lockscreen Card (shadcn dark gray style) */}
      <div
        className={`w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6 transition-transform duration-200 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          
          <h1 className="font-sans font-bold text-2xl text-zinc-100 tracking-tight pt-2">
            The Royal Palette
          </h1>
          <p className="text-xs text-amber-400/90 font-mono font-semibold">
            Executive Command Suite • Authentication
          </p>
          <p className="text-xs text-zinc-400">
            Authorized management personnel only. Enter your credentials.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
          
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium block">Executive Username</label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition text-xs font-mono"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-medium block">Security Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Access Executive HQ</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Security & Env Notice */}
        <div className="pt-2 border-t border-zinc-800/80 text-center space-y-1 text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Environment-Secured Session (ENV)</span>
          </div>
        </div>

      </div>

    </div>
  );
};
