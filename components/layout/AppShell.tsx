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

  if (isPOS || isDigitalMenu) {
    // Dedicated Standalone POS or Modern Digital Tabletop Menu - Clean standalone viewport without global website header/footer
    return (
      <div className="min-h-screen bg-[#f8f9fc] text-slate-900 flex flex-col font-sans selection:bg-[#000f50] selection:text-white">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        {/* Hardware Visualizer for Cash Drawer 24V Solenoid */}
        <CashDrawerVisualizer />
      </div>
    );
  }

  // Standard Website / Customer / Admin Layout
  return (
    <div className="min-h-screen bg-[#f8f8f8] text-slate-900 flex flex-col font-sans selection:bg-[#000f50] selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      {/* Global Hardware Visualizer */}
      <CashDrawerVisualizer />
    </div>
  );
}
