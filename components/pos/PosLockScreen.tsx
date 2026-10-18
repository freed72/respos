'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Lock, Delete, ShieldAlert, CheckCircle2, User } from 'lucide-react';
import { StaffMember } from '@/types';
import { getStaffMembers, authenticateWithPin, setActiveStaff } from '@/lib/pos-auth';

interface PosLockScreenProps {
  onUnlock: (staff: StaffMember) => void;
}

export function PosLockScreen({ onUnlock }: PosLockScreenProps) {
  const staffList = getStaffMembers();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    setErrorMsg(null);
    setPin((prev) => prev + digit);
  }, [pin.length]);

  const handleBackspace = useCallback(() => {
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setErrorMsg(null);
    setPin('');
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const verifyPin = useCallback((pinToVerify: string) => {
    const matchedStaff = authenticateWithPin(pinToVerify, selectedStaffId || undefined);
    if (matchedStaff) {
      setIsSuccess(true);
      setErrorMsg(null);
      setActiveStaff(matchedStaff);
      setTimeout(() => {
        onUnlock(matchedStaff);
      }, 350);
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
      triggerShake();
      setPin('');
    }
  }, [selectedStaffId, onUnlock]);

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      verifyPin(pin);
    }
  }, [pin, verifyPin]);

  // Support physical hardware keyboard numpad & key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  const selectedStaff = selectedStaffId ? staffList.find((s) => s.id === selectedStaffId) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#030611] via-[#060b1e] to-[#040714] text-white flex flex-col items-center justify-center p-4 select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Card */}
      <div className="relative w-full max-w-sm flex flex-col items-center text-center space-y-5">
        {/* Brand Emblem */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[1px] shadow-2xl shadow-amber-500/20">
            <div className="w-full h-full rounded-2xl bg-[#090e24] flex items-center justify-center">
              {isSuccess ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-scale-in" />
              ) : (
                <Crown className="w-8 h-8 text-amber-300 animate-pulse" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-amber-400/40 flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5 text-amber-300" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>The Royal Palette POS</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {selectedStaff ? `Passcode for ${selectedStaff.name}` : 'Enter Cashier / Manager 4-Digit Passcode'}
          </p>
        </div>

        {/* Staff Switcher Chips */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 max-w-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedStaffId(null);
              setPin('');
              setErrorMsg(null);
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition border ${
              selectedStaffId === null
                ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Any Staff
          </button>
          {staffList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedStaffId(s.id);
                setPin('');
                setErrorMsg(null);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition border flex items-center gap-1 ${
                selectedStaffId === s.id
                  ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <User className="w-3 h-3" />
              <span>{s.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* PIN 4-Dot Indicators with Shake animation on error */}
        <div
          className={`flex items-center justify-center gap-4 py-2 transition-transform duration-300 ${
            isShaking ? 'translate-x-[-8px] animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
                    : isFilled
                    ? 'bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/50'
                    : 'border-slate-600 bg-white/5'
                }`}
              />
            );
          })}
        </div>

        {/* Error / Status Notice */}
        <div className="h-4">
          {errorMsg ? (
            <p className="text-[11px] text-rose-400 font-bold flex items-center justify-center gap-1 animate-fade-in">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          ) : isSuccess ? (
            <p className="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Unlocked successfully. Opening register...</span>
            </p>
          ) : null}
        </div>

        {/* 3x4 Touch Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white/[0.07] border border-white/10 hover:bg-white/15 active:bg-amber-400 active:text-black font-mono text-xl font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Row 4: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-rose-500/20 text-rose-300 font-mono text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white/[0.07] border border-white/10 hover:bg-white/15 active:bg-amber-400 active:text-black font-mono text-xl font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-14 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/15 active:bg-amber-400 active:text-black text-slate-300 transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
