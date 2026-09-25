'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/dataService';
import { Restaurant } from '@/types';

const CATEGORIES = [
  { name: 'All', icon: '🍽️' },
  { name: 'Biryani', icon: '🍲' },
  { name: 'Tiffin', icon: '🥞' },
  { name: 'Fast Food', icon: '🍔' },
  { name: 'Sweets', icon: '🍮' },
  { name: 'Momo', icon: '🥟' },
  { name: 'Indian Food', icon: '🍛' },
  { name: 'Chinese', icon: '🍜' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Cafe', icon: '☕' },
];

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await dataService.getActiveRestaurants();
      setRestaurants(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || r.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const featured = filtered.filter((r) => r.is_featured);

  return (
    <div className="space-y-6">
      {/* Hero Banner for Bargarh */}
      <section className="bg-gradient-to-r from-[#eaddff] to-[#f3edf7] rounded-3xl p-6 border border-[#d0bcff] shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-[#6750a4] mb-2">
              <span>📍</span> Delivering across Bargarh City only
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#21005d]">
              Direct from Bargarh’s Kitchens
            </h1>
            <p className="text-sm text-[#49454f] mt-1 max-w-md">
              Order fresh food directly from local restaurants. Cash on Delivery (COD) only.
            </p>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/70 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
            🍛
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search restaurants, biryani, tiffin, momo in Bargarh..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-11 rounded-2xl bg-white border border-[#cac4d0] focus:outline-none focus:ring-2 focus:ring-[#6750a4] text-sm shadow-xs"
        />
        <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
      </div>

      {/* Category Horizontal Selector */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#79747e] mb-3">
          Popular Categories
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                selectedCategory === cat.name
                  ? 'bg-[#6750a4] text-white shadow-xs'
                  : 'bg-white text-[#49454f] border border-[#cac4d0] hover:bg-[#f3edf7]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Restaurants */}
      {featured.length > 0 && selectedCategory === 'All' && !searchQuery && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#21005d] flex items-center gap-1.5">
              <span>⭐</span> Featured in Bargarh
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurant/${restaurant.id}`}
                className="group bg-white rounded-3xl overflow-hidden border border-[#cac4d0] hover:border-[#6750a4] shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="h-40 relative bg-gray-100 overflow-hidden">
                  <img
                    src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-[#6750a4] text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Featured
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-[#21005d] text-xs font-semibold px-2.5 py-1 rounded-lg">
                    ₹{restaurant.delivery_fee} Delivery
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-[#1c1b1f] text-base group-hover:text-[#6750a4] transition-colors">
                        {restaurant.name}
                      </h3>
                      <span className="text-xs bg-[#eaddff] text-[#21005d] px-2 py-0.5 rounded-full font-medium">
                        {restaurant.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#49454f] mt-1 line-clamp-2">
                      {restaurant.description}
                    </p>
                    <p className="text-[11px] text-[#79747e] mt-2 flex items-center gap-1">
                      <span>📍</span> {restaurant.address}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f3edf7] flex items-center justify-between text-xs text-[#49454f]">
                    <span>Min order: ₹{restaurant.min_order_amount}</span>
                    <span className="text-[#6750a4] font-semibold group-hover:underline">
                      View Menu →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Restaurants List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#49454f]">
            {selectedCategory === 'All' ? 'All Active Restaurants' : `${selectedCategory} Restaurants`}
          </h2>
          <span className="text-xs text-[#79747e]">{filtered.length} available</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading Bargarh restaurants...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#cac4d0]">
            <p className="text-base text-gray-600">No restaurants found matching your selection.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#6750a4] font-semibold underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurant/${restaurant.id}`}
                className="bg-white rounded-3xl p-4 border border-[#cac4d0] hover:border-[#6750a4] shadow-xs hover:shadow-md transition-all flex gap-4 items-center"
              >
                <img
                  src={restaurant.logo_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150'}
                  alt={restaurant.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-[#cac4d0] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#1c1b1f] truncate">{restaurant.name}</h3>
                    <span className="text-[10px] bg-[#f3edf7] text-[#49454f] px-2 py-0.5 rounded-full font-medium shrink-0 ml-1">
                      {restaurant.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#49454f] truncate mt-0.5">{restaurant.description}</p>
                  <p className="text-[11px] text-[#79747e] truncate mt-1">📍 {restaurant.address}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#6750a4] font-medium">
                    <span>₹{restaurant.delivery_fee} delivery</span>
                    <span>•</span>
                    <span>Min ₹{restaurant.min_order_amount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
