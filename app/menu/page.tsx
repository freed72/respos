'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Flame,
  Crown,
  Sparkles,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
  X,
  Check,
  UtensilsCrossed,
  Soup,
  Wheat,
  GlassWater,
  CakeSlice,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  Heart,
  ChefHat,
  Sparkle,
  Trash2,
  SlidersHorizontal,
  Layers,
  Coins,
  Gift,
  Award,
  Phone,
  UserCheck,
  QrCode,
  LogOut,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { useRestaurantStore } from '@/lib/store';
import { DietaryTag, Product, ModifierOption, SelectedModifier, Customer } from '@/types';
import { formatBDT, getTierBadgeClass } from '@/lib/formatters';

// Icon map for dynamic category rendering
const ICON_MAP: Record<string, React.ElementType> = {
  Crown,
  Flame,
  UtensilsCrossed,
  Soup,
  Wheat,
  Sparkles,
  GlassWater,
  CakeSlice,
};

// Dietary Options Configuration
const DIETARY_OPTIONS = [
  { id: 'all', label: 'All Dishes', icon: Sparkle, desc: 'Complete royal dining menu' },
  { id: 'CHEF_SPECIAL', label: "Chef's Royal Specials", icon: Crown, desc: 'Mastercrafted signature dishes' },
  { id: 'POPULAR', label: 'Most Popular', icon: Flame, desc: 'Guest favorites and banquet bestsellers' },
  { id: 'HALAL', label: '100% Halal Certified', icon: Check, desc: 'Certified halal gourmet preparations' },
  { id: 'SPICY', label: 'Spicy & Rich', icon: Flame, desc: 'Infused with aromatic royal chilies' },
  { id: 'VEGETARIAN', label: 'Vegetarian', icon: Wheat, desc: 'Plant-based delicacies & royal paneer' },
  { id: 'GLUTEN_FREE', label: 'Gluten-Free', icon: Sparkles, desc: 'Crafted without wheat or gluten' },
  { id: 'FAVORITES', label: 'Saved to Favorites', icon: Heart, desc: 'Dishes you marked with a heart' },
];

// Preset kitchen special instruction chips
const PRESET_INSTRUCTIONS = [
  'Mild / Less Spicy',
  'Extra Spicy 🌶️',
  'No Onion / Garlic',
  'Extra Ghee & Saffron',
  'Crispy / Well Done',
  'Serve Piping Hot',
  'Pack Sauce Separately',
];

export default function ModernDigitalMenuPage() {
  const {
    products,
    categories,
    tables,
    orders,
    customers,
    addCustomer,
    findCustomerByPhone,
    createOrder,
    settings,
  } = useRestaurantStore();

  // Navigation & Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Slide-up Drawers States for Filters
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [dietaryDrawerOpen, setDietaryDrawerOpen] = useState(false);

  // Table State (Default fallback for orders)
  const [selectedTableId, setSelectedTableId] = useState<string>('');

  useEffect(() => {
    if (!selectedTableId && tables.length > 0) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0];
  }, [tables, selectedTableId]);

  const [favorites, setFavorites] = useState<string[]>([]);

  // Reward Points & VIP Customer State
  const [rewardDrawerOpen, setRewardDrawerOpen] = useState(false);
  const [activeRewardCustomer, setActiveRewardCustomer] = useState<Customer | null>(null);
  const [rewardDrawerMode, setRewardDrawerMode] = useState<'view' | 'lookup' | 'register'>('lookup');
  const [rewardPhoneSearch, setRewardPhoneSearch] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [rewardFeedbackMsg, setRewardFeedbackMsg] = useState<string | null>(null);
  const [isRewardLoading, setIsRewardLoading] = useState(false);

  // Sync active customer if customer data updates in store
  useEffect(() => {
    if (activeRewardCustomer) {
      const refreshed = customers.find((c) => c.id === activeRewardCustomer.id);
      if (refreshed) {
        setActiveRewardCustomer(refreshed);
      }
    }
  }, [customers, activeRewardCustomer]);

  // Cart State for Digital Pre-Ordering / Tableside Ordering
  const [cart, setCart] = useState<{
    product: Product;
    quantity: number;
    selectedModifiers: SelectedModifier[];
    specialInstructions?: string;
    itemTotal: number;
  }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customizer & Detail Modal State
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customModifiers, setCustomModifiers] = useState<Record<string, ModifierOption>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Active Table Orders Tracker Sheet
  const [orderTrackerOpen, setOrderTrackerOpen] = useState(false);
  const [, setLastPlacedOrderId] = useState<string | null>(null);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<string | null>(null);

  // Toggle favorite dish
  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Active Category & Tag Objects for UI Display
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  const activeDietaryObj = useMemo(() => {
    return DIETARY_OPTIONS.find((d) => d.id === selectedTag) || DIETARY_OPTIONS[0];
  }, [selectedTag]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedTag === 'FAVORITES' && !favorites.includes(item.id)) {
        return false;
      }
      if (selectedTag !== 'all' && selectedTag !== 'FAVORITES' && !item.dietaryTags.includes(selectedTag as DietaryTag)) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchBangla = item.banglaName?.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        return matchName || matchBangla || matchDesc;
      }
      return true;
    });
  }, [products, selectedCategory, selectedTag, searchQuery, favorites]);

  // Active Orders for this table
  const tableOrders = useMemo(() => {
    if (!currentTable) return [];
    return orders.filter(
      (o) => o.tableId === currentTable.id && (o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'SERVED')
    );
  }, [orders, currentTable]);

  // Open Customizer Modal
  const openCustomizer = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomizingProduct(product);
    setSpecialInstructions('');
    setCustomQty(1);
    const initialMods: Record<string, ModifierOption> = {};
    if (product.modifierGroups) {
      product.modifierGroups.forEach((group) => {
        if (group.required && group.options.length > 0) {
          initialMods[group.id] = group.options[0];
        }
      });
    }
    setCustomModifiers(initialMods);
  };

  // Add Item to Cart
  const addItemToCart = (
    product: Product,
    selectedMods: SelectedModifier[] = [],
    instructions: string = '',
    qty: number = 1
  ) => {
    const modsCost = selectedMods.reduce((sum, m) => sum + m.priceDelta, 0);
    const unitTotal = product.price + modsCost;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedMods) &&
          item.specialInstructions === instructions
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += qty;
        copy[existingIdx].itemTotal = copy[existingIdx].quantity * unitTotal;
        return copy;
      }

      return [
        ...prev,
        {
          product,
          quantity: qty,
          selectedModifiers: selectedMods,
          specialInstructions: instructions,
          itemTotal: unitTotal * qty,
        },
      ];
    });

    setCustomizingProduct(null);
    setActiveProductDetail(null);
  };

  // Update Cart Quantity
  const updateCartQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      const unitCost = copy[index].itemTotal / copy[index].quantity;
      copy[index].quantity = newQty;
      copy[index].itemTotal = newQty * unitCost;
      return copy;
    });
  };

  // Remove Item from Cart
  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Cart Totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const cartTax = (cartSubtotal * settings.vatPercent) / 100;
  const cartServiceCharge = (cartSubtotal * settings.serviceChargePercent) / 100;
  const cartTotal = cartSubtotal + cartTax + cartServiceCharge;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Lookup phone
  const handleLookupPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = rewardPhoneSearch.trim().replace(/[\s-]/g, '');
    if (!clean) return;

    setIsRewardLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 450));

    const found = customers.find((c) =>
      c.phone.replace(/[\s-]/g, '').includes(clean)
    );

    if (found) {
      setActiveRewardCustomer(found);
      setRewardDrawerMode('view');
      setRewardFeedbackMsg(null);
    } else {
      setRegisterPhone(rewardPhoneSearch);
      setRewardDrawerMode('register');
      setRewardFeedbackMsg('No member found with that number. Register in seconds to get 50 Welcome Points!');
    }
    setIsRewardLoading(false);
  };

  // Register new member
  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerPhone.trim()) return;

    setIsRewardLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 450));

    const newCust = addCustomer({
      name: registerName.trim(),
      phone: registerPhone.trim(),
    });

    setActiveRewardCustomer(newCust);
    setRewardDrawerMode('view');
    setRewardFeedbackMsg(null);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000f50', '#1e3a8a', '#d4af37', '#ffffff'],
      });
    } catch {
      // ignore
    }
    setIsRewardLoading(false);
  };

  // Calculate Next Tier Info
  const getNextTierProgress = (customer: Customer) => {
    if (customer.tier === 'ROYAL') {
      return { nextTier: 'ROYAL (Highest)', amountNeeded: 0, progressPercent: 100 };
    }
    if (customer.tier === 'GOLD') {
      const target = settings.tierSpendThresholds.ROYAL;
      const needed = Math.max(0, target - customer.totalSpent);
      const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
      return { nextTier: 'Royal Ambassador', amountNeeded: needed, progressPercent: progress };
    }
    if (customer.tier === 'SILVER') {
      const target = settings.tierSpendThresholds.GOLD;
      const needed = Math.max(0, target - customer.totalSpent);
      const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
      return { nextTier: 'Gold VIP', amountNeeded: needed, progressPercent: progress };
    }
    const target = settings.tierSpendThresholds.SILVER;
    const needed = Math.max(0, target - customer.totalSpent);
    const progress = Math.min(100, Math.round((customer.totalSpent / target) * 100));
    return { nextTier: 'Silver VIP', amountNeeded: needed, progressPercent: progress };
  };

  // Submit Order
  const handleSubmitOrder = () => {
    if (cart.length === 0) return;

    const orderItems = cart.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: item.itemTotal / item.quantity,
      quantity: item.quantity,
      selectedModifiers: item.selectedModifiers,
      specialInstructions: item.specialInstructions,
      totalPrice: item.itemTotal,
    }));

    const newOrder = createOrder({
      orderType: 'DINE_IN',
      tableId: currentTable?.id,
      customerId: activeRewardCustomer?.id,
      customerName: activeRewardCustomer?.name,
      customerPhone: activeRewardCustomer?.phone,
      items: orderItems,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
    });

    setLastPlacedOrderId(newOrder.id);
    setCart([]);
    setIsCartOpen(false);
    setOrderSuccessBanner(
      activeRewardCustomer
        ? `Order #${newOrder.orderNumber} sent to kitchen for ${activeRewardCustomer.name}! You'll earn +${newOrder.pointsEarned} VIP points on settlement.`
        : `Order #${newOrder.orderNumber} sent to kitchen! Our chefs have begun preparations.`
    );

    setTimeout(() => {
      setOrderSuccessBanner(null);
    }, 7000);
  };

  return (
    <div className="flex-1 bg-[#F8F9FD] text-slate-900 min-h-screen pb-32 flex flex-col font-sans">

      {/* ========================================================================= */}
      {/* TOAST STATUS BANNERS                                                      */}
      {/* ========================================================================= */}
      {orderSuccessBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] animate-in slide-in-from-top-3 duration-300">
          <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">{orderSuccessBanner}</p>
                <p className="text-[11px] text-emerald-100">Live order status is synchronized with the kitchen POS.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setOrderSuccessBanner(null);
                setOrderTrackerOpen(true);
              }}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition shrink-0 ml-2"
            >
              Track
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SEAMLESS CLEAN SEARCH & DROPDOWN FILTER TRIGGERS                       */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 w-full space-y-3">

        {/* ========================================================================= */}
        {/* REWARD POINTS BANNER (DETAILED WHEN LINKED, MINIMAL WHEN GUEST)           */}
        {/* ========================================================================= */}
        {activeRewardCustomer ? (
          /* Exact Royal Digital VIP Pass Card when Number Linked */
          <div
            onClick={() => {
              setRewardDrawerMode('view');
              setRewardDrawerOpen(true);
            }}
            className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#000f50] via-[#081a70] to-[#020b33] text-white shadow-xl border border-amber-400/40 overflow-hidden cursor-pointer group hover:border-amber-400/60 transition-all"
          >
            {/* Ambient golden glow */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 font-mono">
                    The Royal Palette VIP Circle
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    👑 {activeRewardCustomer.tier} VIP
                  </span>
                </div>
                <h4 className="text-lg font-black text-white mt-1 leading-tight">{activeRewardCustomer.name}</h4>
                <p className="text-xs text-slate-300 font-mono">{activeRewardCustomer.phone}</p>
              </div>

              <div className="bg-white p-1 rounded-xl shadow-md shrink-0">
                <QRCodeSVG value={`VIP-${activeRewardCustomer.phone}`} size={58} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-end justify-between relative z-10">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-200/80 block font-mono">
                  Available Balance
                </span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {activeRewardCustomer.pointsBalance} <span className="text-xs font-normal text-white">PTS</span>
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center text-amber-300 transition-all group-hover:translate-x-0.5 shadow-2xs">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          /* Minimal Guest Bar with Welcome Bonus CTA */
          <div
            onClick={() => {
              setRewardDrawerMode('lookup');
              setRewardDrawerOpen(true);
            }}
            className="bg-[#000f50] text-white p-2.5 sm:px-4 sm:py-2.5 rounded-2xl border border-amber-400/30 flex items-center justify-between gap-2.5 shadow-xs hover:border-amber-400/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center gap-2 text-xs truncate">
                <span className="font-mono font-bold tracking-wider text-amber-300 uppercase text-[11px]">
                  VIP Rewards
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">1 pt = ৳1 off</span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-300 hidden sm:inline">Earn on this order</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRewardDrawerMode('register');
                  setRewardDrawerOpen(true);
                }}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Claim 50 Pts Bonus</span>
              </button>
            </div>
          </div>
        )}

        {/* Row 1: Search Bar & View Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Clean Search Input */}
          <div className="relative flex-1 flex items-center bg-white border border-slate-200/90 rounded-2xl shadow-xs focus-within:border-[#000f50] focus-within:ring-2 focus-within:ring-[#000f50]/10 transition">
            <Search className="ml-3.5 w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search gourmet dishes, ingredients, bangla..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-3 pr-2 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 mr-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cooking Tracker & Layout Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {tableOrders.length > 0 && (
              <button
                onClick={() => setOrderTrackerOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl px-3 py-2.5 text-xs font-bold transition shadow-2xs shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{tableOrders.length} In Kitchen</span>
              </button>
            )}

            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 gap-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition ${viewMode === 'grid' ? 'bg-[#000f50] text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition ${viewMode === 'list' ? 'bg-[#000f50] text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Slide-up Drawer Filter Dropdowns */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">

          {/* Category Filter Dropdown Trigger */}
          <button
            onClick={() => setCategoryDrawerOpen(true)}
            className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition shadow-xs shrink-0 ${selectedCategory !== 'all'
                ? 'bg-[#000f50] text-white border-[#000f50] shadow-md shadow-[#000f50]/15'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-[#000f50]/30'
              }`}
          >
            <div className="flex items-center gap-2">
              <Layers className={`w-3.5 h-3.5 ${selectedCategory !== 'all' ? 'text-amber-400' : 'text-[#000f50]'}`} />
              <span>
                {selectedCategory === 'all' ? 'All Categories' : activeCategoryObj?.name || 'Category'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedCategory !== 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {selectedCategory === 'all'
                  ? products.length
                  : products.filter((p) => p.categoryId === selectedCategory).length}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </div>
          </button>

          {/* Dietary Filter Dropdown Trigger */}
          <button
            onClick={() => setDietaryDrawerOpen(true)}
            className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition shadow-xs shrink-0 ${selectedTag !== 'all'
                ? 'bg-[#000f50] text-white border-[#000f50] shadow-md shadow-[#000f50]/15'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-[#000f50]/30'
              }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className={`w-3.5 h-3.5 ${selectedTag !== 'all' ? 'text-amber-400' : 'text-[#000f50]'}`} />
              <span>
                {selectedTag === 'all' ? 'Dietary Filter' : activeDietaryObj.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-1" />
          </button>

          {/* Active Filter Clear Tag */}
          {(selectedCategory !== 'all' || selectedTag !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTag('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition border border-rose-200 shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DISHES PRODUCT GRID / LIST VIEW (NO BG, SQUARE IMAGE)                  */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex-1 w-full">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto p-8 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-[#000f50]/5 text-[#000f50] flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg">No dishes found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting your category or dietary filter options.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTag('all');
                setSearchQuery('');
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#000f50] text-white text-xs font-bold hover:bg-[#081a70] transition shadow-md shadow-[#000f50]/20"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Modern Card Grid - No BG, Square Image */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {filteredProducts.map((product) => {
              const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;
              const isFav = favorites.includes(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => setActiveProductDetail(product)}
                  className="flex flex-col justify-between group cursor-pointer bg-transparent transition-all duration-300"
                >
                  {/* 1:1 Square Image Container */}
                  <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-lg transition-all duration-500">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-108 transition duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {product.dietaryTags.includes('CHEF_SPECIAL') && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#000f50] text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-md">
                          <Crown className="w-3 h-3" /> Chef&apos;s Royal
                        </span>
                      )}
                      {product.dietaryTags.includes('POPULAR') && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-md">
                          <Flame className="w-3 h-3" /> Popular
                        </span>
                      )}
                      {product.dietaryTags.includes('HALAL') && !product.dietaryTags.includes('CHEF_SPECIAL') && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white shadow-md">
                          100% Halal
                        </span>
                      )}
                    </div>

                    {/* Favorite Heart Button */}
                    <button
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 ${isFav
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
                        }`}
                      title="Save to Favorites"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    {/* Preparation Time Pill */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/80 flex items-center gap-1 shadow-xs z-10">
                      <Clock className="w-3 h-3 text-[#000f50]" />
                      <span>{product.preparationTimeMinutes}m</span>
                    </div>
                  </div>

                  {/* Body Content (No background box) */}
                  <div className="pt-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-[#000f50] transition line-clamp-1 leading-snug">
                        {product.name}
                      </h3>
                      {product.banglaName && (
                        <p className="text-xs text-amber-900/80 font-bangla font-semibold">
                          {product.banglaName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                          Price
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#000f50] font-mono">
                          {formatBDT(product.price)}
                        </span>
                      </div>

                      {hasModifiers ? (
                        <button
                          onClick={(e) => openCustomizer(product, e)}
                          className="px-3.5 py-2 rounded-xl bg-[#000f50]/10 hover:bg-[#000f50] border border-[#000f50]/20 text-[#000f50] hover:text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Customize</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addItemToCart(product);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-[#000f50]/20 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Modern Editorial List View - No BG, Square Thumbnail */
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;
              const isFav = favorites.includes(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => setActiveProductDetail(product)}
                  className="bg-transparent hover:bg-slate-100/50 p-3 sm:p-4 rounded-3xl border-b border-slate-200/80 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto flex-1">
                    {/* Square Thumbnail */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 aspect-square rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-108 transition duration-500"
                        sizes="120px"
                      />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#000f50] transition">
                          {product.name}
                        </h3>
                        {product.dietaryTags.includes('CHEF_SPECIAL') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#000f50] text-amber-300">
                            👑 Chef Special
                          </span>
                        )}
                        {product.dietaryTags.includes('POPULAR') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                            🔥 Popular
                          </span>
                        )}
                      </div>
                      {product.banglaName && (
                        <p className="text-xs text-amber-900/80 font-bangla font-semibold">
                          {product.banglaName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-2 max-w-xl">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#000f50]" /> {product.preparationTimeMinutes} mins
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">100% Halal</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                        Price
                      </span>
                      <span className="text-base sm:text-lg font-black text-[#000f50] font-mono">
                        {formatBDT(product.price)}
                      </span>
                    </div>

                    {hasModifiers ? (
                      <button
                        onClick={(e) => openCustomizer(product, e)}
                        className="px-3.5 py-2 rounded-xl bg-[#000f50]/10 hover:bg-[#000f50] border border-[#000f50]/20 text-[#000f50] hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Customize</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addItemToCart(product);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-[#000f50]/20 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. CATEGORY SLIDE-UP DRAWER (iOS Style Spring Animation)                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {categoryDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setCategoryDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 320,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 400) {
                  setCategoryDrawerOpen(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[68vh] flex flex-col justify-between"
            >
              {/* iOS Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 mb-3 shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#000f50] text-amber-400 flex items-center justify-center shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">Select Category</h3>
                    <p className="text-[11px] text-slate-500">Filter dishes by culinary course</p>
                  </div>
                </div>
                <button
                  onClick={() => setCategoryDrawerOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category Options List (Compact iOS Height) */}
              <div className="overflow-y-auto space-y-1.5 my-3 max-h-[44vh] pr-1 scrollbar-none">
                {/* All Categories Option */}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setCategoryDrawerOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all text-left ${selectedCategory === 'all'
                      ? 'bg-[#000f50] border-[#000f50] text-white font-bold shadow-md shadow-[#000f50]/15'
                      : 'bg-[#f8f9fc] border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedCategory === 'all' ? 'bg-white/20 text-amber-400' : 'bg-white text-[#000f50] shadow-2xs'
                        }`}
                    >
                      <Sparkle className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold">All Categories</h5>
                      <p className={`text-[10px] ${selectedCategory === 'all' ? 'text-slate-200' : 'text-slate-500'}`}>
                        Browse all culinary creations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}
                    >
                      {products.length}
                    </span>
                    {selectedCategory === 'all' && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
                  </div>
                </button>

                {/* Dynamic Categories */}
                {categories.map((cat) => {
                  const Icon = ICON_MAP[cat.iconName] || UtensilsCrossed;
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setCategoryDrawerOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all text-left ${isSelected
                          ? 'bg-[#000f50] border-[#000f50] text-white font-bold shadow-md shadow-[#000f50]/15'
                          : 'bg-[#f8f9fc] border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20 text-amber-400' : 'bg-white text-[#000f50] shadow-2xs'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold">{cat.name}</h5>
                          {cat.description && (
                            <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                            }`}
                        >
                          {count}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setCategoryDrawerOpen(false)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-98"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. DIETARY SLIDE-UP DRAWER (iOS Style Spring Animation)                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {dietaryDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDietaryDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 320,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 400) {
                  setDietaryDrawerOpen(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[68vh] flex flex-col justify-between"
            >
              {/* iOS Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 mb-3 shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#000f50] text-amber-400 flex items-center justify-center shadow-xs">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">Dietary & Preferences</h3>
                    <p className="text-[11px] text-slate-500">Filter by dietary choice or special tag</p>
                  </div>
                </div>
                <button
                  onClick={() => setDietaryDrawerOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dietary Options List (Compact iOS Height) */}
              <div className="overflow-y-auto space-y-1.5 my-3 max-h-[44vh] pr-1 scrollbar-none">
                {DIETARY_OPTIONS.map((tag) => {
                  const Icon = tag.icon;
                  const isSelected = selectedTag === tag.id;
                  const count =
                    tag.id === 'all'
                      ? products.length
                      : tag.id === 'FAVORITES'
                        ? favorites.length
                        : products.filter((p) => p.dietaryTags.includes(tag.id as DietaryTag)).length;

                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTag(tag.id);
                        setDietaryDrawerOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all text-left ${isSelected
                          ? 'bg-[#000f50] border-[#000f50] text-white font-bold shadow-md shadow-[#000f50]/15'
                          : 'bg-[#f8f9fc] border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20 text-amber-400' : 'bg-white text-[#000f50] shadow-2xs'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold">{tag.label}</h5>
                          <p className={`text-[10px] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                            {tag.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                            }`}
                        >
                          {count}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setDietaryDrawerOpen(false)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-98"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. FLOATING BOTTOM ORDER PILL (Spring Slide In)                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 70, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 70, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%]"
          >
            <div className="bg-[#000f50] text-white rounded-2xl shadow-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-amber-400/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs sm:text-sm shadow-md">
                  {totalItemsCount}
                </div>
                <div>
                  <span className="text-[10px] text-amber-200/90 block font-medium leading-none">
                    Your Order
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">{formatBDT(cartTotal)}</p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Review Order</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. SLIDE-OVER TABLE ORDER CART DRAWER (Spring Animation)                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
                mass: 0.8,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl p-5 sm:p-6 overflow-y-auto scrollbar-none"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#000f50] text-amber-400 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Your Order</h3>
                      <p className="text-xs text-slate-500">{totalItemsCount} items selected</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Items List */}
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-800 font-bold text-sm">Your order is empty</p>
                    <p className="text-xs text-slate-500 mt-1">Select dishes from the menu to place your order.</p>
                  </div>
                ) : (
                  <div className="mt-3 divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1 scrollbar-none">
                    {cart.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{item.product.name}</h4>
                            <button
                              onClick={() => removeCartItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {item.selectedModifiers.map((mod, mIdx) => (
                            <p key={mIdx} className="text-[10px] text-[#000f50] font-medium">
                              + {mod.optionName} {mod.priceDelta > 0 && `(${formatBDT(mod.priceDelta)})`}
                            </p>
                          ))}
                          {item.specialInstructions && (
                            <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                          <p className="text-xs font-mono font-bold text-[#000f50]">
                            {formatBDT(item.itemTotal)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#f8f9fc] border border-slate-200 rounded-xl p-1 shrink-0">
                          <button
                            onClick={() => updateCartQuantity(idx, -1)}
                            className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs shadow-2xs"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold px-1 font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(idx, 1)}
                            className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs shadow-2xs"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Calculations & Submit CTA */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-900 font-bold">{formatBDT(cartSubtotal)}</span>
                    </div>
                    {settings.vatPercent > 0 && (
                      <div className="flex justify-between">
                        <span>VAT ({settings.vatPercent}%)</span>
                        <span className="font-mono text-slate-900">{formatBDT(cartTax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#000f50] pt-1.5 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span className="font-mono text-base font-black">{formatBDT(cartTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitOrder}
                    className="w-full py-3.5 rounded-2xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#000f50]/20 transition active:scale-98"
                  >
                    <UtensilsCrossed className="w-4 h-4 text-amber-300" />
                    <span>Send Order to Kitchen ({formatBDT(cartTotal)})</span>
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. GOURMET DISH DETAIL SLIDE-UP DRAWER (iOS Style Spring Animation)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeProductDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveProductDetail(null)}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 320,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 400) {
                  setActiveProductDetail(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col justify-between"
            >
              {/* Header Image with Grab Handle */}
              <div className="relative h-56 sm:h-60 w-full bg-slate-900 shrink-0">
                {/* iOS Grab Handle */}
                <div className="w-10 h-1.5 rounded-full bg-white/80 backdrop-blur-xs mx-auto absolute top-2.5 left-1/2 -translate-x-1/2 z-20 cursor-grab active:cursor-grabbing shadow-sm" />

                <Image
                  src={activeProductDetail.imageUrl}
                  alt={activeProductDetail.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

                <button
                  onClick={() => setActiveProductDetail(null)}
                  className="absolute top-2.5 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {activeProductDetail.dietaryTags.includes('CHEF_SPECIAL') && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                        👑 Chef&apos;s Royal
                      </span>
                    )}
                    {activeProductDetail.dietaryTags.includes('POPULAR') && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                        🔥 Popular
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                      100% Halal
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                    {activeProductDetail.name}
                  </h2>
                  {activeProductDetail.banglaName && (
                    <p className="text-xs text-amber-300 font-bangla font-semibold">
                      {activeProductDetail.banglaName}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-none">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</h4>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                    {activeProductDetail.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#f8f9fc] border border-slate-200 rounded-2xl p-3 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#000f50]" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Preparation</span>
                      <span className="text-xs font-bold text-slate-800">{activeProductDetail.preparationTimeMinutes} Mins</span>
                    </div>
                  </div>
                  <div className="bg-[#f8f9fc] border border-slate-200 rounded-2xl p-3 flex items-center gap-2.5">
                    <ChefHat className="w-4 h-4 text-[#000f50]" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Cooking</span>
                      <span className="text-xs font-bold text-slate-800">Dum & Tandoor</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-200 bg-[#f8f9fc] flex items-center justify-between gap-4 shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Price</span>
                  <span className="text-lg font-black text-[#000f50] font-mono">
                    {formatBDT(activeProductDetail.price)}
                  </span>
                </div>

                {activeProductDetail.modifierGroups && activeProductDetail.modifierGroups.length > 0 ? (
                  <button
                    onClick={() => openCustomizer(activeProductDetail)}
                    className="px-5 py-2.5 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#000f50]/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Customize</span>
                  </button>
                ) : (
                  <button
                    onClick={() => addItemToCart(activeProductDetail)}
                    className="px-5 py-2.5 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#000f50]/20 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 8. DISH CUSTOMIZER SLIDE-UP DRAWER (iOS Style Spring Animation)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {customizingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setCustomizingProduct(null)}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 320,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 400) {
                  setCustomizingProduct(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto scrollbar-none flex flex-col justify-between"
            >
              {/* iOS Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 mb-1 shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Customize: {customizingProduct.name}
                  </h3>
                  <p className="text-xs text-[#000f50] font-mono font-bold mt-0.5">
                    Base Price: {formatBDT(customizingProduct.price)}
                  </p>
                </div>
                <button
                  onClick={() => setCustomizingProduct(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modifier Groups */}
              <div className="space-y-4 overflow-y-auto flex-1 scrollbar-none pr-0.5">
                {customizingProduct.modifierGroups?.map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      {group.name} {group.required && <span className="text-rose-600 font-bold">* Required</span>}
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {group.options.map((opt) => {
                        const isSelected = customModifiers[group.id]?.id === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setCustomModifiers((prev) => ({ ...prev, [group.id]: opt }))
                            }
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${isSelected
                                ? 'bg-[#000f50] border-[#000f50] text-white font-bold shadow-xs'
                                : 'bg-[#f8f9fc] border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-400'
                                  }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                              </div>
                              <span>{opt.name}</span>
                            </div>
                            <span className={`font-mono ${isSelected ? 'text-amber-300' : 'text-[#000f50]'}`}>
                              {opt.priceDelta > 0 ? `+${formatBDT(opt.priceDelta)}` : 'Included'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Special Instructions & Preset Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Special Kitchen Notes (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {PRESET_INSTRUCTIONS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setSpecialInstructions((prev) =>
                            prev ? `${prev}, ${chip}` : chip
                          )
                        }
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-[#000f50]/10 text-slate-700 hover:text-[#000f50] border border-slate-200 transition"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Less oil, allergy requirements..."
                    rows={2}
                    className="w-full bg-[#f8f9fc] border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#000f50] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Quantity Stepper & Add Action */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-[#f8f9fc] border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold shadow-2xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold px-1 font-mono">{customQty}</span>
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => q + 1)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const selectedList = Object.entries(customModifiers).map(([groupId, opt]) => {
                      const grp = customizingProduct.modifierGroups?.find((g) => g.id === groupId);
                      return {
                        groupId,
                        groupName: grp?.name || '',
                        optionId: opt.id,
                        optionName: opt.name,
                        priceDelta: opt.priceDelta,
                      };
                    });
                    addItemToCart(customizingProduct, selectedList, specialInstructions, customQty);
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#000f50]/20 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Confirm & Add</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 9. LIVE ORDER TRACKER DRAWER (Spring Animation)                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {orderTrackerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOrderTrackerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
                mass: 0.8,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl p-5 overflow-y-auto scrollbar-none"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-[#000f50]" />
                    <h3 className="text-sm font-bold text-slate-900">Live Kitchen Tracker</h3>
                  </div>
                  <button
                    onClick={() => setOrderTrackerOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {tableOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-bold">No active orders</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {tableOrders.map((ord) => (
                      <div key={ord.id} className="bg-[#f8f9fc] border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#000f50] font-mono">Order #{ord.orderNumber}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900">
                            {ord.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-0.5">
                          <div className="h-1.5 rounded-full bg-emerald-500" title="Received" />
                          <div
                            className={`h-1.5 rounded-full ${ord.status === 'PREPARING' || ord.status === 'SERVED' ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                            title="Cooking"
                          />
                          <div
                            className={`h-1.5 rounded-full ${ord.status === 'SERVED' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            title="Served"
                          />
                        </div>

                        <div className="divide-y divide-slate-200/60 pt-1">
                          {ord.items.map((it, i) => (
                            <div key={i} className="py-1 flex justify-between text-xs text-slate-700">
                              <span>{it.quantity}x {it.productName}</span>
                              <span className="font-mono">{formatBDT(it.totalPrice)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1.5 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                          <span>Total</span>
                          <span className="font-mono text-[#000f50]">{formatBDT(ord.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => setOrderTrackerOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#000f50] text-white text-xs font-bold"
                >
                  Back to Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 10. REWARD POINTS SLIDE-UP DRAWER (iOS Style Spring Animation)            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {rewardDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setRewardDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 320,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 400) {
                  setRewardDrawerOpen(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto scrollbar-none flex flex-col justify-between"
            >
              {/* iOS Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 mb-1 shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#000f50] text-amber-400 flex items-center justify-center shadow-xs">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">Royal VIP Rewards</h3>
                    <p className="text-[11px] text-slate-500">1 Point = ৳1 Cash Discount at Checkout</p>
                  </div>
                </div>
                <button
                  onClick={() => setRewardDrawerOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Tabs (Only for guests / when not connected) */}
              {!activeRewardCustomer && (
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRewardDrawerMode('lookup')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      rewardDrawerMode === 'lookup' ? 'bg-[#000f50] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Lookup Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRewardDrawerMode('register')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      rewardDrawerMode === 'register' ? 'bg-[#000f50] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Join (50 Pts)</span>
                  </button>
                </div>
              )}

              {/* Feedback Message (Guest Mode Only, e.g. Number not found notice) */}
              {!activeRewardCustomer && rewardFeedbackMsg && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{rewardFeedbackMsg}</span>
                </div>
              )}

              {/* Content Area */}
              <div className="space-y-4 overflow-y-auto flex-1 scrollbar-none pr-0.5">

                {/* 1. VIEW ACTIVE MEMBER CARD (When Connected) */}
                {activeRewardCustomer ? (
                  <div className="space-y-4">
                    {/* Royal Digital VIP Pass Card */}
                    <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#000f50] via-[#081a70] to-[#020b33] text-white shadow-xl border border-amber-400/40 overflow-hidden">
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                              The Royal Palette VIP Circle
                            </span>
                          </div>
                          <h4 className="text-lg font-black text-white mt-1 leading-tight">{activeRewardCustomer.name}</h4>
                          <p className="text-xs text-slate-300 font-mono">{activeRewardCustomer.phone}</p>
                        </div>

                        <div className="bg-white p-1 rounded-xl shadow-md shrink-0">
                          <QRCodeSVG value={`VIP-${activeRewardCustomer.phone}`} size={64} />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-end justify-between relative z-10">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-200/80 block font-mono">
                            Available Balance
                          </span>
                          <span className="text-2xl font-black text-amber-300 font-mono">
                            {activeRewardCustomer.pointsBalance} <span className="text-xs font-normal text-white">PTS</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-300 block font-mono">
                            Discount Value
                          </span>
                          <span className="text-base font-black text-emerald-300 font-mono">
                            {formatBDT(activeRewardCustomer.pointsBalance * settings.loyaltyRedemptionRate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tier Progress */}
                    {(() => {
                      const tierProgress = getNextTierProgress(activeRewardCustomer);
                      return (
                        <div className="bg-[#f8f9fc] border border-slate-200 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">
                              Tier Status: <span className="text-[#000f50] uppercase font-black">{activeRewardCustomer.tier}</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {tierProgress.progressPercent}% to {tierProgress.nextTier}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-[#000f50] rounded-full transition-all duration-500"
                              style={{ width: `${tierProgress.progressPercent}%` }}
                            />
                          </div>
                          {tierProgress.amountNeeded > 0 && (
                            <p className="text-[11px] text-slate-500">
                              Spend <strong className="text-slate-800 font-mono">{formatBDT(tierProgress.amountNeeded)}</strong> more to unlock {tierProgress.nextTier} perks!
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Quick Perks */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-[11px]">1 Pt = ৳1 Cash Off</p>
                          <p className="text-[10px] text-emerald-700">Redeem on food bills</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="font-bold text-[11px]">Birthday VIP Surprises</p>
                          <p className="text-[10px] text-amber-700">Complimentary dessert</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRewardCustomer(null);
                          setRewardDrawerMode('lookup');
                          setRewardFeedbackMsg('Unlinked member account. You can lookup another phone number.');
                        }}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Unlink / Switch Member</span>
                      </button>
                    </div>
                  </div>
                ) : rewardDrawerMode === 'lookup' ? (
                  /* 2. LOOKUP BY PHONE */
                  <form onSubmit={handleLookupPhone} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        Enter Phone Number
                      </label>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input
                          type="tel"
                          value={rewardPhoneSearch}
                          onChange={(e) => setRewardPhoneSearch(e.target.value)}
                          placeholder="e.g. 01711223344"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f8f9fc] border border-slate-200 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:border-[#000f50] transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRewardLoading}
                      className="w-full py-3 rounded-xl bg-[#000f50] hover:bg-[#081a70] disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#000f50]/20 transition active:scale-95 cursor-pointer"
                    >
                      {isRewardLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Looking up...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Lookup VIP Points</span>
                        </>
                      )}
                    </button>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-center">
                      <p className="text-xs font-bold text-slate-800">Not a VIP Member yet?</p>
                      <p className="text-[11px] text-slate-500">
                        Join in 10 seconds and receive <strong className="text-amber-600">50 Welcome Bonus Points (৳50 value)</strong> on your first order.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterPhone(rewardPhoneSearch);
                          setRewardDrawerMode('register');
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#000f50] hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Register New Account</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                ) : (
                  /* 3. REGISTER NEW MEMBER */
                  <form onSubmit={handleRegisterMember} className="space-y-3.5">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5">
                      <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-950">50 Welcome Points Bonus</p>
                        <p className="text-[10px] text-amber-800">Instantly credited with ৳50 discount value upon signup!</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="e.g. Shakib Al Hasan"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fc] border border-slate-200 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#000f50] transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="e.g. 01711223344"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fc] border border-slate-200 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:border-[#000f50] transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isRewardLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-75 disabled:cursor-not-allowed text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                    >
                      {isRewardLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Joining VIP Circle...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Join & Claim 50 Welcome Points (৳50)</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>

              {/* Bottom Action */}
              <div className="pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setRewardDrawerOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-98"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
