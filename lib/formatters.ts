import { LoyaltyTier } from '@/types';

export function formatBDT(amount: number): string {
  if (isNaN(amount)) return '৳0';
  return `৳${Math.round(amount).toLocaleString('en-BD')}`;
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function getTierBadgeClass(tier: LoyaltyTier): { bg: string; text: string; border: string; glow: string } {
  switch (tier) {
    case 'ROYAL':
      return {
        bg: 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20',
        text: 'text-amber-300 font-bold',
        border: 'border-amber-400/50',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      };
    case 'GOLD':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400 font-semibold',
        border: 'border-amber-500/40',
        glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      };
    case 'SILVER':
      return {
        bg: 'bg-slate-300/15',
        text: 'text-slate-200 font-semibold',
        border: 'border-slate-400/40',
        glow: '',
      };
    case 'BRONZE':
    default:
      return {
        bg: 'bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-800/30',
        glow: '',
      };
  }
}
