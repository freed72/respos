'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UtensilsCrossed,
  MonitorCheck,
  Crown,
  LayoutDashboard,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Users,
  Coins,
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';
import { formatBDT } from '@/lib/formatters';

export default function HomePage() {
  const { tables, orders, customers, kickDrawer } = useRestaurantStore();
  const [testingDrawer, setTestingDrawer] = useState(false);

  // Quick live metrics
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'BILLING').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleTestDrawer = async () => {
    setTestingDrawer(true);
    await kickDrawer('Demo Portal Test Kick', 'DEMO-001', 1500);
    setTimeout(() => setTestingDrawer(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f8f8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200 bg-white">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#000f50]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Brand Copy */}
            <div className="max-w-2xl text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#000f50]/10 border border-[#000f50]/20 text-[#000f50] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#000f50]" />
                <span>Next.js • Insforge DB • Bangladeshi Taka (৳) POS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900">
                Welcome to <br />
                <span className="text-[#000f50] uppercase">The Royal Palette</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-light">
                An authentic fine dining and banquet enterprise platform. Featuring guest digital QR menus, high-speed staff Web POS with ESC/POS digital cash drawer integration, and royal VIP loyalty tiers in Bangladeshi Taka (৳).
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/pos"
                  className="px-6 py-3.5 rounded-2xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-sm flex items-center gap-2.5 shadow-md shadow-[#000f50]/20 transition active:scale-95"
                >
                  <MonitorCheck className="w-4 h-4" />
                  <span>Launch POS Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/menu"
                  className="px-6 py-3.5 rounded-2xl bg-[#f8f8f8] hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm flex items-center gap-2 transition"
                >
                  <UtensilsCrossed className="w-4 h-4 text-[#000f50]" />
                  <span>View Digital Menu</span>
                </Link>

                <button
                  onClick={handleTestDrawer}
                  disabled={testingDrawer}
                  className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#000f50]/30 text-[#000f50] font-bold text-sm flex items-center gap-2 transition shadow-xs"
                >
                  <KeyRound className={`w-4 h-4 ${testingDrawer ? 'animate-spin' : ''}`} />
                  <span>{testingDrawer ? 'Pulse Sent!' : 'Test 24V Drawer'}</span>
                </button>
              </div>

              {/* Hardware & Spec Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ESC/POS RJ11 Solenoid Relay</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#000f50]" />
                  <span>WebUSB & Web Serial Ready</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>4 VIP Loyalty Tiers</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup Showcase */}
            <div className="w-full lg:w-auto relative">
              <div className="relative w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono font-bold text-slate-600 ml-2">
                      LIVE PLATFORM MONITOR
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    OPERATIONAL
                  </span>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f8f8f8] p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#000f50]" /> Total Sales
                    </span>
                    <div className="text-lg font-black font-mono text-[#000f50]">
                      {formatBDT(totalRevenue)}
                    </div>
                  </div>

                  <div className="bg-[#f8f8f8] p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Settled Bills
                    </span>
                    <div className="text-lg font-black font-mono text-emerald-700">
                      {completedOrders.length} Orders
                    </div>
                  </div>

                  <div className="bg-[#f8f8f8] p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-600" /> Tables Seated
                    </span>
                    <div className="text-lg font-black font-mono text-indigo-900">
                      {occupiedTables} / {tables.length} Active
                    </div>
                  </div>

                  <div className="bg-[#f8f8f8] p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-600" /> VIP Members
                    </span>
                    <div className="text-lg font-black font-mono text-amber-700">
                      {customers.length} Diners
                    </div>
                  </div>
                </div>

                {/* Quick Hardware Action Bar */}
                <div className="pt-2">
                  <Link
                    href="/pos"
                    className="w-full py-3 rounded-xl bg-[#f8f8f8] hover:bg-[#000f50] hover:text-white border border-slate-200 text-[#000f50] font-bold text-xs flex items-center justify-center gap-2 transition group"
                  >
                    <span>Enter Cashier Counter Terminal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Engineered for Luxury Hospitality & High Velocity
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Four specialized modules working synchronously with local PostgreSQL-compatible storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Digital QR Menu',
              desc: 'High-res food photography, Bengali & English bilingual titles, dietary tags, allergen cards, and pre-cart.',
              icon: UtensilsCrossed,
              href: '/menu',
              badge: 'Guest Facing',
            },
            {
              title: 'Web POS Terminal',
              desc: 'High-speed product catalog table, one-click add to cart, customer phone lookup, discount calculation & auto drawer kick.',
              icon: MonitorCheck,
              href: '/pos',
              badge: 'Cashier & Floor',
            },
            {
              title: 'VIP Loyalty Engine',
              desc: 'Tier-based points accumulation (Bronze to Royal Ambassador) with instant 1 Pt = ৳1 BDT redemption at checkout.',
              icon: Crown,
              href: '/loyalty',
              badge: 'CRM & Retention',
            },
            {
              title: 'Admin Back-Office',
              desc: 'Full product CRUD, modifier groups, sales analytics, hardware configuration, and cashier drawer audit logs.',
              icon: LayoutDashboard,
              href: '/admin',
              badge: 'Management',
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Link
                key={idx}
                href={feature.href}
                className="bg-white border border-slate-200 hover:border-[#000f50]/40 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-md hover:shadow-[#000f50]/5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#000f50]/10 text-[#000f50] flex items-center justify-center group-hover:bg-[#000f50] group-hover:text-white transition duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-[#000f50] transition">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#000f50] group-hover:translate-x-1 transition">
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
