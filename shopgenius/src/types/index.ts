export type { Database } from "./database";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  categoryId?: string;
  merchantId: string;
  images: string[];
  processedImages: string[];
  audioDescriptionUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  merchantId: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded";
  totalAmount: number;
  stripePaymentIntentId?: string;
  items: OrderItem[];
  shippingAddress: Address;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Merchant {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  description?: string;
  logoUrl?: string;
  plan: "starter" | "pro" | "enterprise";
  subscriptionStatus?: string;
}

export interface UserProfile {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  email: string;
  role: "customer" | "merchant" | "admin";
}
