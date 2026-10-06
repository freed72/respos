'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Receipt,
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  Search,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  X,
  RefreshCw,
  Coins,
  ShieldCheck,
  Printer,
  FileText,
  LayoutGrid,
  Percent,
  Clock,
  Flame,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Wallet,
  Activity,
  UserPlus,
  Check,
  ChevronRight,
  Sliders,
  AlertCircle,
  Menu as MenuIcon,
  ChevronDown,
  ExternalLink,
  Tv,
  MonitorCheck,
  Layers,
  HelpCircle,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';
import {
  Customer,
  DietaryTag,
  LoyaltyTier,
  Order,
  Product,
} from '@/types';
import { formatBDT, formatDateTime, getTierBadgeClass } from '@/lib/formatters';
import { ThermalReceiptModal } from '@/components/pos/ThermalReceiptModal';
import { ZReportModal } from '@/components/admin/ZReportModal';
import { AdminLoginGate } from '@/components/admin/AdminLoginGate';

const DIETARY_OPTIONS: { tag: DietaryTag; label: string }[] = [
  { tag: 'CHEF_SPECIAL', label: "Chef's Special" },
  { tag: 'POPULAR', label: 'Popular' },
  { tag: 'HALAL', label: '100% Halal' },
  { tag: 'SPICY', label: 'Spicy' },
  { tag: 'EXTRA_SPICY', label: 'Extra Spicy' },
  { tag: 'VEGETARIAN', label: 'Vegetarian' },
  { tag: 'GLUTEN_FREE', label: 'Gluten Free' },
];

export default function AdminDashboardPage() {
  const {
    products,
    categories,
    orders,
    customers,
    settings,
    drawerLogs,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    addCustomer,
    updateCustomerPoints,
    updateSettings,
    kickDrawer,
    resetToDefaultSeed,
  } = useRestaurantStore();

  // Authentication State
  const [authState, setAuthState] = useState<'CHECKING' | 'AUTHENTICATED' | 'UNAUTHENTICATED'>('CHECKING');
  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    // Check existing executive cookie session
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setAdminUser(data.user);
          setAuthState('AUTHENTICATED');
        } else {
          setAuthState('UNAUTHENTICATED');
        }
      })
      .catch(() => {
        setAuthState('UNAUTHENTICATED');
      });
  }, []);

  const handleLogout = async () => {
    if (confirm('End executive admin session and lock dashboard?')) {
      try {
        await fetch('/api/admin/auth', { method: 'DELETE' });
      } catch {
        // Continue logout
      }
      setAuthState('UNAUTHENTICATED');
      setAdminUser(null);
    }
  };

  // Sidebar & Navigation State
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'products' | 'members' | 'orders' | 'hardware' | 'settings'
  >('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Modals
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    banglaName: '',
    description: '',
    categoryId: categories[0]?.id || '',
    price: 650,
    costPrice: 320,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    dietaryTags: ['HALAL'] as DietaryTag[],
    preparationTimeMinutes: 15,
  });

  // Customer Points Adjust Modal
  const [adjustCustomer, setAdjustCustomer] = useState<Customer | null>(null);
  const [pointsAdjustDelta, setPointsAdjustDelta] = useState<number>(100);
  const [pointsAdjustReason, setPointsAdjustReason] = useState<string>('Manager Courtesy Credit');

  // New Member Modal
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Search & Filter Queries
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Analytics Calculations
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const grossSales = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalVAT = completedOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalPointsRedeemedValue = completedOrders.reduce((sum, o) => sum + o.pointsDiscountValue, 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Best Selling Dishes & Margin Calculation
  const dishSalesMap: Record<
    string,
    { name: string; banglaName?: string; count: number; revenue: number; cost: number; categoryId: string }
  > = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = prod ? prod.costPrice : 0;
      if (!dishSalesMap[item.productId]) {
        dishSalesMap[item.productId] = {
          name: item.productName,
          banglaName: prod?.banglaName,
          count: 0,
          revenue: 0,
          cost: 0,
          categoryId: prod?.categoryId || '',
        };
      }
      dishSalesMap[item.productId].count += item.quantity;
      dishSalesMap[item.productId].revenue += item.totalPrice;
      dishSalesMap[item.productId].cost += unitCost * item.quantity;
    });
  });
  const topDishes = Object.values(dishSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Payment Breakdown for Analytics
  const paymentStats: Record<string, number> = { CASH: 0, CARD: 0, BKASH: 0, NAGAD: 0, LOYALTY_POINTS: 0 };
  completedOrders.forEach((o) => {
    if (o.payments && o.payments.length > 0) {
      o.payments.forEach((p) => {
        paymentStats[p.method] = (paymentStats[p.method] || 0) + p.amount;
      });
    } else if (o.paymentMethod) {
      paymentStats[o.paymentMethod] = (paymentStats[o.paymentMethod] || 0) + o.totalAmount;
    }
  });

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      banglaName: prod.banglaName || '',
      description: prod.description,
      categoryId: prod.categoryId,
      price: prod.price,
      costPrice: prod.costPrice,
      imageUrl: prod.imageUrl,
      dietaryTags: prod.dietaryTags,
      preparationTimeMinutes: prod.preparationTimeMinutes,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: productForm.name,
        banglaName: productForm.banglaName,
        description: productForm.description,
        categoryId: productForm.categoryId,
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice),
        imageUrl: productForm.imageUrl,
        dietaryTags: productForm.dietaryTags,
        preparationTimeMinutes: Number(productForm.preparationTimeMinutes),
      });
    } else {
      addProduct({
        name: productForm.name,
        banglaName: productForm.banglaName,
        description: productForm.description,
        categoryId: productForm.categoryId,
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice),
        imageUrl: productForm.imageUrl,
        dietaryTags: productForm.dietaryTags,
        preparationTimeMinutes: Number(productForm.preparationTimeMinutes),
        isAvailable: true,
        sortOrder: products.length + 1,
      });
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleTestDrawer = async () => {
    await kickDrawer('Executive Manual Hardware Test Kick', 'ADMIN-TEST', 0);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.phone) return;
    addCustomer({
      name: newMemberForm.name,
      phone: newMemberForm.phone,
      email: newMemberForm.email || undefined,
      notes: newMemberForm.notes || undefined,
    });
    setNewMemberForm({ name: '', phone: '', email: '', notes: '' });
    setIsNewMemberModalOpen(false);
  };

  interface NavItem {
    id: 'analytics' | 'products' | 'members' | 'orders' | 'hardware' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const navItems: NavGroup[] = [
    {
      group: 'MAIN DASHBOARD',
      items: [
        { id: 'analytics', label: 'Analytics & Insights', icon: LayoutDashboard },
      ],
    },
    {
      group: 'RESTAURANT OPERATIONS',
      items: [
        { id: 'products', label: 'Menu & Recipe Studio', icon: UtensilsCrossed, count: products.length },
        { id: 'members', label: 'VIP Member CRM', icon: Users, count: customers.length },
        { id: 'orders', label: 'Orders & Invoices', icon: Receipt, count: orders.length },
      ],
    },
    {
      group: 'HARDWARE & SYSTEM',
      items: [
        { id: 'hardware', label: 'Cash Drawer & ESC/POS', icon: KeyRound },
        { id: 'settings', label: 'Store & Tax Settings', icon: Settings },
      ],
    },
  ];

  if (authState === 'CHECKING') {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-xs font-mono text-slate-400">Verifying Executive Session...</p>
        </div>
      </div>
    );
  }

  if (authState === 'UNAUTHENTICATED') {
    return (
      <AdminLoginGate
        onAuthenticated={(user) => {
          setAdminUser(user);
          setAuthState('AUTHENTICATED');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 selection:text-amber-200 antialiased">
      
      {/* ----------------- MOBILE SIDEBAR OVERLAY ----------------- */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ----------------- LEFT SIDEBAR NAVIGATION ----------------- */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c1222] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#000f50] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-serif font-black text-sm text-white tracking-wide">
                  The Royal Palette
                </h2>
              </div>
              <p className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                <span>Khulna Flagship HQ</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links by Group */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-none">
          {navItems.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                {sec.group}
              </p>
              <div className="space-y-0.5 pt-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as typeof activeTab);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition group ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/40 shadow-xs'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition ${
                            isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                            isActive
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Terminal Switcher Section */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              LIVE TERMINALS
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 px-1">
              <Link
                href="/pos"
                target="_blank"
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition"
              >
                <MonitorCheck className="w-4 h-4 text-emerald-400" />
                <span>Staff POS</span>
              </Link>
              <Link
                href="/kds"
                target="_blank"
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>Kitchen KDS</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: System Status & User Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0a0f1d] space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Postgres BaaS Cloud</span>
            </span>
            <span className="text-emerald-400 font-bold">Online</span>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
              {adminUser?.username?.[0] || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {adminUser?.username ? `@${adminUser.username}` : 'Manager'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">Executive Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
              title="End Session (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ----------------- MAIN CONTENT CANVAS ----------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header App Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Admin HQ</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-amber-300 font-semibold capitalize">
                {activeTab === 'analytics' && 'Executive Analytics'}
                {activeTab === 'products' && 'Menu & Recipe Studio'}
                {activeTab === 'members' && 'VIP Member CRM'}
                {activeTab === 'orders' && 'Orders & Invoices Archive'}
                {activeTab === 'hardware' && 'Cash Drawer & ESC/POS'}
                {activeTab === 'settings' && 'Store & Tax Settings'}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {currentTime && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentTime}</span>
              </div>
            )}

            <button
              onClick={handleTestDrawer}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-500/50 text-xs font-bold transition active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Kick Drawer</span>
            </button>

            <button
              onClick={() => setIsZReportOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daily Z-Report</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
              title="Logout Executive"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Main View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* ================= TAB 1: EXECUTIVE ANALYTICS & INSIGHTS ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Page Title & Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-serif font-black text-white">Executive Financial Intelligence</h2>
                  <p className="text-xs text-slate-400">Live operational overview and revenue analytics</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Settlement Stream
                  </span>
                </div>
              </div>

              {/* 4 Standard Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Gross Sales */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Gross Sales Volume</span>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white font-mono">{formatBDT(grossSales)}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3 h-3" /> Realized: {formatBDT(totalRevenue)}
                    </span>
                    <span>{completedOrders.length} orders</span>
                  </div>
                </div>

                {/* NBR VAT */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>NBR VAT ({settings.vatPercent}%)</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-emerald-400 font-mono">{formatBDT(totalVAT)}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
                    <span>Govt. Tax Compliance</span>
                    <span>BIN: {settings.binNumber || '002391024-0101'}</span>
                  </div>
                </div>

                {/* Average Order Value */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Average Banquet (AOV)</span>
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white font-mono">{formatBDT(averageOrderValue)}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="text-cyan-400">Per Dining Party</span>
                    <span>{completedOrders.length} Banquets Settled</span>
                  </div>
                </div>

                {/* VIP Points Redeemed */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>VIP Points Redeemed</span>
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-indigo-300 font-mono">{formatBDT(totalPointsRedeemedValue)}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="text-indigo-400">{customers.length} Members</span>
                    <span>{customers.reduce((s, c) => s + c.pointsBalance, 0)} pts balance</span>
                  </div>
                </div>

              </div>

              {/* Middle Section: Top Dishes with Margins & Settlement Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Top Mastercrafted Dishes (7 cols) */}
                <div className="lg:col-span-7 bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                      <span>Top Selling Dishes & Kitchen Margins</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">Ranked by Gross Revenue</span>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {topDishes.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No orders completed yet.</p>
                    ) : (
                      topDishes.map((dish, idx) => {
                        const grossProfit = dish.revenue - dish.cost;
                        const marginPercent = dish.revenue > 0 ? Math.round((grossProfit / dish.revenue) * 100) : 0;
                        return (
                          <div key={idx} className="py-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center font-bold text-[11px] font-mono">
                                #{idx + 1}
                              </span>
                              <div>
                                <p className="font-bold text-slate-100">{dish.name}</p>
                                {dish.banglaName && (
                                  <p className="text-[10px] text-amber-400/80 font-bangla">{dish.banglaName}</p>
                                )}
                              </div>
                            </div>

                            <div className="text-right space-y-0.5">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-slate-400 font-mono">{dish.count} sold •</span>
                                <span className="font-mono font-bold text-amber-300">{formatBDT(dish.revenue)}</span>
                              </div>
                              <div className="flex items-center gap-2 justify-end text-[10px] font-mono">
                                <span className="text-slate-500">Cost: {formatBDT(dish.cost)}</span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  {marginPercent}% Margin
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Settlement Distribution (5 cols) */}
                <div className="lg:col-span-5 bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Settlement Channel Breakdown</span>
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <span>Cash in Till</span>
                      </div>
                      <span className="font-bold text-white">{formatBDT(paymentStats.CASH || 0)}</span>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <CreditCard className="w-4 h-4 text-cyan-400" />
                        <span>POS Terminals (Visa/MC)</span>
                      </div>
                      <span className="font-bold text-white">{formatBDT(paymentStats.CARD || 0)}</span>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-pink-300">
                        <Phone className="w-4 h-4 text-pink-400" />
                        <span>bKash Merchant Pay</span>
                      </div>
                      <span className="font-bold text-pink-300">{formatBDT(paymentStats.BKASH || 0)}</span>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-orange-300">
                        <Phone className="w-4 h-4 text-orange-400" />
                        <span>Nagad Merchant Pay</span>
                      </div>
                      <span className="font-bold text-orange-300">{formatBDT(paymentStats.NAGAD || 0)}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 2: MENU & RECIPE STUDIO ================= */}
          {activeTab === 'products' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Header & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search dish by English or বাংলা..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ALL">All Categories ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      banglaName: '',
                      description: '',
                      categoryId: categories[0]?.id || '',
                      price: 650,
                      costPrice: 320,
                      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
                      dietaryTags: ['HALAL'],
                      preparationTimeMinutes: 15,
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>

              {/* Products Data Table */}
              <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Dish Details</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Selling Price</th>
                      <th className="p-3.5">Kitchen Cost</th>
                      <th className="p-3.5">Gross Margin</th>
                      <th className="p-3.5">Menu Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {products
                      .filter((p) => {
                        const matchesSearch =
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.banglaName && p.banglaName.toLowerCase().includes(productSearch.toLowerCase()));
                        const matchesCat = productCategoryFilter === 'ALL' || p.categoryId === productCategoryFilter;
                        return matchesSearch && matchesCat;
                      })
                      .map((prod) => {
                        const cat = categories.find((c) => c.id === prod.categoryId);
                        const profit = prod.price - prod.costPrice;
                        const margin = prod.price > 0 ? Math.round((profit / prod.price) * 100) : 0;
                        return (
                          <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 flex items-center gap-3">
                              <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                                <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-white text-xs">{prod.name}</p>
                                  {prod.dietaryTags.includes('CHEF_SPECIAL') && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                      CHEF
                                    </span>
                                  )}
                                </div>
                                {prod.banglaName && (
                                  <p className="text-[10px] text-amber-400/80 font-bangla">{prod.banglaName}</p>
                                )}
                              </div>
                            </td>

                            <td className="p-3.5 text-slate-400 font-medium">{cat?.name || 'Grand Entrée'}</td>

                            <td className="p-3.5 font-mono font-bold text-amber-300">{formatBDT(prod.price)}</td>

                            <td className="p-3.5 font-mono text-slate-400">{formatBDT(prod.costPrice)}</td>

                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                  margin >= 50
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {margin}%
                              </span>
                            </td>

                            <td className="p-3.5">
                              <button
                                onClick={() => toggleProductAvailability(prod.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  prod.isAvailable
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                }`}
                              >
                                {prod.isAvailable ? 'In Stock' : "86'd Out"}
                              </button>
                            </td>

                            <td className="p-3.5 text-right space-x-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700 transition"
                                title="Edit Dish"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove dish "${prod.name}" from catalogue?`)) {
                                    deleteProduct(prod.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                title="Delete Dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

            </div>
          )}



          {/* ================= TAB 4: VIP MEMBER CRM ================= */}
          {activeTab === 'members' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search VIP by phone or name..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => setIsNewMemberModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Onboard VIP Member</span>
                </button>
              </div>

              {/* Member Table */}
              <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">VIP Member</th>
                      <th className="p-3.5">Phone Number</th>
                      <th className="p-3.5">Tier Status</th>
                      <th className="p-3.5">Available Points</th>
                      <th className="p-3.5">Lifetime Spend</th>
                      <th className="p-3.5">Visits</th>
                      <th className="p-3.5 text-right">Points Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {customers
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.phone.includes(customerSearch)
                      )
                      .map((cust) => {
                        const tierStyle = getTierBadgeClass(cust.tier);
                        return (
                          <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5">
                              <p className="font-bold text-white text-xs">{cust.name}</p>
                              {cust.notes && <p className="text-[10px] text-slate-400">{cust.notes}</p>}
                            </td>

                            <td className="p-3.5 font-mono text-slate-300">{cust.phone}</td>

                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                              >
                                {cust.tier}
                              </span>
                            </td>

                            <td className="p-3.5 font-mono font-bold text-amber-300">{cust.pointsBalance} pts</td>

                            <td className="p-3.5 font-mono text-slate-200">{formatBDT(cust.totalSpent)}</td>

                            <td className="p-3.5 font-mono text-slate-400">{cust.visitCount}</td>

                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setAdjustCustomer(cust);
                                  setPointsAdjustDelta(100);
                                  setPointsAdjustReason('Executive Courtesy Credit');
                                }}
                                className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-[11px] font-bold transition ml-auto"
                              >
                                Adjust Points
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ================= TAB 5: ORDERS & INVOICES ARCHIVE ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Order #, phone or guest..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Order States</option>
                  <option value="COMPLETED">COMPLETED (Settled)</option>
                  <option value="SERVED">SERVED (Dining)</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              {/* Orders Table */}
              <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Order No</th>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5">Table / Type</th>
                      <th className="p-3.5">Guest</th>
                      <th className="p-3.5">Dishes</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {orders
                      .filter((o) => {
                        const matchesSearch =
                          o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (o.customerPhone && o.customerPhone.includes(orderSearch)) ||
                          (o.customerName && o.customerName.toLowerCase().includes(orderSearch.toLowerCase()));
                        const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-mono font-bold text-amber-300">#{ord.orderNumber}</td>

                          <td className="p-3.5 text-slate-400 text-[11px] font-mono">{formatDateTime(ord.createdAt)}</td>

                          <td className="p-3.5 text-slate-200">{ord.tableNumber || ord.orderType.replace('_', ' ')}</td>

                          <td className="p-3.5 text-slate-300">
                            {ord.customerName || 'Palace Guest'}
                            {ord.customerPhone && (
                              <span className="block text-[10px] text-slate-500 font-mono">{ord.customerPhone}</span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-slate-400">
                            {ord.items.reduce((s, i) => s + i.quantity, 0)} items
                          </td>

                          <td className="p-3.5 font-mono font-bold text-emerald-400">{formatBDT(ord.totalAmount)}</td>

                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                ord.paymentStatus === 'PAID'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {ord.paymentMethod || ord.paymentStatus}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setSelectedReceiptOrder(ord)}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition ml-auto"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>80mm</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ================= TAB 6: HARDWARE CASH DRAWER ================= */}
          {activeTab === 'hardware' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              
              <div className="lg:col-span-7 bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Digital Cash Drawer & ESC/POS Hardware Bridge</h3>
                    <p className="text-xs text-slate-400">Control the 24V solenoid pulse and WebUSB / WebSerial triggers</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="font-bold text-white text-xs">Auto-Kick Solenoid on Cash Settlement</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Automatically opens cash drawer when cashier completes a cash invoice.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoKickDrawerOnCash}
                      onChange={(e) => updateSettings({ autoKickDrawerOnCash: e.target.checked })}
                      className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1 font-mono">
                      ESC/POS Drawer Kick Command (Hex Byte String)
                    </label>
                    <input
                      type="text"
                      value={settings.drawerKickCodeHex}
                      onChange={(e) => updateSettings({ drawerKickCodeHex: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Standard Pin 2: <code>1B 70 00 19 FA</code> | Pin 5: <code>1B 70 01 19 FA</code>
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTestDrawer}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Fire Test Solenoid (24V Pulse)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hardware Kick Audit Trail */}
              <div className="lg:col-span-5 bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Hardware Pulse Audit Log</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">{drawerLogs.length} events</span>
                </div>

                <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto pr-1">
                  {drawerLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No pulses recorded yet.</p>
                  ) : (
                    drawerLogs.map((log) => (
                      <div key={log.id} className="py-2.5 space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-amber-300">{log.reason}</span>
                          {log.amount !== undefined && (
                            <span className="font-mono text-emerald-400">{formatBDT(log.amount)}</span>
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{formatDateTime(log.timestamp)}</span>
                          {log.orderNumber && <span>Invoice #{log.orderNumber}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 7: STORE & TAX SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-200">
              
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Store Profile & NBR Tax Configurations</h3>
                  <p className="text-xs text-slate-400">Manage business information, receipt headers, and VAT rates</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Restaurant Name</label>
                    <input
                      type="text"
                      value={settings.restaurantName}
                      onChange={(e) => updateSettings({ restaurantName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Tagline</label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => updateSettings({ tagline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Store Address</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => updateSettings({ address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1 font-mono">NBR BIN Number</label>
                    <input
                      type="text"
                      value={settings.binNumber}
                      onChange={(e) => updateSettings({ binNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1 font-mono">NBR VAT (%)</label>
                    <input
                      type="number"
                      value={settings.vatPercent}
                      onChange={(e) => updateSettings({ vatPercent: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1 font-mono">Service Charge (%)</label>
                    <input
                      type="number"
                      value={settings.serviceChargePercent}
                      onChange={(e) => updateSettings({ serviceChargePercent: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Database seeding & initial state</span>
                  <button
                    onClick={() => {
                      if (confirm('Reset entire system database to initial seeded demo dishes, members, and tables?')) {
                        resetToDefaultSeed();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* ================= MODALS ================= */}

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 my-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">
                {editingProduct ? 'Edit Mastercrafted Dish' : 'Add New Royal Dish'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Dish Name (English) *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 font-bangla">Dish Name (বাংলা)</label>
                <input
                  type="text"
                  placeholder="e.g. শাহী মোরগ পোলাও"
                  value={productForm.banglaName}
                  onChange={(e) => setProductForm({ ...productForm, banglaName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bangla focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Culinary Category *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">Food Cost (৳)</label>
                  <input
                    type="number"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Food Image URL</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Dietary & Chef Badges</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_OPTIONS.map((opt) => {
                    const isSelected = productForm.dietaryTags.includes(opt.tag);
                    return (
                      <button
                        key={opt.tag}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? productForm.dietaryTags.filter((t) => t !== opt.tag)
                            : [...productForm.dietaryTags, opt.tag];
                          setProductForm({ ...productForm, dietaryTags: next });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black transition active:scale-95"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Dish'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Adjust Customer Points Modal */}
      {adjustCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Adjust Member Points</h3>
              <button onClick={() => setAdjustCustomer(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-300">
                VIP: <strong className="text-white">{adjustCustomer.name}</strong> ({adjustCustomer.phone})
              </p>
              <p className="text-slate-400">
                Balance: <strong className="text-amber-300 font-mono">{adjustCustomer.pointsBalance} pts</strong>
              </p>

              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">Points Delta (+/-)</label>
                <input
                  type="number"
                  value={pointsAdjustDelta}
                  onChange={(e) => setPointsAdjustDelta(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={pointsAdjustReason}
                  onChange={(e) => setPointsAdjustReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setAdjustCustomer(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateCustomerPoints(adjustCustomer.id, pointsAdjustDelta, 0);
                    setAdjustCustomer(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition"
                >
                  Apply Points
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Member Modal */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Onboard VIP Member</h3>
              <button onClick={() => setIsNewMemberModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navid Chowdhury"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">Mobile Phone (BD) *</label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="optional@domain.com"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">VIP Dietary / Table Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers window table"
                  value={newMemberForm.notes}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black transition"
                >
                  Register VIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Daily Z-Report & Tax Audit Modal */}
      {isZReportOpen && (
        <ZReportModal
          orders={orders}
          settings={settings}
          drawerLogsCount={drawerLogs.length}
          onClose={() => setIsZReportOpen(false)}
        />
      )}

      {/* Re-print Thermal Receipt Modal */}
      {selectedReceiptOrder && (
        <ThermalReceiptModal
          order={selectedReceiptOrder}
          settings={settings}
          onClose={() => setSelectedReceiptOrder(null)}
          onKickDrawer={handleTestDrawer}
        />
      )}

    </div>
  );
}
