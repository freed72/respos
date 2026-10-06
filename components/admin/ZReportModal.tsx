'use client';

import React from 'react';
import { X, Printer, FileText, CheckCircle, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';
import { Order, SystemSettings } from '@/types';
import { formatBDT, formatDateTime } from '@/lib/formatters';

interface ZReportModalProps {
  orders: Order[];
  settings: SystemSettings;
  drawerLogsCount: number;
  onClose: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  orders,
  settings,
  drawerLogsCount,
  onClose,
}) => {
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  
  const grossSales = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + o.discountAmount + o.pointsDiscountValue, 0);
  const totalVAT = completedOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalServiceCharge = completedOrders.reduce((sum, o) => sum + o.serviceChargeAmount, 0);
  const totalTips = completedOrders.reduce((sum, o) => sum + o.tipAmount, 0);
  const netRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPointsRedeemedValue = completedOrders.reduce((sum, o) => sum + o.pointsDiscountValue, 0);
  const totalPointsAwarded = completedOrders.reduce((sum, o) => sum + o.pointsEarned, 0);

  // Payment Breakdown
  const paymentsByMethod: Record<string, number> = {
    CASH: 0,
    CARD: 0,
    BKASH: 0,
    NAGAD: 0,
    LOYALTY_POINTS: 0,
    SPLIT: 0,
    OTHER: 0,
  };

  completedOrders.forEach((o) => {
    if (o.payments && o.payments.length > 0) {
      o.payments.forEach((p) => {
        paymentsByMethod[p.method] = (paymentsByMethod[p.method] || 0) + p.amount;
      });
    } else if (o.paymentMethod) {
      paymentsByMethod[o.paymentMethod] = (paymentsByMethod[o.paymentMethod] || 0) + o.totalAmount;
    } else {
      paymentsByMethod.OTHER += o.totalAmount;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const reportDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#010617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#03091e] border border-amber-500/30 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100 my-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/20 bg-gradient-to-r from-[#000f50] via-[#05164d] to-[#010617]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg text-white tracking-wide">Daily Z-Report & NBR Audit</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  OFFICIAL CLOSEOUT
                </span>
              </div>
              <p className="text-[11px] text-amber-200/70 font-mono">
                {reportDateStr} • Generation: {new Date().toLocaleTimeString('en-US')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Printable Content */}
        <div id="printable-z-report" className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none print:p-0">
          
          {/* Restaurant Official Header */}
          <div className="text-center pb-4 border-b border-white/10 space-y-1">
            <h2 className="font-serif font-black text-xl text-amber-300 tracking-wider uppercase">
              {settings.restaurantName}
            </h2>
            <p className="text-xs text-slate-300 italic">{settings.tagline}</p>
            <p className="text-[11px] text-slate-400">{settings.address} • Phone: {settings.phone}</p>
            <p className="text-[11px] font-mono text-amber-400/90 font-bold">
              NBR BIN: {settings.binNumber || '002391024-0101'} • MUSHAK-6.3
            </p>
          </div>

          {/* Revenue Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Gross Sales</span>
              <p className="text-base font-black text-white font-mono">{formatBDT(grossSales)}</p>
              <span className="text-[10px] text-slate-400">{completedOrders.length} Completed Bills</span>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">Net Settlements</span>
              <p className="text-base font-black text-emerald-400 font-mono">{formatBDT(netRevenue)}</p>
              <span className="text-[10px] text-emerald-500/70">Realized Revenue</span>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">NBR VAT ({settings.vatPercent}%)</span>
              <p className="text-base font-black text-amber-300 font-mono">{formatBDT(totalVAT)}</p>
              <span className="text-[10px] text-amber-400/70">Govt. Tax Collected</span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="bg-[#020617] border border-white/10 rounded-2xl overflow-hidden p-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300 pb-2 border-b border-white/10">
              <span className="font-bold text-slate-200">Financial Category</span>
              <span className="font-bold text-slate-200">Amount (৳)</span>
            </div>
            
            <div className="flex justify-between text-slate-300">
              <span>Gross Food & Beverage Subtotal</span>
              <span className="text-white font-bold">{formatBDT(grossSales)}</span>
            </div>

            <div className="flex justify-between text-rose-400">
              <span>VIP Point Subsidies & Discounts</span>
              <span>- {formatBDT(totalDiscounts)}</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span>Service Charge ({settings.serviceChargePercent}%)</span>
              <span className="text-white">{formatBDT(totalServiceCharge)}</span>
            </div>

            <div className="flex justify-between text-amber-400">
              <span>National Board of Revenue (NBR) VAT</span>
              <span className="font-bold">{formatBDT(totalVAT)}</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span>Server Gratuity / Tips</span>
              <span className="text-white">{formatBDT(totalTips)}</span>
            </div>

            <div className="flex justify-between text-emerald-400 pt-2 border-t border-white/10 text-sm font-bold">
              <span>TOTAL NET DEPOSIT</span>
              <span>{formatBDT(netRevenue)}</span>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Settlement Channel Breakdown</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 block font-mono">CASH IN TILL</span>
                <span className="font-bold font-mono text-white text-sm">{formatBDT(paymentsByMethod.CASH || 0)}</span>
              </div>
              <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 block font-mono">VISA / MC / AMEX</span>
                <span className="font-bold font-mono text-white text-sm">{formatBDT(paymentsByMethod.CARD || 0)}</span>
              </div>
              <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] text-pink-400 block font-mono">bKash MFS</span>
                <span className="font-bold font-mono text-pink-300 text-sm">{formatBDT(paymentsByMethod.BKASH || 0)}</span>
              </div>
              <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] text-orange-400 block font-mono">Nagad MFS</span>
                <span className="font-bold font-mono text-orange-300 text-sm">{formatBDT(paymentsByMethod.NAGAD || 0)}</span>
              </div>
            </div>
          </div>

          {/* Loyalty Program Ledger */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> VIP Loyalty Activity
              </p>
              <p className="text-[11px] text-slate-400">Awarded: {totalPointsAwarded} pts • Burned: {totalPointsRedeemedValue} pts</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Redeemed Value</span>
              <span className="font-mono font-bold text-amber-300">{formatBDT(totalPointsRedeemedValue)}</span>
            </div>
          </div>

          {/* Hardware & Drawer Audit Status */}
          <div className="flex items-center justify-between p-3 bg-slate-950 border border-white/10 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Solenoid Drawer Pulses Today:</span>
            </div>
            <span className="font-mono font-bold text-white">{drawerLogsCount} Pulses recorded</span>
          </div>

          {/* Signoff Footnote */}
          <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
            End of Day Z-Report • Generated autonomously via The Royal Palette POS Core
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Close Window
          </button>

          <button
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Z-Report (80mm / A4)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
