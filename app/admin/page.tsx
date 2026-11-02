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
  Calendar,
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
  LogOut,
  Save,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  WalletCards,
  Tag,
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';
import { downloadOrdersCSV, parseOrdersFromCSV } from '@/lib/orders-csv';
import {
  Customer,
  DietaryTag,
  ExpenseRecord,
  LoyaltyTier,
  Order,
  Product,
  StaffMember,
} from '@/types';
import { formatBDT, formatDateTime, getTierBadgeClass } from '@/lib/formatters';
import { ThermalReceiptModal } from '@/components/pos/ThermalReceiptModal';
import { ZReportModal } from '@/components/admin/ZReportModal';
import { AdminLoginGate } from '@/components/admin/AdminLoginGate';
import { AnalyticsInsightsTab } from '@/components/admin/AnalyticsInsightsTab';
import { SyncStatusBadge } from '@/components/layout/SyncStatusBadge';
import { getStaffMembers, saveStaffMembers } from '@/lib/pos-auth';

const DIETARY_OPTIONS: { tag: DietaryTag; label: string }[] = [
  { tag: 'CHEF_SPECIAL', label: "Chef's Special" },
  { tag: 'POPULAR', label: 'Popular' },
  { tag: 'HALAL', label: '100% Halal' },
  { tag: 'SPICY', label: 'Spicy' },
  { tag: 'EXTRA_SPICY', label: 'Extra Spicy' },
  { tag: 'VEGETARIAN', label: 'Vegetarian' },
  { tag: 'GLUTEN_FREE', label: 'Gluten Free' },
];

const EXPENSE_CATEGORIES = [
  { id: 'RAW_MATERIALS', label: 'Kitchen & Raw Materials', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'UTILITIES', label: 'Utilities & Fuel', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'MAINTENANCE', label: 'Maintenance & Repairs', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'LABOR', label: 'Daily Labor & Wages', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'PETTY_CASH', label: 'Petty Cash & Supplies', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  { id: 'OTHER', label: 'Marketing / Other', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
];

function getExpenseCategoryBadge(catId: string) {
  const found = EXPENSE_CATEGORIES.find((c) => c.id === catId);
  return found || { id: catId, label: catId, color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
}

function downloadExpensesCSV(records: ExpenseRecord[], filename = 'TRP_Expense_Register.csv') {
  if (records.length === 0) return;
  const headers = ['ID', 'Date', 'Time', 'Title / Item', 'Category', 'Payment Method', 'Logged By', 'Notes', 'Amount (BDT)'];
  const rows = records.map((e) => {
    const dt = new Date(e.createdAt);
    const dateStr = dt.toLocaleDateString('en-GB');
    const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
    return [
      escapeCsv(e.id),
      escapeCsv(dateStr),
      escapeCsv(timeStr),
      escapeCsv(e.title),
      escapeCsv(e.category),
      escapeCsv(e.paymentMethod),
      escapeCsv(e.recordedBy || 'Staff'),
      escapeCsv(e.notes || ''),
      e.amount.toFixed(2),
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AdminDashboardPage() {
  const {
    products,
    categories,
    orders,
    customers,
    settings,
    drawerLogs,
    expenses,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerPoints,
    updateSettings,
    kickDrawer,
    resetToDefaultSeed,
    clearAllSalesRecords,
    restoreOrders,
    addExpense,
    deleteExpense,
    clearAllExpenses,
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
    'analytics' | 'products' | 'members' | 'orders' | 'expenses' | 'hardware' | 'settings'
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

  // Edit VIP Member Modal & Delete State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editMemberForm, setEditMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'BRONZE' as LoyaltyTier,
    pointsBalance: 50,
    totalSpent: 0,
    visitCount: 0,
    notes: '',
  });
  const [memberNotification, setMemberNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter Queries
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderDatePreset, setOrderDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const yesterdayStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [orderCustomDate, setOrderCustomDate] = useState<string>(todayStr);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dateDropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);

  // Expense Register State
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [expenseMethodFilter, setExpenseMethodFilter] = useState<'ALL' | 'CASH' | 'BKASH' | 'NAGAD' | 'BANK'>('ALL');
  const [expenseDatePreset, setExpenseDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [expenseCustomDate, setExpenseCustomDate] = useState<string>(todayStr);
  const [isExpenseDateDropdownOpen, setIsExpenseDateDropdownOpen] = useState(false);
  const [isExpenseCategoryDropdownOpen, setIsExpenseCategoryDropdownOpen] = useState(false);
  const [isExpenseMethodDropdownOpen, setIsExpenseMethodDropdownOpen] = useState(false);
  const expenseDateDropdownRef = React.useRef<HTMLDivElement>(null);
  const expenseCategoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const expenseMethodDropdownRef = React.useRef<HTMLDivElement>(null);

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isClearExpensesModalOpen, setIsClearExpensesModalOpen] = useState(false);
  const [expenseNotification, setExpenseNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [newExpenseForm, setNewExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'RAW_MATERIALS',
    paymentMethod: 'CASH' as 'CASH' | 'BKASH' | 'NAGAD' | 'BANK',
    notes: '',
    recordedBy: '',
    customDate: '',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(target)) {
        setIsDateDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setIsStatusDropdownOpen(false);
      }
      if (expenseDateDropdownRef.current && !expenseDateDropdownRef.current.contains(target)) {
        setIsExpenseDateDropdownOpen(false);
      }
      if (expenseCategoryDropdownRef.current && !expenseCategoryDropdownRef.current.contains(target)) {
        setIsExpenseCategoryDropdownOpen(false);
      }
      if (expenseMethodDropdownRef.current && !expenseMethodDropdownRef.current.contains(target)) {
        setIsExpenseMethodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Staff & POS PIN Management State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'CASHIER' | 'MANAGER' | 'SERVER'>('CASHIER');
  const [staffSuccessMsg, setStaffSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setStaffList(getStaffMembers());
  }, []);

  const handleUpdateStaffPin = (id: string, newPin: string) => {
    if (!/^\d{4}$/.test(newPin)) {
      alert('PIN must be exactly 4 numeric digits.');
      return;
    }
    const updated = staffList.map((s) => (s.id === id ? { ...s, pin: newPin } : s));
    setStaffList(updated);
    saveStaffMembers(updated);
    setStaffSuccessMsg('Passcode updated successfully!');
    setTimeout(() => setStaffSuccessMsg(null), 3000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    if (!/^\d{4}$/.test(newStaffPin)) {
      alert('Passcode must be exactly 4 numeric digits.');
      return;
    }
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole,
      pin: newStaffPin,
    };
    const updated = [...staffList, newMember];
    setStaffList(updated);
    saveStaffMembers(updated);
    setNewStaffName('');
    setNewStaffPin('');
    setStaffSuccessMsg(`Staff member "${newMember.name}" added!`);
    setTimeout(() => setStaffSuccessMsg(null), 3000);
  };

  const handleDeleteStaff = (id: string) => {
    if (staffList.length <= 1) {
      alert('At least one staff member must remain to access the POS.');
      return;
    }
    if (confirm('Are you sure you want to remove this staff member?')) {
      const updated = staffList.filter((s) => s.id !== id);
      setStaffList(updated);
      saveStaffMembers(updated);
    }
  };

  // Store Profile & NBR Tax Form State
  const [storeProfileForm, setStoreProfileForm] = useState({
    restaurantName: settings.restaurantName || '',
    tagline: settings.tagline || '',
    address: settings.address || '',
    phone: settings.phone || '',
    binNumber: settings.binNumber || '',
    vatPercent: settings.vatPercent ?? 0,
    serviceChargePercent: settings.serviceChargePercent ?? 0,
    receiptFooterMessage: settings.receiptFooterMessage || '',
  });
  const [isSavingStoreProfile, setIsSavingStoreProfile] = useState(false);
  const [storeProfileSuccess, setStoreProfileSuccess] = useState(false);

  useEffect(() => {
    setStoreProfileForm({
      restaurantName: settings.restaurantName || '',
      tagline: settings.tagline || '',
      address: settings.address || '',
      phone: settings.phone || '',
      binNumber: settings.binNumber || '',
      vatPercent: settings.vatPercent ?? 0,
      serviceChargePercent: settings.serviceChargePercent ?? 0,
      receiptFooterMessage: settings.receiptFooterMessage || '',
    });
  }, [
    settings.restaurantName,
    settings.tagline,
    settings.address,
    settings.phone,
    settings.binNumber,
    settings.vatPercent,
    settings.serviceChargePercent,
    settings.receiptFooterMessage,
  ]);

  const handleSaveStoreProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingStoreProfile(true);
    try {
      updateSettings(storeProfileForm);
      setStoreProfileSuccess(true);
      setTimeout(() => setStoreProfileSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving store profile:', err);
    } finally {
      setIsSavingStoreProfile(false);
    }
  };

  // Loyalty & Points Engine Form State
  const [loyaltyForm, setLoyaltyForm] = useState({
    bronzeRate: settings.loyaltyPointsPer100BDT?.BRONZE ?? 1,
    silverRate: settings.loyaltyPointsPer100BDT?.SILVER ?? 1.5,
    goldRate: settings.loyaltyPointsPer100BDT?.GOLD ?? 2,
    royalRate: settings.loyaltyPointsPer100BDT?.ROYAL ?? 3,
    redemptionRate: settings.loyaltyRedemptionRate ?? 1,
    welcomeBonus: settings.welcomeBonusPoints ?? 50,
    silverThreshold: settings.tierSpendThresholds?.SILVER ?? 10000,
    goldThreshold: settings.tierSpendThresholds?.GOLD ?? 35000,
    royalThreshold: settings.tierSpendThresholds?.ROYAL ?? 80000,
  });
  const [isSavingLoyalty, setIsSavingLoyalty] = useState(false);
  const [loyaltySuccess, setLoyaltySuccess] = useState(false);

  useEffect(() => {
    setLoyaltyForm({
      bronzeRate: settings.loyaltyPointsPer100BDT?.BRONZE ?? 1,
      silverRate: settings.loyaltyPointsPer100BDT?.SILVER ?? 1.5,
      goldRate: settings.loyaltyPointsPer100BDT?.GOLD ?? 2,
      royalRate: settings.loyaltyPointsPer100BDT?.ROYAL ?? 3,
      redemptionRate: settings.loyaltyRedemptionRate ?? 1,
      welcomeBonus: settings.welcomeBonusPoints ?? 50,
      silverThreshold: settings.tierSpendThresholds?.SILVER ?? 10000,
      goldThreshold: settings.tierSpendThresholds?.GOLD ?? 35000,
      royalThreshold: settings.tierSpendThresholds?.ROYAL ?? 80000,
    });
  }, [
    settings.loyaltyPointsPer100BDT,
    settings.loyaltyRedemptionRate,
    settings.welcomeBonusPoints,
    settings.tierSpendThresholds,
  ]);

  const handleSaveLoyaltyRules = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLoyalty(true);
    try {
      updateSettings({
        loyaltyPointsPer100BDT: {
          BRONZE: Number(loyaltyForm.bronzeRate) || 1,
          SILVER: Number(loyaltyForm.silverRate) || 1.5,
          GOLD: Number(loyaltyForm.goldRate) || 2,
          ROYAL: Number(loyaltyForm.royalRate) || 3,
        },
        loyaltyRedemptionRate: Number(loyaltyForm.redemptionRate) || 1,
        welcomeBonusPoints: Number(loyaltyForm.welcomeBonus) || 50,
        tierSpendThresholds: {
          SILVER: Number(loyaltyForm.silverThreshold) || 10000,
          GOLD: Number(loyaltyForm.goldThreshold) || 35000,
          ROYAL: Number(loyaltyForm.royalThreshold) || 80000,
        },
      });
      setLoyaltySuccess(true);
      setTimeout(() => setLoyaltySuccess(false), 4000);
    } catch (err) {
      console.error('Error saving loyalty configurations:', err);
    } finally {
      setIsSavingLoyalty(false);
    }
  };

  // Sales Records Management State (Clear DB & Restore CSV)
  const [isClearSalesModalOpen, setIsClearSalesModalOpen] = useState(false);
  const [isClearingSales, setIsClearingSales] = useState(false);
  const [salesActionNotification, setSalesActionNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [parsedOrdersToRestore, setParsedOrdersToRestore] = useState<Order[]>([]);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoringOrders, setIsRestoringOrders] = useState(false);
  const csvFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleTriggerCsvUpload = () => {
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
      csvFileInputRef.current.click();
    }
  };

  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const { orders: parsed, error } = parseOrdersFromCSV(content);
      if (error || parsed.length === 0) {
        setRestoreError(error || 'No valid orders found in the selected CSV file.');
        setParsedOrdersToRestore([]);
      } else {
        setParsedOrdersToRestore(parsed);
        setRestoreError(null);
      }
      setIsRestoreModalOpen(true);
    };
    reader.onerror = () => {
      setRestoreError('Failed to read the selected file.');
      setParsedOrdersToRestore([]);
      setIsRestoreModalOpen(true);
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (parsedOrdersToRestore.length === 0) return;
    setIsRestoringOrders(true);
    try {
      const res = await restoreOrders(parsedOrdersToRestore);
      setIsRestoreModalOpen(false);
      setParsedOrdersToRestore([]);
      if (res.success) {
        setSalesActionNotification({
          type: 'success',
          message: `Successfully restored ${res.count} sales records to the database and orders archive!`,
        });
      } else {
        setSalesActionNotification({
          type: 'error',
          message: `Restored locally, but cloud DB returned: ${res.error}`,
        });
      }
      setTimeout(() => setSalesActionNotification(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to restore records';
      setSalesActionNotification({ type: 'error', message: msg });
    } finally {
      setIsRestoringOrders(false);
    }
  };

  const handleClearAllSales = async () => {
    setIsClearingSales(true);
    try {
      const res = await clearAllSalesRecords();
      setIsClearSalesModalOpen(false);
      if (res.success) {
        setSalesActionNotification({
          type: 'success',
          message: `Successfully cleared all sales records (${res.count} orders removed from database).`,
        });
      } else {
        setSalesActionNotification({
          type: 'error',
          message: `Cleared local records, but cloud DB warning: ${res.error}`,
        });
      }
      setTimeout(() => setSalesActionNotification(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear sales records';
      setSalesActionNotification({ type: 'error', message: msg });
    } finally {
      setIsClearingSales(false);
    }
  };

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

  const matchesOrderDate = React.useCallback(
    (orderCreatedAt: string | undefined): boolean => {
      if (orderDatePreset === 'ALL') return true;
      if (!orderCreatedAt) return false;
      const ordDate = new Date(orderCreatedAt);
      const ordYear = ordDate.getFullYear();
      const ordMonth = String(ordDate.getMonth() + 1).padStart(2, '0');
      const ordDay = String(ordDate.getDate()).padStart(2, '0');
      const ordDateStr = `${ordYear}-${ordMonth}-${ordDay}`;

      if (orderDatePreset === 'TODAY') {
        return ordDateStr === todayStr;
      }
      if (orderDatePreset === 'YESTERDAY') {
        return ordDateStr === yesterdayStr;
      }
      if (orderDatePreset === 'CUSTOM') {
        return ordDateStr === orderCustomDate;
      }
      if (orderDatePreset === 'LAST_7_DAYS') {
        const ordMidnight = new Date(ordYear, ordDate.getMonth(), ordDate.getDate()).getTime();
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const diffDays = (todayMidnight - ordMidnight) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays < 7;
      }
      if (orderDatePreset === 'THIS_MONTH') {
        const now = new Date();
        return ordDate.getMonth() === now.getMonth() && ordDate.getFullYear() === now.getFullYear();
      }
      return true;
    },
    [orderDatePreset, orderCustomDate, todayStr, yesterdayStr]
  );

  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const query = orderSearch.toLowerCase();
      const matchesSearch =
        !orderSearch.trim() ||
        o.orderNumber.toLowerCase().includes(query) ||
        (o.customerPhone && o.customerPhone.includes(query)) ||
        (o.customerName && o.customerName.toLowerCase().includes(query)) ||
        (o.serverName && o.serverName.toLowerCase().includes(query));
      const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      const matchesDate = matchesOrderDate(o.createdAt);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, orderSearch, orderStatusFilter, matchesOrderDate]);

  const topDishesByCount = React.useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    orders.forEach((ord) => {
      if (ord.status !== 'COMPLETED') return;
      if (!matchesOrderDate(ord.createdAt)) return;
      (ord.items || []).forEach((it) => {
        const name = it.productName || 'Unknown Dish';
        const existing = map.get(name) || { name, count: 0, revenue: 0 };
        existing.count += it.quantity || 1;
        existing.revenue += it.totalPrice || 0;
        map.set(name, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [orders, matchesOrderDate]);

  const totalAdminItemsSold = React.useMemo(() => {
    return topDishesByCount.reduce((sum, d) => sum + d.count, 0);
  }, [topDishesByCount]);

  const datePresetLabel = React.useMemo(() => {
    if (orderDatePreset === 'ALL') return 'All Dates (Cumulative)';
    if (orderDatePreset === 'TODAY') return 'Today';
    if (orderDatePreset === 'YESTERDAY') return 'Yesterday';
    if (orderDatePreset === 'LAST_7_DAYS') return 'Last 7 Days';
    if (orderDatePreset === 'THIS_MONTH') return 'This Month';
    if (orderDatePreset === 'CUSTOM') {
      const [y, m, d] = orderCustomDate.split('-');
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return 'All Dates';
  }, [orderDatePreset, orderCustomDate]);

  // ---------------- EXPENSE REGISTER CALCULATIONS ----------------
  const matchesExpenseDate = React.useCallback(
    (expenseCreatedAt: string | undefined): boolean => {
      if (expenseDatePreset === 'ALL') return true;
      if (!expenseCreatedAt) return false;
      const expDate = new Date(expenseCreatedAt);
      const expYear = expDate.getFullYear();
      const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
      const expDay = String(expDate.getDate()).padStart(2, '0');
      const expDateStr = `${expYear}-${expMonth}-${expDay}`;

      if (expenseDatePreset === 'TODAY') {
        return expDateStr === todayStr;
      }
      if (expenseDatePreset === 'YESTERDAY') {
        return expDateStr === yesterdayStr;
      }
      if (expenseDatePreset === 'CUSTOM') {
        return expDateStr === expenseCustomDate;
      }
      if (expenseDatePreset === 'LAST_7_DAYS') {
        const expMidnight = new Date(expYear, expDate.getMonth(), expDate.getDate()).getTime();
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const diffDays = (todayMidnight - expMidnight) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays < 7;
      }
      if (expenseDatePreset === 'THIS_MONTH') {
        const now = new Date();
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      }
      return true;
    },
    [expenseDatePreset, expenseCustomDate, todayStr, yesterdayStr]
  );

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((e) => {
      const q = expenseSearch.toLowerCase();
      const matchesSearch =
        !expenseSearch.trim() ||
        e.title.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.recordedBy && e.recordedBy.toLowerCase().includes(q));
      const matchesCat = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;
      const matchesMethod = expenseMethodFilter === 'ALL' || e.paymentMethod === expenseMethodFilter;
      const matchesDate = matchesExpenseDate(e.createdAt);
      return matchesSearch && matchesCat && matchesMethod && matchesDate;
    });
  }, [expenses, expenseSearch, expenseCategoryFilter, expenseMethodFilter, matchesExpenseDate]);

  const totalExpenseAmount = React.useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const cashExpenseAmount = React.useMemo(() => {
    return filteredExpenses
      .filter((e) => e.paymentMethod === 'CASH')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const digitalExpenseAmount = React.useMemo(() => {
    return totalExpenseAmount - cashExpenseAmount;
  }, [totalExpenseAmount, cashExpenseAmount]);

  const categoryBreakdown = React.useMemo(() => {
    const map = new Map<string, { categoryId: string; label: string; count: number; total: number; color: string }>();
    EXPENSE_CATEGORIES.forEach((cat) => {
      map.set(cat.id, { categoryId: cat.id, label: cat.label, count: 0, total: 0, color: cat.color });
    });

    filteredExpenses.forEach((exp) => {
      const existing = map.get(exp.category) || {
        categoryId: exp.category,
        label: exp.category,
        count: 0,
        total: 0,
        color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      };
      existing.count += 1;
      existing.total += exp.amount;
      map.set(exp.category, existing);
    });

    return Array.from(map.values())
      .filter((c) => c.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  const expenseDatePresetLabel = React.useMemo(() => {
    if (expenseDatePreset === 'ALL') return 'All Dates (Cumulative)';
    if (expenseDatePreset === 'TODAY') return 'Today';
    if (expenseDatePreset === 'YESTERDAY') return 'Yesterday';
    if (expenseDatePreset === 'LAST_7_DAYS') return 'Last 7 Days';
    if (expenseDatePreset === 'THIS_MONTH') return 'This Month';
    if (expenseDatePreset === 'CUSTOM') {
      const [y, m, d] = expenseCustomDate.split('-');
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return 'All Dates';
  }, [expenseDatePreset, expenseCustomDate]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpenseForm.amount);
    if (!newExpenseForm.title.trim()) {
      alert('Please enter an expense title / description.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive amount in BDT.');
      return;
    }

    let createdAt = new Date().toISOString();
    if (newExpenseForm.customDate) {
      const now = new Date();
      const [y, m, d] = newExpenseForm.customDate.split('-');
      const dt = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds());
      createdAt = dt.toISOString();
    }

    addExpense({
      title: newExpenseForm.title.trim(),
      amount: amountNum,
      category: newExpenseForm.category,
      paymentMethod: newExpenseForm.paymentMethod,
      notes: newExpenseForm.notes.trim() || undefined,
      recordedBy: newExpenseForm.recordedBy.trim() || adminUser?.username || 'Executive Admin',
      createdAt,
    });

    const addedTitle = newExpenseForm.title;
    setNewExpenseForm({
      title: '',
      amount: '',
      category: 'RAW_MATERIALS',
      paymentMethod: 'CASH',
      notes: '',
      recordedBy: '',
      customDate: '',
    });
    setIsAddExpenseModalOpen(false);
    setExpenseNotification({
      type: 'success',
      message: `Recorded expense "${addedTitle}" (${formatBDT(amountNum)}) successfully.`,
    });
    setTimeout(() => setExpenseNotification(null), 4000);
  };

  const handleDeleteExpense = (id: string, title: string, amount: number) => {
    if (confirm(`Are you sure you want to delete expense record "${title}" (${formatBDT(amount)})?`)) {
      deleteExpense(id);
      setExpenseNotification({
        type: 'success',
        message: `Deleted expense "${title}".`,
      });
      setTimeout(() => setExpenseNotification(null), 4000);
    }
  };

  const handleClearAllExpenses = () => {
    clearAllExpenses();
    setIsClearExpensesModalOpen(false);
    setExpenseNotification({
      type: 'success',
      message: 'All expense records have been cleared from the register.',
    });
    setTimeout(() => setExpenseNotification(null), 4000);
  };

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
    setMemberNotification({
      type: 'success',
      message: `Successfully registered VIP member "${newMemberForm.name}".`,
    });
    setTimeout(() => setMemberNotification(null), 4000);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditMemberForm({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || '',
      tier: cust.tier,
      pointsBalance: cust.pointsBalance,
      totalSpent: cust.totalSpent,
      visitCount: cust.visitCount,
      notes: cust.notes || '',
    });
    setIsEditMemberModalOpen(true);
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editMemberForm.name.trim() || !editMemberForm.phone.trim()) {
      alert('Full Name and Phone number are required.');
      return;
    }

    updateCustomer(editingCustomer.id, {
      name: editMemberForm.name.trim(),
      phone: editMemberForm.phone.trim(),
      email: editMemberForm.email.trim() || undefined,
      tier: editMemberForm.tier,
      pointsBalance: Number(editMemberForm.pointsBalance),
      totalSpent: Number(editMemberForm.totalSpent),
      visitCount: Number(editMemberForm.visitCount),
      notes: editMemberForm.notes.trim() || undefined,
    });

    const updatedName = editMemberForm.name;
    setIsEditMemberModalOpen(false);
    setEditingCustomer(null);
    setMemberNotification({
      type: 'success',
      message: `Updated profile for VIP member "${updatedName}".`,
    });
    setTimeout(() => setMemberNotification(null), 4000);
  };

  const handleDeleteCustomer = (cust: Customer) => {
    if (confirm(`Are you sure you want to permanently delete VIP member "${cust.name}" (${cust.phone})?`)) {
      deleteCustomer(cust.id);
      setMemberNotification({
        type: 'success',
        message: `Permanently deleted VIP member "${cust.name}".`,
      });
      setTimeout(() => setMemberNotification(null), 4000);
    }
  };

  interface NavItem {
    id: 'analytics' | 'products' | 'members' | 'orders' | 'expenses' | 'hardware' | 'settings';
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
        { id: 'expenses', label: 'Expense Register', icon: WalletCards, count: expenses.length },
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-xs font-mono text-zinc-400">Verifying Executive Session...</p>
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
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 selection:text-amber-200 antialiased overflow-hidden">

      {/* ----------------- MOBILE SIDEBAR OVERLAY ----------------- */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ----------------- LEFT SIDEBAR NAVIGATION ----------------- */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 h-full lg:h-screen lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Workspace Brand Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 p-0.5 shadow-xs flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[8px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-sans font-bold text-sm text-white tracking-tight">
                  The Royal Palette
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                <span>Khulna Flagship HQ</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links by Group */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-none">
          {navItems.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
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
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition group ${isActive
                          ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-xs'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
                            }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${isActive
                              ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/60'
                              : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'
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
          <div className="pt-2 border-t border-zinc-800 space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              LIVE TERMINALS
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 px-1">
              <Link
                href="/pos"
                target="_blank"
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-300 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition"
              >
                <MonitorCheck className="w-4 h-4 text-emerald-400" />
                <span>Staff POS</span>
              </Link>
              <button
                type="button"
                disabled
                className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-600 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-not-allowed opacity-50 select-none"
                title="Kitchen KDS is currently disabled"
              >
                <div className="flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-zinc-600" />
                  <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-500 font-mono font-bold uppercase">Off</span>
                </div>
                <span>Kitchen KDS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: System Status & User Profile */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Postgres BaaS Cloud</span>
            </span>
            <span className="text-emerald-400 font-bold">Online</span>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
              {adminUser?.username?.[0] || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {adminUser?.username ? `@${adminUser.username}` : 'Manager'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">Executive Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
              title="End Session (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ----------------- MAIN CONTENT CANVAS ----------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">

        {/* Top Header App Bar */}
        <header className="sticky top-0 z-30 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span>Admin HQ</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className="text-amber-300 font-semibold capitalize">
                {activeTab === 'analytics' && 'Executive Analytics'}
                {activeTab === 'products' && 'Menu & Recipe Studio'}
                {activeTab === 'members' && 'VIP Member CRM'}
                {activeTab === 'orders' && 'Orders & Invoices Archive'}
                {activeTab === 'expenses' && 'Expense Register & Petty Cash'}
                {activeTab === 'hardware' && 'Cash Drawer & ESC/POS'}
                {activeTab === 'settings' && 'Store & Tax Settings'}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            <SyncStatusBadge variant="admin" />

            {currentTime && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentTime}</span>
              </div>
            )}

            <button
              onClick={handleTestDrawer}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 text-xs font-bold transition active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Kick Drawer</span>
            </button>

            <button
              onClick={() => setIsZReportOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daily Z-Report</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition"
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
            <AnalyticsInsightsTab
              orders={orders}
              products={products}
              categories={categories}
              customers={customers}
              settings={settings}
              drawerLogsCount={drawerLogs.length}
              onOpenZReport={() => setIsZReportOpen(true)}
            />
          )}

          {/* ================= TAB 2: MENU & RECIPE STUDIO ================= */}
          {activeTab === 'products' && (
            <div className="space-y-5 animate-in fade-in duration-200">

              {/* Header & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search dish by English or বাংলা..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
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
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>

              {/* Products Data Table */}
              <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
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
                  <tbody className="divide-y divide-zinc-800">
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
                          <tr key={prod.id} className="hover:bg-zinc-800/40 transition">
                            <td className="p-3.5 flex items-center gap-3">
                              <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
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

                            <td className="p-3.5 text-zinc-400 font-medium">{cat?.name || 'Grand Entrée'}</td>

                            <td className="p-3.5 font-mono font-bold text-amber-300">{formatBDT(prod.price)}</td>

                            <td className="p-3.5 font-mono text-zinc-400">{formatBDT(prod.costPrice)}</td>

                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${margin >= 50
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
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${prod.isAvailable
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
                                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-amber-300 hover:bg-zinc-700 transition"
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
                                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
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

              {/* Member Action Notification Banner */}
              {memberNotification && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200 ${
                    memberNotification.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {memberNotification.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-medium">{memberNotification.message}</span>
                  </div>
                  <button
                    onClick={() => setMemberNotification(null)}
                    className="p-1 hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search VIP by phone or name..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
                    title="Configure points per spend, redemption value, and tier milestones"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Loyalty Rules Engine</span>
                  </button>

                  <button
                    onClick={() => setIsNewMemberModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Onboard VIP Member</span>
                  </button>
                </div>
              </div>

              {/* Active Points Rules Bar */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">
                    Active Points Engine: <strong className="text-amber-500">Bronze: {settings.loyaltyPointsPer100BDT?.BRONZE ?? 1} pt/৳100</strong> • <strong className="text-zinc-300">Silver: {settings.loyaltyPointsPer100BDT?.SILVER ?? 1.5} pt</strong> • <strong className="text-amber-400">Gold: {settings.loyaltyPointsPer100BDT?.GOLD ?? 2} pt</strong> • <strong className="text-purple-400">Royal: {settings.loyaltyPointsPer100BDT?.ROYAL ?? 3} pt</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-400 font-mono text-[11px] flex-wrap">
                  <span>1 pt = <strong className="text-amber-300">৳{settings.loyaltyRedemptionRate ?? 1}</strong></span>
                  <span className="text-zinc-600">•</span>
                  <span>Welcome: <strong className="text-emerald-400">+{settings.welcomeBonusPoints ?? 50} pts</strong></span>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    Edit Rules →
                  </button>
                </div>
              </div>

              {/* Member Table */}
              <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">VIP Member</th>
                      <th className="p-3.5">Phone Number</th>
                      <th className="p-3.5">Tier Status</th>
                      <th className="p-3.5">Available Points</th>
                      <th className="p-3.5">Lifetime Spend</th>
                      <th className="p-3.5">Visits</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {customers
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.phone.includes(customerSearch)
                      )
                      .map((cust) => {
                        const tierStyle = getTierBadgeClass(cust.tier);
                        return (
                          <tr key={cust.id} className="hover:bg-zinc-800/40 transition">
                            <td className="p-3.5">
                              <p className="font-bold text-white text-xs">{cust.name}</p>
                              {cust.email && <p className="text-[10px] text-zinc-400 truncate max-w-[180px]">{cust.email}</p>}
                              {cust.notes && <p className="text-[10px] text-zinc-500 truncate max-w-[180px] italic">{cust.notes}</p>}
                            </td>

                            <td className="p-3.5 font-mono text-zinc-300">{cust.phone}</td>

                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                              >
                                {cust.tier}
                              </span>
                            </td>

                            <td className="p-3.5 font-mono font-bold text-amber-300">{cust.pointsBalance} pts</td>

                            <td className="p-3.5 font-mono text-zinc-200">{formatBDT(cust.totalSpent)}</td>

                            <td className="p-3.5 font-mono text-zinc-400">{cust.visitCount}</td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setAdjustCustomer(cust);
                                    setPointsAdjustDelta(100);
                                    setPointsAdjustReason('Executive Courtesy Credit');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-[11px] font-bold transition flex items-center gap-1"
                                  title="Credit or debit loyalty points"
                                >
                                  <Coins className="w-3 h-3" />
                                  <span>Points</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEditCustomer(cust)}
                                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                                  title="Edit VIP Member Profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-zinc-300" />
                                </button>

                                <button
                                  onClick={() => handleDeleteCustomer(cust)}
                                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                  title="Delete VIP Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

              {/* Sales Action Notification Banner */}
              {salesActionNotification && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${salesActionNotification.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {salesActionNotification.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{salesActionNotification.message}</span>
                  </div>
                  <button
                    onClick={() => setSalesActionNotification(null)}
                    className="p-1 hover:bg-white/10 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Top Selling Items by Item Count Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm sm:text-base text-white">Top Selling Items</h3>
                    <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {datePresetLabel}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                    {totalAdminItemsSold} items sold ({topDishesByCount.length} dishes)
                  </span>
                </div>

                {topDishesByCount.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No sales records or sold items recorded for {datePresetLabel}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {topDishesByCount.slice(0, 8).map((dish, idx) => (
                      <div
                        key={dish.name}
                        className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate" title={dish.name}>
                              {dish.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono">{formatBDT(dish.revenue)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-amber-400 font-mono block">
                            {dish.count} <span className="text-[10px] font-sans font-bold uppercase text-amber-400/80">items</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search by Order #, phone or guest..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  {/* Custom Dark Style Day & Date Dropdown Panel */}
                  <div className="relative" ref={dateDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDateDropdownOpen((prev) => !prev);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition active:scale-[0.98] ${
                        orderDatePreset !== 'ALL'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/5'
                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{datePresetLabel}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                          isDateDropdownOpen ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    {/* Floating Luxury Dark Dropdown Panel */}
                    {isDateDropdownOpen && (
                      <div className="absolute left-0 top-full mt-2 w-72 z-50 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-2.5 shadow-2xl shadow-black/90 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-zinc-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Filter by Date / Period
                          </span>
                          {orderDatePreset !== 'ALL' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOrderDatePreset('ALL');
                                setIsDateDropdownOpen(false);
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        {/* Presets List */}
                        <div className="space-y-1">
                          {/* All Dates */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrderDatePreset('ALL');
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              orderDatePreset === 'ALL'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-zinc-400" />
                              <span>All Dates (Cumulative)</span>
                            </div>
                            {orderDatePreset === 'ALL' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          {/* Today */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrderDatePreset('TODAY');
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              orderDatePreset === 'TODAY'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Today</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {todayStr}
                              </span>
                              {orderDatePreset === 'TODAY' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                          </button>

                          {/* Yesterday */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrderDatePreset('YESTERDAY');
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              orderDatePreset === 'YESTERDAY'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Yesterday</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {yesterdayStr}
                              </span>
                              {orderDatePreset === 'YESTERDAY' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                          </button>

                          {/* Last 7 Days */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrderDatePreset('LAST_7_DAYS');
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              orderDatePreset === 'LAST_7_DAYS'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Last 7 Days</span>
                            </div>
                            {orderDatePreset === 'LAST_7_DAYS' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          {/* This Month */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrderDatePreset('THIS_MONTH');
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              orderDatePreset === 'THIS_MONTH'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-purple-400" />
                              <span>This Month</span>
                            </div>
                            {orderDatePreset === 'THIS_MONTH' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                        </div>

                        {/* Custom Date Picker Section */}
                        <div className="pt-2.5 mt-2 border-t border-zinc-800/80">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block px-2.5 mb-1.5">
                            Pick Specific Date
                          </label>
                          <div className="relative px-1">
                            <input
                              type="date"
                              value={orderCustomDate}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setOrderCustomDate(e.target.value);
                                  setOrderDatePreset('CUSTOM');
                                  setIsDateDropdownOpen(false);
                                }
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none transition cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Dark Style Order Status Dropdown Panel */}
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusDropdownOpen((prev) => !prev);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition active:scale-[0.98] ${
                        orderStatusFilter !== 'ALL'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/5'
                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          orderStatusFilter === 'COMPLETED'
                            ? 'bg-emerald-400'
                            : orderStatusFilter === 'SERVED'
                            ? 'bg-amber-400'
                            : orderStatusFilter === 'PREPARING'
                            ? 'bg-blue-400'
                            : orderStatusFilter === 'PENDING'
                            ? 'bg-orange-400'
                            : 'bg-zinc-500'
                        }`}
                      />
                      <span>
                        {orderStatusFilter === 'ALL'
                          ? 'All Order States'
                          : orderStatusFilter === 'COMPLETED'
                          ? 'Completed (Settled)'
                          : orderStatusFilter === 'SERVED'
                          ? 'Served (Dining)'
                          : orderStatusFilter}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                          isStatusDropdownOpen ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    {/* Floating Luxury Dark Status Panel */}
                    {isStatusDropdownOpen && (
                      <div className="absolute left-0 top-full mt-2 w-60 z-50 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-2.5 shadow-2xl shadow-black/90 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-zinc-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Order State Filter
                          </span>
                          {orderStatusFilter !== 'ALL' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOrderStatusFilter('ALL');
                                setIsStatusDropdownOpen(false);
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          {[
                            { id: 'ALL', label: 'All Order States', color: 'bg-zinc-400' },
                            { id: 'COMPLETED', label: 'COMPLETED (Settled)', color: 'bg-emerald-400' },
                            { id: 'SERVED', label: 'SERVED (Dining)', color: 'bg-amber-400' },
                            { id: 'PREPARING', label: 'PREPARING', color: 'bg-blue-400' },
                            { id: 'PENDING', label: 'PENDING', color: 'bg-orange-400' },
                          ].map((st) => {
                            const isSelected = orderStatusFilter === st.id;
                            const count =
                              st.id === 'ALL'
                                ? orders.length
                                : orders.filter((o) => o.status === st.id).length;

                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  setOrderStatusFilter(st.id);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                                  isSelected
                                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${st.color}`} />
                                  <span>{st.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                    {count}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-zinc-500 font-mono hidden xl:inline">
                    Showing {filteredOrders.length} of {orders.length}
                  </span>
                </div>

                {/* Orders Toolbar Actions: Export CSV, Upload CSV, Clear DB Records */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="file"
                    ref={csvFileInputRef}
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvFileSelected}
                  />

                  <button
                    onClick={() =>
                      downloadOrdersCSV(
                        filteredOrders,
                        `TRP_Orders_${orderDatePreset}_${orderDatePreset === 'CUSTOM' ? orderCustomDate : todayStr}.csv`
                      )
                    }
                    disabled={filteredOrders.length === 0}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                    title="Export filtered sales records to CSV spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export CSV ({filteredOrders.length})</span>
                  </button>

                  <button
                    onClick={handleTriggerCsvUpload}
                    className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    title="Upload CSV to restore sales records"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore from CSV</span>
                  </button>

                  <button
                    onClick={() => setIsClearSalesModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    title="Clear all sales records from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Sales Records</span>
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
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
                  <tbody className="divide-y divide-zinc-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-zinc-500 text-xs">
                          No orders found matching your search and date filters ({datePresetLabel}).
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-zinc-800/40 transition">
                          <td className="p-3.5 font-mono font-bold text-amber-300">#{ord.orderNumber}</td>

                          <td className="p-3.5 text-zinc-400 text-[11px] font-mono">{formatDateTime(ord.createdAt)}</td>

                          <td className="p-3.5 text-zinc-200">{ord.tableNumber || ord.orderType.replace('_', ' ')}</td>

                          <td className="p-3.5 text-zinc-300">
                            {ord.customerName || 'Palace Guest'}
                            {ord.customerPhone && (
                              <span className="block text-[10px] text-zinc-500 font-mono">{ord.customerPhone}</span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-zinc-400">
                            {ord.items.reduce((s, i) => s + i.quantity, 0)} items
                          </td>

                          <td className="p-3.5 font-mono font-bold text-emerald-400">{formatBDT(ord.totalAmount)}</td>

                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${ord.paymentStatus === 'PAID'
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
                              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 transition ml-auto"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>80mm</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ================= TAB 5: EXPENSE REGISTER & PETTY CASH ================= */}
          {activeTab === 'expenses' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Notification Banner */}
              {expenseNotification && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200 ${
                    expenseNotification.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {expenseNotification.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-medium">{expenseNotification.message}</span>
                  </div>
                  <button
                    onClick={() => setExpenseNotification(null)}
                    className="p-1 hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Header & Quick Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <WalletCards className="w-5 h-5 text-rose-400" />
                    <span>Expense Register &amp; Petty Cash</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Track kitchen procurement, utilities, daily labor &amp; petty cash vouchers (isolated from sales revenue)
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      downloadExpensesCSV(
                        filteredExpenses,
                        `TRP_Expenses_${expenseDatePreset}_${expenseDatePreset === 'CUSTOM' ? expenseCustomDate : todayStr}.csv`
                      )
                    }
                    disabled={filteredExpenses.length === 0}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                    title="Export filtered expense records to CSV spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export CSV ({filteredExpenses.length})</span>
                  </button>

                  <button
                    onClick={() => setIsClearExpensesModalOpen(true)}
                    disabled={expenses.length === 0}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                    title="Clear all expense records from register"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Register</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewExpenseForm({
                        title: '',
                        amount: '',
                        category: 'RAW_MATERIALS',
                        paymentMethod: 'CASH',
                        notes: '',
                        recordedBy: adminUser?.username ? `@${adminUser.username}` : 'Executive Admin',
                        customDate: todayStr,
                      });
                      setIsAddExpenseModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Expense</span>
                  </button>
                </div>
              </div>

              {/* 4 Financial KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Expenses */}
                <div className="bg-gradient-to-br from-rose-500/10 via-zinc-900 to-zinc-900 border border-rose-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <WalletCards className="w-12 h-12 text-rose-400" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Total Outlay</p>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight font-mono">
                    {formatBDT(totalExpenseAmount)}
                  </h2>
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium truncate">
                    {filteredExpenses.length} voucher{filteredExpenses.length === 1 ? '' : 's'} recorded
                  </p>
                </div>

                {/* 2. Cash Outflow (Till / Petty Cash) */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Cash From Till</p>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-300 mt-1.5 tracking-tight font-mono">
                    {formatBDT(cashExpenseAmount)}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 font-medium">Physical cash withdrawals</p>
                </div>

                {/* 3. MFS & Digital Bank Outflow */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Digital / Bank</p>
                  <h3 className="text-xl sm:text-2xl font-black text-cyan-300 mt-1.5 tracking-tight font-mono">
                    {formatBDT(digitalExpenseAmount)}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 font-medium">bKash, Nagad &amp; transfers</p>
                </div>

                {/* 4. Top Category */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Top Spend Category</p>
                  <h3 className="text-base sm:text-lg font-black text-zinc-200 mt-1.5 tracking-tight truncate">
                    {categoryBreakdown[0]?.label || 'None'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 font-medium font-mono">
                    {categoryBreakdown[0] ? formatBDT(categoryBreakdown[0].total) : '৳0.00'}
                  </p>
                </div>
              </div>

              {/* Filters Bar: Search + Custom Floating Dropdowns */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search expense, staff, note..."
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  {/* 1. Date Filter Popover */}
                  <div className="relative" ref={expenseDateDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpenseDateDropdownOpen(!isExpenseDateDropdownOpen);
                        setIsExpenseCategoryDropdownOpen(false);
                        setIsExpenseMethodDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-xs ${
                        expenseDatePreset !== 'ALL'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{expenseDatePresetLabel}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                          isExpenseDateDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpenseDateDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-72 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold border-b border-zinc-800/80 mb-1">
                          Filter by Date Period
                        </div>
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseDatePreset('ALL');
                              setIsExpenseDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              expenseDatePreset === 'ALL'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              <span>All Recorded Dates</span>
                            </div>
                            {expenseDatePreset === 'ALL' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExpenseDatePreset('TODAY');
                              setIsExpenseDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              expenseDatePreset === 'TODAY'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Today</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {todayStr}
                              </span>
                              {expenseDatePreset === 'TODAY' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExpenseDatePreset('YESTERDAY');
                              setIsExpenseDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              expenseDatePreset === 'YESTERDAY'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Yesterday</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {yesterdayStr}
                              </span>
                              {expenseDatePreset === 'YESTERDAY' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExpenseDatePreset('LAST_7_DAYS');
                              setIsExpenseDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              expenseDatePreset === 'LAST_7_DAYS'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Last 7 Days</span>
                            </div>
                            {expenseDatePreset === 'LAST_7_DAYS' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExpenseDatePreset('THIS_MONTH');
                              setIsExpenseDateDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              expenseDatePreset === 'THIS_MONTH'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-purple-400" />
                              <span>This Month</span>
                            </div>
                            {expenseDatePreset === 'THIS_MONTH' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                        </div>

                        {/* Custom Date Picker */}
                        <div className="mt-2 pt-2 border-t border-zinc-800/80">
                          <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1.5 px-1">
                            Or Pick Custom Date
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={expenseCustomDate}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setExpenseCustomDate(e.target.value);
                                  setExpenseDatePreset('CUSTOM');
                                }
                              }}
                              className="flex-1 bg-zinc-950 border border-zinc-800 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-500 transition cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseDatePreset('CUSTOM');
                                setIsExpenseDateDropdownOpen(false);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Category Dropdown Popover */}
                  <div className="relative" ref={expenseCategoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpenseCategoryDropdownOpen(!isExpenseCategoryDropdownOpen);
                        setIsExpenseDateDropdownOpen(false);
                        setIsExpenseMethodDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-xs ${
                        expenseCategoryFilter !== 'ALL'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {expenseCategoryFilter === 'ALL'
                          ? 'All Categories'
                          : EXPENSE_CATEGORIES.find((c) => c.id === expenseCategoryFilter)?.label || expenseCategoryFilter}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                          isExpenseCategoryDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpenseCategoryDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold border-b border-zinc-800/80 mb-1">
                          Filter by Category
                        </div>
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseCategoryFilter('ALL');
                              setIsExpenseCategoryDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                              expenseCategoryFilter === 'ALL'
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <span>All Categories ({expenses.length})</span>
                            {expenseCategoryFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          {EXPENSE_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setExpenseCategoryFilter(cat.id);
                                setIsExpenseCategoryDropdownOpen(false);
                              }}
                              className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                                expenseCategoryFilter === cat.id
                                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                  : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                              }`}
                            >
                              <span>{cat.label}</span>
                              {expenseCategoryFilter === cat.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Payment Method Filter Popover */}
                  <div className="relative" ref={expenseMethodDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpenseMethodDropdownOpen(!isExpenseMethodDropdownOpen);
                        setIsExpenseDateDropdownOpen(false);
                        setIsExpenseCategoryDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-xs ${
                        expenseMethodFilter !== 'ALL'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 text-amber-400" />
                      <span>{expenseMethodFilter === 'ALL' ? 'All Channels' : expenseMethodFilter}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                          isExpenseMethodDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpenseMethodDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold border-b border-zinc-800/80 mb-1">
                          Payment Channel
                        </div>
                        <div className="space-y-0.5">
                          {(['ALL', 'CASH', 'BKASH', 'NAGAD', 'BANK'] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => {
                                setExpenseMethodFilter(method);
                                setIsExpenseMethodDropdownOpen(false);
                              }}
                              className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                                expenseMethodFilter === method
                                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                  : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                              }`}
                            >
                              <span>{method === 'ALL' ? 'All Channels' : method}</span>
                              {expenseMethodFilter === method && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reset Filters Button */}
                  {(expenseSearch || expenseCategoryFilter !== 'ALL' || expenseMethodFilter !== 'ALL' || expenseDatePreset !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseSearch('');
                        setExpenseCategoryFilter('ALL');
                        setExpenseMethodFilter('ALL');
                        setExpenseDatePreset('ALL');
                      }}
                      className="px-2.5 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="text-xs text-zinc-400 font-mono flex items-center justify-end gap-1.5 shrink-0">
                  <span>Showing</span>
                  <span className="font-bold text-white">{filteredExpenses.length}</span>
                  <span>of</span>
                  <span className="font-bold text-zinc-300">{expenses.length}</span>
                  <span>vouchers</span>
                </div>
              </div>

              {/* Category Spend Distribution Bar (if expenses exist) */}
              {categoryBreakdown.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Spend by Category ({expenseDatePresetLabel})</span>
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Total: <strong className="text-rose-400">{formatBDT(totalExpenseAmount)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {categoryBreakdown.map((cat) => {
                      const percent = totalExpenseAmount > 0 ? (cat.total / totalExpenseAmount) * 100 : 0;
                      return (
                        <div
                          key={cat.categoryId}
                          className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-200 truncate">{cat.label}</span>
                            <span className="font-mono font-bold text-rose-400 shrink-0">{formatBDT(cat.total)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span>{cat.count} voucher{cat.count === 1 ? '' : 's'}</span>
                            <span className="font-mono">{percent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-rose-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expenses Table */}
              <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Date &amp; Time</th>
                      <th className="p-3.5">Description / Purpose</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">Logged By</th>
                      <th className="p-3.5">Notes / Ref</th>
                      <th className="p-3.5 text-right">Amount (BDT)</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-zinc-500 text-xs">
                          <WalletCards className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                          <p>No expense records found matching your filters ({expenseDatePresetLabel}).</p>
                          <button
                            type="button"
                            onClick={() => {
                              setNewExpenseForm({
                                title: '',
                                amount: '',
                                category: 'RAW_MATERIALS',
                                paymentMethod: 'CASH',
                                notes: '',
                                recordedBy: adminUser?.username ? `@${adminUser.username}` : 'Executive Admin',
                                customDate: todayStr,
                              });
                              setIsAddExpenseModalOpen(true);
                            }}
                            className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Record First Expense</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp) => {
                        const badge = getExpenseCategoryBadge(exp.category);
                        return (
                          <tr key={exp.id} className="hover:bg-zinc-800/40 transition">
                            <td className="p-3.5 text-zinc-400 text-[11px] font-mono whitespace-nowrap">
                              {formatDateTime(exp.createdAt)}
                            </td>

                            <td className="p-3.5 font-bold text-white">{exp.title}</td>

                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="font-mono text-[11px] text-zinc-300 font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                                {exp.paymentMethod}
                              </span>
                            </td>

                            <td className="p-3.5 text-zinc-300 text-[11px] font-medium">
                              {exp.recordedBy || 'Staff'}
                            </td>

                            <td className="p-3.5 text-zinc-400 text-[11px] max-w-[180px] truncate">
                              {exp.notes || '—'}
                            </td>

                            <td className="p-3.5 text-right font-mono font-black text-rose-400 text-sm whitespace-nowrap">
                              {formatBDT(exp.amount)}
                            </td>

                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id, exp.title, exp.amount)}
                                className="p-1.5 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-lg transition"
                                title="Delete expense record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {filteredExpenses.length > 0 && (
                    <tfoot className="bg-zinc-950 border-t border-zinc-800 text-xs">
                      <tr>
                        <td colSpan={6} className="p-3.5 text-right font-bold text-zinc-400 uppercase tracking-wider font-mono">
                          Total Expense Outlay ({expenseDatePresetLabel}):
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-rose-400 text-base">
                          {formatBDT(totalExpenseAmount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          )}
          {activeTab === 'hardware' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">

              <div className="lg:col-span-7 bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Digital Cash Drawer & ESC/POS Hardware Bridge</h3>
                    <p className="text-xs text-zinc-400">Control the 24V solenoid pulse and WebUSB / WebSerial triggers</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Auto-Print Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div>
                      <h4 className="font-bold text-white text-xs">Auto-Print 80mm Receipt on Checkout</h4>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Automatically opens receipt print dialog when &apos;Process Transaction&apos; is clicked in POS.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoPrintReceipt !== false}
                      onChange={(e) => updateSettings({ autoPrintReceipt: e.target.checked })}
                      className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
                    />
                  </div>

                  {/* Auto-Kick Solenoid Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div>
                      <h4 className="font-bold text-white text-xs">Auto-Kick Solenoid on Cash Settlement</h4>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Automatically pops open the cash drawer when completing a cash transaction.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoKickDrawerOnCash}
                      onChange={(e) => updateSettings({ autoKickDrawerOnCash: e.target.checked })}
                      className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
                    />
                  </div>

                  {/* Rongta RP335 + RT410B2 Hardware Architecture Note */}
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-zinc-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-400 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Rongta RP335 (USB) + RT410B2 (RJ11) Setup Guide</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300">
                      The Rongta RT410B2 cash drawer connects directly into the <strong>DK (Drawer Kick) RJ11/RJ12 port</strong> at the back of your Rongta RP335 thermal printer.
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400 font-medium">
                      <li>In Windows: Go to <strong>Settings → Printers &amp; Scanners → Rongta RP335 → Printer Properties</strong>.</li>
                      <li>Open the <strong>Device Settings</strong> tab.</li>
                      <li>Set <strong>Cash Drawer #1</strong> to <span className="text-amber-300 font-semibold">&ldquo;Open Before Printing&rdquo;</span> or <span className="text-amber-300 font-semibold">&ldquo;Open After Printing&rdquo;</span>.</li>
                      <li>For instant silent printing without print preview dialogs, launch Chrome with <code className="bg-zinc-800 text-amber-300 px-1 py-0.5 rounded text-[10px]">--kiosk-printing</code> flag.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-zinc-300 font-bold block mb-1 font-mono">
                      ESC/POS Drawer Kick Command (Hex Byte String)
                    </label>
                    <input
                      type="text"
                      value={settings.drawerKickCodeHex}
                      onChange={(e) => updateSettings({ drawerKickCodeHex: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 font-mono text-amber-300 font-bold focus:outline-none focus:border-zinc-700"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                      Standard Pin 2: <code>1B 70 00 19 FA</code> | Pin 5: <code>1B 70 01 19 FA</code>
                    </p>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <button
                      onClick={handleTestDrawer}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Test Drawer Pulse</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition active:scale-95"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>Test Print Dialog</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hardware Kick Audit Trail */}
              <div className="lg:col-span-5 bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Hardware Pulse Audit Log</span>
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">{drawerLogs.length} events</span>
                </div>

                <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto pr-1">
                  {drawerLogs.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-6 text-center">No pulses recorded yet.</p>
                  ) : (
                    drawerLogs.map((log) => (
                      <div key={log.id} className="py-2.5 space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-amber-300">{log.reason}</span>
                          {log.amount !== undefined && (
                            <span className="font-mono text-emerald-400">{formatBDT(log.amount)}</span>
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
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
            <div className="w-full space-y-6 animate-in fade-in duration-200">

              {/* 1. Store Profile & NBR Tax Configurations Card */}
              <div className="w-full bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Store Profile &amp; NBR Tax Configurations</h3>
                    <p className="text-xs text-zinc-400">Manage business information, receipt headers, and VAT rates</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Row 1: Profile Info - 4 columns on large screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1">Restaurant Name</label>
                      <input
                        type="text"
                        value={storeProfileForm.restaurantName}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, restaurantName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1">Tagline</label>
                      <input
                        type="text"
                        value={storeProfileForm.tagline}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, tagline: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1">Store Address</label>
                      <input
                        type="text"
                        value={storeProfileForm.address}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, address: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={storeProfileForm.phone}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, phone: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Row 2: Tax & Service Charge - 3 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1 font-mono">NBR BIN Number</label>
                      <input
                        type="text"
                        value={storeProfileForm.binNumber}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, binNumber: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1 font-mono">NBR VAT (%)</label>
                      <input
                        type="number"
                        value={storeProfileForm.vatPercent}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, vatPercent: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1 font-mono">Service Charge (%)</label>
                      <input
                        type="number"
                        value={storeProfileForm.serviceChargePercent}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, serviceChargePercent: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Row 3: Receipt Footer Message */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">Receipt Footer Salutation / Greeting</label>
                    <input
                      type="text"
                      value={storeProfileForm.receiptFooterMessage}
                      onChange={(e) => setStoreProfileForm({ ...storeProfileForm, receiptFooterMessage: e.target.value })}
                      placeholder="e.g. Thank you for dining with us! Visit again."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-700"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Printed at the bottom of customer 80mm thermal bills and invoices.
                    </p>
                  </div>

                  {/* Save Button for Store Profile & NBR Tax Configurations */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    {storeProfileSuccess ? (
                      <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        ✓ Store Profile &amp; NBR Tax configurations saved!
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">
                        Changes will update receipt headers, VAT rates, and invoices across the entire system.
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveStoreProfile}
                      disabled={isSavingStoreProfile}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-500/10 disabled:opacity-50"
                    >
                      {isSavingStoreProfile ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Configurations</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. VIP Loyalty & Reward Points Rules Engine Card */}
              <div id="loyalty-engine-settings" className="w-full bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>VIP Loyalty &amp; Reward Points Rules Engine</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Active Engine
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Configure earn ratios per ৳100 spend, redemption conversion rates, and tier upgrade milestones
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Live Calculation Simulator */}
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-zinc-300">
                      Live Simulator: On a <strong className="text-white font-mono">৳2,000</strong> bill, guests earn:
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs w-full lg:w-auto">
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-600 font-bold flex items-center justify-between gap-2">
                      <span>Bronze:</span>
                      <strong className="text-white">{Math.round((2000 / 100) * (Number(loyaltyForm.bronzeRate) || 1))} pts</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold flex items-center justify-between gap-2">
                      <span>Silver:</span>
                      <strong className="text-white">{Math.round((2000 / 100) * (Number(loyaltyForm.silverRate) || 1.5))} pts</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 font-bold flex items-center justify-between gap-2">
                      <span>Gold:</span>
                      <strong className="text-white">{Math.round((2000 / 100) * (Number(loyaltyForm.goldRate) || 2))} pts</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400 font-bold flex items-center justify-between gap-2">
                      <span>Royal:</span>
                      <strong className="text-white">{Math.round((2000 / 100) * (Number(loyaltyForm.royalRate) || 3))} pts</strong>
                    </div>
                  </div>
                </div>

                {/* 1. Earn Rates Grid */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                    Earn Ratios: Points awarded per ৳100 bill spend
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-amber-600 uppercase">Bronze Tier</span>
                        <span className="text-[10px] font-mono text-zinc-500">{(Number(loyaltyForm.bronzeRate) || 1).toFixed(1)}% value</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={loyaltyForm.bronzeRate}
                          onChange={(e) => setLoyaltyForm({ ...loyaltyForm, bronzeRate: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs text-zinc-400 shrink-0 font-mono">pt/৳100</span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase">Silver Tier</span>
                        <span className="text-[10px] font-mono text-zinc-500">{(Number(loyaltyForm.silverRate) || 1.5).toFixed(1)}% value</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={loyaltyForm.silverRate}
                          onChange={(e) => setLoyaltyForm({ ...loyaltyForm, silverRate: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs text-zinc-400 shrink-0 font-mono">pt/৳100</span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-amber-400 uppercase">Gold Tier</span>
                        <span className="text-[10px] font-mono text-zinc-500">{(Number(loyaltyForm.goldRate) || 2).toFixed(1)}% value</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={loyaltyForm.goldRate}
                          onChange={(e) => setLoyaltyForm({ ...loyaltyForm, goldRate: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs text-zinc-400 shrink-0 font-mono">pt/৳100</span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-purple-400 uppercase">Royal Tier</span>
                        <span className="text-[10px] font-mono text-zinc-500">{(Number(loyaltyForm.royalRate) || 3).toFixed(1)}% value</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={loyaltyForm.royalRate}
                          onChange={(e) => setLoyaltyForm({ ...loyaltyForm, royalRate: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs text-zinc-400 shrink-0 font-mono">pt/৳100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Redemption Value & Welcome Bonus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-bold">
                        Point Redemption Rate
                      </label>
                      <span className="text-xs font-mono text-amber-400">100 pts = ৳{100 * (Number(loyaltyForm.redemptionRate) || 1)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-zinc-400 shrink-0">1 Point =</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={loyaltyForm.redemptionRate}
                        onChange={(e) => setLoyaltyForm({ ...loyaltyForm, redemptionRate: Number(e.target.value) })}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-mono text-zinc-300 shrink-0">৳ BDT Discount</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Applied directly on checkout invoice when guest redeems points.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-bold">
                        New VIP Welcome Bonus
                      </label>
                      <span className="text-xs font-mono text-emerald-400">Instant Gift</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={loyaltyForm.welcomeBonus}
                        onChange={(e) => setLoyaltyForm({ ...loyaltyForm, welcomeBonus: Number(e.target.value) })}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-mono text-zinc-300 shrink-0">
                        Bonus Points (৳{Number(loyaltyForm.welcomeBonus) * (Number(loyaltyForm.redemptionRate) || 1)})
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Awarded to guest profile immediately upon initial phone registration.
                    </p>
                  </div>
                </div>

                {/* 3. Tier Spend Thresholds */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                    Tier Upgrade Thresholds: Lifetime spend (৳) required to unlock tier
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase">Silver Threshold</span>
                        <span className="text-[10px] font-mono text-zinc-500">Auto-promotion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-mono">৳</span>
                        <input
                          type="number"
                          step="500"
                          min="1000"
                          value={loyaltyForm.silverThreshold}
                          onChange={(e) => setLoyaltyForm({ ...loyaltyForm, silverThreshold: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-amber-400 uppercase">Gold Threshold</span>
                        <span className="text-[10px] font-mono text-zinc-500">Auto-promotion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-mono">৳</span>
                        <input
                          type="number"
                          step="1000"
                          min="2000"
                          value={loyaltyForm.goldThreshold}
                          onChange={(e) => setLoyaltyForm({ ...loyaltyForm, goldThreshold: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-purple-400 uppercase">Royal Ambassador</span>
                        <span className="text-[10px] font-mono text-zinc-500">Highest Tier</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-mono">৳</span>
                        <input
                          type="number"
                          step="1000"
                          min="5000"
                          value={loyaltyForm.royalThreshold}
                          onChange={(e) => setLoyaltyForm({ ...loyaltyForm, royalThreshold: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  {loyaltySuccess ? (
                    <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      ✓ Loyalty points rules saved and synced with POS!
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      Changes apply instantly to future order settlements and points calculations.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveLoyaltyRules}
                    disabled={isSavingLoyalty}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-500/10 disabled:opacity-50"
                  >
                    {isSavingLoyalty ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Loyalty Rules</span>
                  </button>
                </div>
              </div>

              {/* 3. Staff & Cashier PIN Management Card */}
              <div className="w-full bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">POS Cashier &amp; Staff Passcodes (Offline PIN Security)</h4>
                      <p className="text-xs text-zinc-400">Manage 4-digit PINs used to lock and unlock the POS terminal.</p>
                    </div>
                  </div>
                  {staffSuccessMsg && (
                    <span className="text-xs font-bold text-emerald-400 font-mono animate-fade-in flex items-center gap-1">
                      ✓ {staffSuccessMsg}
                    </span>
                  )}
                </div>

                {/* Existing Staff List in a responsive multi-column Grid */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                    Registered Staff &amp; Cashiers ({staffList.length})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {staffList.map((staff) => (
                      <div key={staff.id} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-zinc-800">
                            {staff.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{staff.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono uppercase">{staff.role}</span>
                          </div>
                        </div>

                        {/* PIN Editor */}
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[10px] font-mono text-zinc-400">PIN:</label>
                          <input
                            type="text"
                            maxLength={4}
                            defaultValue={staff.pin}
                            onBlur={(e) => {
                              if (e.target.value !== staff.pin) {
                                handleUpdateStaffPin(staff.id, e.target.value);
                              }
                            }}
                            className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff.id)}
                            title="Remove staff member"
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Staff Member Form */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                    Add New Staff Passcode
                  </label>
                  <form onSubmit={handleAddStaff} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-wrap sm:flex-nowrap items-center gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Staff name (e.g. Rashedul)"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="flex-1 min-w-[160px] bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-zinc-700 text-xs"
                    />
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as StaffMember['role'])}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-zinc-700 text-xs"
                    >
                      <option value="CASHIER">CASHIER</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="SERVER">SERVER</option>
                    </select>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="4-digit PIN"
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                      className="w-28 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-zinc-700 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition shrink-0"
                    >
                      + Add Staff Member
                    </button>
                  </form>
                </div>
              </div>

              {/* 4. Sales Records & Database Archive Management Card */}
              <div className="w-full bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Sales Records &amp; Database Archive Management</h4>
                      <p className="text-xs text-zinc-400">
                        Clear sales records from cloud database, restore from CSV spreadsheet, or backup transaction history.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-white block text-sm">Sales Records &amp; Transaction History</span>
                    <span className="text-xs text-zinc-400 block mt-0.5 font-mono">
                      Currently <strong className="text-amber-400">{orders.length}</strong> orders recorded in database &amp; archive.
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => downloadOrdersCSV(orders)}
                      disabled={orders.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-2 disabled:opacity-40"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerCsvUpload}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Restore CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsClearSalesModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Sales</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-white text-xs font-bold block">Database Seeding &amp; Factory Reset</span>
                    <span className="text-zinc-400 text-[11px] block">Revert dishes, categories, members, and tables back to factory demo state.</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset entire system database to initial seeded demo dishes, members, and tables?')) {
                        resetToDefaultSeed();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 text-xs font-bold transition flex items-center gap-2 shrink-0"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 my-8 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-sm text-white">
                {editingProduct ? 'Edit Mastercrafted Dish' : 'Add New Royal Dish'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Dish Name (English) *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1 font-bangla">Dish Name (বাংলা)</label>
                <input
                  type="text"
                  placeholder="e.g. শাহী মোরগ পোলাও"
                  value={productForm.banglaName}
                  onChange={(e) => setProductForm({ ...productForm, banglaName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bangla focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Culinary Category *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-700"
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
                  <label className="text-zinc-300 font-bold block mb-1 font-mono">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-bold block mb-1 font-mono">Food Cost (৳)</label>
                  <input
                    type="number"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Food Image URL</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1.5">Dietary & Chef Badges</label>
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
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${isSelected
                            ? 'bg-amber-500 text-zinc-950 border-amber-400'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold transition active:scale-95"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-white text-sm">Adjust Member Points</h3>
              <button onClick={() => setAdjustCustomer(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-zinc-300">
                VIP: <strong className="text-white">{adjustCustomer.name}</strong> ({adjustCustomer.phone})
              </p>
              <p className="text-zinc-400">
                Balance: <strong className="text-amber-300 font-mono">{adjustCustomer.pointsBalance} pts</strong>
              </p>

              <div>
                <label className="text-zinc-300 font-bold block mb-1 font-mono">Points Delta (+/-)</label>
                <input
                  type="number"
                  value={pointsAdjustDelta}
                  onChange={(e) => setPointsAdjustDelta(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={pointsAdjustReason}
                  onChange={(e) => setPointsAdjustReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setAdjustCustomer(null)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateCustomerPoints(adjustCustomer.id, pointsAdjustDelta, 0);
                    setAdjustCustomer(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-white text-sm">Onboard VIP Member</h3>
              <button onClick={() => setIsNewMemberModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navid Chowdhury"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1 font-mono">Mobile Phone (BD) *</label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="optional@domain.com"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">VIP Dietary / Table Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers window table"
                  value={newMemberForm.notes}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold transition"
                >
                  Register VIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit VIP Member Modal */}
      {isEditMemberModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-zinc-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Edit VIP Member Profile</h3>
                  <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[200px]">ID: {editingCustomer.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditMemberModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editMemberForm.name}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1 font-mono">Mobile Phone (BD) *</label>
                  <input
                    type="tel"
                    required
                    value={editMemberForm.phone}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Loyalty Tier</label>
                  <select
                    value={editMemberForm.tier}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, tier: e.target.value as LoyaltyTier })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition cursor-pointer font-bold"
                  >
                    <option value="BRONZE">BRONZE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="ROYAL">ROYAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="optional@domain.com"
                  value={editMemberForm.email}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1 font-mono">Points</label>
                  <input
                    type="number"
                    min="0"
                    value={editMemberForm.pointsBalance}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, pointsBalance: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1 font-mono">Lifetime Spend</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editMemberForm.totalSpent}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, totalSpent: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1 font-mono">Visits</label>
                  <input
                    type="number"
                    min="0"
                    value={editMemberForm.visitCount}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, visitCount: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">VIP Dietary / Table Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers window table, regular guest, allergies..."
                  value={editMemberForm.notes}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMemberModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
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
          autoPrint={false}
          onClose={() => setSelectedReceiptOrder(null)}
          onKickDrawer={handleTestDrawer}
        />
      )}

      {/* Clear All Sales Records Confirmation Modal */}
      {isClearSalesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 my-8 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Clear All Sales Records from DB</h3>
                <p className="text-xs text-zinc-400">Irreversible database cleanup</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete all <strong className="text-white font-mono">{orders.length} sales orders</strong> and transaction items from the database? This will permanently wipe sales history and order archives.
            </p>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <p className="font-bold text-zinc-300">💡 Recommended before clearing:</p>
              <p>Download a complete CSV backup so you can restore your records at any time.</p>
              <button
                type="button"
                onClick={() => downloadOrdersCSV(orders)}
                className="mt-1 text-amber-400 hover:text-amber-300 font-bold underline inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Download Sales CSV Backup
              </button>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isClearingSales}
                onClick={() => setIsClearSalesModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingSales}
                onClick={handleClearAllSales}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isClearingSales ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Clear All Sales</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Orders from CSV Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4 my-8 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Restore Sales Records from CSV</h3>
                  <p className="text-xs text-zinc-400">Review parsed orders before syncing to database</p>
                </div>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {restoreError ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">CSV Parsing Error</span>
                  <span>{restoreError}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                {/* Stats summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase block">Total Orders</span>
                    <span className="text-base font-bold text-amber-400">{parsedOrdersToRestore.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase block">Combined Revenue</span>
                    <span className="text-base font-bold text-emerald-400">
                      {formatBDT(parsedOrdersToRestore.reduce((s, o) => s + (o.totalAmount || 0), 0))}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-zinc-400 uppercase block">Total Dishes</span>
                    <span className="text-base font-bold text-zinc-200">
                      {parsedOrdersToRestore.reduce((s, o) => s + (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0), 0)} items
                    </span>
                  </div>
                </div>

                {/* Preview sample list */}
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="bg-zinc-950 px-3 py-2 text-[10px] text-zinc-400 font-mono uppercase border-b border-zinc-800 flex justify-between">
                    <span>Preview of Records to Restore</span>
                    <span>Showing top {Math.min(5, parsedOrdersToRestore.length)} of {parsedOrdersToRestore.length}</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/60 bg-zinc-900/60 font-mono text-[11px]">
                    {parsedOrdersToRestore.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-amber-300 block truncate">#{ord.orderNumber}</span>
                          <span className="text-[10px] text-zinc-400 block truncate font-sans">
                            {ord.customerName || 'Guest'} • {ord.items?.length || 0} dishes
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-400 block">{formatBDT(ord.totalAmount)}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">{ord.paymentMethod || 'CASH'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Clicking <strong>&apos;Restore to Database&apos;</strong> will insert these sales records into your database and orders archive. Any existing orders with matching numbers will be updated.
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isRestoringOrders}
                onClick={() => setIsRestoreModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>
              {!restoreError && (
                <button
                  type="button"
                  disabled={isRestoringOrders || parsedOrdersToRestore.length === 0}
                  onClick={handleConfirmRestore}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRestoringOrders ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Restore to Database ({parsedOrdersToRestore.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD EXPENSE ================= */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <WalletCards className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Record Operational Expense</h3>
                  <p className="text-xs text-zinc-400">Log petty cash, kitchen procurement, labor or utilities</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              {/* Description / Purpose */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh herbs & veggies, gas cylinder refill, staff snacks..."
                  value={newExpenseForm.title}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Amount (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={newExpenseForm.amount}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Category *
                  </label>
                  <select
                    value={newExpenseForm.category}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Paid Via (Channel)
                  </label>
                  <select
                    value={newExpenseForm.paymentMethod}
                    onChange={(e) =>
                      setNewExpenseForm({
                        ...newExpenseForm,
                        paymentMethod: e.target.value as 'CASH' | 'BKASH' | 'NAGAD' | 'BANK',
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
                  >
                    <option value="CASH">Cash (From Till / Register)</option>
                    <option value="BKASH">bKash Merchant / Personal</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="BANK">Bank Transfer / Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Date of Expense
                  </label>
                  <input
                    type="date"
                    value={newExpenseForm.customDate || todayStr}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, customDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500 transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Logged By & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Recorded By (Staff / Admin)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manager / @admin"
                    value={newExpenseForm.recordedBy}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, recordedBy: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Voucher / Reference Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Optional memo, voucher #, vendor name..."
                    value={newExpenseForm.notes}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, notes: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold transition shadow-md shadow-rose-500/20 active:scale-95"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLEAR ALL EXPENSES ================= */}
      {isClearExpensesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Clear All Expense Records?</h3>
                <p className="text-xs text-zinc-400">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will permanently delete all <strong>{expenses.length}</strong> expense records from the register. This action will not affect sales orders or product inventory.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearExpensesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllExpenses}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-md shadow-rose-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear Register</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
