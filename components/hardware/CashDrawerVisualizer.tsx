'use client';

import React, { useEffect, useState } from 'react';
import { Coins, CheckCircle, Volume2, KeyRound } from 'lucide-react';
import { formatBDT } from '@/lib/formatters';

interface DrawerKickDetail {
  timestamp: string;
  reason: string;
  orderNumber?: string;
  amount?: number;
}

export function CashDrawerVisualizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastKick, setLastKick] = useState<DrawerKickDetail | null>(null);

  useEffect(() => {
    const handleKick = (event: CustomEvent<DrawerKickDetail>) => {
      setLastKick(event.detail);
      setIsOpen(true);

      // Auto close visualizer after 4.5 seconds
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 4500);

      return () => clearTimeout(timer);
    };

    window.addEventListener('royal-palette-drawer-kick' as unknown as keyof WindowEventMap, handleKick as unknown as EventListener);
    return () => {
      window.removeEventListener('royal-palette-drawer-kick' as unknown as keyof WindowEventMap, handleKick as unknown as EventListener);
    };
  }, []);

  if (!isOpen || !lastKick) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border-2 border-[#000f50] rounded-xl shadow-2xl p-5 text-slate-900 overflow-hidden relative">
        {/* Top Glowing Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#000f50] via-blue-600 to-[#000f50]" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#000f50]/10 border border-[#000f50]/20 flex items-center justify-center text-[#000f50]">
              <KeyRound className="w-6 h-6 text-[#000f50]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> 24V PULSE TRIGGERED
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-[#000f50]" /> Solenoid Open
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">Cash Drawer Opened</h4>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md text-xs"
          >
            ✕
          </button>
        </div>

        {/* Drawer Meta Info */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#f8f8f8] p-2 rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Reason</span>
            <span className="font-semibold text-slate-800 truncate block">{lastKick.reason}</span>
          </div>

          {lastKick.amount !== undefined ? (
            <div className="bg-[#f8f8f8] p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Amount Tendered</span>
              <span className="font-mono font-bold text-[#000f50] block">{formatBDT(lastKick.amount)}</span>
            </div>
          ) : (
            <div className="bg-[#f8f8f8] p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Relay Command</span>
              <span className="font-mono text-[11px] text-slate-700 block">ESC p 0 25 250</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
