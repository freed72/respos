'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';

export function Footer() {
  const { settings } = useRestaurantStore();

  return (
    <footer className="w-full bg-[#f8f8f8] border-t border-slate-200 text-slate-600 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#000f50]/20 shadow-xs">
                <Image
                  src="/images/logo.jpeg"
                  alt="The Royal Palette"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-black text-[#000f50] uppercase">
                The Royal Palette
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {settings.tagline}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#000f50]/10 text-[#000f50] border border-[#000f50]/20">
              <Crown className="w-3.5 h-3.5 text-[#000f50]" />
              <span>Royal VIP Hospitality</span>
            </div>
          </div>

          {/* Quick Nav */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#000f50] uppercase tracking-wider font-mono">
              System Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/menu" className="hover:text-[#000f50] font-medium transition flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#000f50]" /> Digital Guest Menu
                </Link>
              </li>
              <li>
                <Link href="/pos" className="hover:text-[#000f50] font-medium transition">
                  Staff POS & Terminal
                </Link>
              </li>
              <li>
                <Link href="/loyalty" className="hover:text-[#000f50] font-medium transition">
                  Royal Loyalty & Points
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#000f50] font-medium transition">
                  Admin Back-Office
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#000f50] uppercase tracking-wider font-mono">
              Location & Contact
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#000f50] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#000f50] shrink-0" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#000f50] shrink-0" />
                <span>{settings.email}</span>
              </li>
            </ul>
          </div>

          {/* Operating Hours & Hardware */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#000f50] uppercase tracking-wider font-mono">
              Dining Hours & Hardware
            </h4>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-800 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#000f50]" /> Lunch:
                </span>
                <span>12:00 PM – 4:00 PM</span>
              </div>
              <div className="flex items-center justify-between text-slate-800 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#000f50]" /> Dinner:
                </span>
                <span>6:30 PM – 11:30 PM</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ESC/POS 24V Cash Drawer Enabled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} The Royal Palette. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Currency: <strong>BDT (৳)</strong></span>
            <span>•</span>
            <span>VAT BIN: {settings.binNumber}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
