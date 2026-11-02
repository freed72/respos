'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Copy,
  Check,
  Download,
  User,
  Utensils,
  ChevronDown,
  Sparkles,
  Percent,
  Layers,
  ShoppingBag,
  Truck,
  RotateCcw,
  Wallet,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';
import { Order, OrderItem, PaymentMethod, ExpenseRecord } from '@/types';
import { formatBDT, formatDateTime } from '@/lib/formatters';
import { getActiveStaff } from '@/lib/pos-auth';
import { downloadOrdersCSV } from '@/lib/orders-csv';
import { SyncStatusBadge } from '@/components/layout/SyncStatusBadge';

export default function DailyReportPage() {
  const { orders, expenses, addExpense, deleteExpense, settings, drawerLogs } = useRestaurantStore();

  // Active cashier / staff session
  const [activeStaff, setActiveStaff] = useState<ReturnType<typeof getActiveStaff>>(null);

  useEffect(() => {
    setActiveStaff(getActiveStaff());
  }, []);

  // Daily Expense Recording State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('RAW_MATERIALS');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'BANK'>('CASH');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Today and Yesterday date strings in local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [copied, setCopied] = useState(false);

  // Search & Filter within the day's transaction table
  const [transactionSearch, setTransactionSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Filter orders by the selected date
  const dayOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}` === selectedDate;
    });
  }, [orders, selectedDate]);

  // Completed vs Cancelled
  const completedOrders = useMemo(() => {
    return dayOrders.filter((o) => o.status === 'COMPLETED');
  }, [dayOrders]);

  const cancelledOrders = useMemo(() => {
    return dayOrders.filter((o) => o.status === 'CANCELLED');
  }, [dayOrders]);

  // Financial aggregates
  const grossSales = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  }, [completedOrders]);

  const totalDiscounts = useMemo(() => {
    return completedOrders.reduce(
      (sum, o) => sum + (o.discountAmount || 0) + (o.pointsDiscountValue || 0),
      0
    );
  }, [completedOrders]);

  const netRevenue = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [completedOrders]);

  const totalVAT = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
  }, [completedOrders]);

  const totalServiceCharge = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.serviceChargeAmount || 0), 0);
  }, [completedOrders]);

  const totalTips = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.tipAmount || 0), 0);
  }, [completedOrders]);

  const aov = useMemo(() => {
    return completedOrders.length > 0 ? Math.round(netRevenue / completedOrders.length) : 0;
  }, [netRevenue, completedOrders.length]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const tally: Record<string, { count: number; amount: number }> = {
      CASH: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      BKASH: { count: 0, amount: 0 },
      NAGAD: { count: 0, amount: 0 },
      LOYALTY_POINTS: { count: 0, amount: 0 },
      SPLIT: { count: 0, amount: 0 },
      OTHER: { count: 0, amount: 0 },
    };

    completedOrders.forEach((o) => {
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach((p) => {
          const method = p.method in tally ? p.method : 'OTHER';
          tally[method].amount += p.amount || 0;
          tally[method].count += 1;
        });
      } else if (o.paymentMethod) {
        const method = o.paymentMethod in tally ? o.paymentMethod : 'OTHER';
        tally[method].amount += o.totalAmount || 0;
        tally[method].count += 1;
      } else {
        tally.OTHER.amount += o.totalAmount || 0;
        tally.OTHER.count += 1;
      }
    });

    return tally;
  }, [completedOrders]);

  // Dining Type breakdown
  const dineInOrders = useMemo(() => completedOrders.filter((o) => o.orderType === 'DINE_IN'), [completedOrders]);
  const takeawayOrders = useMemo(() => completedOrders.filter((o) => o.orderType === 'TAKEAWAY'), [completedOrders]);
  const deliveryOrders = useMemo(() => completedOrders.filter((o) => o.orderType === 'DELIVERY'), [completedOrders]);

  const dineInRevenue = useMemo(() => dineInOrders.reduce((s, o) => s + (o.totalAmount || 0), 0), [dineInOrders]);
  const takeawayRevenue = useMemo(() => takeawayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0), [takeawayOrders]);
  const deliveryRevenue = useMemo(() => deliveryOrders.reduce((s, o) => s + (o.totalAmount || 0), 0), [deliveryOrders]);

  // Top Selling Dishes for the day
  const topDishes = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    completedOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const existing = map.get(it.productName) || { name: it.productName, quantity: 0, revenue: 0 };
        existing.quantity += it.quantity || 1;
        existing.revenue += it.totalPrice || 0;
        map.set(it.productName, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [completedOrders]);

  // Filtered transactions in the table
  const filteredTransactions = useMemo(() => {
    return dayOrders.filter((o) => {
      if (filterPayment !== 'ALL' && o.paymentMethod !== filterPayment) {
        return false;
      }
      if (filterType !== 'ALL' && o.orderType !== filterType) {
        return false;
      }
      if (transactionSearch.trim()) {
        const query = transactionSearch.toLowerCase();
        const matchNum = o.orderNumber?.toLowerCase().includes(query);
        const matchCust = o.customerName?.toLowerCase().includes(query) || o.customerPhone?.includes(query);
        const matchStaff = o.serverName?.toLowerCase().includes(query);
        return matchNum || matchCust || matchStaff;
      }
      return true;
    });
  }, [dayOrders, filterPayment, filterType, transactionSearch]);

  // Formatted date label for display
  const formattedDateLabel = useMemo(() => {
    if (selectedDate === todayStr) return 'Today';
    if (selectedDate === yesterdayStr) return 'Yesterday';
    const [y, m, d] = selectedDate.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [selectedDate, todayStr, yesterdayStr]);

  // Day Expenses
  const dayExpenses = useMemo(() => {
    return (expenses || []).filter((exp) => {
      if (!exp.createdAt) return false;
      const d = new Date(exp.createdAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}` === selectedDate;
    });
  }, [expenses, selectedDate]);

  const totalDayExpenses = useMemo(() => {
    return dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [dayExpenses]);

  const cashExpenses = useMemo(() => {
    return dayExpenses
      .filter((e) => e.paymentMethod === 'CASH')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [dayExpenses]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'RAW_MATERIALS':
        return { label: 'Kitchen & Raw', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'STAFF_MEAL':
        return { label: 'Staff Meal & Tea', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'UTILITIES':
        return { label: 'Gas / Ice / Power', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'SUPPLIES':
        return { label: 'Cleaning & Packs', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'TRANSPORT':
        return { label: 'Transport & Fuel', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'MAINTENANCE':
        return { label: 'Repairs & Fix', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      default:
        return { label: 'Miscellaneous', color: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20' };
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!expenseTitle.trim() || isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid expense description and positive amount.');
      return;
    }

    const expenseDateTime =
      selectedDate === todayStr
        ? new Date().toISOString()
        : new Date(`${selectedDate}T12:00:00.000Z`).toISOString();

    addExpense({
      title: expenseTitle.trim(),
      amount: amountNum,
      category: expenseCategory,
      paymentMethod: expensePaymentMethod,
      notes: expenseNotes.trim() || undefined,
      recordedBy: activeStaff ? `${activeStaff.name} (${activeStaff.role})` : 'Cashier',
      createdAt: expenseDateTime,
    });

    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNotes('');
    setShowAddExpense(false);
  };

  // Copy summary to clipboard for WhatsApp/SMS
  const handleCopySummary = () => {
    const text = `⚜️ THE ROYAL PALETTE — DAILY SALES REPORT ⚜️
Date: ${formattedDateLabel} (${selectedDate})
Generated At: ${new Date().toLocaleTimeString()}
Operator: ${activeStaff ? `${activeStaff.name} (${activeStaff.role})` : 'Main Cashier'}
------------------------------------
Completed Bills: ${completedOrders.length}
Gross Sales: ৳${grossSales.toLocaleString()}
Discounts/Subsidies: -৳${totalDiscounts.toLocaleString()}
Net Revenue: ৳${netRevenue.toLocaleString()}
NBR VAT: +৳${totalVAT.toLocaleString()}
Tips / Gratuity: +৳${totalTips.toLocaleString()}
------------------------------------
TENDER BREAKDOWN (CASH DRAWER):
- Cash in Till: ৳${paymentBreakdown.CASH.amount.toLocaleString()} (${paymentBreakdown.CASH.count} bills)
- Card / POS: ৳${paymentBreakdown.CARD.amount.toLocaleString()} (${paymentBreakdown.CARD.count} bills)
- bKash MFS: ৳${paymentBreakdown.BKASH.amount.toLocaleString()} (${paymentBreakdown.BKASH.count} bills)
- Nagad MFS: ৳${paymentBreakdown.NAGAD.amount.toLocaleString()} (${paymentBreakdown.NAGAD.count} bills)
------------------------------------
CHANNELS:
- Dine-In: ৳${dineInRevenue.toLocaleString()} (${dineInOrders.length} orders)
- Takeaway: ৳${takeawayRevenue.toLocaleString()} (${takeawayOrders.length} orders)
- Delivery: ৳${deliveryRevenue.toLocaleString()} (${deliveryOrders.length} orders)
------------------------------------
EXPENSES (SEPARATE RECORD):
Total Day Expenses: ৳${totalDayExpenses.toLocaleString()} (${dayExpenses.length} entries)
- Cash Payouts: ৳${cashExpenses.toLocaleString()}
(Not deducted from sales revenue)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to POS</span>
            </Link>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  Daily Sales Report
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold font-mono">
                  {formattedDateLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Cashier & Manager Shift Reconciliation • The Royal Palette
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* Active Cashier Badge */}
            {activeStaff && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeStaff.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({activeStaff.role})</span>
              </div>
            )}

            <SyncStatusBadge variant="pos-dark" />

            {/* Copy Summary Button */}
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition active:scale-95 shadow-xs"
              title="Copy WhatsApp & SMS ready shift summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>

            {/* Download CSV Button */}
            <button
              onClick={() => downloadOrdersCSV(dayOrders, `TRP_Daily_Report_${selectedDate}.csv`)}
              disabled={dayOrders.length === 0}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20"
              title="Download CSV report for this day"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Date Selector Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Select Period:</span>
            
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedDate === todayStr
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedDate === yesterdayStr
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Yesterday
            </button>

            <div className="flex items-center gap-1.5 ml-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-medium focus:outline-none focus:border-amber-500 transition cursor-pointer"
              />
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Viewing sales records for</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-bold font-mono">
              {selectedDate}
            </span>
            <span className="text-slate-500">({dayOrders.length} transactions)</span>
          </div>
        </div>

        {/* 6 Key Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Net Revenue */}
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <DollarSign className="w-12 h-12 text-amber-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Net Revenue</p>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight font-mono">
              {formatBDT(netRevenue)}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Completed &amp; paid</p>
          </div>

          {/* 2. Gross Sales */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gross Sales</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-200 mt-1.5 tracking-tight font-mono">
              {formatBDT(grossSales)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Subtotal before discount</p>
          </div>

          {/* 3. Completed Bills */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bills Settled</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1.5 tracking-tight font-mono">
              {completedOrders.length}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              {cancelledOrders.length > 0 ? `${cancelledOrders.length} void / cancelled` : '0 cancellations'}
            </p>
          </div>

          {/* 4. Average Order Value */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Order (AOV)</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-200 mt-1.5 tracking-tight font-mono">
              {formatBDT(aov)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Per completed table/guest</p>
          </div>

          {/* 5. Total Discounts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Discounts &amp; Points</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-400 mt-1.5 tracking-tight font-mono">
              - {formatBDT(totalDiscounts)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Promos &amp; loyalty savings</p>
          </div>

          {/* 6. Total VAT Collected */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">NBR VAT Collected</p>
            <h3 className="text-xl sm:text-2xl font-black text-cyan-400 mt-1.5 tracking-tight font-mono">
              {formatBDT(totalVAT)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Tax payable ({settings.vatPercent || 0}%)</p>
          </div>
        </div>

        {/* Section: Tender Reconciliation & Channel Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tender Breakdown (Cash Drawer Balancing) - 7 cols */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">Payment Method &amp; Till Breakdown</h3>
              </div>
              <span className="text-[11px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Cashier Reconciliation
              </span>
            </div>

            {/* Cash in Till Highlight Card */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Physical Cash in Till</p>
                  <p className="text-[11px] text-slate-400">Expected cash amount inside register drawer</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {formatBDT(paymentBreakdown.CASH.amount)}
                </span>
                <span className="block text-[11px] text-slate-400 font-medium">
                  {paymentBreakdown.CASH.count} cash {paymentBreakdown.CASH.count === 1 ? 'sale' : 'sales'}
                </span>
              </div>
            </div>

            {/* Other Payment Channels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Card / POS */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-slate-200">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    Cards / POS
                  </span>
                  <span className="text-[10px] font-mono font-bold">{paymentBreakdown.CARD.count} bills</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white font-mono">
                  {formatBDT(paymentBreakdown.CARD.amount)}
                </p>
                <p className="text-[10px] text-slate-500">Credit / Debit terminal</p>
              </div>

              {/* bKash */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-slate-200">
                    <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                    bKash MFS
                  </span>
                  <span className="text-[10px] font-mono font-bold">{paymentBreakdown.BKASH.count} bills</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white font-mono">
                  {formatBDT(paymentBreakdown.BKASH.amount)}
                </p>
                <p className="text-[10px] text-slate-500">Merchant QR / Push</p>
              </div>

              {/* Nagad */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-slate-200">
                    <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                    Nagad MFS
                  </span>
                  <span className="text-[10px] font-mono font-bold">{paymentBreakdown.NAGAD.count} bills</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white font-mono">
                  {formatBDT(paymentBreakdown.NAGAD.amount)}
                </p>
                <p className="text-[10px] text-slate-500">Direct merchant pay</p>
              </div>
            </div>

            {/* Split / Other */}
            {(paymentBreakdown.SPLIT.amount > 0 || paymentBreakdown.OTHER.amount > 0) && (
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-400">Split / Loyalty Points / Other</span>
                <span className="font-bold text-white font-mono">
                  {formatBDT(paymentBreakdown.SPLIT.amount + paymentBreakdown.OTHER.amount)}
                </span>
              </div>
            )}
          </div>

          {/* Dining Channels Breakdown - 5 cols */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">Dining Channels Breakdown</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Order Modes</span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Dine In */}
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Dine-In Banquet</h4>
                    <p className="text-[10px] text-slate-400">{dineInOrders.length} tables served</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-black text-amber-300 font-mono">{formatBDT(dineInRevenue)}</p>
                  <p className="text-[10px] text-slate-500">
                    {netRevenue > 0 ? Math.round((dineInRevenue / netRevenue) * 100) : 0}% of sales
                  </p>
                </div>
              </div>

              {/* Takeaway */}
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Takeaway / Parcel</h4>
                    <p className="text-[10px] text-slate-400">{takeawayOrders.length} parcel orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-black text-cyan-300 font-mono">{formatBDT(takeawayRevenue)}</p>
                  <p className="text-[10px] text-slate-500">
                    {netRevenue > 0 ? Math.round((takeawayRevenue / netRevenue) * 100) : 0}% of sales
                  </p>
                </div>
              </div>

              {/* Delivery */}
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Delivery</h4>
                    <p className="text-[10px] text-slate-400">{deliveryOrders.length} dispatch deliveries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-black text-emerald-300 font-mono">{formatBDT(deliveryRevenue)}</p>
                  <p className="text-[10px] text-slate-500">
                    {netRevenue > 0 ? Math.round((deliveryRevenue / netRevenue) * 100) : 0}% of sales
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Top Selling Items on Selected Day */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">Top Selling Items of the Day</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {topDishes.reduce((sum, d) => sum + d.quantity, 0)} items sold ({topDishes.length} dishes)
            </span>
          </div>

          {topDishes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No sales or items recorded for {formattedDateLabel}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topDishes.slice(0, 8).map((dish, idx) => (
                <div
                  key={dish.name}
                  className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-700 text-amber-400 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate" title={dish.name}>{dish.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatBDT(dish.revenue)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-amber-400 font-mono block">
                      {dish.quantity} <span className="text-[10px] font-sans font-bold uppercase text-amber-400/80">items</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Daily Store & Petty Cash Expenses (Separate record, not calculated with sales) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white">Daily Expenses Record</h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                    Separate Register
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Track out-of-pocket &amp; petty cash expenses (Record only • Not calculated with sales)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-2 hidden sm:block">
                <span className="text-[11px] text-slate-400 block font-medium">Day Total:</span>
                <span className="text-sm font-black text-rose-400 font-mono">
                  {formatBDT(totalDayExpenses)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddExpense((prev) => !prev)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddExpense ? 'Cancel' : 'Record Expense'}</span>
              </button>
            </div>
          </div>

          {/* Add Expense Form */}
          {showAddExpense && (
            <form
              onSubmit={handleAddExpense}
              className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> New Expense for {formattedDateLabel}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Logged by: {activeStaff ? activeStaff.name : 'Cashier'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Expense Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kitchen Ice, Milk, Transport..."
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Amount in ৳ *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 350"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="RAW_MATERIALS">Kitchen &amp; Raw Ingredients</option>
                    <option value="STAFF_MEAL">Staff Meal &amp; Tea</option>
                    <option value="UTILITIES">Gas / Utilities / Ice</option>
                    <option value="SUPPLIES">Packaging &amp; Cleaning</option>
                    <option value="TRANSPORT">Transport &amp; Fuel</option>
                    <option value="MAINTENANCE">Repairs &amp; Fix</option>
                    <option value="OTHER">General Miscellaneous</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Paid Via
                  </label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="CASH">Cash (From Till / Pocket)</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Notes & Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Optional notes / payee / voucher reference..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full sm:max-w-md bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500"
                />

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95"
                  >
                    Save Expense
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Expenses List */}
          {dayExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-dashed border-slate-800">
              No expenses recorded for {formattedDateLabel}. Click{' '}
              <button
                type="button"
                onClick={() => setShowAddExpense(true)}
                className="text-rose-400 hover:underline font-bold"
              >
                + Record Expense
              </button>{' '}
              to log petty cash or daily kitchen purchases.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Paid Via</th>
                    <th className="py-2.5 px-3">Logged By</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {dayExpenses.map((exp) => {
                    const timeStr = new Date(exp.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const badge = getCategoryBadge(exp.category);

                    return (
                      <tr key={exp.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{timeStr}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{exp.title}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] text-slate-300 font-bold">{exp.paymentMethod}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{exp.recordedBy || 'Staff'}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                          {exp.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-rose-400">
                          {formatBDT(exp.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete expense "${exp.title}" (${formatBDT(exp.amount)})?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition"
                            title="Delete expense entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-800 bg-slate-950/40 text-xs">
                    <td colSpan={6} className="py-2 px-3 text-right font-bold text-slate-400">
                      Total Expenses Recorded:
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-rose-400 text-sm">
                      {formatBDT(totalDayExpenses)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Section: Full Transaction Log for Selected Day */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">Day Invoices &amp; Transactions</h3>
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {filteredTransactions.length} of {dayOrders.length}
              </span>
            </div>

            {/* Table Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order #, customer, phone..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 w-52 sm:w-64"
                />
              </div>

              {/* Payment Filter */}
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Payments</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
              </select>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="DINE_IN">Dine-In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No transactions match your current search and filters for {formattedDateLabel}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Cashier / Server</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Items</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredTransactions.map((order) => {
                    const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isCompleted = order.status === 'COMPLETED';
                    const isCancelled = order.status === 'CANCELLED';

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {timeStr}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.orderType === 'DINE_IN'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : order.orderType === 'TAKEAWAY'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {order.orderType === 'DINE_IN' ? `Dine-In (${order.tableNumber || 'T'})` : order.orderType}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-white font-bold truncate max-w-[140px]">
                            {order.customerName || 'Walk-in Guest'}
                          </p>
                          {order.customerPhone && (
                            <p className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {order.serverName || 'Cashier'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] font-bold text-slate-200">
                            {order.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 font-mono">
                          {(order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-amber-300">
                          {formatBDT(order.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isCancelled
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

