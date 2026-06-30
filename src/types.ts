/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  image: string;
  weight: string;
  netContent: string;
  description: string;
  ingredients?: string;
  rating: number;
  reviews: Review[];
  stock: number;
  rackLocation: string;
  productionDate: string;
  expiredDate?: string;
  priceHistory?: { date: string; price: number }[];
  competitorPrices?: { store: string; price: number }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 
  | 'QRIS' 
  | 'DANA' 
  | 'OVO' 
  | 'GOPAY' 
  | 'SHOPEEPAY' 
  | 'LINKAJA' 
  | 'VA' 
  | 'BANK_TRANSFER' 
  | 'DEBIT' 
  | 'CREDIT' 
  | 'COD' 
  | 'CASH';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  discount: number;
  voucherCode?: string;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
}

export interface ScanHistory {
  id: string;
  barcode: string;
  productName?: string;
  timestamp: string;
  scannedBy: string;
  status: 'SUCCESS' | 'NOT_FOUND';
  mode: 'CAMERA' | 'AI' | 'MANUAL';
}

export interface PaymentHistory {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  timestamp: string;
}

export interface LoginHistory {
  id: string;
  username: string;
  role: 'Admin' | 'Kasir' | 'Member';
  timestamp: string;
  device: string;
  ip: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
}

export type MemberLevel = 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface Coupon {
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  expiryDate: string;
  isUsed: boolean;
}

export interface MemberProfile {
  username: string;
  email: string;
  phone: string;
  role: 'Member';
  level: MemberLevel;
  points: number;
  cashbackBalance: number;
  totalSpent: number;
  nextLevelProgress: number; // percentage 0 - 100
  coupons: Coupon[];
  scansCount: number;
}

export interface UserSession {
  username: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Kasir' | 'Member';
  token: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'promo';
  timestamp: string;
  read: boolean;
}
