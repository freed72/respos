'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, Crown } from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';

export function Footer() {
  const { settings } = useRestaurantStore();

  return (
    <footer className="w-full bg-[#010617] text-slate-400 text-xs mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Main Clean Row */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">

          {/* Brand Info */}
          <div className="space-y-2.5 max-w-sm">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-amber-400/30">
                <Image
                  src="/images/logo.jpeg"
                  alt="The Royal Palette"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-base font-black text-white uppercase tracking-tight">
                The Royal Palette
              </span>
            </div>
            <p className="text-slate-400 font-light leading-relaxed">
              Authentic Dum-Pukht & fine Mughlai dining at BNS Mongla, Khulna.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.address || '123, BNS Mongla, Khulna'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.phone || '01712345678'}</span>
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 font-medium text-slate-300">
            <Link href="/menu" className="hover:text-amber-300 transition-colors">
              Digital Menu
            </Link>
            <Link href="/loyalty" className="hover:text-amber-300 transition-colors flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>VIP Rewards</span>
            </Link>
          </div>

          {/* Operating Hours */}
          <div className="space-y-1.5 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end gap-1.5 text-slate-200 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Dining Hours</span>
            </div>
            <p className="text-slate-400 font-light">Lunch: 12:00 PM – 4:00 PM</p>
            <p className="text-slate-400 font-light">Dinner: 6:30 PM – 11:30 PM</p>
          </div>

        </div>

        {/* Bottom Clean Divider */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} The Royal Palette. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Currency: <strong className="text-slate-300">BDT (৳)</strong></span>
            <span>•</span>
            <span>VAT BIN: {settings.binNumber}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}


