'use client';

import { useEffect, useState } from 'react';
import {
  Category,
  Customer,
  LoyaltyTier,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  SystemSettings,
  Table,
  TableStatus,
} from '@/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_TABLES,
} from './mock-data';
import { triggerCashDrawer } from './hardware/cashDrawer';
import { insforge } from './insforge';

export type OutboxActionType =
  | 'INSERT_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'INSERT_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'INSERT_TABLE'
  | 'UPDATE_TABLE'
  | 'UPDATE_TABLE_FULL'
  | 'DELETE_TABLE'
  | 'INSERT_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'INSERT_ORDER'
  | 'SETTLE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'INSERT_DRAWER_LOG'
  | 'UPDATE_SETTINGS';

export interface OutboxItem {
  id: string;
  type: OutboxActionType;
  payload: any;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

const STORAGE_KEYS = {
  PRODUCTS: 'trp_products_v2',
  CATEGORIES: 'trp_categories_v2',
  TABLES: 'trp_tables_v2',
  CUSTOMERS: 'trp_customers_v2',
  ORDERS: 'trp_orders_v2',
  SETTINGS: 'trp_settings_v2',
  DRAWER_LOGS: 'trp_drawer_logs_v2',
  OUTBOX: 'trp_outbox_queue_v2',
};

export interface DrawerLogEntry {
  id: string;
  timestamp: string;
  reason: string;
  orderNumber?: string;
  amount?: number;
}

// Global in-memory cache to sync across tabs and re-renders
let state = {
  products: INITIAL_PRODUCTS,
  categories: INITIAL_CATEGORIES,
  tables: INITIAL_TABLES,
  customers: INITIAL_CUSTOMERS,
  orders: [] as Order[],
  settings: INITIAL_SETTINGS,
  drawerLogs: [] as DrawerLogEntry[],
  outboxQueue: [] as OutboxItem[],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncingOutbox: false,
  lastSyncTime: null as string | null,
  initialized: false,
};

// Sample orders initialized as empty clean slate for testing
function getInitialSampleOrders(): Order[] {
  return [];
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

// ---------------- DATABASE ROW MAPPERS ----------------
interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
}

interface DbProduct {
  id: string;
  name: string;
  bangla_name: string | null;
  description: string | null;
  category_id: string;
  price: number | string;
  cost_price: number | string;
  image_url: string | null;
  dietary_tags: unknown;
  is_available: boolean;
  preparation_time_minutes: number;
  modifier_groups: unknown;
  sort_order: number;
}

interface DbTable {
  id: string;
  table_number: string;
  capacity: number;
  section: Table['section'];
  status: TableStatus;
  current_order_id: string | null;
}

interface DbCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tier: LoyaltyTier;
  points_balance: number | string;
  total_spent: number | string;
  visit_count: number | string;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
}

interface DbOrder {
  id: string;
  order_number: string;
  order_type: Order['orderType'];
  table_id: string | null;
  table_number: string | null;
  status: OrderStatus;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  service_charge_amount: number | string;
  tip_amount: number | string;
  total_amount: number | string;
  points_earned: number | string;
  points_redeemed: number | string;
  points_discount_value: number | string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payments: unknown;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number | string;
  quantity: number | string;
  selected_modifiers: unknown;
  special_instructions: string | null;
  total_price: number | string;
  created_at: string;
}

interface DbDrawerLog {
  id: string;
  reason: string;
  order_number: string | null;
  amount: number | string | null;
  timestamp: string;
}

function mapDbProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    banglaName: p.bangla_name || undefined,
    description: p.description || '',
    categoryId: p.category_id,
    price: Number(p.price) || 0,
    costPrice: Number(p.cost_price) || 0,
    imageUrl: p.image_url || '',
    dietaryTags: Array.isArray(p.dietary_tags) ? (p.dietary_tags as Product['dietaryTags']) : [],
    isAvailable: p.is_available ?? true,
    preparationTimeMinutes: p.preparation_time_minutes || 15,
    modifierGroups: Array.isArray(p.modifier_groups) ? (p.modifier_groups as Product['modifierGroups']) : [],
    sortOrder: p.sort_order || 1,
  };
}

function mapDbCustomer(c: DbCustomer): Customer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || undefined,
    tier: c.tier || 'BRONZE',
    pointsBalance: Number(c.points_balance) || 0,
    totalSpent: Number(c.total_spent) || 0,
    visitCount: Number(c.visit_count) || 0,
    joinedAt: c.created_at || new Date().toISOString(),
    birthDate: c.birth_date || undefined,
    notes: c.notes || undefined,
  };
}

function mapDbTable(t: DbTable): Table {
  return {
    id: t.id,
    tableNumber: t.table_number,
    capacity: t.capacity || 4,
    section: t.section || 'INDOOR',
    status: t.status || 'AVAILABLE',
    currentOrderId: t.current_order_id || undefined,
  };
}

function mapDbOrder(o: DbOrder, items: OrderItem[]): Order {
  let parsedPayments: Order['payments'] | undefined = undefined;
  if (Array.isArray(o.payments)) {
    parsedPayments = o.payments as Order['payments'];
  } else if (typeof o.payments === 'string') {
    try {
      parsedPayments = JSON.parse(o.payments);
    } catch {
      parsedPayments = undefined;
    }
  }

  return {
    id: o.id,
    orderNumber: o.order_number,
    orderType: o.order_type || 'DINE_IN',
    tableId: o.table_id || undefined,
    tableNumber: o.table_number || undefined,
    status: o.status || 'PENDING',
    customerId: o.customer_id || undefined,
    customerName: o.customer_name || undefined,
    customerPhone: o.customer_phone || undefined,
    items: items || [],
    subtotal: Number(o.subtotal) || 0,
    discountAmount: Number(o.discount_amount) || 0,
    taxAmount: Number(o.tax_amount) || 0,
    serviceChargeAmount: Number(o.service_charge_amount) || 0,
    tipAmount: Number(o.tip_amount) || 0,
    totalAmount: Number(o.total_amount) || 0,
    pointsEarned: Number(o.points_earned) || 0,
    pointsRedeemed: Number(o.points_redeemed) || 0,
    pointsDiscountValue: Number(o.points_discount_value) || 0,
    paymentStatus: o.payment_status || 'UNPAID',
    paymentMethod: o.payment_method || undefined,
    payments: parsedPayments,
    notes: o.notes || undefined,
    createdAt: o.created_at || new Date().toISOString(),
    completedAt: o.completed_at || undefined,
  };
}

function mapDbOrderItem(it: DbOrderItem): OrderItem {
  let parsedModifiers: OrderItem['selectedModifiers'] = undefined;
  if (Array.isArray(it.selected_modifiers)) {
    parsedModifiers = it.selected_modifiers as OrderItem['selectedModifiers'];
  } else if (typeof it.selected_modifiers === 'string') {
    try {
      parsedModifiers = JSON.parse(it.selected_modifiers);
    } catch {
      parsedModifiers = undefined;
    }
  }

  return {
    id: it.id,
    productId: it.product_id || '',
    productName: it.product_name,
    unitPrice: Number(it.unit_price) || 0,
    quantity: Number(it.quantity) || 1,
    selectedModifiers: parsedModifiers,
    specialInstructions: it.special_instructions || undefined,
    totalPrice: Number(it.total_price) || 0,
  };
}

function toDbOrder(o: Order) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    order_type: o.orderType,
    table_id: o.tableId || null,
    table_number: o.tableNumber || null,
    status: o.status,
    customer_id: o.customerId || null,
    customer_name: o.customerName || null,
    customer_phone: o.customerPhone || null,
    subtotal: o.subtotal,
    discount_amount: o.discountAmount,
    tax_amount: o.taxAmount,
    service_charge_amount: o.serviceChargeAmount,
    tip_amount: o.tipAmount,
    total_amount: o.totalAmount,
    points_earned: o.pointsEarned,
    points_redeemed: o.pointsRedeemed,
    points_discount_value: o.pointsDiscountValue,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod || null,
    payments: JSON.stringify(o.payments || []),
    notes: o.notes || null,
    created_at: o.createdAt,
    completed_at: o.completedAt || null,
  };
}

function toDbOrderItem(item: OrderItem, orderId: string) {
  return {
    id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    order_id: orderId,
    product_id: item.productId || null,
    product_name: item.productName,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    selected_modifiers: JSON.stringify(item.selectedModifiers || []),
    special_instructions: item.specialInstructions || null,
    total_price: item.totalPrice,
    created_at: new Date().toISOString(),
  };
}

// ---------------- LOCAL STORAGE SYNC ----------------
function loadFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const p = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const c = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const t = localStorage.getItem(STORAGE_KEYS.TABLES);
    const m = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const o = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const d = localStorage.getItem(STORAGE_KEYS.DRAWER_LOGS);
    const q = localStorage.getItem(STORAGE_KEYS.OUTBOX);

    if (p) state.products = JSON.parse(p);
    if (c) state.categories = JSON.parse(c);
    if (t) state.tables = JSON.parse(t);
    if (m) state.customers = JSON.parse(m);
    if (o) state.orders = JSON.parse(o);
    else state.orders = [];
    if (s) state.settings = JSON.parse(s);
    if (d) state.drawerLogs = JSON.parse(d);
    if (q) state.outboxQueue = JSON.parse(q);

    state.isOnline = navigator.onLine;
    state.initialized = true;
  } catch (err) {
    console.error('Failed to load storage:', err);
  }
}

function saveToStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(state.products));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(state.tables));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(state.customers));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(state.orders));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(STORAGE_KEYS.DRAWER_LOGS, JSON.stringify(state.drawerLogs));
    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(state.outboxQueue));
  } catch (err) {
    console.error('Failed to save storage:', err);
  }
}

// ---------------- OFFLINE OUTBOX & AUTO-REPLAY QUEUE ENGINE ----------------

function enqueueOutboxMutation(type: OutboxActionType, payload: any) {
  const item: OutboxItem = {
    id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  state.outboxQueue = [...state.outboxQueue, item];
  saveToStorage();
  notify();
  console.log(`[Outbox Enqueued] ${type} (${item.id}) - Queue size: ${state.outboxQueue.length}`);
}

async function executeDirectMutation(type: OutboxActionType, payload: any): Promise<void> {
  switch (type) {
    case 'INSERT_PRODUCT': {
      const product = payload as Product;
      const { error } = await insforge.database.from('products').insert([
        {
          id: product.id,
          name: product.name,
          bangla_name: product.banglaName || null,
          description: product.description,
          category_id: product.categoryId,
          price: product.price,
          cost_price: product.costPrice,
          image_url: product.imageUrl,
          dietary_tags: JSON.stringify(product.dietaryTags || []),
          is_available: product.isAvailable,
          preparation_time_minutes: product.preparationTimeMinutes,
          modifier_groups: JSON.stringify(product.modifierGroups || []),
          sort_order: product.sortOrder,
        },
      ]);
      if (error) throw new Error(error.message || 'Error inserting product');
      break;
    }
    case 'UPDATE_PRODUCT': {
      const { id, updates } = payload as { id: string; updates: Partial<Product> };
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.banglaName !== undefined) dbUpdates.bangla_name = updates.banglaName;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.dietaryTags !== undefined) dbUpdates.dietary_tags = JSON.stringify(updates.dietaryTags);
      if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
      if (updates.preparationTimeMinutes !== undefined) dbUpdates.preparation_time_minutes = updates.preparationTimeMinutes;
      if (updates.modifierGroups !== undefined) dbUpdates.modifier_groups = JSON.stringify(updates.modifierGroups);
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await insforge.database.from('products').update(dbUpdates).eq('id', id);
        if (error) throw new Error(error.message || 'Error updating product');
      }
      break;
    }
    case 'DELETE_PRODUCT': {
      const { id } = payload as { id: string };
      const { error } = await insforge.database.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message || 'Error deleting product');
      break;
    }
    case 'INSERT_CATEGORY': {
      const category = payload as Category;
      const { error } = await insforge.database.from('categories').insert([
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          icon_name: category.iconName,
          sort_order: category.sortOrder,
          is_active: category.isActive,
        },
      ]);
      if (error) throw new Error(error.message || 'Error inserting category');
      break;
    }
    case 'UPDATE_CATEGORY': {
      const { id, updates } = payload as { id: string; updates: Partial<Category> };
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.iconName !== undefined) dbUpdates.icon_name = updates.iconName;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await insforge.database.from('categories').update(dbUpdates).eq('id', id);
        if (error) throw new Error(error.message || 'Error updating category');
      }
      break;
    }
    case 'DELETE_CATEGORY': {
      const { id } = payload as { id: string };
      const { error } = await insforge.database.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message || 'Error deleting category');
      break;
    }
    case 'INSERT_TABLE': {
      const table = payload as Table;
      const { error } = await insforge.database.from('dining_tables').insert([
        {
          id: table.id,
          table_number: table.tableNumber,
          capacity: table.capacity,
          section: table.section,
          status: table.status,
          current_order_id: table.currentOrderId || null,
        },
      ]);
      if (error) throw new Error(error.message || 'Error inserting table');
      break;
    }
    case 'UPDATE_TABLE': {
      const { tableId, status, currentOrderId } = payload as { tableId: string; status: TableStatus; currentOrderId?: string };
      const { error } = await insforge.database.from('dining_tables').update({
        status,
        current_order_id: currentOrderId || null,
      }).eq('id', tableId);
      if (error) throw new Error(error.message || 'Error updating table status');
      break;
    }
    case 'UPDATE_TABLE_FULL': {
      const { tableId, updates } = payload as { tableId: string; updates: Partial<Table> };
      const dbUpdates: Record<string, unknown> = {};
      if (updates.tableNumber !== undefined) dbUpdates.table_number = updates.tableNumber;
      if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
      if (updates.section !== undefined) dbUpdates.section = updates.section;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.currentOrderId !== undefined) dbUpdates.current_order_id = updates.currentOrderId || null;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await insforge.database.from('dining_tables').update(dbUpdates).eq('id', tableId);
        if (error) throw new Error(error.message || 'Error full updating table');
      }
      break;
    }
    case 'DELETE_TABLE': {
      const { tableId } = payload as { tableId: string };
      const { error } = await insforge.database.from('dining_tables').delete().eq('id', tableId);
      if (error) throw new Error(error.message || 'Error deleting table');
      break;
    }
    case 'INSERT_CUSTOMER': {
      const customer = payload as Customer;
      const { error } = await insforge.database.from('customers').insert([
        {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
          tier: customer.tier,
          points_balance: customer.pointsBalance,
          total_spent: customer.totalSpent,
          visit_count: customer.visitCount,
          birth_date: customer.birthDate && customer.birthDate.trim() !== '' ? customer.birthDate : null,
          notes: customer.notes || null,
          created_at: customer.joinedAt,
        },
      ]);
      if (error) throw new Error(error.message || 'Error inserting customer');
      break;
    }
    case 'UPDATE_CUSTOMER': {
      const { customerId, customer } = payload as { customerId: string; customer: Customer };
      const { error } = await insforge.database.from('customers').update({
        points_balance: customer.pointsBalance,
        total_spent: customer.totalSpent,
        visit_count: customer.visitCount,
        tier: customer.tier,
      }).eq('id', customerId);
      if (error) throw new Error(error.message || 'Error updating customer');
      break;
    }
    case 'INSERT_ORDER': {
      const order = payload as Order;
      // Upsert/Insert order
      const { error: orderError } = await insforge.database.from('orders').insert([toDbOrder(order)]);
      if (orderError) throw new Error(orderError.message || 'Error inserting order');
      if (order.items && order.items.length > 0) {
        const dbItems = order.items.map((it) => toDbOrderItem(it, order.id));
        const { error: itemsError } = await insforge.database.from('order_items').insert(dbItems);
        if (itemsError) throw new Error(itemsError.message || 'Error inserting order items');
      }
      break;
    }
    case 'SETTLE_ORDER': {
      const { orderId, paymentMethod, payments, completedAt } = payload as {
        orderId: string;
        paymentMethod: PaymentMethod;
        payments: unknown;
        completedAt: string;
      };
      const { error } = await insforge.database.from('orders').update({
        payment_status: 'PAID',
        payment_method: paymentMethod,
        payments: JSON.stringify(payments),
        status: 'COMPLETED',
        completed_at: completedAt,
      }).eq('id', orderId);
      if (error) throw new Error(error.message || 'Error settling order');
      break;
    }
    case 'UPDATE_ORDER_STATUS': {
      const { orderId, status } = payload as { orderId: string; status: OrderStatus };
      const { error } = await insforge.database.from('orders').update({ status }).eq('id', orderId);
      if (error) throw new Error(error.message || 'Error updating order status');
      break;
    }
    case 'INSERT_DRAWER_LOG': {
      const log = payload as DrawerLogEntry;
      const { error } = await insforge.database.from('drawer_logs').insert([
        {
          id: log.id,
          reason: log.reason,
          order_number: log.orderNumber || null,
          amount: log.amount || null,
          timestamp: log.timestamp,
        },
      ]);
      if (error) throw new Error(error.message || 'Error inserting drawer log');
      break;
    }
    case 'UPDATE_SETTINGS': {
      const settings = payload as Partial<SystemSettings>;
      const dbSettings: Record<string, unknown> = {};
      if (settings.restaurantName !== undefined) dbSettings.restaurant_name = settings.restaurantName;
      if (settings.tagline !== undefined) dbSettings.tagline = settings.tagline;
      if (settings.currency !== undefined) dbSettings.currency = settings.currency;
      if (settings.currencyCode !== undefined) dbSettings.currency_code = settings.currencyCode;
      if (settings.address !== undefined) dbSettings.address = settings.address;
      if (settings.phone !== undefined) dbSettings.phone = settings.phone;
      if (settings.email !== undefined) dbSettings.email = settings.email;
      if (settings.binNumber !== undefined) dbSettings.bin_number = settings.binNumber;
      if (settings.vatPercent !== undefined) dbSettings.vat_percent = settings.vatPercent;
      if (settings.serviceChargePercent !== undefined) dbSettings.service_charge_percent = settings.serviceChargePercent;
      if (settings.autoKickDrawerOnCash !== undefined) dbSettings.auto_kick_drawer_on_cash = settings.autoKickDrawerOnCash;
      if (settings.drawerKickCodeHex !== undefined) dbSettings.drawer_kick_code_hex = settings.drawerKickCodeHex;
      if (settings.receiptFooterMessage !== undefined) dbSettings.receipt_footer_message = settings.receiptFooterMessage;

      if (Object.keys(dbSettings).length > 0) {
        const { error } = await insforge.database.from('system_settings').update(dbSettings).eq('id', 'GLOBAL_CONFIG');
        if (error) throw new Error(error.message || 'Error updating settings');
      }
      break;
    }
  }
}

// Replays all items in state.outboxQueue in strict FIFO order
async function flushOutboxQueue(): Promise<{ processed: number; failed: number }> {
  if (typeof window === 'undefined') return { processed: 0, failed: 0 };
  if (!navigator.onLine) {
    state.isOnline = false;
    notify();
    return { processed: 0, failed: 0 };
  }
  if (state.isSyncingOutbox) return { processed: 0, failed: 0 };
  if (state.outboxQueue.length === 0) return { processed: 0, failed: 0 };

  state.isSyncingOutbox = true;
  notify();

  let processedCount = 0;
  let failedCount = 0;

  console.log(`[Auto-Replay Engine] Starting queue replay of ${state.outboxQueue.length} pending mutations...`);

  const remainingQueue: OutboxItem[] = [];

  for (let i = 0; i < state.outboxQueue.length; i++) {
    const item = state.outboxQueue[i];
    try {
      await executeDirectMutation(item.type, item.payload);
      processedCount++;
      console.log(`[Auto-Replay Engine] Replayed mutation (${item.type} - ${item.id}) successfully.`);
    } catch (err: any) {
      console.error(`[Auto-Replay Engine] Replay failed for ${item.type} (${item.id}):`, err);
      item.attempts += 1;
      item.lastError = err?.message || String(err);
      failedCount++;
      // Keep remaining items if network is interrupted
      remainingQueue.push(item);

      // If connection was lost during loop, keep the rest for next cycle
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        state.isOnline = false;
        remainingQueue.push(...state.outboxQueue.slice(i + 1));
        break;
      }
    }
  }

  state.outboxQueue = remainingQueue;
  state.isSyncingOutbox = false;
  state.lastSyncTime = new Date().toISOString();
  saveToStorage();
  notify();

  console.log(`[Auto-Replay Engine] Completed sync pass: ${processedCount} processed, ${failedCount} remaining.`);
  return { processed: processedCount, failed: failedCount };
}

// ---------------- ASYNC DATABASE HELPERS (WITH AUTOMATIC OUTBOX FALLBACK) ----------------
async function dbInsertProduct(product: Product) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('INSERT_PRODUCT', product);
    return;
  }
  try {
    await executeDirectMutation('INSERT_PRODUCT', product);
  } catch (err) {
    console.warn('DB Insert Product failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('INSERT_PRODUCT', product);
  }
}

async function dbUpdateProduct(id: string, updates: Partial<Product>) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('UPDATE_PRODUCT', { id, updates });
    return;
  }
  try {
    await executeDirectMutation('UPDATE_PRODUCT', { id, updates });
  } catch (err) {
    console.warn('DB Update Product failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('UPDATE_PRODUCT', { id, updates });
  }
}

async function dbDeleteProduct(id: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('DELETE_PRODUCT', { id });
    return;
  }
  try {
    await executeDirectMutation('DELETE_PRODUCT', { id });
  } catch (err) {
    console.warn('DB Delete Product failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('DELETE_PRODUCT', { id });
  }
}

async function dbInsertCategory(category: Category) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('INSERT_CATEGORY', category);
    return;
  }
  try {
    await executeDirectMutation('INSERT_CATEGORY', category);
  } catch (err) {
    console.warn('DB Insert Category failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('INSERT_CATEGORY', category);
  }
}

async function dbUpdateCategory(id: string, updates: Partial<Category>) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('UPDATE_CATEGORY', { id, updates });
    return;
  }
  try {
    await executeDirectMutation('UPDATE_CATEGORY', { id, updates });
  } catch (err) {
    console.warn('DB Update Category failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('UPDATE_CATEGORY', { id, updates });
  }
}

async function dbDeleteCategory(id: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('DELETE_CATEGORY', { id });
    return;
  }
  try {
    await executeDirectMutation('DELETE_CATEGORY', { id });
  } catch (err) {
    console.warn('DB Delete Category failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('DELETE_CATEGORY', { id });
  }
}

async function dbInsertTable(table: Table) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('INSERT_TABLE', table);
    return;
  }
  try {
    await executeDirectMutation('INSERT_TABLE', table);
  } catch (err) {
    console.warn('DB Insert Table failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('INSERT_TABLE', table);
  }
}

async function dbUpdateTable(tableId: string, status: TableStatus, currentOrderId?: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('UPDATE_TABLE', { tableId, status, currentOrderId });
    return;
  }
  try {
    await executeDirectMutation('UPDATE_TABLE', { tableId, status, currentOrderId });
  } catch (err) {
    console.warn('DB Update Table failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('UPDATE_TABLE', { tableId, status, currentOrderId });
  }
}

async function dbUpdateTableFull(tableId: string, updates: Partial<Table>) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('UPDATE_TABLE_FULL', { tableId, updates });
    return;
  }
  try {
    await executeDirectMutation('UPDATE_TABLE_FULL', { tableId, updates });
  } catch (err) {
    console.warn('DB Full Update Table failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('UPDATE_TABLE_FULL', { tableId, updates });
  }
}

async function dbDeleteTable(tableId: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('DELETE_TABLE', { tableId });
    return;
  }
  try {
    await executeDirectMutation('DELETE_TABLE', { tableId });
  } catch (err) {
    console.warn('DB Delete Table failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('DELETE_TABLE', { tableId });
  }
}

async function dbInsertCustomer(customer: Customer) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('INSERT_CUSTOMER', customer);
    return;
  }
  try {
    await executeDirectMutation('INSERT_CUSTOMER', customer);
  } catch (err) {
    console.warn('DB Insert Customer failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('INSERT_CUSTOMER', customer);
  }
}

async function dbUpdateCustomer(customerId: string, customer: Customer) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('UPDATE_CUSTOMER', { customerId, customer });
    return;
  }
  try {
    await executeDirectMutation('UPDATE_CUSTOMER', { customerId, customer });
  } catch (err) {
    console.warn('DB Update Customer failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('UPDATE_CUSTOMER', { customerId, customer });
  }
}

async function dbInsertOrder(order: Order) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('INSERT_ORDER', order);
    return;
  }
  try {
    await executeDirectMutation('INSERT_ORDER', order);
  } catch (err) {
    console.warn('DB Insert Order failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('INSERT_ORDER', order);
  }
}

async function dbSettleOrder(orderId: string, paymentMethod: PaymentMethod, payments: unknown, completedAt: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('SETTLE_ORDER', { orderId, paymentMethod, payments, completedAt });
    return;
  }
  try {
    await executeDirectMutation('SETTLE_ORDER', { orderId, paymentMethod, payments, completedAt });
  } catch (err) {
    console.warn('DB Settle Order failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('SETTLE_ORDER', { orderId, paymentMethod, payments, completedAt });
  }
}

async function dbUpdateOrderStatus(orderId: string, status: OrderStatus) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('UPDATE_ORDER_STATUS', { orderId, status });
    return;
  }
  try {
    await executeDirectMutation('UPDATE_ORDER_STATUS', { orderId, status });
  } catch (err) {
    console.warn('DB Update Order Status failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('UPDATE_ORDER_STATUS', { orderId, status });
  }
}

async function dbInsertDrawerLog(log: DrawerLogEntry) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('INSERT_DRAWER_LOG', log);
    return;
  }
  try {
    await executeDirectMutation('INSERT_DRAWER_LOG', log);
  } catch (err) {
    console.warn('DB Insert Drawer Log failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('INSERT_DRAWER_LOG', log);
  }
}

async function dbUpdateSettings(settings: Partial<SystemSettings>) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOutboxMutation('UPDATE_SETTINGS', settings);
    return;
  }
  try {
    await executeDirectMutation('UPDATE_SETTINGS', settings);
  } catch (err) {
    console.warn('DB Update Settings failed, enqueuing to Outbox:', err);
    enqueueOutboxMutation('UPDATE_SETTINGS', settings);
  }
}

// ---------------- INSFORGE DATABASE LIVE SYNC ----------------
async function syncFromDatabase() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    state.isOnline = false;
    notify();
    return;
  }

  try {
    const [
      { data: categoriesData },
      { data: productsData },
      { data: tablesData },
      { data: customersData },
      { data: ordersData },
      { data: orderItemsData },
      { data: drawerLogsData },
    ] = await Promise.all([
      insforge.database.from('categories').select(),
      insforge.database.from('products').select(),
      insforge.database.from('dining_tables').select(),
      insforge.database.from('customers').select(),
      insforge.database.from('orders').select().order('created_at', { ascending: false }),
      insforge.database.from('order_items').select(),
      insforge.database.from('drawer_logs').select().order('timestamp', { ascending: false }).limit(50),
    ]);

    state.isOnline = true;
    state.lastSyncTime = new Date().toISOString();

    if (categoriesData && categoriesData.length > 0) {
      state.categories = (categoriesData as DbCategory[]).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || undefined,
        iconName: c.icon_name || 'UtensilsCrossed',
        sortOrder: c.sort_order || 1,
        isActive: c.is_active ?? true,
      }));
    }

    if (productsData && productsData.length > 0) {
      state.products = (productsData as DbProduct[]).map(mapDbProduct);
    }

    if (tablesData && tablesData.length > 0) {
      state.tables = (tablesData as DbTable[]).map(mapDbTable);
    }

    if (customersData && customersData.length > 0) {
      state.customers = (customersData as DbCustomer[]).map(mapDbCustomer);
    }

    if (ordersData && ordersData.length > 0) {
      const itemsList = (orderItemsData || []) as DbOrderItem[];
      const itemsByOrderId = new Map<string, OrderItem[]>();

      itemsList.forEach((it) => {
        const mapped = mapDbOrderItem(it);
        const existing = itemsByOrderId.get(it.order_id) || [];
        existing.push(mapped);
        itemsByOrderId.set(it.order_id, existing);
      });

      state.orders = (ordersData as DbOrder[]).map((o) =>
        mapDbOrder(o, itemsByOrderId.get(o.id) || [])
      );
    }

    if (drawerLogsData && drawerLogsData.length > 0) {
      state.drawerLogs = (drawerLogsData as DbDrawerLog[]).map((d) => ({
        id: d.id,
        reason: d.reason,
        orderNumber: d.order_number || undefined,
        amount: d.amount ? Number(d.amount) : undefined,
        timestamp: d.timestamp,
      }));
    }

    saveToStorage();
    notify();
  } catch (err) {
    console.warn('InsForge database sync warning (using cached local data):', err);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      state.isOnline = false;
      notify();
    }
  }
}

// Calculate customer Tier dynamically based on total spend in BDT
export function calculateTier(totalSpent: number, settings: SystemSettings): LoyaltyTier {
  if (totalSpent >= settings.tierSpendThresholds.ROYAL) return 'ROYAL';
  if (totalSpent >= settings.tierSpendThresholds.GOLD) return 'GOLD';
  if (totalSpent >= settings.tierSpendThresholds.SILVER) return 'SILVER';
  return 'BRONZE';
}

export function calculatePointsEarned(amount: number, tier: LoyaltyTier, settings: SystemSettings): number {
  const rate = settings.loyaltyPointsPer100BDT[tier] || 1;
  return Math.floor((amount / 100) * rate);
}

let networkListenersAttached = false;

export const restaurantStore = {
  getSnapshot() {
    return state;
  },

  init() {
    if (!state.initialized) {
      loadFromStorage();
      syncFromDatabase();
    }

    if (typeof window !== 'undefined' && !networkListenersAttached) {
      networkListenersAttached = true;

      const handleOnline = () => {
        console.log('[Network Monitor] Connection restored. Replaying outbox mutations and syncing...');
        state.isOnline = true;
        notify();
        restaurantStore.flushOutbox();
        restaurantStore.syncFromDatabase();
      };

      const handleOffline = () => {
        console.warn('[Network Monitor] Connection lost. Operating in Zero-Latency Offline Outbox Mode.');
        state.isOnline = false;
        notify();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Heartbeat periodic outbox queue retry (every 15 seconds)
      setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine && state.outboxQueue.length > 0 && !state.isSyncingOutbox) {
          restaurantStore.flushOutbox();
        }
      }, 15000);
    }
  },

  async flushOutbox() {
    return await flushOutboxQueue();
  },

  async syncFromDatabase() {
    return await syncFromDatabase();
  },

  // ---------------- PRODUCT CRUD ----------------
  addProduct(product: Omit<Product, 'id'>) {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    state.products = [newProduct, ...state.products];
    saveToStorage();
    notify();

    dbInsertProduct(newProduct);
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>) {
    state.products = state.products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    saveToStorage();
    notify();

    dbUpdateProduct(id, updates);
  },

  toggleProductAvailability(id: string) {
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    const nextVal = !product.isAvailable;

    state.products = state.products.map((p) => (p.id === id ? { ...p, isAvailable: nextVal } : p));
    saveToStorage();
    notify();

    dbUpdateProduct(id, { isAvailable: nextVal });
  },

  deleteProduct(id: string) {
    state.products = state.products.filter((p) => p.id !== id);
    saveToStorage();
    notify();

    dbDeleteProduct(id);
  },

  // ---------------- CATEGORY CRUD ----------------
  addCategory(category: Omit<Category, 'id'>) {
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    state.categories = [...state.categories, newCat];
    saveToStorage();
    notify();

    dbInsertCategory(newCat);
    return newCat;
  },

  updateCategory(id: string, updates: Partial<Category>) {
    state.categories = state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveToStorage();
    notify();

    dbUpdateCategory(id, updates);
  },

  deleteCategory(id: string) {
    state.categories = state.categories.filter((c) => c.id !== id);
    saveToStorage();
    notify();

    dbDeleteCategory(id);
  },

  // ---------------- TABLE CRUD ----------------
  updateTableStatus(tableId: string, status: TableStatus, currentOrderId?: string) {
    state.tables = state.tables.map((t) => (t.id === tableId ? { ...t, status, currentOrderId } : t));
    saveToStorage();
    notify();

    dbUpdateTable(tableId, status, currentOrderId);
  },

  addTable(table: Omit<Table, 'id'>) {
    const newTable: Table = {
      ...table,
      id: `tbl-${Date.now()}`,
    };
    state.tables = [...state.tables, newTable];
    saveToStorage();
    notify();

    dbInsertTable(newTable);
    return newTable;
  },

  updateTable(id: string, updates: Partial<Table>) {
    state.tables = state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveToStorage();
    notify();

    dbUpdateTableFull(id, updates);
  },

  deleteTable(id: string) {
    state.tables = state.tables.filter((t) => t.id !== id);
    saveToStorage();
    notify();

    dbDeleteTable(id);
  },

  // ---------------- CUSTOMER & LOYALTY CRUD ----------------
  addCustomer(customerData: Omit<Customer, 'id' | 'tier' | 'pointsBalance' | 'totalSpent' | 'visitCount' | 'joinedAt'>) {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      tier: 'BRONZE',
      pointsBalance: 50, // Welcome bonus points (৳50 value)
      totalSpent: 0,
      visitCount: 0,
      joinedAt: new Date().toISOString(),
    };
    state.customers = [newCustomer, ...state.customers];
    saveToStorage();
    notify();

    dbInsertCustomer(newCustomer);
    return newCustomer;
  },

  updateCustomerPoints(customerId: string, pointsDelta: number, spendDelta: number = 0) {
    let updatedCustomer: Customer | undefined;

    state.customers = state.customers.map((cust) => {
      if (cust.id !== customerId) return cust;

      const updatedSpent = Math.max(0, cust.totalSpent + spendDelta);
      const updatedPoints = Math.max(0, cust.pointsBalance + pointsDelta);
      const updatedVisits = spendDelta > 0 ? cust.visitCount + 1 : cust.visitCount;
      const updatedTier = calculateTier(updatedSpent, state.settings);

      updatedCustomer = {
        ...cust,
        totalSpent: updatedSpent,
        pointsBalance: updatedPoints,
        visitCount: updatedVisits,
        tier: updatedTier,
      };

      return updatedCustomer;
    });

    saveToStorage();
    notify();

    if (updatedCustomer) {
      dbUpdateCustomer(customerId, updatedCustomer);
    }
  },

  findCustomerByPhone(phone: string): Customer | undefined {
    const cleaned = phone.replace(/[\s-]/g, '');
    return state.customers.find((c) => c.phone.replace(/[\s-]/g, '').includes(cleaned));
  },

  // ---------------- ORDERS & POS SETTLEMENT ----------------
  createOrder(orderData: {
    orderType: Order['orderType'];
    tableId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    items: OrderItem[];
    discountAmount?: number;
    tipAmount?: number;
    notes?: string;
    pointsToRedeem?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
  }): Order {
    const subtotal = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = 0;
    const isDineIn = orderData.orderType === 'DINE_IN';
    const serviceChargeAmount = 0;
    const discountAmount = orderData.discountAmount || 0;
    const pointsToRedeem = orderData.pointsToRedeem || 0;
    const pointsDiscountValue = pointsToRedeem * state.settings.loyaltyRedemptionRate;

    const totalAmount = Math.max(
      0,
      subtotal + (orderData.tipAmount || 0) - discountAmount - pointsDiscountValue
    );

    let customer: Customer | undefined;
    if (orderData.customerId) {
      customer = state.customers.find((c) => c.id === orderData.customerId);
    } else if (orderData.customerPhone && orderData.customerPhone.replace(/[\s-]/g, '').length >= 11) {
      const cleanPhone = orderData.customerPhone.trim();
      const existing = state.customers.find((c) => c.phone.replace(/[\s-]/g, '') === cleanPhone.replace(/[\s-]/g, ''));
      if (existing) {
        customer = existing;
      } else {
        customer = restaurantStore.addCustomer({
          name: orderData.customerName || `Guest ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
        });
      }
    }

    const tier: LoyaltyTier = customer?.tier || 'BRONZE';
    const pointsEarned = calculatePointsEarned(totalAmount, tier, state.settings);

    let tableObj: Table | undefined;
    if (orderData.tableId) {
      tableObj = state.tables.find((t) => t.id === orderData.tableId);
    }

    const status: OrderStatus = orderData.status || (orderData.paymentMethod ? 'COMPLETED' : 'PENDING');
    const paymentStatus: PaymentStatus = orderData.paymentStatus || (orderData.paymentMethod ? 'PAID' : 'UNPAID');
    const completedAt = (status === 'COMPLETED' || paymentStatus === 'PAID') ? new Date().toISOString() : undefined;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `TRP-${1000 + state.orders.length + 1}`,
      orderType: orderData.orderType,
      tableId: orderData.tableId,
      tableNumber: tableObj?.tableNumber,
      status,
      customerId: customer?.id || orderData.customerId,
      customerName: customer?.name || orderData.customerName,
      customerPhone: customer?.phone || orderData.customerPhone,
      items: orderData.items,
      subtotal,
      discountAmount,
      taxAmount,
      serviceChargeAmount,
      tipAmount: orderData.tipAmount || 0,
      totalAmount,
      pointsEarned,
      pointsRedeemed: pointsToRedeem,
      pointsDiscountValue,
      paymentStatus,
      paymentMethod: orderData.paymentMethod || undefined,
      payments: orderData.paymentMethod ? [{ method: orderData.paymentMethod, amount: totalAmount }] : undefined,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
      completedAt,
    };

    state.orders = [newOrder, ...state.orders];

    // If assigned to a table, update table status
    if (orderData.tableId) {
      if (status === 'COMPLETED') {
        restaurantStore.updateTableStatus(orderData.tableId, 'AVAILABLE', undefined);
      } else {
        restaurantStore.updateTableStatus(orderData.tableId, 'OCCUPIED', newOrder.id);
      }
    }

    // If order was created directly as settled/paid, process points & cash drawer immediately
    if (status === 'COMPLETED' && newOrder.customerId) {
      const netPointsChange = newOrder.pointsEarned - newOrder.pointsRedeemed;
      restaurantStore.updateCustomerPoints(newOrder.customerId, netPointsChange, newOrder.totalAmount);
    }

    if (status === 'COMPLETED' && newOrder.paymentMethod === 'CASH' && state.settings.autoKickDrawerOnCash) {
      restaurantStore.kickDrawer(`Settled Order #${newOrder.orderNumber}`, newOrder.orderNumber, newOrder.totalAmount);
    }

    saveToStorage();
    notify();

    // Persist Order and Items directly with COMPLETED & PAID status to InsForge Postgres DB
    dbInsertOrder(newOrder);

    return newOrder;
  },

  settleOrder(params: {
    orderId: string;
    paymentMethod: PaymentMethod;
    payments?: { method: PaymentMethod; amount: number; reference?: string }[];
  }) {
    const { orderId, paymentMethod, payments } = params;
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const completedAt = new Date().toISOString();
    const finalPayments = payments || [{ method: paymentMethod, amount: order.totalAmount }];

    state.orders = state.orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        paymentStatus: 'PAID' as PaymentStatus,
        paymentMethod,
        payments: finalPayments,
        status: 'COMPLETED' as OrderStatus,
        completedAt,
      };
    });

    // Update table status to AVAILABLE
    if (order.tableId) {
      restaurantStore.updateTableStatus(order.tableId, 'AVAILABLE', undefined);
    }

    // Process Loyalty Points
    if (order.customerId) {
      const netPointsChange = order.pointsEarned - order.pointsRedeemed;
      restaurantStore.updateCustomerPoints(order.customerId, netPointsChange, order.totalAmount);
    }

    // Trigger Digital Cash Drawer if Cash Payment and setting enabled
    const hasCash = paymentMethod === 'CASH' || payments?.some((p) => p.method === 'CASH');
    if (hasCash && state.settings.autoKickDrawerOnCash) {
      restaurantStore.kickDrawer(`Settled Order #${order.orderNumber}`, order.orderNumber, order.totalAmount);
    }

    saveToStorage();
    notify();

    // Persist Settlement updates to InsForge Postgres DB
    dbSettleOrder(orderId, paymentMethod, finalPayments, completedAt);
  },

  updateOrderStatus(orderId: string, status: OrderStatus) {
    state.orders = state.orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    saveToStorage();
    notify();

    dbUpdateOrderStatus(orderId, status);
  },

  // ---------------- DIGITAL CASH DRAWER ACTIONS ----------------
  async kickDrawer(reason: string = 'Manual Staff Override', orderNumber?: string, amount?: number) {
    await triggerCashDrawer({ reason, orderNumber, amount, playSound: true });

    const newLog: DrawerLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reason,
      orderNumber,
      amount,
    };

    state.drawerLogs = [newLog, ...state.drawerLogs.slice(0, 49)];
    saveToStorage();
    notify();

    dbInsertDrawerLog(newLog);
  },

  // ---------------- SETTINGS ----------------
  updateSettings(newSettings: Partial<SystemSettings>) {
    state.settings = { ...state.settings, ...newSettings };
    saveToStorage();
    notify();

    dbUpdateSettings(newSettings);
  },

  resetToDefaultSeed() {
    state.products = INITIAL_PRODUCTS;
    state.categories = INITIAL_CATEGORIES;
    state.tables = INITIAL_TABLES;
    state.customers = [];
    state.orders = [];
    state.settings = INITIAL_SETTINGS;
    state.drawerLogs = [];
    saveToStorage();
    notify();
  },
};

export function useRestaurantStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    restaurantStore.init();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...state,
    ...restaurantStore,
  };
}
