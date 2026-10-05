'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Receipt,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Search,
  KeyRound,
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
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';
import { Customer, DietaryTag, Order, Product } from '@/types';
import { formatBDT, formatDateTime, getTierBadgeClass } from '@/lib/formatters';
import { ThermalReceiptModal } from '@/components/pos/ThermalReceiptModal';

export default function AdminPage() {
  const {
    products,
    categories,
    orders,
    customers,
    tables,
    settings,
    drawerLogs,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    updateCustomerPoints,
    updateSettings,
    kickDrawer,
    resetToDefaultSeed,
  } = useRestaurantStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'members' | 'orders' | 'hardware'>('analytics');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    banglaName: '',
    description: '',
    categoryId: categories[0]?.id || '',
    price: 500,
    costPrice: 250,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    dietaryTags: ['HALAL'] as DietaryTag[],
    preparationTimeMinutes: 15,
  });

  // Customer Points Adjust Modal
  const [adjustCustomer, setAdjustCustomer] = useState<Customer | null>(null);
  const [pointsAdjustDelta, setPointsAdjustDelta] = useState<number>(100);

  // Receipt Modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Search Queries
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Analytics Calculations
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalVAT = completedOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalPointsRedeemedValue = completedOrders.reduce((sum, o) => sum + o.pointsDiscountValue, 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Best Selling Dishes
  const dishSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      if (!dishSalesMap[item.productId]) {
        dishSalesMap[item.productId] = { name: item.productName, count: 0, revenue: 0 };
      }
      dishSalesMap[item.productId].count += item.quantity;
      dishSalesMap[item.productId].revenue += item.totalPrice;
    });
  });
  const topDishes = Object.values(dishSalesMap).sort((a, b) => b.count - a.count).slice(0, 5);

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
    await kickDrawer('Admin Hardware Test Kick', 'ADMIN-TEST', 0);
  };

  return (
    <div className="flex-1 bg-[#f8f8f8] text-slate-900 min-h-screen pb-16">
      {/* Admin Top Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto scrollbar-none py-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'analytics', label: 'Analytics Dashboard', icon: LayoutDashboard },
              { id: 'products', label: 'Menu & Products', icon: UtensilsCrossed },
              { id: 'members', label: 'Member CRM', icon: Users },
              { id: 'orders', label: 'Orders & Receipts', icon: Receipt },
              { id: 'hardware', label: 'Cash Drawer & Settings', icon: KeyRound },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap border ${
                    isActive
                      ? 'bg-[#000f50] text-white border-[#000f50] shadow-sm'
                      : 'bg-[#f8f8f8] text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#000f50]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#000f50]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleTestDrawer}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#000f50]/10 hover:bg-[#000f50]/20 text-[#000f50] border border-[#000f50]/20 text-xs font-bold transition shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Test Drawer Kick</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* TAB 1: ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-[#000f50]" />
                </div>
                <h3 className="text-2xl font-black text-[#000f50] font-mono">
                  {formatBDT(totalRevenue)}
                </h3>
                <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3 text-emerald-600" /> Live BDT Settlements
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Completed Banquets</span>
                  <ShoppingBag className="w-4 h-4 text-[#000f50]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-mono">
                  {completedOrders.length}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {orders.length - completedOrders.length} active in-service orders
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Average Order Value (AOV)</span>
                  <Sparkles className="w-4 h-4 text-[#000f50]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-mono">
                  {formatBDT(averageOrderValue)}
                </h3>
                <p className="text-[11px] text-slate-500">Per dining table banquet</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Loyalty Redeemed</span>
                  <Coins className="w-4 h-4 text-indigo-700" />
                </div>
                <h3 className="text-2xl font-black text-indigo-900 font-mono">
                  {formatBDT(totalPointsRedeemedValue)}
                </h3>
                <p className="text-[11px] text-indigo-700 font-medium">Direct member discount value</p>
              </div>
            </div>

            {/* Top Selling Dishes & Payment Method Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Dishes (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-[#000f50]" />
                  <span>Top Mastercrafted Dishes</span>
                </h3>
                <div className="divide-y divide-slate-100">
                  {topDishes.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">No completed orders yet.</p>
                  ) : (
                    topDishes.map((dish, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[#000f50]/10 text-[#000f50] flex items-center justify-center font-bold text-[11px]">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900">{dish.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500">{dish.count} ordered • </span>
                          <span className="font-mono font-bold text-[#000f50]">
                            {formatBDT(dish.revenue)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Table Floor Occupancy & System Health (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-[#000f50]" />
                  <span>Floor Occupancy & Tax Collected</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="bg-[#f8f8f8] p-3.5 rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Total Restaurant Tables:</span>
                    <span className="font-bold text-slate-900">{tables.length} Tables</span>
                  </div>
                  <div className="bg-[#f8f8f8] p-3.5 rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Active Seated Tables:</span>
                    <span className="font-bold text-[#000f50]">
                      {tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'BILLING').length}
                    </span>
                  </div>
                  <div className="bg-[#f8f8f8] p-3.5 rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-slate-600">NBR VAT Collected ({settings.vatPercent}%):</span>
                    <span className="font-bold font-mono text-emerald-700">
                      {formatBDT(totalVAT)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU & PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#000f50]"
                />
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f8f8] border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Dish</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price (৳)</th>
                    <th className="p-3.5">Cost (৳)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) =>
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.banglaName?.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((prod) => {
                      const cat = categories.find((c) => c.id === prod.categoryId);
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <Image
                                src={prod.imageUrl}
                                alt={prod.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{prod.name}</p>
                              {prod.banglaName && (
                                <p className="text-[10px] text-[#000f50]/70 font-bangla">{prod.banglaName}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-600">{cat?.name || 'General'}</td>
                          <td className="p-3.5 font-mono font-bold text-[#000f50]">
                            {formatBDT(prod.price)}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">
                            {formatBDT(prod.costPrice)}
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => toggleProductAvailability(prod.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                prod.isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {prod.isAvailable ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-[#000f50] hover:bg-slate-200 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${prod.name}?`)) deleteProduct(prod.id);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition"
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

        {/* TAB 3: MEMBER CRM */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search member by phone or name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#000f50]"
              />
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f8f8] border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Member Name</th>
                    <th className="p-3.5">Mobile Phone</th>
                    <th className="p-3.5">VIP Tier</th>
                    <th className="p-3.5">Points Balance</th>
                    <th className="p-3.5">Total Spent</th>
                    <th className="p-3.5">Visits</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers
                    .filter((c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch)
                    )
                    .map((cust) => {
                      const tierStyle = getTierBadgeClass(cust.tier);
                      return (
                        <tr key={cust.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-bold text-slate-900">{cust.name}</td>
                          <td className="p-3.5 font-mono text-slate-700">{cust.phone}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                            >
                              {cust.tier}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-[#000f50]">
                            {cust.pointsBalance} pts
                          </td>
                          <td className="p-3.5 font-mono text-slate-800">
                            {formatBDT(cust.totalSpent)}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">{cust.visitCount} visits</td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setAdjustCustomer(cust);
                                setPointsAdjustDelta(100);
                              }}
                              className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 text-[11px] font-bold transition"
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

        {/* TAB 4: ORDERS & PAST RECEIPTS ARCHIVE */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order # or Phone..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#000f50]"
              />
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f8f8] border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Order No</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Type / Table</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5">Total (৳)</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders
                    .filter((o) =>
                      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      (o.customerPhone && o.customerPhone.includes(orderSearch))
                    )
                    .map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-[#000f50]">
                          #{ord.orderNumber}
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {formatDateTime(ord.createdAt)}
                        </td>
                        <td className="p-3.5 text-slate-800">
                          {ord.tableNumber || ord.orderType.replace('_', ' ')}
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {ord.customerName ? `${ord.customerName}` : 'Guest'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {ord.items.reduce((s, i) => s + i.quantity, 0)} items
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">
                          {formatBDT(ord.totalAmount)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f8f8f8] border border-slate-200 text-slate-800">
                            {ord.paymentMethod || 'UNPAID'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="px-3 py-1 rounded-lg bg-[#000f50]/10 text-[#000f50] border border-[#000f50]/20 hover:bg-[#000f50]/20 text-[11px] font-bold flex items-center gap-1 ml-auto"
                          >
                            <Printer className="w-3 h-3" />
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

        {/* TAB 5: HARDWARE & CASH DRAWER SETTINGS */}
        {activeTab === 'hardware' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
            {/* Left Hardware & Tax Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#000f50]/10 text-[#000f50] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Digital Cash Drawer & ESC/POS Setup
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control the 24V solenoid trigger pulse and Web Serial / WebUSB printer bridge.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Auto Kick Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#f8f8f8] rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900">Auto-Kick Drawer on Cash Settlement</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Automatically energizes the cash drawer solenoid when a cash bill is completed.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoKickDrawerOnCash}
                    onChange={(e) => updateSettings({ autoKickDrawerOnCash: e.target.checked })}
                    className="w-5 h-5 accent-[#000f50] cursor-pointer"
                  />
                </div>

                {/* ESC/POS Hex Code */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    ESC/POS Drawer Kick Command (Hex Byte String)
                  </label>
                  <input
                    type="text"
                    value={settings.drawerKickCodeHex}
                    onChange={(e) => updateSettings({ drawerKickCodeHex: e.target.value })}
                    className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-[#000f50] font-bold focus:outline-none focus:border-[#000f50] focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Standard Pin 2: <code>1B 70 00 19 FA</code> | Pin 5: <code>1B 70 01 19 FA</code>
                  </p>
                </div>

                {/* Tax & Service Charge */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">NBR VAT Percentage (%)</label>
                    <input
                      type="number"
                      value={settings.vatPercent}
                      onChange={(e) => updateSettings({ vatPercent: Number(e.target.value) })}
                      className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-900 focus:outline-none focus:border-[#000f50]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Service Charge (%)</label>
                    <input
                      type="number"
                      value={settings.serviceChargePercent}
                      onChange={(e) => updateSettings({ serviceChargePercent: Number(e.target.value) })}
                      className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-900 focus:outline-none focus:border-[#000f50]"
                    />
                  </div>
                </div>

                {/* Test Action */}
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleTestDrawer}
                    className="flex-1 py-3 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Fire Test Solenoid (24V Pulse)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Reset entire system to initial demo dishes, tables, and members?')) {
                        resetToDefaultSeed();
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-[#f8f8f8] border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Drawer Kick Audit Log (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cash Drawer Kick Audit Trail</span>
              </h3>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {drawerLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No drawer pulses recorded yet.</p>
                ) : (
                  drawerLogs.map((log) => (
                    <div key={log.id} className="py-2.5 space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#000f50]">{log.reason}</span>
                        {log.amount !== undefined && (
                          <span className="font-mono text-emerald-700">{formatBDT(log.amount)}</span>
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{formatDateTime(log.timestamp)}</span>
                        {log.orderNumber && <span>Order #{log.orderNumber}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Mastercrafted Dish' : 'Add New Royal Dish'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Dish Name (English) *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Dish Name (Bangla)</label>
                <input
                  type="text"
                  placeholder="e.g. শাহী মোরগ পোলাও"
                  value={productForm.banglaName}
                  onChange={(e) => setProductForm({ ...productForm, banglaName: e.target.value })}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Category *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
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
                  <label className="text-slate-700 font-bold block mb-1">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#000f50]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Cost Price (৳)</label>
                  <input
                    type="number"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#000f50]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Food Image URL</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#000f50]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs shadow-md mt-2"
              >
                {editingProduct ? 'Update Dish Details' : 'Publish Dish to Menu & POS'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Customer Points Modal */}
      {adjustCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Adjust Member Points</h3>
              <button onClick={() => setAdjustCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-2">
              <p className="text-slate-700">
                Member: <strong>{adjustCustomer.name}</strong> ({adjustCustomer.phone})
              </p>
              <p className="text-slate-500">
                Current Points: <strong className="text-[#000f50]">{adjustCustomer.pointsBalance}</strong>
              </p>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Points Adjustment (+/-):
                </label>
                <input
                  type="number"
                  value={pointsAdjustDelta}
                  onChange={(e) => setPointsAdjustDelta(Number(e.target.value))}
                  className="w-full bg-[#f8f8f8] border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono"
                />
              </div>
              <button
                onClick={() => {
                  updateCustomerPoints(adjustCustomer.id, pointsAdjustDelta, 0);
                  setAdjustCustomer(null);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs mt-2 shadow-sm"
              >
                Apply Points Adjustment
              </button>
            </div>
          </div>
        </div>
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
