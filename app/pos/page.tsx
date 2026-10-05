'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Plus,
  Minus,
  Receipt,
  KeyRound,
  Crown,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  CheckCircle2,
  X,
  ShoppingCart,
  ChevronDown,
  Trash2,
  Maximize2,
  Minimize2,
  LogOut,
  Percent,
  Sun,
  Moon,
} from 'lucide-react';
import { useRestaurantStore } from '@/lib/store';
import { Order, OrderItem, PaymentMethod, Product, Table } from '@/types';
import { formatBDT } from '@/lib/formatters';
import { ThermalReceiptModal } from '@/components/pos/ThermalReceiptModal';

export default function POSPage() {
  const {
    products,
    categories,
    tables,
    customers,
    addCustomer,
    createOrder,
    settleOrder,
    kickDrawer,
    settings,
  } = useRestaurantStore();

  // Dark Mode Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('pos-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextVal = !prev;
      localStorage.setItem('pos-theme', nextVal ? 'dark' : 'light');
      return nextVal;
    });
  };

  // Filter & Search State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Customer Order State
  const [orderType, setOrderType] = useState<Order['orderType']>('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountVal, setCustomDiscountVal] = useState<string>('');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [customPointsVal, setCustomPointsVal] = useState<string>('');

  // Settlement & Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [completedOrderForReceipt, setCompletedOrderForReceipt] = useState<Order | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  };

  // Auto-detect Customer by input (Phone or Name) - triggers only after 11 characters typed
  const identifiedCustomer = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const cleanedPhone = q.replace(/[\s-]/g, '');
    if (cleanedPhone.length < 11 && q.length < 11) return null;
    return (
      customers.find(
        (c) =>
          c.phone.replace(/[\s-]/g, '').includes(cleanedPhone) ||
          c.name.toLowerCase().includes(q)
      ) || null
    );
  }, [customerSearch, customers]);

  const availableCustomerPoints = identifiedCustomer?.pointsBalance || 0;

  // Search & Global Hotkey State
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const cashInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' &&
          (e.target as HTMLElement)?.tagName !== 'INPUT' &&
          (e.target as HTMLElement)?.tagName !== 'TEXTAREA') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Products (Multi-attribute indexing)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'all' && p.categoryId !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const catName = categories.find((c) => c.id === p.categoryId)?.name.toLowerCase() || '';
        const dietary = (p.dietaryTags || []).join(' ').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.banglaName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.price.toString().includes(q) ||
          catName.includes(q) ||
          dietary.includes(q)
        );
      }
      return true;
    });
  }, [products, categories, activeCategory, searchQuery]);

  // Quick Enter to add top search result
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts.length > 0 && filteredProducts[0].isAvailable) {
        handleAddToCart(filteredProducts[0]);
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (!product.isAvailable) return;
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].totalPrice =
          updated[existingIdx].quantity * updated[existingIdx].unitPrice;
        return updated;
      }
      return [
        ...prev,
        {
          id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          totalPrice: product.price,
        },
      ];
    });
  };

  // Update Cart Quantity
  const handleUpdateQty = (index: number, delta: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].quantity = newQty;
      copy[index].totalPrice = newQty * copy[index].unitPrice;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    if (cartItems.length > 0 && confirm('Are you sure you want to clear all selected items?')) {
      setCartItems([]);
      setPointsToRedeem(0);
      setCustomPointsVal('');
      setDiscountPercent(0);
      setCashTendered(0);
    }
  };

  // Financial Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxAmount = 0;
  const isDineIn = orderType === 'DINE_IN';
  const serviceChargeAmount = 0;
  const maxRedeemablePoints = Math.min(
    availableCustomerPoints,
    Math.floor(subtotal / (settings.loyaltyRedemptionRate || 1))
  );
  const pointsDiscountValue = pointsToRedeem * settings.loyaltyRedemptionRate;

  const totalPayable = Math.max(
    0,
    subtotal - discountAmount - pointsDiscountValue
  );

  const changeDue = Math.max(0, cashTendered - totalPayable);

  // Quick cash helpers
  const handleSetExactCash = () => setCashTendered(Math.ceil(totalPayable));

  // Process Transaction & Settle
  const handleProcessTransaction = () => {
    if (cartItems.length === 0) {
      alert('Please select at least one product.');
      return;
    }

    try {
      // Auto-resolve or register customer if 11-digit phone number typed in customerSearch
      let activeCustomerId = identifiedCustomer?.id;
      let activeCustomerName = identifiedCustomer?.name;
      let activeCustomerPhone = identifiedCustomer?.phone;

      const cleanedPhone = customerSearch.trim().replace(/[\s-]/g, '');
      if (!activeCustomerId && cleanedPhone.length >= 11) {
        const existing = customers.find((c) => c.phone.replace(/[\s-]/g, '') === cleanedPhone);
        if (existing) {
          activeCustomerId = existing.id;
          activeCustomerName = existing.name;
          activeCustomerPhone = existing.phone;
        } else {
          const newCustomer = addCustomer({
            name: `Guest ${cleanedPhone.slice(-4)}`,
            phone: customerSearch.trim(),
          });
          activeCustomerId = newCustomer.id;
          activeCustomerName = newCustomer.name;
          activeCustomerPhone = newCustomer.phone;
        }
      }

      // 1. Create and settle order record directly
      const targetOrder = createOrder({
        orderType,
        tableId: isDineIn ? selectedTableId : undefined,
        customerId: activeCustomerId,
        customerName: activeCustomerName || (customerSearch.trim() || undefined),
        customerPhone: activeCustomerPhone || (cleanedPhone.length >= 11 ? customerSearch.trim() : undefined),
        items: cartItems,
        discountAmount,
        pointsToRedeem,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod,
        notes: customerSearch ? `Customer: ${customerSearch}` : undefined,
      });

      // 3. Prepare receipt modal
      const receiptOrder: Order = {
        ...targetOrder,
        items: cartItems,
        subtotal,
        discountAmount,
        taxAmount,
        serviceChargeAmount,
        totalAmount: totalPayable,
        pointsRedeemed: pointsToRedeem,
        pointsDiscountValue,
        paymentStatus: 'PAID',
        paymentMethod,
        customerName: activeCustomerName || customerSearch || undefined,
        customerPhone: activeCustomerPhone || undefined,
        tableNumber: isDineIn ? tables.find((t) => t.id === selectedTableId)?.tableNumber : undefined,
      };

      setCompletedOrderForReceipt(receiptOrder);

      // Reset cart for next order
      setCartItems([]);
      setCustomerSearch('');
      setPointsToRedeem(0);
      setCustomPointsVal('');
      setDiscountPercent(0);
      setCustomDiscountVal('');
      setCashTendered(0);
    } catch (err) {
      console.error('Error processing transaction:', err);
      alert('Transaction completed with local receipt preview.');
    }
  };

  const handleManualKickDrawer = async () => {
    await kickDrawer('Cashier Key Latch Open', undefined, undefined);
  };

  return (
    <div
      className={`min-h-screen lg:h-screen lg:max-h-screen flex flex-col p-3 sm:p-4 font-sans overflow-x-hidden lg:overflow-hidden select-none transition-colors duration-200 ${isDarkMode ? 'bg-black text-neutral-100' : 'bg-[#f8f8f8] text-slate-800'
        }`}
    >
      {/* ================= MAIN POS 2-COLUMN WORKSPACE (8 cols Left / 4 cols Right) ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch lg:h-full lg:max-h-full overflow-hidden">
        {/* ================= LEFT MAIN CONTAINER: PRODUCT CATALOG (8 cols = ~66.7%) ================= */}
        <div
          className={`lg:col-span-8 rounded-xl border p-3.5 sm:p-4 shadow-xs flex flex-col h-full max-h-full overflow-hidden transition-colors duration-200 ${isDarkMode ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-slate-200/80'
            }`}
        >
          {/* Header Row: Brand/Title & Search (Enlarged 20%) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5">
            <div className="flex items-center gap-3 shrink-0">

              <div>
                <h2
                  className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                >
                  Product
                </h2>
                <p className="text-[11px] text-neutral-400 font-medium">The Royal Palette Catalog</p>
              </div>
            </div>

            {/* Active Search Box & Quick Controls (20% Bigger) */}
            <div className="flex items-center gap-2.5 flex-1 justify-end">
              <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg transition-all">
                <Search
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition ${searchQuery
                      ? isDarkMode
                        ? 'text-white'
                        : 'text-[#000f50]'
                      : isDarkMode
                        ? 'text-neutral-500'
                        : 'text-slate-400'
                    }`}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search dish, bengali, price, tag... (Press '/' or ↵ to add)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className={`w-full border rounded-lg pl-10.5 pr-24 py-2.5 text-xs sm:text-sm font-medium placeholder-neutral-400 focus:outline-none transition-all shadow-2xs ${isDarkMode
                      ? 'bg-[#141414] border-[#2e2e2e] text-white focus:border-white focus:ring-2 focus:ring-white/10 focus:bg-[#191919]'
                      : 'bg-[#f8f8f8] border-slate-300 text-slate-900 focus:border-[#000f50] focus:ring-2 focus:ring-[#000f50]/15 focus:bg-white'
                    }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  {searchQuery ? (
                    <>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${isDarkMode
                            ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            : 'bg-slate-200 text-slate-700'
                          }`}
                      >
                        {filteredProducts.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="pointer-events-auto p-1 text-neutral-400 hover:text-white rounded transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <kbd
                      className={`text-xs font-mono px-2 py-0.5 rounded border shadow-2xs ${isDarkMode
                          ? 'bg-[#1e1e1e] border-[#333333] text-neutral-400'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                    >
                      /
                    </kbd>
                  )}
                </div>
              </div>

              {/* Theme Mode Toggle Button (20% Larger) */}
              <button
                onClick={toggleTheme}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center transition shrink-0 ${isDarkMode
                    ? 'border-[#333333] text-amber-300 bg-[#171717] hover:bg-[#262626]'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* Discreet Drawer & Fullscreen buttons (20% Larger) */}
              <button
                onClick={handleManualKickDrawer}
                title="Send 24V Kick Pulse to Cash Drawer"
                className={`w-10 h-10 rounded-lg border flex items-center justify-center transition shrink-0 ${isDarkMode
                    ? 'border-[#333333] text-white bg-[#171717] hover:bg-[#262626]'
                    : 'border-slate-200 text-[#000f50] hover:bg-slate-50'
                  }`}
              >
                <KeyRound className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center transition shrink-0 ${isDarkMode
                    ? 'border-[#333333] text-neutral-300 hover:text-white bg-[#171717] hover:bg-[#262626]'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
              </button>

              <Link
                href="/"
                title="Exit POS"
                className={`w-10 h-10 rounded-lg border flex items-center justify-center transition shrink-0 ${isDarkMode
                    ? 'border-[#333333] text-neutral-300 hover:text-rose-400 bg-[#171717] hover:bg-[#262626]'
                    : 'border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                  }`}
              >
                <LogOut className="w-4.5 h-4.5" />
              </Link>
            </div>
          </div>

          {/* Category Horizontal Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-1.5 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${activeCategory === 'all'
                  ? isDarkMode
                    ? 'bg-white text-black border-white font-bold shadow-xs'
                    : 'bg-transparent text-slate-900 border-slate-900 font-bold shadow-xs'
                  : isDarkMode
                    ? 'bg-[#141414] text-neutral-300 border-[#262626] hover:bg-[#1f1f1f] hover:text-white'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
            >
              Show all
            </button>

            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${isSelected
                      ? isDarkMode
                        ? 'bg-white text-black border-white font-bold shadow-xs'
                        : 'bg-transparent text-slate-900 border-slate-900 font-bold shadow-xs'
                      : isDarkMode
                        ? 'bg-[#141414] text-neutral-300 border-[#262626] hover:bg-[#1f1f1f] hover:text-white'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Product Grid (3-4 columns with square image cards) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-500 space-y-2.5">
                <Search className="w-10 h-10 text-neutral-500 stroke-1" />
                <p className="text-sm font-medium">
                  No dishes match &ldquo;{searchQuery || activeCategory}&rdquo;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${isDarkMode
                      ? 'bg-[#1c1c1c] border-[#333333] text-white hover:bg-[#282828]'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-3.5">
                {filteredProducts.map((product) => {
                  const inCartItem = cartItems.find((item) => item.productId === product.id);
                  const isAvailable = product.isAvailable;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className={`rounded-xl border transition-all duration-200 p-3 flex flex-col justify-between group shadow-2xs hover:shadow-md cursor-pointer active:scale-[0.98] select-none ${isDarkMode
                          ? 'bg-[#111111] hover:bg-[#171717] border-[#222222] hover:border-[#444444]'
                          : 'bg-[#fbfbfb] hover:bg-white border-slate-200/80 hover:border-[#000f50]/40'
                        } ${!isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div>
                        {/* Square Food Image Container */}
                        <div
                          className={`relative aspect-square w-full rounded-lg overflow-hidden mb-2 shadow-2xs border ${isDarkMode
                              ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                              : 'bg-slate-100 border-slate-200/40'
                            }`}
                        >
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />

                          {/* Status Badge Over Image */}
                          <div className="absolute top-2 left-2 z-10">
                            {isAvailable ? (
                              product.dietaryTags?.includes('POPULAR') ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-600 text-white shadow-xs">
                                  Popular
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                                  Available
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                                Sold out
                              </span>
                            )}
                          </div>

                          {/* In-cart Quantity Badge Over Image */}
                          {inCartItem && (
                            <span
                              className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-md ${isDarkMode ? 'bg-white text-black' : 'bg-[#000f50] text-white'
                                }`}
                            >
                              {inCartItem.quantity} in cart
                            </span>
                          )}
                        </div>

                        {/* Product Title */}
                        <h4
                          className={`font-bold text-xs sm:text-sm line-clamp-1 transition ${isDarkMode
                              ? 'text-white group-hover:text-neutral-200'
                              : 'text-slate-900 group-hover:text-[#000f50]'
                            }`}
                        >
                          {product.name}
                        </h4>
                        {product.banglaName && (
                          <p className="text-[10px] text-neutral-400 font-bangla truncate mt-0.5">
                            {product.banglaName}
                          </p>
                        )}
                      </div>

                      {/* Price & Action Button */}
                      <div
                        className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 ${isDarkMode ? 'border-[#1f1f1f]' : 'border-slate-100'
                          }`}
                      >
                        <div>
                          <span className="text-[9px] text-neutral-400 block leading-tight uppercase font-mono">
                            Price
                          </span>
                          <span
                            className={`font-bold font-mono text-xs sm:text-sm ${isDarkMode ? 'text-white font-black' : 'text-[#000f50]'
                              }`}
                          >
                            {formatBDT(product.price)}
                          </span>
                        </div>

                        <div
                          className={`px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition shadow-2xs ${isDarkMode
                              ? 'bg-[#1c1c1c] border-[#333333] text-neutral-200 group-hover:bg-white group-hover:border-white group-hover:text-black'
                              : 'bg-white border-slate-200 text-slate-700 group-hover:bg-[#000f50] group-hover:text-white'
                            }`}
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Add</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT MAIN CONTAINER: ORDER DETAIL (4 cols = ~33.3%) ================= */}
        <div
          className={`lg:col-span-4 rounded-xl border p-3 sm:p-3.5 shadow-xs flex flex-col h-full max-h-full overflow-hidden transition-colors duration-200 ${isDarkMode ? 'bg-[#0a0a0a] border-[#1f1f1f] text-neutral-100' : 'bg-white border-slate-200/80 text-slate-800'
            }`}
        >
          {/* 1. FIXED TOP: Order Detail Header & Customer Information */}
          <div
            className={`shrink-0 space-y-2 pb-2.5 border-b ${isDarkMode ? 'border-[#1f1f1f]' : 'border-slate-100'
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3
                className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
              >
                Order Detail
              </h3>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${isDarkMode
                    ? 'bg-white/10 text-neutral-200 border border-[#333333]'
                    : 'bg-[#000f50]/10 text-[#000f50]'
                  }`}
              >
                Live Ticket
              </span>
            </div>

            {/* Customer Information Block */}
            <div className="space-y-1.5">
              {/* Customer Name / Phone Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Guest phone (11 digits e.g. 01711...)"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setPointsToRedeem(0);
                    setCustomPointsVal('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      cashInputRef.current?.focus();
                      cashInputRef.current?.select();
                    }
                  }}
                  className={`w-full border rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium placeholder-neutral-400 focus:outline-none transition ${isDarkMode
                      ? 'bg-[#141414] border-[#262626] text-white focus:border-neutral-400 focus:bg-[#181818]'
                      : 'bg-[#f8f8f8] border-slate-200/80 text-slate-900 focus:border-[#000f50] focus:bg-white'
                    }`}
                />
                {customerSearch && (
                  <button
                    onClick={() => {
                      setCustomerSearch('');
                      setPointsToRedeem(0);
                      setCustomPointsVal('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Two Dropdown Selectors: Order Type & Select Table */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as Order['orderType'])}
                    className={`w-full appearance-none border rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none pr-7 cursor-pointer ${isDarkMode
                        ? 'bg-[#141414] border-[#262626] text-white focus:border-neutral-400'
                        : 'bg-[#f8f8f8] border-slate-200/80 text-slate-800 focus:border-[#000f50]'
                      }`}
                  >
                    <option value="DINE_IN">Dine in</option>
                    <option value="TAKEAWAY">Takeaway</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  {orderType === 'DINE_IN' ? (
                    <>
                      <select
                        value={selectedTableId}
                        onChange={(e) => setSelectedTableId(e.target.value)}
                        className={`w-full appearance-none border rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none pr-7 cursor-pointer ${isDarkMode
                            ? 'bg-[#141414] border-[#262626] text-white focus:border-neutral-400'
                            : 'bg-[#f8f8f8] border-slate-200/80 text-slate-800 focus:border-[#000f50]'
                          }`}
                      >
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.tableNumber} ({t.section.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </>
                  ) : (
                    <div
                      className={`border rounded-lg px-2.5 py-1.5 text-xs font-bold ${isDarkMode
                          ? 'bg-[#141414] border-[#262626] text-neutral-400'
                          : 'bg-[#f8f8f8] border-slate-200/80 text-slate-500'
                        }`}
                    >
                      Counter Quick
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Items Summary Header */}
            <div className="flex items-center justify-between pt-0.5">
              <span
                className={`text-xs font-bold ${isDarkMode ? 'text-neutral-200' : 'text-slate-900'}`}
              >
                {cartItems.reduce((s, i) => s + i.quantity, 0)} items selected
              </span>
              {cartItems.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline transition"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* 2. ONLY SCROLLABLE AREA: Selected Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-2 space-y-2">
            {cartItems.length === 0 ? (
              <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-neutral-500 text-xs text-center py-4">
                <ShoppingCart className="w-7 h-7 text-neutral-600 mx-auto mb-1 stroke-1" />
                <span>No items added yet. Click dishes on the left.</span>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const productObj = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={item.id || idx}
                    className={`rounded-lg border p-2 flex items-center justify-between gap-2 shadow-2xs ${isDarkMode
                        ? 'bg-[#121212] border-[#222222]'
                        : 'bg-[#fbfbfb] border-slate-200/80'
                      }`}
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`relative w-9 h-9 rounded-md overflow-hidden shrink-0 border ${isDarkMode
                            ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                            : 'bg-slate-100 border-slate-200/60'
                          }`}
                      >
                        {productObj?.imageUrl ? (
                          <Image
                            src={productObj.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">
                            🍲
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5
                          className={`font-bold text-xs truncate leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}
                        >
                          {item.productName}
                        </h5>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          {formatBDT(item.unitPrice)} each
                        </p>
                      </div>
                    </div>

                    {/* Right: Stepper & Price */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stepper */}
                      <div
                        className={`flex items-center border rounded-md p-0.5 shadow-2xs ${isDarkMode
                            ? 'bg-[#0a0a0a] border-[#262626]'
                            : 'bg-white border-slate-200'
                          }`}
                      >
                        <button
                          onClick={() => handleUpdateQty(idx, -1)}
                          className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold ${isDarkMode
                              ? 'text-neutral-300 hover:bg-[#1f1f1f]'
                              : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className={`w-5 text-center text-xs font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(idx, 1)}
                          className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold shadow-2xs ${isDarkMode
                              ? 'bg-white text-black hover:bg-neutral-200'
                              : 'bg-[#000f50] text-white'
                            }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Line Price */}
                      <div className="text-right min-w-[55px]">
                        <span
                          className={`font-bold font-mono text-xs block ${isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}
                        >
                          {formatBDT(item.totalPrice)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className={`text-[10px] transition font-medium ${isDarkMode
                              ? 'text-neutral-500 hover:text-rose-400'
                              : 'text-slate-400 hover:text-rose-600'
                            }`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. FIXED BOTTOM: Discounts, Loyalty, Totals, Payment & Process Button */}
          <div
            className={`shrink-0 pt-2 border-t space-y-2 ${isDarkMode ? 'border-[#1f1f1f]' : 'border-slate-100'
              }`}
          >
            {/* Discount & VIP Loyalty Section */}
            <div className="space-y-1.5">
              {/* Direct Preset Discount Chips */}
              <div
                className={`p-2 rounded-lg border space-y-1 ${isDarkMode
                    ? 'bg-[#121212] border-[#222222]'
                    : 'bg-[#f8f8f8] border-slate-200/80'
                  }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-neutral-200' : 'text-slate-800'
                      }`}
                  >
                    <Percent
                      className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white' : 'text-[#000f50]'}`}
                    />
                    <span>Discount</span>
                  </span>
                  {discountAmount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-400 font-mono">
                      -{formatBDT(discountAmount)} ({discountPercent}%)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-1 items-center">
                  {[
                    { id: 'none', label: 'None', value: 0 },
                    { id: '5', label: '5%', value: 5 },
                    { id: '10', label: '10%', value: 10 },
                    { id: '15', label: '15%', value: 15 },
                  ].map((item) => {
                    const isSelected =
                      discountPercent === item.value && customDiscountVal === '';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setDiscountPercent(item.value);
                          setCustomDiscountVal('');
                        }}
                        className={`py-1 rounded text-xs font-bold transition border ${isSelected
                            ? isDarkMode
                              ? 'bg-white text-black border-white shadow-xs'
                              : 'bg-[#000f50] text-white border-[#000f50] shadow-xs'
                            : isDarkMode
                              ? 'bg-[#1a1a1a] text-neutral-300 border-[#2b2b2b] hover:bg-[#242424]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}

                  {/* 5th column: Empty input field for custom percentage */}
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Custom %"
                      value={customDiscountVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomDiscountVal(val);
                        if (val === '') {
                          setDiscountPercent(0);
                        } else {
                          const num = Math.min(100, Math.max(0, Number(val)));
                          setDiscountPercent(num);
                        }
                      }}
                      className={`w-full border rounded text-center py-1 text-xs font-bold focus:outline-none transition ${customDiscountVal !== ''
                          ? isDarkMode
                            ? 'bg-white text-black border-white shadow-xs font-black'
                            : 'bg-[#000f50] text-white border-[#000f50] shadow-xs font-black placeholder:text-blue-200'
                          : isDarkMode
                            ? 'bg-[#141414] border-[#2b2b2b] text-white placeholder-neutral-500 focus:border-white'
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#000f50]'
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* VIP Loyalty Points Redemption Section */}
              {identifiedCustomer ? (
                <div
                  className={`border rounded-lg p-2 space-y-1.5 text-xs ${isDarkMode
                      ? 'bg-[#121212] border-[#282828] text-neutral-200'
                      : 'bg-indigo-50/80 border-indigo-200/90 text-indigo-950'
                    }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>{identifiedCustomer.name}</span>
                      <span
                        className={`text-[10px] font-mono font-normal ${isDarkMode ? 'text-neutral-400' : 'text-indigo-700'
                          }`}
                      >
                        ({identifiedCustomer.tier} • {identifiedCustomer.pointsBalance} pts)
                      </span>
                    </div>

                    {pointsToRedeem > 0 && (
                      <span
                        className={`text-[11px] font-bold font-mono ${isDarkMode ? 'text-amber-400' : 'text-indigo-800'
                          }`}
                      >
                        -{formatBDT(pointsDiscountValue)}
                      </span>
                    )}
                  </div>

                  {availableCustomerPoints > 0 ? (
                    <div className="grid grid-cols-7 gap-1 items-center">
                      {[
                        { id: '0', label: '0', getValue: () => 0 },
                        { id: '100', label: '100', getValue: () => Math.min(100, maxRedeemablePoints) },
                        { id: '200', label: '200', getValue: () => Math.min(200, maxRedeemablePoints) },
                        { id: '500', label: '500', getValue: () => Math.min(500, maxRedeemablePoints) },
                        { id: '50%', label: '50%', getValue: () => Math.floor(maxRedeemablePoints * 0.5) },
                        { id: '100%', label: '100%', getValue: () => maxRedeemablePoints },
                      ].map((item) => {
                        const targetVal = item.getValue();
                        const isSelected =
                          customPointsVal === '' &&
                          ((item.id === '0' && pointsToRedeem === 0) ||
                            (item.id === '100' && pointsToRedeem === 100 && targetVal === 100) ||
                            (item.id === '200' && pointsToRedeem === 200 && targetVal === 200) ||
                            (item.id === '500' && pointsToRedeem === 500 && targetVal === 500) ||
                            (item.id === '50%' && pointsToRedeem === targetVal && targetVal > 0 && targetVal !== maxRedeemablePoints) ||
                            (item.id === '100%' && pointsToRedeem === targetVal && targetVal > 0));

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setPointsToRedeem(targetVal);
                              setCustomPointsVal('');
                            }}
                            className={`py-1 rounded text-xs font-bold transition border text-center ${isSelected
                                ? isDarkMode
                                  ? 'bg-white text-black border-white shadow-xs'
                                  : 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                                : isDarkMode
                                  ? 'bg-[#1c1c1c] text-neutral-300 border-[#2d2d2d] hover:bg-[#282828]'
                                  : 'bg-white text-indigo-950 border-indigo-200 hover:bg-indigo-100'
                              }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}

                      {/* 7th Column: Custom points input */}
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={maxRedeemablePoints}
                          placeholder="Custom"
                          value={customPointsVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomPointsVal(val);
                            if (val === '') {
                              setPointsToRedeem(0);
                            } else {
                              const num = Math.min(maxRedeemablePoints, Math.max(0, Number(val)));
                              setPointsToRedeem(num);
                            }
                          }}
                          className={`w-full border rounded text-center py-1 text-xs font-bold focus:outline-none transition ${customPointsVal !== ''
                              ? isDarkMode
                                ? 'bg-white text-black border-white shadow-xs font-black'
                                : 'bg-indigo-700 text-white border-indigo-700 shadow-xs font-black placeholder:text-indigo-200'
                              : isDarkMode
                                ? 'bg-[#141414] border-[#2d2d2d] text-white placeholder-neutral-500 focus:border-white'
                                : 'bg-white border-indigo-200 text-indigo-950 placeholder-indigo-300 focus:border-indigo-600'
                            }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-400">0 reward points available.</p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Financial Calculations Breakdown */}
            <div
              className={`space-y-1 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-slate-600'
                }`}
            >
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span
                  className={`font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                >
                  {formatBDT(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-mono">- {formatBDT(discountAmount)}</span>
                </div>
              )}
              {pointsDiscountValue > 0 && (
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>Loyalty Points ({pointsToRedeem} pts)</span>
                  <span className="font-mono">- {formatBDT(pointsDiscountValue)}</span>
                </div>
              )}
              <div
                className={`flex justify-between text-base sm:text-lg font-black pt-1.5 border-t ${isDarkMode
                    ? 'text-white border-[#262626]'
                    : 'text-slate-900 border-slate-200/80'
                  }`}
              >
                <span className="font-bold">Total</span>
                <span
                  className={`font-mono text-lg sm:text-xl ${isDarkMode ? 'text-white font-black' : 'text-[#000f50]'
                    }`}
                >
                  {formatBDT(totalPayable)}
                </span>
              </div>
            </div>

            {/* Quick Payment Method Selector Chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'CASH', label: 'Cash' },
                { id: 'CARD', label: 'Card' },
                { id: 'BKASH', label: 'bKash' },
                { id: 'NAGAD', label: 'Nagad' },
              ].map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${isSelected
                        ? isDarkMode
                          ? 'bg-white text-black border-white shadow-xs'
                          : 'bg-[#000f50] text-white border-[#000f50] shadow-xs'
                        : isDarkMode
                          ? 'bg-[#141414] border-[#262626] text-neutral-300 hover:bg-[#1f1f1f]'
                          : 'bg-[#f8f8f8] border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {pm.label}
                  </button>
                );
              })}
            </div>

            {/* Redesigned Cash Tendered & Change Return Section */}
            {paymentMethod === 'CASH' && (
              <div
                className={`p-2 rounded-xl border space-y-1.5 transition-all ${isDarkMode
                    ? 'bg-[#121212] border-[#262626]'
                    : 'bg-[#f8f8f8] border-slate-200'
                  }`}
              >
                {/* Top Row: Cash Received Input & Live Change Badge */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 font-mono">
                      ৳
                    </span>
                    <input
                      ref={cashInputRef}
                      type="number"
                      placeholder={`Cash received (min ৳${totalPayable})`}
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (cartItems.length > 0) {
                            if (!cashTendered || cashTendered < totalPayable) {
                              setCashTendered(totalPayable);
                            }
                            handleProcessTransaction();
                          }
                        }
                      }}
                      className={`w-full border rounded-lg pl-6 pr-7 py-1.5 text-xs font-mono font-bold placeholder:text-neutral-400 focus:outline-none transition ${isDarkMode
                          ? 'bg-[#0a0a0a] border-[#2e2e2e] text-white focus:border-white'
                          : 'bg-white border-slate-200 text-slate-900 focus:border-[#000f50]'
                        }`}
                    />
                    {cashTendered > 0 && (
                      <button
                        onClick={() => setCashTendered(0)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Change / Due Badge */}
                  <div
                    className={`px-2.5 py-1 rounded-lg border text-right min-w-[105px] flex flex-col justify-center ${cashTendered >= totalPayable && cashTendered > 0
                        ? isDarkMode
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : cashTendered > 0
                          ? isDarkMode
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                          : isDarkMode
                            ? 'bg-[#0a0a0a] border-[#222222] text-neutral-500'
                            : 'bg-white border-slate-200 text-slate-400'
                      }`}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-wider block leading-none">
                      {cashTendered >= totalPayable
                        ? 'Change Return'
                        : cashTendered > 0
                          ? 'Short Amount'
                          : 'Change Return'}
                    </span>
                    <span className="font-mono text-xs font-bold mt-0.5 leading-tight">
                      {cashTendered >= totalPayable
                        ? formatBDT(changeDue)
                        : cashTendered > 0
                          ? `- ${formatBDT(totalPayable - cashTendered)}`
                          : formatBDT(0)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Quick Note Chips (BDT Denominations) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
                  <button
                    type="button"
                    onClick={handleSetExactCash}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition shrink-0 ${cashTendered === totalPayable && totalPayable > 0
                        ? isDarkMode
                          ? 'bg-white text-black border-white shadow-xs'
                          : 'bg-[#000f50] text-white border-[#000f50] shadow-xs'
                        : isDarkMode
                          ? 'bg-[#1c1c1c] text-neutral-300 border-[#2d2d2d] hover:bg-[#282828]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    Exact ৳{totalPayable}
                  </button>

                  {[100, 200, 500, 1000, 2000, 3000, 5000].map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setCashTendered(note)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border transition shrink-0 ${cashTendered === note
                          ? isDarkMode
                            ? 'bg-white text-black border-white shadow-xs'
                            : 'bg-[#000f50] text-white border-[#000f50] shadow-xs'
                          : isDarkMode
                            ? 'bg-[#1c1c1c] text-neutral-300 border-[#2d2d2d] hover:bg-[#282828]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      ৳{note}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Big Primary Action Button: Process Transaction */}
            <button
              onClick={handleProcessTransaction}
              disabled={cartItems.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition disabled:opacity-40 active:scale-[0.99] ${isDarkMode
                  ? 'bg-white hover:bg-neutral-200 text-black font-black shadow-lg shadow-white/10'
                  : 'bg-[#000f50] hover:bg-[#081a70] text-white shadow-md shadow-[#000f50]/20'
                }`}
            >
              <Receipt className={`w-4.5 h-4.5 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              <span>Process Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* 80mm Thermal Receipt Modal after Settlement */}
      {completedOrderForReceipt && (
        <ThermalReceiptModal
          order={completedOrderForReceipt}
          settings={settings}
          onClose={() => setCompletedOrderForReceipt(null)}
          onKickDrawer={handleManualKickDrawer}
        />
      )}
    </div>
  );
}
