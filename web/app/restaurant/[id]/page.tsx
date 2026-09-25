'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/dataService';
import { useCart } from '@/lib/cartContext';
import { Restaurant, MenuItem } from '@/types';

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const restaurantId = resolvedParams.id;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { addToCart, items, updateQuantity, totalCount, subtotal } = useCart();

  useEffect(() => {
    async function load() {
      const rest = await dataService.getRestaurantById(restaurantId);
      const items = await dataService.getMenuItemsByRestaurant(restaurantId);
      setRestaurant(rest);
      setMenuItems(items);
      setLoading(false);
    }
    load();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#49454f]">
        Loading restaurant and menu in Bargarh...
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-[#cac4d0]">
        <h2 className="text-lg font-bold text-[#21005d]">Restaurant Not Found</h2>
        <p className="text-xs text-[#49454f] mt-1">This restaurant is not available or inactive.</p>
        <Link
          href="/"
          className="mt-4 inline-block px-4 py-2 bg-[#6750a4] text-white text-xs font-semibold rounded-full"
        >
          ← Back to Bargarh Restaurants
        </Link>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category_name)))];

  const filteredItems = menuItems.filter((item) => {
    if (!item.is_available) return false;
    if (filterVegOnly && !item.is_veg) return false;
    if (selectedCategory !== 'All' && item.category_name !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#6750a4] hover:underline"
      >
        ← Back to restaurants
      </Link>

      {/* Restaurant Header */}
      <div className="bg-white rounded-3xl overflow-hidden border border-[#cac4d0] shadow-xs">
        <div className="h-48 relative bg-gray-100">
          <img
            src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[11px] font-bold bg-[#6750a4] px-2.5 py-1 rounded-full uppercase tracking-wider">
              {restaurant.category}
            </span>
            <h1 className="text-2xl font-bold mt-1">{restaurant.name}</h1>
            <p className="text-xs text-gray-200 mt-0.5 line-clamp-1">{restaurant.description}</p>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#fdf8ff] border-t border-[#cac4d0] text-xs">
          <div>
            <span className="text-[#79747e] block text-[11px]">Location</span>
            <span className="font-semibold text-[#1c1b1f] truncate block">📍 {restaurant.address}</span>
          </div>
          <div>
            <span className="text-[#79747e] block text-[11px]">Delivery Fee</span>
            <span className="font-semibold text-[#1c1b1f]">₹{restaurant.delivery_fee}</span>
          </div>
          <div>
            <span className="text-[#79747e] block text-[11px]">Min Order</span>
            <span className="font-semibold text-[#1c1b1f]">₹{restaurant.min_order_amount}</span>
          </div>
          <div>
            <span className="text-[#79747e] block text-[11px]">Opening Hours</span>
            <span className="font-semibold text-[#1c1b1f]">{restaurant.opening_hours}</span>
          </div>
        </div>
      </div>

      {/* Filter and Category Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#cac4d0]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#6750a4] text-white'
                  : 'bg-[#f3edf7] text-[#49454f] hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFilterVegOnly(!filterVegOnly)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            filterVegOnly
              ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="text-emerald-600 font-bold">🟢</span>
          <span>Pure Veg Only</span>
        </button>
      </div>

      {/* Menu Item Cards */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#cac4d0]">
            <p className="text-sm text-gray-500">No dishes match the selected filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const inCart = items.find((ci) => ci.menuItem.id === item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-[#cac4d0] shadow-xs flex justify-between gap-4 items-center"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                        item.is_veg
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_veg ? '🟢 VEG' : '🔴 NON-VEG'}
                    </span>
                    <span className="text-[11px] text-[#79747e]">{item.category_name}</span>
                  </div>

                  <h3 className="font-bold text-base text-[#1c1b1f] mt-1">{item.name}</h3>
                  <div className="text-base font-bold text-[#21005d] mt-0.5">₹{item.price}</div>
                  {item.description && (
                    <p className="text-xs text-[#49454f] mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 rounded-2xl object-cover border border-[#cac4d0]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-[#eaddff] flex items-center justify-center text-3xl">
                      🍲
                    </div>
                  )}

                  {inCart ? (
                    <div className="flex items-center bg-[#eaddff] rounded-full px-2 py-1 gap-2 shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-white text-[#21005d] font-bold text-sm flex items-center justify-center active:scale-90"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-[#21005d] px-1">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-white text-[#21005d] font-bold text-sm flex items-center justify-center active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item, restaurant)}
                      className="px-5 py-1.5 bg-[#6750a4] hover:bg-[#523d8c] text-white text-xs font-bold rounded-full shadow-xs active:scale-95 transition-all"
                    >
                      ADD +
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Cart bar at bottom */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40">
          <div className="bg-[#21005d] text-white rounded-3xl p-3.5 px-6 shadow-xl flex items-center justify-between border border-[#eaddff]/20">
            <div>
              <span className="text-xs text-[#eaddff] uppercase tracking-wider block">
                {totalCount} {totalCount === 1 ? 'item' : 'items'} in cart
              </span>
              <span className="text-lg font-bold">₹{subtotal}</span>
            </div>
            <Link
              href="/cart"
              className="px-5 py-2 rounded-full bg-[#eaddff] text-[#21005d] font-bold text-xs hover:bg-white transition-all flex items-center gap-1.5"
            >
              <span>View Cart & Checkout</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
