'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CashDrawerVisualizer } from '@/components/hardware/CashDrawerVisualizer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPOS = pathname?.startsWith('/pos');
  const isDigitalMenu = pathname?.startsWith('/menu');
  const isAdmin = pathname?.startsWith('/admin');
  const isKDS = pathname?.startsWith('/kds');

  if (isPOS || isDigitalMenu || isAdmin || isKDS) {
    // Dedicated Standalone POS, Digital Menu, Admin Dashboard, or KDS Viewport
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        {/* Hardware Visualizer for Cash Drawer 24V Solenoid */}
        <CashDrawerVisualizer />
      </div>
    );
  }

  const isHome = pathname === '/';
  const isLoyalty = pathname?.startsWith('/loyalty');

  // Standard Website / Customer Pages Layout
  return (
    <div className="min-h-screen bg-[#f8f8f8] text-slate-900 flex flex-col font-sans selection:bg-[#000f50] selection:text-white">
      {!isHome && !isLoyalty && <Navbar />}
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      {/* Global Hardware Visualizer */}
      <CashDrawerVisualizer />
    </div>
  );
}

