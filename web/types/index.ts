export type UserRole = 'admin' | 'owner' | 'customer';

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  city_id: string;
  cover_image_url?: string;
  logo_url?: string;
  is_active: boolean;
  is_featured: boolean;
  delivery_available: boolean;
  pickup_available: boolean;
  delivery_fee: number;
  min_order_amount: number;
  opening_hours: string;
  commission_percentage: number;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  category_name: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_veg: boolean;
  created_at?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string; // e.g. BF-10948
  restaurant_id: string;
  restaurant_name?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_notes?: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: 'CASH_ON_DELIVERY';
  order_status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  performed_by?: string;
  details?: Record<string, unknown>;
  created_at: string;
}
