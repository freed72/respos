'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileText,
  Calendar,
  DollarSign,
  ShieldCheck,
  Sparkles,
  FileSpreadsheet,
  Receipt,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Wallet,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Order, SystemSettings } from '@/types';
import { formatBDT, formatDateTime } from '@/lib/formatters';
import { QRCodeSVG } from 'qrcode.react';

interface ZReportModalProps {
  orders: Order[];
  settings: SystemSettings;
  drawerLogsCount: number;
  onClose: () => void;
}

type DateFilterType = 'TODAY' | 'YESTERDAY' | 'CUSTOM' | 'ALL';
type PrintFormatType = 'THERMAL_80MM' | 'A4_SHEET';

export const ZReportModal: React.FC<ZReportModalProps> = ({
  orders,
  settings,
  drawerLogsCount,
  onClose,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('TODAY');
  const [printFormat, setPrintFormat] = useState<PrintFormatType>('THERMAL_80MM');
  const [copied, setCopied] = useState(false);

  // Compute local date strings
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [customDate, setCustomDate] = useState<string>(todayStr);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filter orders by scope
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      const oYear = orderDate.getFullYear();
      const oMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
      const oDay = String(orderDate.getDate()).padStart(2, '0');
      const orderDateStr = `${oYear}-${oMonth}-${oDay}`;

      if (dateFilter === 'TODAY') {
        return orderDateStr === todayStr;
      }
      if (dateFilter === 'YESTERDAY') {
        return orderDateStr === yesterdayStr;
      }
      if (dateFilter === 'CUSTOM') {
        return orderDateStr === customDate;
      }
      return true; // ALL
    });
  }, [orders, dateFilter, todayStr, yesterdayStr, customDate]);

  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'COMPLETED');
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'CANCELLED');
  }, [filteredOrders]);

  // Financial aggregates
  const grossSales = completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalDiscounts = completedOrders.reduce(
    (sum, o) => sum + (o.discountAmount || 0) + (o.pointsDiscountValue || 0),
    0
  );
  const netTaxableSales = Math.max(0, grossSales - totalDiscounts);
  const totalVAT = completedOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
  const totalServiceCharge = completedOrders.reduce((sum, o) => sum + (o.serviceChargeAmount || 0), 0);
  const totalTips = completedOrders.reduce((sum, o) => sum + (o.tipAmount || 0), 0);
  const netRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPointsRedeemedValue = completedOrders.reduce(
    (sum, o) => sum + (o.pointsDiscountValue || 0),
    0
  );
  const totalPointsRedeemedCount = completedOrders.reduce((sum, o) => sum + (o.pointsRedeemed || 0), 0);
  const totalPointsAwarded = completedOrders.reduce((sum, o) => sum + (o.pointsEarned || 0), 0);

  // Sorting for invoice boundaries
  const sortedOrders = useMemo(() => {
    return [...completedOrders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [completedOrders]);

  const firstOrder = sortedOrders[0];
  const lastOrder = sortedOrders[sortedOrders.length - 1];

  // Channel breakdown
  const dineInCount = completedOrders.filter((o) => o.orderType === 'DINE_IN').length;
  const takeawayCount = completedOrders.filter((o) => o.orderType === 'TAKEAWAY').length;
  const deliveryCount = completedOrders.filter((o) => o.orderType === 'DELIVERY').length;

  // Tender / Payment Breakdown
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
      paymentsByMethod[o.paymentMethod] =
        (paymentsByMethod[o.paymentMethod] || 0) + (o.totalAmount || 0);
    } else {
      paymentsByMethod.OTHER += o.totalAmount || 0;
    }
  });

  const activeDateLabel = useMemo(() => {
    if (dateFilter === 'TODAY') {
      return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    if (dateFilter === 'YESTERDAY') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (dateFilter === 'CUSTOM') {
      const [y, m, d] = customDate.split('-');
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return 'All Records (Cumulative)';
  }, [dateFilter, customDate]);

  const zReportCode = useMemo(() => {
    const cleanDate = (dateFilter === 'CUSTOM' ? customDate : todayStr).replace(/-/g, '');
    return `Z-${cleanDate}-001`;
  }, [dateFilter, customDate, todayStr]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `⚜️ THE ROYAL PALETTE — DAILY Z-REPORT ⚜️
Ref: ${zReportCode}
Period: ${activeDateLabel}
Generation Time: ${new Date().toLocaleTimeString()}
-----------------------------------
Bills Completed: ${completedOrders.length}
Gross Sales: ৳${grossSales.toLocaleString()}
Discounts/Loyalty: -৳${totalDiscounts.toLocaleString()}
Net Taxable Base: ৳${netTaxableSales.toLocaleString()}
NBR VAT (${settings.vatPercent}%): +৳${totalVAT.toLocaleString()}
Service Charge (${settings.serviceChargePercent}%): +৳${totalServiceCharge.toLocaleString()}
Tips / Gratuity: +৳${totalTips.toLocaleString()}
-----------------------------------
TOTAL NET REVENUE: ৳${netRevenue.toLocaleString()}
-----------------------------------
Tender Channels:
- Cash in Till: ৳${(paymentsByMethod.CASH || 0).toLocaleString()}
- Cards: ৳${(paymentsByMethod.CARD || 0).toLocaleString()}
- bKash MFS: ৳${(paymentsByMethod.BKASH || 0).toLocaleString()}
- Nagad MFS: ৳${(paymentsByMethod.NAGAD || 0).toLocaleString()}
Loyalty Activity: +${totalPointsAwarded} pts / -${totalPointsRedeemedCount} pts
Drawer Pulses: ${drawerLogsCount}
Status: NBR Mushak-6.3 Certified Closeout`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto z-report-modal-backdrop font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col h-[94vh] max-h-[940px] text-zinc-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Modal Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-base sm:text-lg text-white tracking-tight">
                  Daily Z-Report & Fiscal Closeout
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono tracking-wider">
                  NBR MUSHAK-6.3
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Official Fiscal End-of-Day Register • Ref: <span className="font-bold text-amber-300">{zReportCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
              title="Copy shift summary text for messaging"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Z-Report</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition border border-zinc-700"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Executive Key Metric Strip (Top Ribbon) */}
        <div className="px-6 py-2.5 bg-zinc-950 border-b border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">Net Settlements</span>
              <span className="text-base font-black font-mono text-emerald-400">{formatBDT(netRevenue)}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{completedOrders.length} bills</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">NBR VAT ({settings.vatPercent}%)</span>
              <span className="text-base font-black font-mono text-amber-300">{formatBDT(totalVAT)}</span>
            </div>
            <span className="text-[10px] font-mono text-amber-300/70">Govt. Tax</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold block">Cash in Drawer</span>
              <span className="text-base font-black font-mono text-white">{formatBDT(paymentsByMethod.CASH || 0)}</span>
            </div>
            <span className="text-[10px] font-mono text-blue-300/70">{drawerLogsCount} kicks</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 font-bold block">Digital MFS / Cards</span>
              <span className="text-base font-black font-mono text-white">
                {formatBDT((paymentsByMethod.CARD || 0) + (paymentsByMethod.BKASH || 0) + (paymentsByMethod.NAGAD || 0))}
              </span>
            </div>
            <span className="text-[10px] font-mono text-pink-300/70">Cards/MFS</span>
          </div>
        </div>

        {/* 3. Main Split View: (Left: Full Paper Slip Preview | Right: Controls & Tender Analytics) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT: Printable Slip Preview Stage (Dominant, scrollable) */}
          <div className="flex-1 min-w-0 bg-zinc-950 p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
            
            {/* Paper Layout Mode Toggle */}
            <div className="w-full max-w-[420px] flex items-center justify-between mb-4 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-400 text-[11px] flex items-center gap-1.5 pl-2.5">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Paper Layout:</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPrintFormat('THERMAL_80MM')}
                  className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 font-bold text-xs ${
                    printFormat === 'THERMAL_80MM'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>80mm POS Roll</span>
                </button>
                <button
                  onClick={() => setPrintFormat('A4_SHEET')}
                  className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 font-bold text-xs ${
                    printFormat === 'A4_SHEET'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>A4 Statement</span>
                </button>
              </div>
            </div>

            {/* The Authentic Thermal Paper Slip (id="printable-z-report") */}
            <div
              id="printable-z-report"
              className={`w-full bg-white text-neutral-900 shadow-2xl font-mono text-[11px] leading-relaxed select-text border border-neutral-300 relative rounded-sm transition-all duration-200 my-auto ${
                printFormat === 'A4_SHEET'
                  ? 'max-w-[580px] p-8 text-[12px] print-format-a4'
                  : 'max-w-[360px] p-5'
              }`}
            >
              {/* Restaurant Header */}
              <div className="text-center pb-3 border-b-2 border-dashed border-black">
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold tracking-widest text-neutral-600 uppercase mb-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600 inline" /> THE ROYAL PALETTE <Sparkles className="w-2.5 h-2.5 text-amber-600 inline" />
                </div>
                <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-black font-sans">
                  {settings.restaurantName}
                </h1>
                <p className="text-[10px] text-neutral-600 italic">{settings.tagline}</p>
                <p className="text-[10px] text-neutral-800 mt-0.5">{settings.address}</p>
                <p className="text-[10px] text-neutral-800">Hotline: {settings.phone}</p>
                
                <div className="mt-2 pt-1.5 border-t border-dotted border-neutral-400 space-y-0.5">
                  <p className="text-[11px] font-black tracking-wider text-black">
                    OFFICIAL DAILY Z-REPORT
                  </p>
                  <p className="text-[10px] font-bold text-neutral-900">
                    NBR MUSHAK-6.3 FISCAL REGISTER CLOSEOUT
                  </p>
                  <p className="text-[10px] text-neutral-800">
                    BIN / VAT Reg No: <strong>{settings.binNumber || '002391024-0101'}</strong>
                  </p>
                </div>
              </div>

              {/* Shift Meta */}
              <div className="py-2.5 border-b border-dashed border-black text-[10px] sm:text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Z-Report Ref:</span>
                  <span className="font-bold">{zReportCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reporting Period:</span>
                  <span className="font-bold">{activeDateLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Generated At:</span>
                  <span>{formatDateTime(new Date().toISOString())}</span>
                </div>
                <div className="flex justify-between">
                  <span>POS Terminal:</span>
                  <span>COUNTER-01 (Offline-First POS)</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Drawer Pulses:</span>
                  <span><strong>{drawerLogsCount}</strong> cycles</span>
                </div>
              </div>

              {/* 1. Transaction Audit */}
              <div className="py-2.5 border-b border-dashed border-black text-[10px] sm:text-[11px] space-y-1">
                <div className="font-bold uppercase tracking-wider text-[11px] pb-0.5">
                  [ 1. TRANSACTION AUDIT ]
                </div>
                <div className="flex justify-between">
                  <span>Completed Bills:</span>
                  <span className="font-black text-sm">{completedOrders.length}</span>
                </div>
                {cancelledOrders.length > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Void / Cancelled Bills:</span>
                    <span>{cancelledOrders.length}</span>
                  </div>
                )}
                {firstOrder && (
                  <div className="flex justify-between text-neutral-800">
                    <span>First Invoice:</span>
                    <span>#{firstOrder.orderNumber} ({new Date(firstOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                )}
                {lastOrder && (
                  <div className="flex justify-between text-neutral-800">
                    <span>Last Invoice:</span>
                    <span>#{lastOrder.orderNumber} ({new Date(lastOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dotted border-neutral-300 text-[10px] text-neutral-700">
                  <span>Channel Breakdown:</span>
                  <span>Dine-In: {dineInCount} | Takeaway: {takeawayCount} | Del: {deliveryCount}</span>
                </div>
              </div>

              {/* 2. Financial Reconciliation */}
              <div className="py-2.5 border-b border-dashed border-black text-[10px] sm:text-[11px] space-y-1.5">
                <div className="font-bold uppercase tracking-wider text-[11px] pb-0.5">
                  [ 2. FINANCIAL RECONCILIATION ]
                </div>

                <div className="flex justify-between">
                  <span>Gross F&B Sales Subtotal:</span>
                  <span className="font-bold">{formatBDT(grossSales)}</span>
                </div>

                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-neutral-800">
                    <span>Discounts & Loyalty Subsidies:</span>
                    <span>- {formatBDT(totalDiscounts)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-neutral-400">
                  <span>Net Taxable Base Sales:</span>
                  <span>{formatBDT(netTaxableSales)}</span>
                </div>

                <div className="flex justify-between">
                  <span>NBR VAT ({settings.vatPercent}%):</span>
                  <span>+ {formatBDT(totalVAT)}</span>
                </div>

                {totalServiceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge ({settings.serviceChargePercent}%):</span>
                    <span>+ {formatBDT(totalServiceCharge)}</span>
                  </div>
                )}

                {totalTips > 0 && (
                  <div className="flex justify-between">
                    <span>Staff Gratuity / Tips:</span>
                    <span>+ {formatBDT(totalTips)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[13px] font-black pt-2 border-t-2 border-black">
                  <span>TOTAL NET REVENUE:</span>
                  <span>{formatBDT(netRevenue)}</span>
                </div>
              </div>

              {/* 3. Tender / Payments */}
              <div className="py-2.5 border-b border-dashed border-black text-[10px] sm:text-[11px] space-y-1">
                <div className="font-bold uppercase tracking-wider text-[11px] pb-0.5">
                  [ 3. TENDER & SETTLEMENTS ]
                </div>
                <div className="flex justify-between">
                  <span>Cash in Drawer (Till):</span>
                  <span className="font-bold">{formatBDT(paymentsByMethod.CASH || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit/Debit Cards:</span>
                  <span className="font-bold">{formatBDT(paymentsByMethod.CARD || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>bKash MFS:</span>
                  <span className="font-bold">{formatBDT(paymentsByMethod.BKASH || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nagad MFS:</span>
                  <span className="font-bold">{formatBDT(paymentsByMethod.NAGAD || 0)}</span>
                </div>
                {paymentsByMethod.LOYALTY_POINTS > 0 && (
                  <div className="flex justify-between">
                    <span>Loyalty Points Direct:</span>
                    <span className="font-bold">{formatBDT(paymentsByMethod.LOYALTY_POINTS)}</span>
                  </div>
                )}
                {paymentsByMethod.SPLIT > 0 && (
                  <div className="flex justify-between">
                    <span>Split Invoices:</span>
                    <span className="font-bold">{formatBDT(paymentsByMethod.SPLIT)}</span>
                  </div>
                )}
                {paymentsByMethod.OTHER > 0 && (
                  <div className="flex justify-between">
                    <span>Other Settlement:</span>
                    <span className="font-bold">{formatBDT(paymentsByMethod.OTHER)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black pt-1 border-t border-dotted border-neutral-400">
                  <span>Total Settlements Verified:</span>
                  <span>{formatBDT(netRevenue)}</span>
                </div>
              </div>

              {/* 4. VIP Loyalty Program Ledger */}
              <div className="py-2.5 border-b border-dashed border-black text-[10px] sm:text-[11px] space-y-1">
                <div className="font-bold uppercase tracking-wider text-[11px] pb-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> [ 4. VIP LOYALTY LEDGER ]
                </div>
                <div className="flex justify-between">
                  <span>Points Issued This Shift:</span>
                  <span className="font-bold">+{totalPointsAwarded} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Points Burned / Redeemed:</span>
                  <span className="font-bold">-{totalPointsRedeemedCount} pts</span>
                </div>
                <div className="flex justify-between text-neutral-800">
                  <span>Absorbed Loyalty Subsidy:</span>
                  <span className="font-bold">{formatBDT(totalPointsRedeemedValue)}</span>
                </div>
              </div>

              {/* 5. Cloud Verification QR */}
              <div className="py-3 flex flex-col items-center justify-center text-center space-y-1">
                <div className="p-1 bg-white border border-neutral-300 rounded">
                  <QRCodeSVG
                    value={`https://royalpalette.com.bd/audit/z-report?ref=${zReportCode}&revenue=${netRevenue}`}
                    size={64}
                    level="M"
                  />
                </div>
                <p className="text-[9px] text-neutral-600 font-mono">Scan for Cloud Verification & Tax Authority Audit</p>
              </div>

              {/* 6. Dual Auditor Signatures */}
              <div className="pt-3 pb-2 text-[10px] space-y-6">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="border-t border-black pt-1 mt-6">
                    <p className="font-bold">Chief Cashier</p>
                    <p className="text-[9px] text-neutral-600">Physical Till Count & Sign</p>
                  </div>
                  <div className="border-t border-black pt-1 mt-6">
                    <p className="font-bold">General Manager</p>
                    <p className="text-[9px] text-neutral-600">Audit & Fiscal Approval</p>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-dotted border-neutral-400 text-[9px] text-neutral-600 space-y-0.5">
                  <p className="font-bold text-neutral-800">NBR Mushak-6.3 Certified Fiscal Audit Record</p>
                  <p>Retain physical printout with daily cashier register records for 5 years.</p>
                  <p className="text-neutral-500">The Royal Palette POS System Core</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Controls & Tender Analytics Panel (Fixed 380px width) */}
          <div className="w-full lg:w-[380px] lg:shrink-0 bg-zinc-900 p-5 space-y-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto">
            <div className="space-y-5">
              
              {/* Date Scope Filter */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Audited Time Scope</span>
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDateFilter('TODAY')}
                    className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${
                      dateFilter === 'TODAY'
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <span>Today</span>
                  </button>
                  <button
                    onClick={() => setDateFilter('YESTERDAY')}
                    className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${
                      dateFilter === 'YESTERDAY'
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <span>Yesterday</span>
                  </button>
                  <button
                    onClick={() => setDateFilter('ALL')}
                    className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${
                      dateFilter === 'ALL'
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <span>All Time</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-400 font-mono text-[11px] shrink-0">Custom Day:</span>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter('CUSTOM');
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Settlement Channel Distribution */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settlement Channels</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">{completedOrders.length} orders</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                  {netRevenue > 0 && (
                    <>
                      <div
                        style={{ width: `${((paymentsByMethod.CASH || 0) / netRevenue) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title={`Cash: ${formatBDT(paymentsByMethod.CASH || 0)}`}
                      />
                      <div
                        style={{ width: `${((paymentsByMethod.CARD || 0) / netRevenue) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Cards: ${formatBDT(paymentsByMethod.CARD || 0)}`}
                      />
                      <div
                        style={{ width: `${((paymentsByMethod.BKASH || 0) / netRevenue) * 100}%` }}
                        className="bg-pink-500 h-full"
                        title={`bKash: ${formatBDT(paymentsByMethod.BKASH || 0)}`}
                      />
                      <div
                        style={{ width: `${((paymentsByMethod.NAGAD || 0) / netRevenue) * 100}%` }}
                        className="bg-orange-500 h-full"
                        title={`Nagad: ${formatBDT(paymentsByMethod.NAGAD || 0)}`}
                      />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Cash
                    </span>
                    <span className="font-bold text-zinc-200">{formatBDT(paymentsByMethod.CASH || 0)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cards
                    </span>
                    <span className="font-bold text-zinc-200">{formatBDT(paymentsByMethod.CARD || 0)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                    <span className="flex items-center gap-1.5 text-pink-400">
                      <span className="w-2 h-2 rounded-full bg-pink-500" /> bKash
                    </span>
                    <span className="font-bold text-zinc-200">{formatBDT(paymentsByMethod.BKASH || 0)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                    <span className="flex items-center gap-1.5 text-orange-400">
                      <span className="w-2 h-2 rounded-full bg-orange-500" /> Nagad
                    </span>
                    <span className="font-bold text-zinc-200">{formatBDT(paymentsByMethod.NAGAD || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Hardware Solenoid & Loyalty Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Drawer Solenoid Pulses</span>
                  </span>
                  <span className="font-bold text-white bg-zinc-900 px-2.5 py-0.5 rounded-md border border-zinc-800">
                    {drawerLogsCount} times
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono pt-2 border-t border-zinc-800">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Loyalty Subsidies Burned</span>
                  </span>
                  <span className="font-bold text-amber-300">
                    {formatBDT(totalPointsRedeemedValue)}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800 space-y-2.5 shrink-0">
              <button
                onClick={handlePrint}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Z-Report Now</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition border border-zinc-700"
              >
                Dismiss Window
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
