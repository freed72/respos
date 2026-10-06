'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronRight,
  Crown,
  Sparkles,
  ArrowRight,
  Flame,
  Utensils,
  Clock,
  Heart,
  X,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Handle Search submit to Digital Menu
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (clean) {
      router.push(`/menu?search=${encodeURIComponent(clean)}`);
    } else {
      router.push('/menu');
    }
  };

  const collections = [
    {
      id: 'kacchi-biryani',
      title: 'Dum-Pukht Kacchi & Biryani',
      category: 'Mains',
      description: 'Aged basmati rice, tender spiced meat, and baby potatoes slow-cooked in traditional dough-sealed handis with pure saffron.',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&auto=format&fit=crop&q=80',
      itemsCount: '16 Dishes',
      badge: 'Heritage Classic',
      badgeColor: 'bg-amber-500 text-slate-950',
      startingPrice: '৳380',
      queryParam: 'Mains',
    },
    {
      id: 'charcoal-kebabs',
      title: 'Sizzling Charcoal Kebabs',
      category: 'Starters',
      description: 'Melt-in-mouth Malai Boti, Seekh Kebabs, and Tandoori chicken marinated in royal spices and charred over glowing coals.',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=900&auto=format&fit=crop&q=80',
      itemsCount: '12 Items',
      badge: 'Chef Choice',
      badgeColor: 'bg-rose-500 text-white',
      startingPrice: '৳320',
      queryParam: 'Starters',
    },
    {
      id: 'shahi-gravies',
      title: 'Nawabi Shahi Gravies',
      category: 'Curries',
      description: 'Rich almond, cashew, and saffron-infused gravies, simmered for hours with royal mutton, chicken, and Mughlai aromatics.',
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=900&auto=format&fit=crop&q=80',
      itemsCount: '14 Specialties',
      badge: 'Slow Cooked',
      badgeColor: 'bg-emerald-600 text-white',
      startingPrice: '৳350',
      queryParam: 'Curries',
    },
    {
      id: 'zafrani-desserts',
      title: 'Zafrani Desserts & Elixirs',
      category: 'Desserts',
      description: 'Gold-leaf Shahi Tukda, saffron Kesar Firni, and house-made chilled spiced Borhani brewed with roasted mountain spices.',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=900&auto=format&fit=crop&q=80',
      itemsCount: '10 Delicacies',
      badge: 'Royal Sweet',
      badgeColor: 'bg-amber-400 text-slate-950',
      startingPrice: '৳120',
      queryParam: 'Desserts',
    },
    {
      id: 'imperial-platters',
      title: 'Imperial Feast Platters',
      category: 'Platters',
      description: 'Grand family platters with aromatic Kacchi, Zafrani Roast, Jali Kebabs, Borhani, and Firni crafted for royal dining.',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80',
      itemsCount: '6 Grand Sets',
      badge: 'Best For Groups',
      badgeColor: 'bg-[#000f50] text-amber-300 border border-amber-400/30',
      startingPrice: '৳1,450',
      queryParam: 'Mains',
    },
    {
      id: 'artisanal-beverages',
      title: 'Artisanal Refreshers & Coolers',
      category: 'Beverages',
      description: 'Handcrafted seasonal mocktails, saffron pistachio lassi, iced mint lemonade, and signature Mughal spiced teas.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=900&auto=format&fit=crop&q=80',
      itemsCount: '8 Blends',
      badge: 'Chilled',
      badgeColor: 'bg-cyan-600 text-white',
      startingPrice: '৳160',
      queryParam: 'Beverages',
    },
  ];

  const categories = ['All', 'Mains', 'Starters', 'Curries', 'Desserts', 'Beverages'];

  const filteredCollections = activeCategoryFilter === 'All'
    ? collections
    : collections.filter((c) => c.category === activeCategoryFilter);

  return (
    <div className="flex-1 flex flex-col bg-[#faf9f6] text-slate-900 font-sans selection:bg-[#000f50] selection:text-white">

      {/* 1. HERO SECTION WITH VIDEO BACKGROUND (CENTER-BOTTOM ANCHORED) */}
      <section className="relative min-h-screen h-screen min-h-[100dvh] h-[100dvh] flex flex-col justify-end items-center overflow-hidden bg-slate-950 px-4 sm:px-8 pb-20 sm:pb-16 md:pb-20 text-white">

        {/* Background Ambient Video with Fallback Poster & Bottom-Up Gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80"
            className="w-full h-full object-cover opacity-100 scale-105"
          >
            <source
              src="/images/food-background.webm"
              type="video/webm"
            />
          </video>
          {/* Bottom-up gradient scrim only covering text and search bar at the lower half */}
          <div className="absolute inset-x-0 bottom-0 h-3/5 sm:h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </div>

        {/* Center-Bottom Hero Content (Fully Mobile Optimized) */}
        <div className="relative z-10 max-w-3xl mx-auto w-full text-center space-y-3.5 sm:space-y-5 px-1 sm:px-0">

          <div className="space-y-2 sm:space-y-3">
            {/* Responsive Luxury VIP Reward Points CTA */}
            <Link
              href="/loyalty"
              className="group inline-flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-2.5 sm:pr-3.5 rounded-full bg-gradient-to-r from-amber-500/25 via-slate-900/85 to-amber-500/25 hover:from-amber-500/35 hover:to-amber-500/35 border border-amber-400/40 hover:border-amber-300 text-white backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-amber-500/10 max-w-[95vw] sm:max-w-none"
            >
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] sm:text-[11px] uppercase tracking-wider shrink-0 shadow-sm">
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950" />
                <span>50 Pts Bonus</span>
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-amber-200 group-hover:text-white transition-colors truncate">
                <span className="sm:hidden">Claim ৳50 Off First Order</span>
                <span className="hidden sm:inline">Claim ৳50 Instant Cash Discount on First Order</span>
              </span>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400/20 group-hover:bg-amber-400 text-amber-300 group-hover:text-slate-950 flex items-center justify-center transition-all shrink-0">
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Brand Title (Responsive sizing) */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white italic drop-shadow-md">
              the royal palette
            </h1>

            {/* Subtitle with Reward & Food focus */}
            <p className="text-[11px] sm:text-sm md:text-base text-slate-200 font-light max-w-lg mx-auto leading-relaxed drop-shadow-sm px-2 sm:px-0">
              <strong className="text-amber-300 font-bold"> • where premium quality meets finest service • </strong>
            </p>
          </div>

          {/* Fully Responsive Functional Digital Menu Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-xl rounded-full p-1 sm:p-1.5 shadow-2xl flex items-center border border-white/30 text-slate-900 transition-all focus-within:ring-4 focus-within:ring-amber-400/30"
          >
            <div className="flex items-center pl-2.5 sm:pl-3 text-slate-400 shrink-0">
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. Kacchi, Kebab, Firni)..."
              className="flex-1 min-w-0 px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 mr-0.5 sm:mr-1 transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#000f50] hover:bg-[#081a70] text-white text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-md transition active:scale-95 cursor-pointer shrink-0"
            >
              <span className="hidden sm:inline">Search Menu</span>
              <span className="sm:hidden">Search</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </form>

          {/* Quick Suggestion Chips (Mobile Optimized Wrapping) */}
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 pt-0.5 text-[10px] sm:text-[11px]">
            <span className="text-slate-300 font-medium hidden xs:inline">Quick search:</span>
            {[
              'Grand Mutton Kacchi',
              'Zafrani Chicken Roast',
              'Mughal Malai Boti',
              'Shahi Tukda',
              'Borhani Cooler',
            ].map((dish, i) => (
              <Link
                key={i}
                href={`/menu?search=${encodeURIComponent(dish)}`}
                className="px-2 sm:px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-[10px] sm:text-[11px] transition cursor-pointer hover:border-amber-400/50"
              >
                {dish}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 2. REDESIGNED ROYAL CURATED COLLECTIONS SECTION */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Curated Culinary Heritage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Signature Collections
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Explore authentic Mughlai flavors, claypot dum creations, and signature royal feast selections crafted by our master ustads.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategoryFilter === cat
                    ? 'bg-[#000f50] text-white shadow-md shadow-[#000f50]/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Collections Showcase Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredCollections.map((col) => (
            <Link
              key={col.id}
              href={`/menu?category=${encodeURIComponent(col.queryParam)}`}
              className="group relative h-[360px] sm:h-[400px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-slate-200/60 hover:border-amber-400/60 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between p-6 text-white cursor-pointer"
            >
              {/* Background Full-Bleed Image */}
              <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-108 transition-all duration-700 ease-out"
                />
                {/* Multi-stop cinematic dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/20 group-hover:from-slate-950/95 transition-colors duration-500" />
              </div>

              {/* Card Top: Floating Glass Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/20 border border-white/25 text-white shadow-xs">
                  {col.badge}
                </span>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-amber-300 text-xs font-mono font-bold shadow-xs">
                  <span>From</span>
                  <span className="text-white font-black">{col.startingPrice}</span>
                </div>
              </div>

              {/* Card Bottom: Typography, Description & Action */}
              <div className="relative z-10 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>{col.itemsCount}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-slate-300 font-sans font-normal">{col.category}</span>
                  </div>

                  <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors duration-300 tracking-tight leading-tight drop-shadow-md">
                    {col.title}
                  </h3>

                  <p className="text-xs text-slate-300 font-light line-clamp-2 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                    {col.description}
                  </p>
                </div>

                {/* Explore Pill Button */}
                <div className="pt-2 flex items-center justify-between border-t border-white/15 text-xs font-bold text-white">
                  <span className="text-[11px] text-slate-400 font-normal">Slow Dum-Cooked</span>
                  <div className="flex items-center gap-1.5 text-amber-300 group-hover:text-white transition-colors">
                    <span>Explore Collection</span>
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 group-hover:bg-white flex items-center justify-center transition-all group-hover:translate-x-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Menu CTA Strip */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#000f50] via-[#05186b] to-[#000f50] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-amber-400/20">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg sm:text-xl font-black text-white">
                Craving Something Specific?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-light">
              Browse our complete tabletop digital menu with instant tableside ordering & delivery.
            </p>
          </div>

          <Link
            href="/menu"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>View Full 50+ Dish Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </section>

      {/* 3. SLEEK ROYAL VIP REWARD POINTS BANNER */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#000a26] via-[#000f50] to-[#020b33] border border-amber-400/30 p-8 sm:p-12 shadow-2xl text-white">

          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">

            {/* Left Content */}
            <div className="space-y-4 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>The Royal VIP Circle</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Dine & Earn Instant Cash Back
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                Join our VIP Circle and receive <strong className="text-amber-300 font-bold">50 Welcome Points (৳50 value)</strong> immediately. 
                Earn up to 3% cashback on every order where <strong className="text-white font-semibold">1 Point = ৳1 Cash Discount</strong> with zero expiry.
              </p>

              {/* 3 Clean Quick Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
                  🎁 ৳50 Welcome Bonus
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
                  💰 1 Pt = ৳1 Cash Off
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
                  👑 Up to 3% Point Cashback
                </span>
              </div>
            </div>

            {/* Right Action */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/loyalty"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>Claim 50 Bonus Points (৳50)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-slate-400 font-medium text-center">
                Instant activation • No credit card required
              </span>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}


