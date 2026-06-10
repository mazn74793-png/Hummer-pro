/**
 * Shared Type Definitions for Hummer Crepes & Fried Chicken App
 */

export type FoodCategory = 'fried-chicken' | 'crepes' | 'combos' | 'sides' | 'drinks';

export interface SizeOption {
  id: string;
  nameAr: string;
  nameEn: string;
  extraPrice: number;
}

export interface MenuItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  image: string;
  category: FoodCategory;
  spicyOption?: boolean;
  tags?: string[];
  sizes?: SizeOption[];
  isCustomizable?: boolean;
}

export interface CartItem {
  id: string; // Dynamic unique ID incorporating choices
  menuItemId: string;
  nameAr: string;
  nameEn: string;
  basePrice: number;
  pricePerUnit: number;
  quantity: number;
  selectedSize?: string;
  selectedSizeAr?: string;
  isSpicy?: boolean;
  notes?: string;
  customizations?: {
    nameAr: string;
    nameEn: string;
    price: number;
  }[];
}

export interface CustomCrepeSelection {
  base: string; // e.g., 'sweet' or 'savory'
  fillings: string[]; // e.g., 'crispy-chicken', 'shish-tawook', 'pane', 'mix-cheese', 'nutella'
  toppings: string[]; // e.g., 'mozzarella', 'olives', 'peppers', 'tomatoes', 'jalapeno'
  sauces: string[]; // e.g., 'ketchup', 'mayo', 'hummer-secret', 'ranch', 'bbq'
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  badge: 'عاشق الكريبات' | 'ملك المقرمشات' | 'هامر الأكيل' | 'زبون دائم';
}

export type OrderStep = 'received' | 'cooking' | 'wrapping' | 'delivering' | 'completed';

export interface OrderState {
  id: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  paymentMethod: 'cash' | 'card';
  items: CartItem[];
  discountAmount: number;
  deliveryFee: number;
  totalPrice: number;
  status: OrderStep;
  createdAt: string;
  estimatedMinutes: number;
  captainName: string;
  scheduledDeliveryTime?: string;
  userId?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  couponCode?: string;
}

export interface Branch {
  id: string;
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  deliveryHotline?: string;
  hoursAr: string;
  hoursEn: string;
}

export interface SiteSettings {
  heroTitleAr: string;
  heroTitleEn: string;
  heroSubAr: string;
  heroSubEn: string;
  heroBadgeAr: string;
  heroBadgeEn: string;
  deliveryTimeAr: string;
  deliveryTimeEn: string;
  deliveryTimeSubAr: string;
  deliveryTimeSubEn: string;
  hotline: string;
  addressSummaryAr: string;
  addressSummaryEn: string;
  deliveryNoticeAr: string;
  deliveryNoticeEn: string;
  footerDescAr: string;
  footerDescEn: string;
  promoBannerAr: string;
  promoBannerEn: string;
  logoUrl?: string;
  introVideoUrl?: string;
  disableIntro?: boolean;
  systemApiKey?: string;
  systemWebhookUrl?: string;
  coupons?: DbCoupon[];
}

export interface DbCoupon {
  code: string;
  discountPercent: number;
  limit: number;
  usedCount: number;
  expiryDate: string; // YYYY-MM-DD format
  giftType: 'discount' | 'gift';
  giftItem?: string; // e.g. PEPSI, FRIES, etc.
}

export interface ProductComment {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}


