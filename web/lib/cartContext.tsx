'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Restaurant, CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  currentRestaurant: Restaurant | null;
  addToCart: (item: MenuItem, restaurant: Restaurant) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bargarh_cart');
    const savedRest = localStorage.getItem('bargarh_cart_restaurant');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
    }
    if (savedRest) {
      try {
        setCurrentRestaurant(JSON.parse(savedRest));
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  const saveCart = (newItems: CartItem[], rest: Restaurant | null) => {
    setItems(newItems);
    setCurrentRestaurant(rest);
    localStorage.setItem('bargarh_cart', JSON.stringify(newItems));
    if (rest) {
      localStorage.setItem('bargarh_cart_restaurant', JSON.stringify(rest));
    } else {
      localStorage.removeItem('bargarh_cart_restaurant');
    }
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    // If cart has items from another restaurant, prompt or reset to enforce single-restaurant order
    if (currentRestaurant && currentRestaurant.id !== restaurant.id) {
      if (
        !confirm(
          `Your cart contains items from "${currentRestaurant.name}". Reset cart to add items from "${restaurant.name}"?`
        )
      ) {
        return;
      }
      const newItems: CartItem[] = [
        {
          menuItem: item,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          quantity: 1,
        },
      ];
      saveCart(newItems, restaurant);
      return;
    }

    const existingIdx = items.findIndex((i) => i.menuItem.id === item.id);
    let newItems = [...items];
    if (existingIdx >= 0) {
      newItems[existingIdx].quantity += 1;
    } else {
      newItems.push({
        menuItem: item,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        quantity: 1,
      });
    }
    saveCart(newItems, restaurant);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    let newItems = items
      .map((i) => {
        if (i.menuItem.id === itemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      })
      .filter(Boolean) as CartItem[];

    saveCart(newItems, newItems.length === 0 ? null : currentRestaurant);
  };

  const removeFromCart = (itemId: string) => {
    const newItems = items.filter((i) => i.menuItem.id !== itemId);
    saveCart(newItems, newItems.length === 0 ? null : currentRestaurant);
  };

  const clearCart = () => {
    saveCart([], null);
  };

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        currentRestaurant,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
