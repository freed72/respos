'use client';

import React, { useState } from 'react';
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
  Percent,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useRestaurantStore } from '@/lib/store';
import { formatBDT, getTierBadgeClass } from '@/lib/formatters';
import { Customer, LoyaltyTier } from '@/types';

export default function LoyaltyPage() {
  const { customers, addCustomer, settings } = useRestaurantStore();

  const [searchPhone, setSearchPhone] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<Customer>(customers[0]);
  const [isRegistering, setIsRegistering] = useState(false);

  // New Member Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = customers.find((c) =>
      c.phone.replace(/[\s-]/g, '').includes(searchPhone.replace(/[\s-]/g, ''))
    );
    if (found) {
      setActiveCustomer(found);
      setIsRegistering(false);
    } else {
      alert('Member not found with that phone number. You can register below to get 50 bonus points!');
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
    setIsRegistering(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000f50', '#1e3a8a', '#d4af37', '#ffffff'],
      });
    } catch {
      // ignore
    }
  };

  // Next tier milestone calculation
  const getNextTierInfo = (customer: Customer) => {
    if (customer.tier === 'ROYAL') {
      return { nextTier: 'ROYAL (Highest)', amountNeeded: 0, progressPercent: 100 };
    }
    if (customer.tier === 'GOLD') {
      const target = settings.tierSpendThresholds.ROYAL;
      const needed = Math.max(0, target - customer.totalSpent);
      const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
      return { nextTier: 'Royal Ambassador', amountNeeded: needed, progressPercent: progress };
    }
    if (customer.tier === 'SILVER') {
      const target = settings.tierSpendThresholds.GOLD;
      const needed = Math.max(0, target - customer.totalSpent);
      const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
      return { nextTier: 'Gold Tier', amountNeeded: needed, progressPercent: progress };
    }
    // Bronze
    const target = settings.tierSpendThresholds.SILVER;
    const needed = Math.max(0, target - customer.totalSpent);
    const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
    return { nextTier: 'Silver Tier', amountNeeded: needed, progressPercent: progress };
  };

  const tierInfo = getNextTierInfo(activeCustomer);
  const tierStyle = getTierBadgeClass(activeCustomer.tier);

  return (
    <div className="flex-1 bg-[#f8f8f8] text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#000f50]/10 border border-[#000f50]/20 text-[#000f50] text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-[#000f50]" />
            <span>The Royal Palette VIP Circle</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#000f50] uppercase">
            Membership & Rewards
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Earn royal points on every ৳ spent. Redeem 1 Point = ৳1 BDT instant discount on your dining banquet.
          </p>
        </div>

        {/* Member Lookup & Switcher Bar */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter member phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#000f50] focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="px-4 py-2 rounded-xl bg-[#f8f8f8] border border-slate-200 hover:bg-slate-100 text-[#000f50] text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#000f50]" />
            <span>{isRegistering ? 'Cancel' : 'New Member'}</span>
          </button>
        </div>

        {/* Registration Form (Collapsible) */}
        {isRegistering && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Gift className="w-5 h-5 text-[#000f50]" />
              <h3 className="font-bold text-slate-900 text-base">
                Join Royal Rewards (50 Free Points)
              </h3>
            </div>
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Chowdhury"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01712345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. asif@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  Date of Birth (For Birthday Treats)
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs shadow-md shadow-[#000f50]/20 transition"
              >
                Register & Activate 50 Points Welcome Bonus
              </button>
            </form>
          </div>
        )}

        {/* Digital VIP Membership Card Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Presentation (Left 6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md relative rounded-3xl p-7 overflow-hidden border-2 border-[#000f50] shadow-2xl bg-[#000f50] text-white">
              {/* Subtle Gold Shimmers */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-black text-xl">
                    👑
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white uppercase">
                      The Royal Palette
                    </h3>
                    <p className="text-[10px] text-blue-200 font-mono">VIP CLUB PASS</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs uppercase tracking-wider font-extrabold bg-white text-[#000f50] shadow-sm">
                  {activeCustomer.tier} TIER
                </span>
              </div>

              {/* Card Body: Member Details & QR Code */}
              <div className="py-6 flex items-center justify-between gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-blue-200 uppercase font-mono">Cardholder</p>
                    <h4 className="text-xl font-bold text-white">{activeCustomer.name}</h4>
                    <p className="text-xs text-blue-100 font-mono">{activeCustomer.phone}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-blue-200 uppercase font-mono">Available Points</p>
                    <p className="text-3xl font-black text-amber-300 font-mono tracking-tight">
                      {activeCustomer.pointsBalance}{' '}
                      <span className="text-xs font-normal text-blue-200 font-sans">Pts</span>
                    </p>
                    <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                      = {formatBDT(activeCustomer.pointsBalance * settings.loyaltyRedemptionRate)} Instant Discount
                    </p>
                  </div>
                </div>

                {/* Scannable Dynamic QR Code */}
                <div className="bg-white p-2.5 rounded-2xl shadow-lg border border-white">
                  <QRCodeSVG
                    value={`MEMBER:${activeCustomer.id}:${activeCustomer.phone}`}
                    size={88}
                    level="M"
                  />
                  <p className="text-[8px] text-[#000f50] text-center font-mono font-bold mt-1">
                    SCAN AT POS
                  </p>
                </div>
              </div>

              {/* Card Footer: Tier Progress Bar */}
              <div className="pt-4 border-t border-white/20 space-y-2">
                <div className="flex justify-between text-xs text-blue-100">
                  <span>Total Spent: <strong className="text-white">{formatBDT(activeCustomer.totalSpent)}</strong></span>
                  <span className="text-amber-300 font-bold">{tierInfo.nextTier}</span>
                </div>

                <div className="w-full bg-blue-950/80 h-2.5 rounded-full overflow-hidden border border-white/20">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-200 h-full rounded-full transition-all duration-500"
                    style={{ width: `${tierInfo.progressPercent}%` }}
                  />
                </div>

                {tierInfo.amountNeeded > 0 ? (
                  <p className="text-[10px] text-blue-200 text-right">
                    Spend <strong className="text-white">{formatBDT(tierInfo.amountNeeded)}</strong> more to upgrade tier
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-300 text-right font-bold">
                    ★ Highest Royal Ambassador Privilege Unlocked ★
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tier Privileges & Value Calculator (Right 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Value Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <Coins className="w-6 h-6 text-[#000f50]" />
                <h4 className="font-bold text-slate-900 text-sm">1 Point = ৳1 BDT</h4>
                <p className="text-xs text-slate-500">
                  Direct dollar-for-dollar bill reductions on every dine-in or takeaway banquet.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <TrendingUp className="w-6 h-6 text-[#000f50]" />
                <h4 className="font-bold text-slate-900 text-sm">Up to 3x Points</h4>
                <p className="text-xs text-slate-500">
                  Advance from Bronze to Royal Ambassador to earn 3 points per ৳100 spent.
                </p>
              </div>
            </div>

            {/* Loyalty Tiers Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#000f50]" />
                <span>Royal Privilege Tiers</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* Bronze */}
                <div className="bg-[#f8f8f8] border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-700 block">Bronze Tier</span>
                    <span className="text-slate-500 text-[11px]">Spend ৳0 – ৳9,999</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">1.0 Pt / ৳100 (1%)</span>
                </div>

                {/* Silver */}
                <div className="bg-[#f8f8f8] border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block">Silver Tier</span>
                    <span className="text-slate-500 text-[11px]">Spend ৳10,000+</span>
                  </div>
                  <span className="font-mono font-bold text-[#000f50]">1.5 Pts / ৳100 (1.5%)</span>
                </div>

                {/* Gold */}
                <div className="bg-[#f8f8f8] border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-600 block">Gold Tier</span>
                    <span className="text-slate-500 text-[11px]">Spend ৳35,000+</span>
                  </div>
                  <span className="font-mono font-bold text-[#000f50]">2.0 Pts / ৳100 (2.0%)</span>
                </div>

                {/* Royal */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#000f50] block flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-600" /> Royal Ambassador
                    </span>
                    <span className="text-slate-500 text-[11px]">Spend ৳80,000+</span>
                  </div>
                  <span className="font-mono font-bold text-[#000f50]">3.0 Pts / ৳100 (3.0%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
