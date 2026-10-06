'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Crown,
  Sparkles,
  Award,
  QrCode,
  Gift,
  Coins,
  CheckCircle2,
  Phone,
  UserPlus,
  Search,
  ArrowRight,
  TrendingUp,
  Copy,
  Check,
  ChefHat,
  Sliders,
  X,
  ChevronRight,
  ShieldCheck,
  Utensils,
  ArrowLeft,
  Home,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useRestaurantStore } from '@/lib/store';
import { formatBDT } from '@/lib/formatters';
import { Customer, LoyaltyTier } from '@/types';

export default function LoyaltyPage() {
  const { customers, addCustomer, settings } = useRestaurantStore();

  const [searchPhone, setSearchPhone] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<Customer>(customers[0] || {
    id: 'cust-demo',
    name: 'Shakib Al Hasan',
    phone: '01711223344',
    tier: 'ROYAL',
    pointsBalance: 420,
    totalSpent: 86500,
    visitCount: 18,
    joinedAt: new Date().toISOString(),
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live Calculator State
  const [simSpend, setSimSpend] = useState<number>(3500);
  const [simTierOverride, setSimTierOverride] = useState<LoyaltyTier | null>(null);

  // New Member Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchPhone.replace(/[\s-]/g, '');
    if (!clean) return;

    const found = customers.find((c) =>
      c.phone.replace(/[\s-]/g, '').includes(clean)
    );
    if (found) {
      setActiveCustomer(found);
      setSimTierOverride(null);
      setIsRegistering(false);
    } else {
      setIsRegistering(true);
      setFormData((prev) => ({ ...prev, phone: searchPhone }));
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newCust = addCustomer({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      birthDate: formData.birthDate,
    });

    setActiveCustomer(newCust);
    setSimTierOverride(null);
    setIsRegistering(false);
    setFormData({ name: '', phone: '', email: '', birthDate: '' });

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#000f50', '#d4af37', '#e23744', '#ffffff'],
      });
    } catch {
      // ignore
    }
  };

  const handleCopyId = () => {
    if (activeCustomer) {
      navigator.clipboard.writeText(activeCustomer.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Next tier milestone calculation
  const getNextTierInfo = (customer: Customer) => {
    const thresholds = settings?.tierSpendThresholds || {
      SILVER: 10000,
      GOLD: 35000,
      ROYAL: 80000,
    };

    if (customer.tier === 'ROYAL') {
      return { nextTier: 'ROYAL AMBASSADOR', amountNeeded: 0, progressPercent: 100, target: thresholds.ROYAL };
    }
    if (customer.tier === 'GOLD') {
      const target = thresholds.ROYAL;
      const needed = Math.max(0, target - customer.totalSpent);
      const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
      return { nextTier: 'Royal Ambassador', amountNeeded: needed, progressPercent: progress, target };
    }
    if (customer.tier === 'SILVER') {
      const target = thresholds.GOLD;
      const needed = Math.max(0, target - customer.totalSpent);
      const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
      return { nextTier: 'Gold Tier', amountNeeded: needed, progressPercent: progress, target };
    }
    // Bronze
    const target = thresholds.SILVER;
    const needed = Math.max(0, target - customer.totalSpent);
    const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
    return { nextTier: 'Silver Tier', amountNeeded: needed, progressPercent: progress, target };
  };

  const tierInfo = getNextTierInfo(activeCustomer);

  // Dynamic Card Backgrounds by Tier
  const getCardTheme = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'ROYAL':
        return {
          bg: 'bg-gradient-to-br from-[#000a26] via-[#001366] to-[#010822]',
          border: 'border-amber-400/60 shadow-amber-500/20',
          badgeBg: 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950',
          tierName: 'ROYAL AMBASSADOR',
          cashback: '3.0%',
          rateMultiplier: 0.03,
          accent: 'text-amber-300',
        };
      case 'GOLD':
        return {
          bg: 'bg-gradient-to-br from-[#1f1402] via-[#4d3204] to-[#120b00]',
          border: 'border-amber-400/50 shadow-amber-500/15',
          badgeBg: 'bg-amber-400 text-slate-950',
          tierName: 'GOLD TIER',
          cashback: '2.0%',
          rateMultiplier: 0.02,
          accent: 'text-amber-300',
        };
      case 'SILVER':
        return {
          bg: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0b1120]',
          border: 'border-slate-300/40 shadow-slate-500/10',
          badgeBg: 'bg-slate-200 text-slate-950',
          tierName: 'SILVER TIER',
          cashback: '1.5%',
          rateMultiplier: 0.015,
          accent: 'text-slate-200',
        };
      case 'BRONZE':
      default:
        return {
          bg: 'bg-gradient-to-br from-[#1c0d02] via-[#381a05] to-[#120701]',
          border: 'border-amber-700/50 shadow-amber-900/20',
          badgeBg: 'bg-amber-700 text-white',
          tierName: 'BRONZE MEMBER',
          cashback: '1.0%',
          rateMultiplier: 0.01,
          accent: 'text-amber-200',
        };
    }
  };

  const cardTheme = getCardTheme(activeCustomer.tier);

  // Active Simulator Calculation
  const activeSimTier = simTierOverride || activeCustomer.tier;
  const simTheme = getCardTheme(activeSimTier);
  const effectiveSimSpend = Math.max(0, simSpend || 0);
  const calculatedPoints = Math.round(effectiveSimSpend * simTheme.rateMultiplier);
  const calculatedCashDiscount = calculatedPoints * (settings?.loyaltyRedemptionRate || 1);

  return (
    <div className="flex-1 bg-[#010617] text-slate-200 min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#000f50] selection:text-white relative overflow-hidden">

      {/* Ambient Luxury Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-[#000f50]/60 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14 relative z-10">

        {/* 1. STANDALONE TOP NAVIGATION STRIP (REPLACES GLOBAL NAVBAR) */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-amber-400/30 group-hover:border-amber-400 transition-colors">
              <Image
                src="/images/logo.jpeg"
                alt="The Royal Palette"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-left">
              <span className="text-sm sm:text-base font-black text-white uppercase tracking-tight block">
                The Royal Palette
              </span>
              <span className="text-[9px] text-amber-400 font-mono tracking-widest uppercase block">
                VIP Privilege Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
            <Link
              href="/"
              className="px-3.5 sm:px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <Link
              href="/menu"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow-md transition flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Digital Menu</span>
              <span className="sm:hidden">Menu</span>
            </Link>
          </div>
        </div>

        {/* 2. SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Royal VIP Circle Privileges</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
            VIP Membership & Rewards
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 font-light leading-relaxed px-2 sm:px-0">
            Every point is real cash off your dining bill. <strong className="text-amber-300 font-bold">1 Reward Point = ৳1 BDT Discount</strong> with instant redemption on tableside dining, takeaway, and delivery.
          </p>
        </div>

        {/* 3. MEMBER SEARCH & SAMPLE PROFILE SWITCHER BAR */}
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="p-2 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="tel"
                  placeholder="Enter phone (e.g. 01711223344)..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>{isRegistering ? 'Close Form' : 'New VIP Pass (+50 Pts)'}</span>
            </button>
          </div>

          {/* Quick Demo Profile Switchers */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-[10px] sm:text-[11px] scrollbar-none">
            <span className="text-slate-400 shrink-0 font-medium">Quick Demo:</span>
            {customers.slice(0, 4).map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => {
                  setActiveCustomer(cust);
                  setSimTierOverride(null);
                  setIsRegistering(false);
                }}
                className={`px-2.5 py-1 rounded-full border transition cursor-pointer shrink-0 ${
                  activeCustomer.id === cust.id
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-xs'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {cust.name.split(' ')[0]} ({cust.tier})
              </button>
            ))}
          </div>
        </div>

        {/* 4. NEW MEMBER REGISTRATION DRAWER (COLLAPSIBLE) */}
        {isRegistering && (
          <div className="max-w-xl mx-auto rounded-3xl p-5 sm:p-8 bg-gradient-to-b from-[#0a184a] via-[#020b33] to-[#010617] border-2 border-amber-400/50 shadow-2xl space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm sm:text-lg">
                    Activate VIP Pass & Claim 50 Points
                  </h3>
                  <p className="text-[11px] sm:text-xs text-amber-300 font-medium">
                    ৳50 Instant Welcome Credit added immediately.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs sm:text-sm">
              <div className="space-y-1 text-left">
                <label className="text-slate-300 block font-bold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Chowdhury"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 sm:px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-slate-300 block font-bold">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01712345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 sm:px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 block font-bold">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. asif@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 sm:px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-slate-300 block font-bold">
                  Date of Birth (For Birthday Treats & Feasts)
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3.5 sm:px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer mt-2"
              >
                Register & Activate 50 Free Points (৳50 Bonus)
              </button>
            </form>
          </div>
        )}

        {/* 5. DIGITAL VIP PASS & LIVE CASHBACK CALCULATOR (2-COL SHOWCASE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* Left Column (6 cols): 3D-Styled Metallic VIP Pass Card */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4 w-full">
            <div className={`w-full max-w-sm sm:max-w-md relative rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 overflow-hidden border-2 ${cardTheme.border} ${cardTheme.bg} shadow-2xl text-white group transition-all duration-500`}>

              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              {/* Card Top Header */}
              <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-white/15">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-tight">
                      The Royal Palette
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-amber-300 font-mono tracking-widest uppercase">
                      VIP PRIVILEGE PASS • MONGLA, KHULNA
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs uppercase tracking-wider font-black shadow-md shrink-0 ${cardTheme.badgeBg}`}>
                  {cardTheme.tierName}
                </span>
              </div>

              {/* Card Body: Member Info + Scannable QR */}
              <div className="py-5 sm:py-6 flex items-center justify-between gap-3 sm:gap-4 text-left">
                <div className="space-y-2.5 sm:space-y-3 min-w-0">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono tracking-wider">VIP Cardholder</p>
                    <h4 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">{activeCustomer.name}</h4>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white font-mono transition mt-0.5 cursor-pointer"
                    >
                      <span>{activeCustomer.phone}</span>
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>

                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono tracking-wider">Available Points Balance</p>
                    <p className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                      {activeCustomer.pointsBalance}{' '}
                      <span className="text-xs sm:text-sm font-sans font-bold text-slate-300">PTS</span>
                    </p>
                    <p className="text-[11px] sm:text-xs text-emerald-400 font-bold mt-0.5 flex items-center gap-1 truncate">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>= {formatBDT(activeCustomer.pointsBalance * (settings?.loyaltyRedemptionRate || 1))} Instant Discount</span>
                    </p>
                  </div>
                </div>

                {/* Scannable Dynamic POS/Tableside QR Code */}
                <div className="bg-white p-2 rounded-2xl shadow-xl border-2 border-white/80 shrink-0 text-center">
                  <QRCodeSVG
                    value={`MEMBER:${activeCustomer.id}:${activeCustomer.phone}`}
                    size={72}
                    className="sm:w-[84px] sm:h-[84px]"
                    level="M"
                  />
                  <p className="text-[7px] sm:text-[8px] text-[#000f50] font-mono font-black mt-1 uppercase tracking-wider">
                    SCAN AT POS
                  </p>
                </div>
              </div>

              {/* Card Footer: Tier Milestone Progress */}
              <div className="pt-3.5 sm:pt-4 border-t border-white/15 space-y-2 text-left">
                <div className="flex justify-between text-[11px] sm:text-xs text-slate-300">
                  <span>Total Spent: <strong className="text-white font-mono">{formatBDT(activeCustomer.totalSpent)}</strong></span>
                  <span className="text-amber-300 font-bold truncate ml-2">{tierInfo.nextTier}</span>
                </div>

                <div className="w-full bg-black/50 h-2 sm:h-2.5 rounded-full overflow-hidden border border-white/15">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${tierInfo.progressPercent}%` }}
                  />
                </div>

                {tierInfo.amountNeeded > 0 ? (
                  <p className="text-[10px] sm:text-[11px] text-slate-300 text-right">
                    Spend <strong className="text-white font-mono">{formatBDT(tierInfo.amountNeeded)}</strong> more to upgrade tier
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-[11px] text-amber-300 text-right font-black">
                    ★ Highest Royal Ambassador Privilege Active ★
                  </p>
                )}
              </div>

            </div>

            {/* Action link */}
            <div className="flex items-center gap-3 text-xs pt-1">
              <Link
                href="/menu"
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>Order with Points on Digital Menu</span>
              </Link>
            </div>
          </div>

          {/* Right Column (6 cols): Fully Working Live Cashback Calculator */}
          <div className="lg:col-span-6 space-y-5 w-full">

            {/* Interactive Live Points Calculator Box */}
            <div className="rounded-3xl p-5 sm:p-7 bg-white/5 border border-white/15 backdrop-blur-xl shadow-xl space-y-5 text-left">
              
              {/* Box Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-white text-base sm:text-lg">
                    Live Cashback Calculator
                  </h3>
                </div>

                {/* Tier Switcher inside Calculator */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                  {(['BRONZE', 'SILVER', 'GOLD', 'ROYAL'] as LoyaltyTier[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSimTierOverride(t)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                        activeSimTier === t
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input & Slider Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-bold text-slate-300">
                    Dining Bill Amount (BDT ৳):
                  </label>
                  <div className="relative w-36 sm:w-44">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">৳</span>
                    <input
                      type="number"
                      min={100}
                      max={100000}
                      step={100}
                      value={simSpend || ''}
                      onChange={(e) => setSimSpend(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-900/90 border border-amber-400/40 rounded-xl pl-7 pr-3 py-1.5 text-xs sm:text-sm font-mono font-black text-white focus:outline-none focus:border-amber-300 text-right"
                    />
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={500}
                  max={30000}
                  step={250}
                  value={simSpend}
                  onChange={(e) => setSimSpend(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                {/* Quick Presets Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Presets:</span>
                  {[1500, 3500, 7500, 15000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSimSpend(amt)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                        simSpend === amt
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      ৳{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Live Output Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                
                {/* 1. Points Earned */}
                <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                  <p className="text-[9px] uppercase font-mono text-slate-400">Points Earned</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                    +{calculatedPoints.toLocaleString()} <span className="text-[10px] font-sans text-slate-400">PTS</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium font-mono">{simTheme.cashback} Rate</p>
                </div>

                {/* 2. Direct Cash Value */}
                <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                  <p className="text-[9px] uppercase font-mono text-slate-400">Cash Discount Value</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    {formatBDT(calculatedCashDiscount)}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold">1 Pt = ৳1 Off</p>
                </div>

                {/* 3. Effective Net Bill */}
                <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-gradient-to-b from-[#000f50]/80 to-black/60 border border-amber-400/30 space-y-1">
                  <p className="text-[9px] uppercase font-mono text-amber-300">Net Value Gained</p>
                  <p className="text-xl sm:text-2xl font-black text-white font-mono">
                    {formatBDT(Math.max(0, effectiveSimSpend - calculatedCashDiscount))}
                  </p>
                  <p className="text-[10px] text-slate-300">Effective Bill</p>
                </div>

              </div>
            </div>

            {/* Quick Benefits Guarantee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Coins className="w-4 h-4" />
                  <span>1 Point = ৳1 Direct Discount</span>
                </div>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                  No confusing tiers or point conversion formulas. 1 point is always equal to ৳1 cash discount.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span>Zero Expiry Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                  Your hard-earned VIP points never expire. Accumulate and redeem on any banquet.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* 6. FOUR TIERS OF ROYAL PRIVILEGES MATRIX */}
        <div className="space-y-6 pt-6 border-t border-white/10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              The Four Royal Privilege Tiers
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light px-2 sm:px-0">
              Advance your membership status as you dine to unlock higher cashback rates and bespoke royal courtesies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            {/* Tier 1: Bronze */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-200 uppercase tracking-wider">BRONZE</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-xs font-mono font-bold">1.0% Back</span>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white">Entry Level</p>
                  <p className="text-xs text-slate-400 font-mono">Spend ৳0 – ৳9,999</p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 font-light pt-2 border-t border-white/10">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>50 Points (৳50)</strong> Welcome Bonus</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>1 Pt = ৳1 instant discount</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Digital menu tableside sync</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tier 2: Silver */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-slate-300/30 hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider">SILVER</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-xs font-mono font-bold">1.5% Back</span>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white">Silver Tier</p>
                  <p className="text-xs text-slate-400 font-mono">Spend &gt; ৳10,000</p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 font-light pt-2 border-t border-white/10">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>1.5% points</strong> on all dine-in & delivery</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Priority table reservations</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Seasonal festival multipliers</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tier 3: Gold */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-amber-400/40 hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">GOLD</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-bold">2.0% Back</span>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white">Gold Tier</p>
                  <p className="text-xs text-slate-400 font-mono">Spend &gt; ৳35,000</p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 font-light pt-2 border-t border-white/10">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>2.0% points cashback</strong></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Complimentary birthday dessert</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Dedicated VIP concierge</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tier 4: Royal Ambassador */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#000f50] via-[#04155e] to-black border-2 border-amber-400 shadow-xl shadow-amber-500/15 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> ROYAL
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-black">3.0% Back</span>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white">Royal Ambassador</p>
                  <p className="text-xs text-amber-300/80 font-mono">Spend &gt; ৳80,000</p>
                </div>
                <ul className="space-y-2 text-xs text-amber-100/90 font-light pt-2 border-t border-white/15">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Max 3.0% points cashback</strong></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Private VIP Majlis bookings</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Complimentary valet & tastings</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* 7. BOTTOM CTA STRIP */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#000a26] via-[#000f50] to-[#000a26] border border-amber-400/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Ready to Redeem Your Points?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-light">
              Explore our 50+ authentic dum-cooked dishes, slow charcoal kebabs, and Mughlai curries on the Digital Menu.
            </p>
          </div>

          <Link
            href="/menu"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Explore Digital Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
