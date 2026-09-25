import { supabase, isSupabaseConfigured } from './supabase/client';
import { INITIAL_RESTAURANTS, INITIAL_MENU_ITEMS, INITIAL_ORDERS } from './mockData';
import { Restaurant, MenuItem, Order, CartItem, AuditLog } from '@/types';

// Browser storage fallback keys
const STORAGE_KEYS = {
  RESTAURANTS: 'bargarh_restaurants',
  MENU_ITEMS: 'bargarh_menu_items',
  ORDERS: 'bargarh_orders',
  AUDIT_LOGS: 'bargarh_audit_logs',
};

const getLocal = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(item);
  } catch {
    return defaultVal;
  }
};

const setLocal = <T>(key: string, val: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

export const dataService = {
  // --- Restaurants ---
  async getActiveRestaurants(): Promise<Restaurant[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('is_active', true);
        if (!error && data && data.length > 0) return data as Restaurant[];
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local data', err);
      }
    }
    const all = getLocal<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
    return all.filter((r) => r.is_active);
  },

  async getAllRestaurants(): Promise<Restaurant[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('restaurants').select('*');
        if (!error && data && data.length > 0) return data as Restaurant[];
      } catch (err) {
        console.warn('Supabase fetch failed', err);
      }
    }
    return getLocal<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const list = await this.getAllRestaurants();
    return list.find((r) => r.id === id) || null;
  },

  async saveRestaurant(restaurant: Restaurant): Promise<Restaurant> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('restaurants').upsert(restaurant).select().single();
        if (data) return data as Restaurant;
      } catch (e) {
        console.warn(e);
      }
    }
    const all = getLocal<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_RESTAURANTS);
    const idx = all.findIndex((r) => r.id === restaurant.id);
    if (idx >= 0) {
      all[idx] = restaurant;
    } else {
      all.push(restaurant);
    }
    setLocal(STORAGE_KEYS.RESTAURANTS, all);
    return restaurant;
  },

  // --- Menu Items ---
  async getMenuItemsByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantId);
        if (!error && data) return data as MenuItem[];
      } catch (e) {
        console.warn(e);
      }
    }
    const all = getLocal<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
    return all.filter((item) => item.restaurant_id === restaurantId);
  },

  async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('menu_items').upsert(item).select().single();
        if (data) return data as MenuItem;
      } catch (e) {
        console.warn(e);
      }
    }
    const all = getLocal<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
    const idx = all.findIndex((m) => m.id === item.id);
    if (idx >= 0) {
      all[idx] = item;
    } else {
      all.push(item);
    }
    setLocal(STORAGE_KEYS.MENU_ITEMS, all);
    return item;
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('menu_items').delete().eq('id', id);
      } catch (e) {
        console.warn(e);
      }
    }
    const all = getLocal<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
    const filtered = all.filter((m) => m.id !== id);
    setLocal(STORAGE_KEYS.MENU_ITEMS, filtered);
    return true;
  },

  // --- Orders ---
  async createGuestOrder(
    restaurant: Restaurant,
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    deliveryNotes: string,
    cartItems: CartItem[]
  ): Promise<Order> {
    // Generate unique human-readable order ID for Bargarh e.g. BF-74892
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderId = `BF-${randomSuffix}`;

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
    const deliveryFee = restaurant.delivery_fee || 0;
    const totalAmount = subtotal + deliveryFee;

    // Snapshot item names & purchase price so future menu price updates NEVER alter historical orders!
    const orderItems = cartItems.map((ci) => ({
      item_name: ci.menuItem.name,
      unit_price: ci.menuItem.price,
      quantity: ci.quantity,
      subtotal: ci.menuItem.price * ci.quantity,
    }));

    const newOrder: Order = {
      id: orderId,
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      delivery_notes: deliveryNotes,
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      payment_method: 'CASH_ON_DELIVERY',
      order_status: 'NEW',
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').insert({
          id: newOrder.id,
          restaurant_id: newOrder.restaurant_id,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          delivery_address: newOrder.delivery_address,
          delivery_notes: newOrder.delivery_notes,
          subtotal: newOrder.subtotal,
          delivery_fee: newOrder.delivery_fee,
          total_amount: newOrder.total_amount,
          payment_method: newOrder.payment_method,
          order_status: newOrder.order_status,
        });

        // Insert order items snapshot
        const itemsToInsert = orderItems.map((item) => ({
          order_id: newOrder.id,
          item_name: item.item_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        }));
        await supabase.from('order_items').insert(itemsToInsert);
      } catch (e) {
        console.warn('Supabase order creation failed, persisting locally', e);
      }
    }

    const allOrders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    allOrders.unshift(newOrder);
    setLocal(STORAGE_KEYS.ORDERS, allOrders);

    return newOrder;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            restaurant_id: data.restaurant_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            delivery_address: data.delivery_address,
            delivery_notes: data.delivery_notes,
            subtotal: Number(data.subtotal),
            delivery_fee: Number(data.delivery_fee),
            total_amount: Number(data.total_amount),
            payment_method: data.payment_method,
            order_status: data.order_status,
            created_at: data.created_at,
            items: data.order_items?.map((oi: any) => ({
              item_name: oi.item_name,
              unit_price: Number(oi.unit_price),
              quantity: oi.quantity,
              subtotal: Number(oi.subtotal),
            })),
          };
        }
      } catch (e) {
        console.warn(e);
      }
    }
    const all = getLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return all.find((o) => o.id.toUpperCase() === orderId.toUpperCase()) || null;
  },

  // Owner specific orders (STRICT ISOLATION)
  async getOrdersForRestaurant(restaurantId: string): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });
        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            restaurant_id: d.restaurant_id,
            customer_name: d.customer_name,
            customer_phone: d.customer_phone,
            delivery_address: d.delivery_address,
            delivery_notes: d.delivery_notes,
            subtotal: Number(d.subtotal),
            delivery_fee: Number(d.delivery_fee),
            total_amount: Number(d.total_amount),
            payment_method: d.payment_method,
            order_status: d.order_status,
            created_at: d.created_at,
            items: d.order_items || [],
          }));
        }
      } catch (e) {
        console.warn(e);
      }
    }
    const all = getLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return all.filter((o) => o.restaurant_id === restaurantId);
  },

  async getAllOrders(): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });
        if (data) return data;
      } catch (e) {
        console.warn(e);
      }
    }
    return getLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  async updateOrderStatus(orderId: string, status: Order['order_status']): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
      } catch (e) {
        console.warn(e);
      }
    }
    const all = getLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const order = all.find((o) => o.id === orderId);
    if (order) {
      order.order_status = status;
      setLocal(STORAGE_KEYS.ORDERS, all);
      return true;
    }
    return false;
  },

  // Audit Log
  async recordAudit(action: string, entityType: string, entityId: string, details?: any) {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('audit_logs').insert(log);
      } catch (e) {
        console.warn(e);
      }
    }
    const logs = getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift(log);
    setLocal(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) return data;
      } catch (e) {
        console.warn(e);
      }
    }
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },
};
