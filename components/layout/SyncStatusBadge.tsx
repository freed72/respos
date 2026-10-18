'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowUpRight,
  Clock,
  HardDrive,
  Check,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';

interface SyncStatusBadgeProps {
  variant?: 'pos-light' | 'pos-dark' | 'admin';
  className?: string;
}

export function SyncStatusBadge({ variant = 'admin', className = '' }: SyncStatusBadgeProps) {
  const {
    isOnline,
    outboxQueue,
    isSyncingOutbox,
    lastSyncTime,
    flushOutbox,
    syncFromDatabase,
    clearOutboxQueue,
    removeOutboxItem,
  } = useRestaurantStore();

  const [isOpen, setIsOpen] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleManualSync = async () => {
    setManualSyncLoading(true);
    setSyncSuccessMessage(null);
    setSyncErrorMessage(null);
    try {
      const res = await flushOutbox();
      await syncFromDatabase();
      if (res.failed > 0) {
        setSyncErrorMessage(`${res.failed} item(s) failed to sync. Check error details below.`);
      } else if (res.processed > 0) {
        setSyncSuccessMessage(`Successfully synced ${res.processed} pending mutation(s)!`);
      } else {
        setSyncSuccessMessage('Database is up-to-date and synced.');
      }
      setTimeout(() => {
        setSyncSuccessMessage(null);
        setSyncErrorMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Manual sync error:', err);
      setSyncErrorMessage(err?.message || 'Sync failed. Check connection.');
    } finally {
      setManualSyncLoading(false);
    }
  };

  const pendingCount = outboxQueue.length;
  const isPending = pendingCount > 0;
  const isSyncing = isSyncingOutbox || manualSyncLoading;

  // Format relative last sync time
  const formattedSyncTime = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Pending startup';

  // Variant styling helpers
  const getBadgeClasses = () => {
    if (!isOnline) {
      if (variant === 'pos-light') {
        return 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100';
      }
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25';
    }

    if (isSyncing) {
      if (variant === 'pos-light') {
        return 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100';
      }
      return 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25';
    }

    if (isPending) {
      if (variant === 'pos-light') {
        return 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';
      }
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20';
    }

    // Fully synced online
    if (variant === 'pos-light') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100';
    }
    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Interactive Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border flex items-center gap-2 transition-all font-mono text-xs font-semibold cursor-pointer shadow-xs select-none active:scale-98 ${getBadgeClasses()}`}
        title="Network & Offline Outbox Status"
      >
        {/* Status Indicator Icon */}
        {!isOnline ? (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          </div>
        ) : isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
        ) : isPending ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <Database className="w-3.5 h-3.5 text-amber-400" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        )}

        {/* Status Text Label */}
        <span className="hidden sm:inline font-sans text-xs">
          {!isOnline
            ? `Offline (${pendingCount})`
            : isSyncing
            ? `Syncing (${pendingCount})...`
            : isPending
            ? `Queued (${pendingCount})`
            : 'Cloud Synced'}
        </span>

        {/* Mobile Mini Counter */}
        {pendingCount > 0 && (
          <span className="sm:hidden px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Detailed Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl ${
            variant === 'pos-light'
              ? 'bg-white/95 border-slate-200 text-slate-900'
              : 'bg-[#0b1329]/95 border-slate-700/80 text-slate-100'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">
                  {isOnline ? 'Cloud Database Connected' : 'Offline Safe Mode Active'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {isOnline ? 'Postgres BaaS • InsForge Engine' : 'Zero-Latency Local Storage Cache'}
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Outbox Status Card */}
          <div className="py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Pending Outbox Queue</span>
              </span>
              <span
                className={`font-mono font-bold ${
                  pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {pendingCount} {pendingCount === 1 ? 'mutation' : 'mutations'}
              </span>
            </div>

            {/* Outbox Queue Preview Items */}
            {pendingCount > 0 ? (
              <div
                className={`max-h-48 overflow-y-auto rounded-lg p-2 space-y-2 text-[11px] font-mono border ${
                  variant === 'pos-light'
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                {outboxQueue.map((item) => (
                  <div key={item.id} className="p-1.5 rounded bg-black/20 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold truncate">
                        • {item.type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            item.attempts > 0
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {item.attempts > 0 ? `Failed (${item.attempts}x)` : 'Queued'}
                        </span>
                        <button
                          onClick={() => removeOutboxItem(item.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          title="Discard this queue item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {item.lastError && (
                      <p className="text-[10px] text-rose-400 font-sans leading-tight pl-2 border-l border-rose-500/40 truncate" title={item.lastError}>
                        {item.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                  variant === 'pos-light'
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All POS orders and data are 100% synchronized with the cloud backend.</span>
              </div>
            )}

            {/* Last Synced Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 font-sans">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Last Cloud Sync:</span>
              </span>
              <span className="font-mono text-slate-300">{formattedSyncTime}</span>
            </div>

            {syncSuccessMessage && (
              <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                <span>{syncSuccessMessage}</span>
              </div>
            )}

            {syncErrorMessage && (
              <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{syncErrorMessage}</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-md cursor-pointer ${
                variant === 'pos-light'
                  ? 'bg-[#000f50] hover:bg-[#00177e] text-white disabled:bg-slate-300'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 disabled:opacity-50'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Now...' : 'Force Sync / Replay Outbox'}</span>
            </button>
            {pendingCount > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all pending offline mutations from outbox queue?')) {
                    clearOutboxQueue();
                  }
                }}
                className="py-2 px-3 rounded-xl font-semibold text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 transition active:scale-98"
                title="Clear all stuck queue items"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
