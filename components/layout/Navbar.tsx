'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  UtensilsCrossed,
  MonitorCheck,
  Crown,
  LayoutDashboard,
  KeyRound,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';

export function Navbar() {
  const pathname = usePathname();
  const { kickDrawer } = useRestaurantStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isKicking, setIsKicking] = useState(false);

  const handleManualKick = async () => {
    setIsKicking(true);
    await kickDrawer('Cashier Key Override', undefined, undefined);
    setTimeout(() => setIsKicking(false), 1200);
  };

  const navLinks = [
    { name: 'Digital Menu', href: '/menu', icon: UtensilsCrossed, badge: 'Guest' },
    { name: 'POS Terminal', href: '/pos', icon: MonitorCheck, badge: 'Staff' },
    { name: 'VIP Rewards', href: '/loyalty', icon: Crown, badge: 'Club' },
    { name: 'Admin Portal', href: '/admin', icon: LayoutDashboard, badge: 'Back-Office' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#000f50]/20 shadow-sm group-hover:border-[#000f50]/40 transition duration-300">
              <Image
                src="/images/logo.jpeg"
                alt="The Royal Palette Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wide text-[#000f50] uppercase">
                  The Royal Palette
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#000f50]/10 text-[#000f50] border border-[#000f50]/20">
                  <Sparkles className="w-2.5 h-2.5 mr-1" /> BDT ৳
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wider hidden sm:block">
                LUXURY DINING & BANQUET SYSTEM
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#000f50] text-white shadow-sm font-bold'
                      : 'text-slate-700 hover:text-[#000f50] hover:bg-[#f8f8f8] border border-transparent hover:border-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#000f50]'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Hardware & Loyalty Actions */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              href="/loyalty"
              className="px-3 py-2 rounded-xl text-xs font-bold border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-amber-500/20 text-[#000f50] hover:bg-amber-500/25 flex items-center gap-1.5 transition shadow-2xs"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>VIP Points</span>
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">
                1pt = ৳1
              </span>
            </Link>

            <button
              onClick={handleManualKick}
              disabled={isKicking}
              title="Send ESC/POS Drawer Kick Pulse (Pin 2 / 24V)"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all shadow-xs ${
                isKicking
                  ? 'bg-[#000f50] text-white border-[#000f50] scale-95'
                  : 'bg-[#f8f8f8] text-[#000f50] border-slate-200 hover:bg-[#000f50]/10 hover:border-[#000f50]/30'
              }`}
            >
              <KeyRound className={`w-3.5 h-3.5 ${isKicking ? 'animate-spin' : 'text-[#000f50]'}`} />
              <span>{isKicking ? 'Pulse Sent!' : 'Open Cash Drawer'}</span>
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/loyalty"
              className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-1 text-xs font-bold"
              title="VIP Points & Rewards"
            >
              <Crown className="w-4 h-4 text-amber-600" />
            </Link>
            <button
              onClick={handleManualKick}
              className="p-2 rounded-lg bg-[#f8f8f8] border border-slate-200 text-[#000f50]"
              title="Open Cash Drawer"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#f8f8f8] border border-slate-200 text-slate-700 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-[#000f50] text-white'
                    : 'text-slate-700 hover:bg-[#f8f8f8] hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#000f50]'}`} />
                  <span>{link.name}</span>
                </div>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {link.badge}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
