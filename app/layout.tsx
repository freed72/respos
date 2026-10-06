import type { Metadata, Viewport } from 'next';
import { Inter, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { PwaManager } from '@/components/pwa/PwaManager';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali', 'latin'],
  variable: '--font-bangla',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#000f50',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'The Royal Palette | Luxury Dining, POS & Loyalty Platform',
  description:
    'Experience the culinary heritage of The Royal Palette. Featuring digital QR menu, staff POS terminal with automated cash drawer integration, and royal VIP rewards in Bangladeshi Taka (৳).',
  keywords: [
    'The Royal Palette',
    'Restaurant POS Mongla',
    'Digital Menu Bangladesh',
    'Luxury Dining Khulna',
    'Loyalty Rewards BDT',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Royal Palette POS',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${hindSiliguri.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[#f8f8f8] text-slate-900 flex flex-col font-sans selection:bg-[#000f50] selection:text-white">
        <AppShell>{children}</AppShell>
        <PwaManager />
      </body>
    </html>
  );
}
