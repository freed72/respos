'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Percent,
  Sparkles,
  UtensilsCrossed,
  CreditCard,
  Wallet,
  Phone,
  Coins,
  Download,
  Layers,
  Clock,
  Users,
  Award,
  ShoppingBag,
  FileText,
  Activity,
  BarChart3,
  PieChart,
  Search,
} from 'lucide-react';
import { Order, Product, Category, Customer, SystemSettings } from '@/types';
import { formatBDT } from '@/lib/formatters';

interface AnalyticsInsightsTabProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
  settings: SystemSettings;
  drawerLogsCount: number;
  onOpenZReport?: () => void;
}

type DatePreset = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM' | 'ALL';
type OrderTypeFilter = 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
type DishSortBy = 'REVENUE' | 'COUNT' | 'PRICE' | 'NAME';

export const AnalyticsInsightsTab: React.FC<AnalyticsInsightsTabProps> = ({
  orders,
  products,
  categories,
  customers,
  settings,
  drawerLogsCount,
  onOpenZReport,
}) => {
  // 1. Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('THIS_MONTH');
  
  // Custom Date range
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const monthAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(monthAgoStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [channelFilter, setChannelFilter] = useState<OrderTypeFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [dishSortBy, setDishSortBy] = useState<DishSortBy>('REVENUE');
  const [dishSearch, setDishSearch] = useState<string>('');

  // 2. Compute Filter Date Boundaries
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    if (datePreset === 'TODAY') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start: s, end: e };
    }
    if (datePreset === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const s = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      const e = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      return { start: s, end: e };
    }
    if (datePreset === 'LAST_7_DAYS') {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      s.setHours(0, 0, 0, 0);
      return { start: s, end: now };
    }
    if (datePreset === 'THIS_MONTH') {
      const s = new Date(now);
      s.setDate(s.getDate() - 30);
      s.setHours(0, 0, 0, 0);
      return { start: s, end: now };
    }
    if (datePreset === 'CUSTOM') {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    return { start: new Date(0), end: new Date(8640000000000000) }; // ALL
  }, [datePreset, startDate, endDate]);

  // 3. Filter Orders by Date, Channel, and Payment
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const oDate = new Date(o.createdAt);
      if (oDate < dateRangeBounds.start || oDate > dateRangeBounds.end) return false;

      if (channelFilter !== 'ALL' && o.orderType !== channelFilter) return false;

      if (paymentFilter !== 'ALL') {
        const hasPayment =
          (o.payments && o.payments.some((p) => p.method === paymentFilter)) ||
          o.paymentMethod === paymentFilter;
        if (!hasPayment) return false;
      }

      return true;
    });
  }, [orders, dateRangeBounds, channelFilter, paymentFilter]);

  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'COMPLETED');
  }, [filteredOrders]);

  // 4. Financial Calculations
  const grossSales = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0), [completedOrders]);
  const totalRevenue = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [completedOrders]);
  const totalDiscounts = useMemo(
    () => completedOrders.reduce((sum, o) => sum + (o.discountAmount || 0) + (o.pointsDiscountValue || 0), 0),
    [completedOrders]
  );
  const totalVAT = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0), [completedOrders]);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const totalItemsSold = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0), 0),
    [completedOrders]
  );
  const totalPointsRedeemedValue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + (o.pointsDiscountValue || 0), 0),
    [completedOrders]
  );
  const totalPointsAwarded = useMemo(
    () => completedOrders.reduce((sum, o) => sum + (o.pointsEarned || 0), 0),
    [completedOrders]
  );

  // 5. Channel Breakdown
  const channelMetrics = useMemo(() => {
    const dineIn = completedOrders.filter((o) => o.orderType === 'DINE_IN');
    const takeaway = completedOrders.filter((o) => o.orderType === 'TAKEAWAY');
    const delivery = completedOrders.filter((o) => o.orderType === 'DELIVERY');

    const dineInRev = dineIn.reduce((s, o) => s + o.totalAmount, 0);
    const takeawayRev = takeaway.reduce((s, o) => s + o.totalAmount, 0);
    const deliveryRev = delivery.reduce((s, o) => s + o.totalAmount, 0);

    return {
      DINE_IN: { count: dineIn.length, revenue: dineInRev },
      TAKEAWAY: { count: takeaway.length, revenue: takeawayRev },
      DELIVERY: { count: delivery.length, revenue: deliveryRev },
    };
  }, [completedOrders]);

  // 6. Payment Methods Breakdown
  const paymentMetrics = useMemo(() => {
    const stats: Record<string, { count: number; amount: number }> = {
      CASH: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      BKASH: { count: 0, amount: 0 },
      NAGAD: { count: 0, amount: 0 },
      LOYALTY_POINTS: { count: 0, amount: 0 },
      OTHER: { count: 0, amount: 0 },
    };

    completedOrders.forEach((o) => {
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach((p) => {
          const m = stats[p.method] ? p.method : 'OTHER';
          stats[m].count += 1;
          stats[m].amount += p.amount;
        });
      } else if (o.paymentMethod && stats[o.paymentMethod]) {
        stats[o.paymentMethod].count += 1;
        stats[o.paymentMethod].amount += o.totalAmount;
      } else {
        stats.OTHER.count += 1;
        stats.OTHER.amount += o.totalAmount || 0;
      }
    });

    return stats;
  }, [completedOrders]);

  // 7. Rush Hours & Hourly Dining Heatmap
  const hourlyTraffic = useMemo(() => {
    const hours: { hour: number; label: string; count: number; revenue: number }[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i === 0 ? '12' : i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`,
      count: 0,
      revenue: 0,
    }));

    completedOrders.forEach((o) => {
      const dt = new Date(o.createdAt);
      const h = dt.getHours();
      if (hours[h]) {
        hours[h].count += 1;
        hours[h].revenue += o.totalAmount;
      }
    });

    return hours;
  }, [completedOrders]);

  // 8. Day-by-Day Revenue Trend
  const dailyTrends = useMemo(() => {
    const map: Record<string, { date: string; label: string; revenue: number; count: number }> = {};
    
    const sorted = [...completedOrders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((o) => {
      const dt = new Date(o.createdAt);
      const key = dt.toISOString().split('T')[0];
      const label = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!map[key]) {
        map[key] = { date: key, label, revenue: 0, count: 0 };
      }
      map[key].revenue += o.totalAmount;
      map[key].count += 1;
    });

    return Object.values(map);
  }, [completedOrders]);

  const maxDailyRevenue = useMemo(() => {
    return Math.max(...dailyTrends.map((d) => d.revenue), 1000);
  }, [dailyTrends]);

  // 9. Dish Sales Ranking
  const dishSalesList = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        banglaName?: string;
        categoryName: string;
        categoryId: string;
        price: number;
        count: number;
        revenue: number;
      }
    > = {};

    completedOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (categoryFilter !== 'ALL' && prod && prod.categoryId !== categoryFilter) {
          return;
        }

        const cat = categories.find((c) => c.id === prod?.categoryId);

        if (!map[item.productId]) {
          map[item.productId] = {
            id: item.productId,
            name: item.productName,
            banglaName: prod?.banglaName,
            categoryName: cat?.name || 'Delicacy',
            categoryId: prod?.categoryId || '',
            price: prod?.price || item.unitPrice,
            count: 0,
            revenue: 0,
          };
        }
        map[item.productId].count += item.quantity;
        map[item.productId].revenue += item.totalPrice;
      });
    });

    const list = Object.values(map);

    const searched = dishSearch.trim()
      ? list.filter(
          (d) =>
            d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
            (d.banglaName && d.banglaName.includes(dishSearch))
        )
      : list;

    return searched.sort((a, b) => {
      if (dishSortBy === 'REVENUE') return b.revenue - a.revenue;
      if (dishSortBy === 'COUNT') return b.count - a.count;
      if (dishSortBy === 'PRICE') return b.price - a.price;
      if (dishSortBy === 'NAME') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [completedOrders, products, categories, categoryFilter, dishSearch, dishSortBy]);

  // 10. Category Performance Contribution
  const categoryStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; revenue: number; itemsSold: number }> = {};
    categories.forEach((c) => {
      map[c.id] = { id: c.id, name: c.name, revenue: 0, itemsSold: 0 };
    });

    completedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && map[prod.categoryId]) {
          map[prod.categoryId].revenue += item.totalPrice;
          map[prod.categoryId].itemsSold += item.quantity;
        }
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [categories, completedOrders, products]);

  // 11. VIP Loyalty Tier Metrics
  const tierMetrics = useMemo(() => {
    const tiers = { BRONZE: 0, SILVER: 0, GOLD: 0, ROYAL: 0 };
    customers.forEach((c) => {
      if (tiers[c.tier] !== undefined) {
        tiers[c.tier] += 1;
      }
    });
    return tiers;
  }, [customers]);

  // 12. Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Date & Time',
      'Dining Type',
      'Status',
      'Items Count',
      'Subtotal (BDT)',
      'Discount (BDT)',
      'VAT (BDT)',
      'Service Charge (BDT)',
      'Tips (BDT)',
      'Total Net (BDT)',
      'Payment Method',
      'Points Earned',
      'Points Redeemed Value (BDT)',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.createdAt}"`,
      `"${o.orderType}"`,
      `"${o.status}"`,
      o.items.reduce((s, it) => s + it.quantity, 0),
      o.subtotal,
      o.discountAmount + o.pointsDiscountValue,
      o.taxAmount,
      o.serviceChargeAmount,
      o.tipAmount,
      o.totalAmount,
      `"${o.paymentMethod || 'MIXED'}"`,
      o.pointsEarned,
      o.pointsDiscountValue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TRP_Executive_Analytics_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-zinc-100 font-sans">
      
      {/* 1. Header & Context Control Strip (shadcn dark style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-sans font-bold text-zinc-100 tracking-tight">
              Executive Analytics & Financial Intelligence
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium font-mono tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" /> LIVE STREAM
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Period Analysis • {completedOrders.length} Completed Settlements • BIN: {settings.binNumber || '002391024-0101'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap z-10">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium font-sans flex items-center gap-1.5 transition active:scale-95"
            title="Export filtered records to Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          {onOpenZReport && (
            <button
              onClick={onOpenZReport}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daily Z-Report</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Filter Command Bar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-xs font-sans">
        <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
          <span className="text-zinc-200 font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Filter className="w-3.5 h-3.5 text-zinc-400" /> Multi-Dimensional Analytics Scope
          </span>
          <span className="text-zinc-400">
            Showing <strong className="text-zinc-100">{filteredOrders.length}</strong> matching orders
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Scope Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-400 text-[11px] mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" /> Period:
            </span>
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'LAST_7_DAYS', label: '7 Days' },
              { id: 'THIS_MONTH', label: '30 Days' },
              { id: 'ALL', label: 'All History' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id as DatePreset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  datePreset === p.id
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-xs'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Custom Range */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
              <span className="text-[10px] text-zinc-400">Custom:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="bg-transparent text-zinc-100 text-xs focus:outline-none cursor-pointer"
              />
              <span className="text-zinc-500 text-xs">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="bg-transparent text-zinc-100 text-xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Dining Channel Filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-zinc-400" /> Channel:
            </span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as OrderTypeFilter)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-zinc-700"
            >
              <option value="ALL">All Dining Channels</option>
              <option value="DINE_IN">Dine-In Banquets</option>
              <option value="TAKEAWAY">Takeaway / Counter</option>
              <option value="DELIVERY">Express Delivery</option>
            </select>

            {/* Payment Method Filter */}
            <span className="text-zinc-400 text-[11px] ml-2 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-zinc-400" /> Tender:
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-zinc-700"
            >
              <option value="ALL">All Tender Types</option>
              <option value="CASH">Cash in Till</option>
              <option value="CARD">Cards (Visa/MC/Amex)</option>
              <option value="BKASH">bKash MFS</option>
              <option value="NAGAD">Nagad MFS</option>
              <option value="LOYALTY_POINTS">Loyalty Points Direct</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Grid (6 Metric Cards - Without Gross Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 font-sans">
        
        {/* 1. Net Realized Revenue */}
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 shadow-xs space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-semibold">
            <span>Net Revenue</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
            {formatBDT(totalRevenue)}
          </h3>
          <div className="text-[10px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800">
            <span>Realized Deposits</span>
            <span className="text-emerald-400 font-medium">{completedOrders.length} bills</span>
          </div>
        </div>

        {/* 2. Gross Sales Volume */}
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 shadow-xs space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-semibold">
            <span>Gross Sales</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
            {formatBDT(grossSales)}
          </h3>
          <div className="text-[10px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800">
            <span>Pre-Discount Subtotal</span>
            <span className="text-zinc-300 font-medium">{totalItemsSold} items</span>
          </div>
        </div>

        {/* 3. Average Order Value (AOV) */}
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 shadow-xs space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-semibold">
            <span>Average Banquet (AOV)</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
            {formatBDT(averageOrderValue)}
          </h3>
          <div className="text-[10px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800">
            <span>Per Dining Ticket</span>
            <span className="text-cyan-400 font-medium">{channelMetrics.DINE_IN.count} Dine-In</span>
          </div>
        </div>

        {/* 4. NBR VAT Compliance */}
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 shadow-xs space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-semibold">
            <span>NBR VAT ({settings.vatPercent}%)</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-purple-400">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
            {formatBDT(totalVAT)}
          </h3>
          <div className="text-[10px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800">
            <span>Govt. Tax Collected</span>
            <span className="text-zinc-400 font-mono">Mushak-6.3</span>
          </div>
        </div>

        {/* 5. Subsidies & Discounts Absorbed */}
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 shadow-xs space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-semibold">
            <span>Discounts Absorbed</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-rose-400">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
            {formatBDT(totalDiscounts)}
          </h3>
          <div className="text-[10px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800">
            <span>Points: {formatBDT(totalPointsRedeemedValue)}</span>
            <span className="text-zinc-300 font-medium">{totalPointsAwarded} pts out</span>
          </div>
        </div>

        {/* 6. Hardware Cash Drawer */}
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 shadow-xs space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-semibold">
            <span>Cash in Drawer</span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-blue-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
            {formatBDT(paymentMetrics.CASH.amount)}
          </h3>
          <div className="text-[10px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800">
            <span>Solenoid: {drawerLogsCount} kicks</span>
            <span className="text-blue-400 font-medium">{paymentMetrics.CASH.count} cash tx</span>
          </div>
        </div>

      </div>

      {/* 4. Visual Trend Charts & Channel Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
        
        {/* Left: Revenue Trend Over Time (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-sm text-zinc-100 tracking-tight">
                Settlement Revenue Velocity
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              Peak Day: <strong className="text-zinc-100">{formatBDT(maxDailyRevenue)}</strong>
            </span>
          </div>

          {dailyTrends.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No completed transactions recorded for the selected period.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Responsive SVG Bar Chart */}
              <div className="h-44 w-full flex items-end gap-1.5 sm:gap-3 pt-6 pb-2 px-1 border-b border-zinc-800">
                {dailyTrends.map((d, idx) => {
                  const heightPercent = Math.max(8, Math.round((d.revenue / maxDailyRevenue) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end cursor-pointer"
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 text-[10px] font-sans p-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 text-center">
                        <p className="font-bold text-zinc-100">{formatBDT(d.revenue)}</p>
                        <p className="text-zinc-400">{d.count} bills • {d.label}</p>
                      </div>

                      {/* Bar Pillar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                          d.revenue === maxDailyRevenue
                            ? 'bg-zinc-100 shadow-sm'
                            : 'bg-zinc-700 hover:bg-zinc-600'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Day Labels Axis */}
              <div className="flex justify-between text-[10px] text-zinc-400 px-1 font-mono">
                {dailyTrends.slice(0, 7).map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Dining Channel Metrics */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800 text-xs">
            <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">DINE-IN BANQUETS</span>
              <span className="font-bold text-zinc-100 font-mono text-sm">{formatBDT(channelMetrics.DINE_IN.revenue)}</span>
              <span className="text-[10px] text-zinc-500">{channelMetrics.DINE_IN.count} parties</span>
            </div>

            <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">TAKEAWAY / COUNTER</span>
              <span className="font-bold text-zinc-100 font-mono text-sm">{formatBDT(channelMetrics.TAKEAWAY.revenue)}</span>
              <span className="text-[10px] text-zinc-500">{channelMetrics.TAKEAWAY.count} orders</span>
            </div>

            <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">EXPRESS DELIVERY</span>
              <span className="font-bold text-zinc-100 font-mono text-sm">{formatBDT(channelMetrics.DELIVERY.revenue)}</span>
              <span className="text-[10px] text-zinc-500">{channelMetrics.DELIVERY.count} dispatches</span>
            </div>
          </div>
        </div>

        {/* Right: Tender Breakdown & Hourly Rush Heatmap (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-sm text-zinc-100 tracking-tight">
                Tender Distribution & MFS
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              Total: <strong className="text-zinc-100 font-mono">{formatBDT(totalRevenue)}</strong>
            </span>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
              {totalRevenue > 0 && (
                <>
                  <div
                    style={{ width: `${(paymentMetrics.CASH.amount / totalRevenue) * 100}%` }}
                    className="bg-blue-500 h-full"
                    title={`Cash: ${formatBDT(paymentMetrics.CASH.amount)}`}
                  />
                  <div
                    style={{ width: `${(paymentMetrics.CARD.amount / totalRevenue) * 100}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Cards: ${formatBDT(paymentMetrics.CARD.amount)}`}
                  />
                  <div
                    style={{ width: `${(paymentMetrics.BKASH.amount / totalRevenue) * 100}%` }}
                    className="bg-pink-500 h-full"
                    title={`bKash: ${formatBDT(paymentMetrics.BKASH.amount)}`}
                  />
                  <div
                    style={{ width: `${(paymentMetrics.NAGAD.amount / totalRevenue) * 100}%` }}
                    className="bg-orange-500 h-full"
                    title={`Nagad: ${formatBDT(paymentMetrics.NAGAD.amount)}`}
                  />
                  <div
                    style={{ width: `${(paymentMetrics.LOYALTY_POINTS.amount / totalRevenue) * 100}%` }}
                    className="bg-purple-500 h-full"
                    title={`Loyalty Points: ${formatBDT(paymentMetrics.LOYALTY_POINTS.amount)}`}
                  />
                </>
              )}
            </div>

            {/* Tender Channel Details */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <Wallet className="w-3.5 h-3.5 text-blue-400" /> Cash in Drawer
                </span>
                <div className="text-right">
                  <span className="font-bold text-zinc-100 font-mono block">{formatBDT(paymentMetrics.CASH.amount)}</span>
                  <span className="text-[10px] text-zinc-500">{paymentMetrics.CASH.count} transactions</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Cards (Visa/Mastercard)
                </span>
                <div className="text-right">
                  <span className="font-bold text-zinc-100 font-mono block">{formatBDT(paymentMetrics.CARD.amount)}</span>
                  <span className="text-[10px] text-zinc-500">{paymentMetrics.CARD.count} transactions</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <Phone className="w-3.5 h-3.5 text-pink-400" /> bKash Merchant Wallet
                </span>
                <div className="text-right">
                  <span className="font-bold text-pink-300 font-mono block">{formatBDT(paymentMetrics.BKASH.amount)}</span>
                  <span className="text-[10px] text-zinc-500">{paymentMetrics.BKASH.count} transactions</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <Phone className="w-3.5 h-3.5 text-orange-400" /> Nagad Merchant Wallet
                </span>
                <div className="text-right">
                  <span className="font-bold text-orange-300 font-mono block">{formatBDT(paymentMetrics.NAGAD.amount)}</span>
                  <span className="text-[10px] text-zinc-500">{paymentMetrics.NAGAD.count} transactions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rush Hour Dining Heatmap Summary */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs space-y-1.5">
            <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" /> Dining Peak Distribution
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-400 block">Lunch (12-3 PM)</span>
                <span className="font-bold text-zinc-200">
                  {hourlyTraffic.slice(12, 15).reduce((s, h) => s + h.count, 0)} orders
                </span>
              </div>
              <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-400 block">Snack (3-6 PM)</span>
                <span className="font-bold text-zinc-200">
                  {hourlyTraffic.slice(15, 18).reduce((s, h) => s + h.count, 0)} orders
                </span>
              </div>
              <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-400 block">Dinner (7-10 PM)</span>
                <span className="font-bold text-zinc-100">
                  {hourlyTraffic.slice(19, 22).reduce((s, h) => s + h.count, 0)} orders
                </span>
              </div>
              <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
                <span className="text-zinc-400 block">Late Night</span>
                <span className="font-bold text-zinc-200">
                  {hourlyTraffic.slice(22, 24).reduce((s, h) => s + h.count, 0)} orders
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Menu Delicacy Performance Table (shadcn table style) */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2 tracking-tight">
              <UtensilsCrossed className="w-4 h-4 text-zinc-400" />
              <span>Delicacy Sales & Popularity Ranking</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Live ranking of recipe popularity, volume sold, and revenue contribution
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Dish Search */}
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search dish..."
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sorting */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setDishSortBy('REVENUE')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  dishSortBy === 'REVENUE' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setDishSortBy('COUNT')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  dishSortBy === 'COUNT' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Units Sold
              </button>
              <button
                onClick={() => setDishSortBy('PRICE')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  dishSortBy === 'PRICE' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Price
              </button>
              <button
                onClick={() => setDishSortBy('NAME')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  dishSortBy === 'NAME' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                A-Z
              </button>
            </div>
          </div>
        </div>

        {/* Dish Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-2.5 px-3">Rank & Delicacy</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-center">Volume Sold</th>
                <th className="py-2.5 px-3 text-right">Gross Revenue</th>
                <th className="py-2.5 px-3 text-right">Revenue Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {dishSalesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No dishes sold in the selected period.
                  </td>
                </tr>
              ) : (
                dishSalesList.map((dish, idx) => {
                  const sharePercent = grossSales > 0 ? ((dish.revenue / grossSales) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={dish.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 font-bold text-[10px] flex items-center justify-center border border-zinc-700/80 font-mono">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-zinc-100 text-xs">{dish.name}</p>
                            {dish.banglaName && (
                              <p className="text-[10px] text-zinc-400 font-bangla">{dish.banglaName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700/80">
                          {dish.categoryName}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-zinc-300 font-mono">
                        {formatBDT(dish.price)}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-zinc-200 font-mono">
                        {dish.count}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-zinc-100 font-mono">
                        {formatBDT(dish.revenue)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium text-[10px] border border-zinc-700 font-mono">
                          {sharePercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. VIP Loyalty & Category Contribution Dual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 font-sans">
        
        {/* VIP Loyalty Engine Analytics */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-sm text-zinc-100 tracking-tight">
                VIP Loyalty Program Velocity
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              {customers.length} Enrolled VIP Members
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold block uppercase">BRONZE</span>
              <span className="text-base font-black text-zinc-100 font-mono">{tierMetrics.BRONZE}</span>
              <span className="text-[9px] text-zinc-500 font-mono">1 pt/৳100</span>
            </div>

            <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-300 font-semibold block uppercase">SILVER</span>
              <span className="text-base font-black text-zinc-100 font-mono">{tierMetrics.SILVER}</span>
              <span className="text-[9px] text-zinc-500 font-mono">1.5 pt/৳100</span>
            </div>

            <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-amber-400 font-semibold block uppercase">GOLD VIP</span>
              <span className="text-base font-black text-amber-300 font-mono">{tierMetrics.GOLD}</span>
              <span className="text-[9px] text-zinc-500 font-mono">2 pt/৳100</span>
            </div>

            <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-purple-400 font-semibold block uppercase">ROYAL</span>
              <span className="text-base font-black text-purple-300 font-mono">{tierMetrics.ROYAL}</span>
              <span className="text-[9px] text-zinc-500 font-mono">3 pt/৳100</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-zinc-200 font-semibold block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Program Burn Ratio
              </span>
              <span className="text-[11px] text-zinc-400">
                Issued: +{totalPointsAwarded} pts • Burned: {totalPointsRedeemedValue} pts
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Total Absorbed Discount</span>
              <span className="font-bold text-zinc-100 font-mono text-sm">{formatBDT(totalPointsRedeemedValue)}</span>
            </div>
          </div>
        </div>

        {/* Menu Category Contribution */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-sm text-zinc-100 tracking-tight">
                Category Contribution Matrix
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              {categories.length} Active Kitchen Sections
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {categoryStats.slice(0, 4).map((c) => {
              const sharePercent = grossSales > 0 ? Math.round((c.revenue / grossSales) * 100) : 0;
              return (
                <div key={c.id} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-[10px]">{c.itemsSold} sold •</span>
                      <span className="font-bold text-zinc-100 font-mono">{formatBDT(c.revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${sharePercent}%` }}
                      className="h-full bg-zinc-200 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
