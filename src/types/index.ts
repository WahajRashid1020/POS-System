// ==========================================
// MENU
// ==========================================
export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string; // Category ID
  description?: string;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number; // minutes
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// ORDERS
// ==========================================
export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderType = "dine-in" | "takeaway" | "delivery";

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  price: number; // price at time of order
}

export interface Order {
  _id: string;
  orderNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  type: OrderType;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: "cash" | "card" | "online";
  customerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ==========================================
// CART (client-side state)
// ==========================================
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  type: OrderType;
  customerName?: string;
  notes?: string;
}

// ==========================================
// USER / AUTH
// ==========================================
export type UserRole = "admin" | "manager" | "cashier" | "kitchen";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  isActive: boolean;
  createdAt: Date;
}

// ==========================================
// REPORTS
// ==========================================
export interface DailySummary {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  ordersByHour: { hour: number; count: number }[];
  ordersByType: { type: OrderType; count: number }[];
}

// ==========================================
// AI CHAT
// ==========================================
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
