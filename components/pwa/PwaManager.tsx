'use client';

import React, { useEffect, useState } from 'react';
import { Download, Sparkles, X, Monitor, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isInstalledJustNow, setIsInstalledJustNow] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker in production/development
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);

            // Handle service worker updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New version available. Refresh to update.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed in standalone window mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Check if user dismissed recently
      const dismissedUntil = localStorage.getItem('trp_pwa_banner_dismissed');
      const isDismissed = dismissedUntil && Date.now() < Number(dismissedUntil);

      // 3. Capture native install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
        if (!isStandaloneMode && !isDismissed) {
          // Delay banner display slightly so it doesn't interrupt immediate initial load
          setTimeout(() => {
            setIsBannerVisible(true);
          }, 2000);
        }
      };

      const handleAppInstalled = () => {
        console.log('[PWA] App successfully installed!');
        setInstallPrompt(null);
        setIsBannerVisible(false);
        setIsInstalledJustNow(true);
        setTimeout(() => setIsInstalledJustNow(false), 5000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        console.log('[PWA] User accepted installation prompt');
        setIsBannerVisible(false);
      } else {
        console.log('[PWA] User dismissed installation prompt');
      }
      setInstallPrompt(null);
    } catch (err) {
      console.error('[PWA] Installation prompt error:', err);
    }
  };

  const handleDismissBanner = () => {
    setIsBannerVisible(false);
    // Dismiss for 24 hours
    localStorage.setItem('trp_pwa_banner_dismissed', String(Date.now() + 24 * 60 * 60 * 1000));
  };

  // If already running standalone or no banner to show, return null
  if (isStandalone && !isInstalledJustNow) return null;

  return (
    <>
      {/* Floating PWA Install Toast / Banner */}
      {isBannerVisible && installPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm sm:max-w-md p-4 rounded-2xl bg-[#090e1e]/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#000f50] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-serif font-black text-white tracking-wide">
                  Install The Royal Palette App
                </h4>
                <button
                  onClick={handleDismissBanner}
                  className="p-1 rounded-md text-slate-400 hover:text-white transition"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Run the POS terminal in a full-screen, dedicated standalone desktop/tablet window with offline capabilities.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification after install */}
      {isInstalledJustNow && (
        <div className="fixed top-4 right-4 z-50 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in duration-200 text-xs">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>The Royal Palette POS installed successfully! You can launch it from your Desktop/Applications.</span>
        </div>
      )}
    </>
  );
}
