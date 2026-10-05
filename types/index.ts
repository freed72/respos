export type DietaryTag = 
  | 'CHEF_SPECIAL'
  | 'POPULAR'
  | 'HALAL'
  | 'VEGETARIAN'
  | 'VEGAN'
  | 'GLUTEN_FREE'
  | 'SPICY'
  | 'EXTRA_SPICY';

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number; // in BDT (৳)
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  banglaName?: string;
  description: string;
  categoryId: string;
  price: number; // in BDT (৳)
  costPrice: number;
  imageUrl: string;
  dietaryTags: DietaryTag[];
  isAvailable: boolean;
  preparationTimeMinutes: number;
  modifierGroups?: ModifierGroup[];
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILLING' | 'RESERVED' | 'CLEANING';
export type TableSection = 'INDOOR' | 'VIP_ROYAL' | 'TERRACE' | 'GARDEN';

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  section: TableSection;
  status: TableStatus;
  currentOrderId?: string;
}

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'ROYAL';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: LoyaltyTier;
  pointsBalance: number;
  totalSpent: number; // in BDT (৳)
  visitCount: number;
  joinedAt: string;
  birthDate?: string;
  notes?: string;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BKASH' | 'NAGAD' | 'LOYALTY_POINTS' | 'SPLIT';

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedModifiers?: SelectedModifier[];
  specialInstructions?: string;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableId?: string;
  tableNumber?: string;
  status: OrderStatus;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number; // ৳
  discountAmount: number; // ৳
  taxAmount: number; // ৳
  serviceChargeAmount: number; // ৳
  tipAmount: number; // ৳
  totalAmount: number; // ৳
  pointsEarned: number;
  pointsRedeemed: number;
  pointsDiscountValue: number; // ৳ value reduced by loyalty points
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  payments?: {
    method: PaymentMethod;
    amount: number;
    reference?: string;
  }[];
  notes?: string;
  createdAt: string;
  completedAt?: string;
  serverName?: string;
}

export interface SystemSettings {
  restaurantName: string;
  tagline: string;
  currency: string; // '৳'
  currencyCode: string; // 'BDT'
  address: string;
  phone: string;
  email: string;
  binNumber: string; // Business Identification Number
  vatPercent: number; // e.g. 5% or 7.5% in BD
  serviceChargePercent: number; // e.g. 10%
  // Loyalty Engine settings:
  loyaltyPointsPer100BDT: {
    BRONZE: number; // e.g. 1 pt per ৳100
    SILVER: number; // e.g. 1.5 pt per ৳100
    GOLD: number; // e.g. 2 pt per ৳100
    ROYAL: number; // e.g. 3 pt per ৳100
  };
  loyaltyRedemptionRate: number; // 1 point = ৳1 BDT discount
  tierSpendThresholds: {
    SILVER: number; // ৳10,000
    GOLD: number; // ৳30,000
    ROYAL: number; // ৳75,000
  };
  // Hardware settings:
  printerType: 'WEB_USB' | 'WEB_SERIAL' | 'BROWSER_DIALOG' | 'LOCAL_WS';
  autoKickDrawerOnCash: boolean;
  drawerKickCodeHex: string; // "1B 70 00 19 FA"
  receiptFooterMessage: string;
}
