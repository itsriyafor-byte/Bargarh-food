'use client';

import { useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';
import { Restaurant, Order, AuditLog } from '@/types';

export default function AdminDashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'restaurants' | 'orders' | 'analytics' | 'audit'>('restaurants');
  const [loading, setLoading] = useState(true);

  // New Restaurant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newRestDesc, setNewRestDesc] = useState('');
  const [newRestCategory, setNewRestCategory] = useState('Biryani');
  const [newRestAddress, setNewRestAddress] = useState('');
  const [newRestPhone, setNewRestPhone] = useState('');
  const [newRestCoverUrl, setNewRestCoverUrl] = useState('');
  const [newRestDeliveryFee, setNewRestDeliveryFee] = useState('25');
  const [newRestMinOrder, setNewRestMinOrder] = useState('100');
  const [newRestCommission, setNewRestCommission] = useState('10');

  const loadData = async () => {
    setLoading(true);
    const r = await dataService.getAllRestaurants();
    const o = await dataService.getAllOrders();
    const a = await dataService.getAuditLogs();
    setRestaurants(r);
    setOrders(o);
    setAuditLogs(a);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (restaurant: Restaurant) => {
    const updated = { ...restaurant, is_active: !restaurant.is_active };
    await dataService.saveRestaurant(updated);
    await dataService.recordAudit('TOGGLE_RESTAURANT_STATUS', 'restaurant', restaurant.id, {
      name: restaurant.name,
      newStatus: updated.is_active,
    });
    loadData();
  };

  const handleToggleFeatured = async (restaurant: Restaurant) => {
    const updated = { ...restaurant, is_featured: !restaurant.is_featured };
    await dataService.saveRestaurant(updated);
    await dataService.recordAudit('TOGGLE_RESTAURANT_FEATURED', 'restaurant', restaurant.id, {
      name: restaurant.name,
      newFeatured: updated.is_featured,
    });
    loadData();
  };

  const handleUpdateCommission = async (restaurant: Restaurant, newRate: string) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0) return;
    const updated = { ...restaurant, commission_percentage: rate };
    await dataService.saveRestaurant(updated);
    await dataService.recordAudit('UPDATE_COMMISSION_RATE', 'restaurant', restaurant.id, {
      name: restaurant.name,
      newRate: rate,
    });
    loadData();
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName.trim() || !newRestAddress.trim()) return;

    const newRest: Restaurant = {
      id: crypto.randomUUID(),
      name: newRestName.trim(),
      description: newRestDesc.trim(),
      category: newRestCategory,
      address: newRestAddress.trim(),
      phone: newRestPhone.trim() || '+91 94370 00000',
      city_id: 'bargarh_city',
      cover_image_url: newRestCoverUrl.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      logo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150',
      is_active: true,
      is_featured: false,
      delivery_available: true,
      pickup_available: true,
      delivery_fee: parseFloat(newRestDeliveryFee) || 25,
      min_order_amount: parseFloat(newRestMinOrder) || 100,
      opening_hours: '11:00 AM - 10:00 PM',
      commission_percentage: parseFloat(newRestCommission) || 10,
    };

    await dataService.saveRestaurant(newRest);
    await dataService.recordAudit('CREATE_RESTAURANT', 'restaurant', newRest.id, {
      name: newRest.name,
    });

    setShowAddModal(false);
    setNewRestName('');
    setNewRestDesc('');
    setNewRestAddress('');
    setNewRestPhone('');
    setNewRestCoverUrl('');
    loadData();
  };

  const totalGMV = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const deliveredOrders = orders.filter((o) => o.order_status === 'DELIVERED');
  const deliveredSales = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const platformCommissionEst = Math.round(deliveredSales * 0.1);

  if (loading) {
    return <div className="py-20 text-center text-sm text-[#49454f]">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-[#cac4d0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#21005d] rounded-full text-xs font-bold text-white mb-1">
            🛡️ Platform Admin Dashboard
          </div>
          <h1 className="text-xl font-bold text-[#1c1b1f]">Bargarh Food Marketplace Control</h1>
          <p className="text-xs text-[#49454f]">
            Platform-wide management, commission controls, and security audits for Bargarh city
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-full bg-[#6750a4] hover:bg-[#523d8c] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>+</span> Add New Restaurant
        </button>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#eaddff] rounded-3xl p-4 border border-[#d0bcff] text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#21005d]">
            Total Restaurants
          </span>
          <div className="text-2xl font-black text-[#21005d] mt-1">{restaurants.length}</div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-[#cac4d0] text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#79747e]">
            Total Orders
          </span>
          <div className="text-2xl font-black text-[#1c1b1f] mt-1">{orders.length}</div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-[#cac4d0] text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#79747e]">
            Delivered Sales
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{deliveredSales}</div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-[#cac4d0] text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#79747e]">
            Platform Earnings
          </span>
          <div className="text-2xl font-black text-[#6750a4] mt-1">₹{platformCommissionEst}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#cac4d0] pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('restaurants')}
          className={`px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'restaurants'
              ? 'bg-[#6750a4] text-white shadow-xs'
              : 'text-[#49454f] hover:bg-[#f3edf7]'
          }`}
        >
          Restaurants ({restaurants.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[#6750a4] text-white shadow-xs'
              : 'text-[#49454f] hover:bg-[#f3edf7]'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#6750a4] text-white shadow-xs'
              : 'text-[#49454f] hover:bg-[#f3edf7]'
          }`}
        >
          Analytics & Commissions
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-[#6750a4] text-white shadow-xs'
              : 'text-[#49454f] hover:bg-[#f3edf7]'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab: Restaurants Management */}
      {activeTab === 'restaurants' && (
        <div className="space-y-3">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-3xl p-4 border border-[#cac4d0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
                  alt={restaurant.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-[#cac4d0]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#1c1b1f]">{restaurant.name}</h3>
                    <span className="text-[10px] bg-[#f3edf7] px-2 py-0.5 rounded-full font-medium">
                      {restaurant.category}
                    </span>
                    {restaurant.is_featured && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <p className="text-[#49454f] mt-0.5">📍 {restaurant.address}</p>
                  <p className="text-gray-400 text-[11px]">Phone: {restaurant.phone}</p>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#f3edf7]">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-600">Commission:</span>
                  <input
                    type="number"
                    defaultValue={restaurant.commission_percentage}
                    onBlur={(e) => handleUpdateCommission(restaurant, e.target.value)}
                    className="w-14 px-2 py-1 bg-[#fdf8ff] border border-[#cac4d0] rounded-lg font-bold text-xs"
                  />
                  <span>%</span>
                </div>

                <button
                  onClick={() => handleToggleFeatured(restaurant)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    restaurant.is_featured
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {restaurant.is_featured ? 'Unfeature' : 'Feature'}
                </button>

                <button
                  onClick={() => handleToggleActive(restaurant)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    restaurant.is_active
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {restaurant.is_active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#cac4d0]">
              <p className="text-sm text-gray-500">No orders placed yet.</p>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-3xl p-4 border border-[#cac4d0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#6750a4]">{o.id}</span>
                    <span className="font-bold text-[#1c1b1f]">{o.restaurant_name}</span>
                    <span className="px-2 py-0.5 bg-[#eaddff] text-[#21005d] rounded-full text-[10px] font-bold">
                      {o.order_status}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-1">
                    Customer: <span className="font-medium text-[#1c1b1f]">{o.customer_name}</span> (
                    {o.customer_phone})
                  </div>
                  <div className="text-gray-400 text-[11px]">📍 {o.delivery_address}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-[#21005d]">₹{o.total_amount} (COD)</div>
                  <div className="text-gray-400 text-[11px]">
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Platform Analytics */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-3xl p-6 border border-[#cac4d0] shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#49454f]">
            Financial & Marketplace Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#fdf8ff] rounded-2xl border border-[#cac4d0]">
              <span className="text-gray-500">Gross Merchandise Value (GMV)</span>
              <div className="text-xl font-bold text-[#1c1b1f] mt-1">₹{totalGMV}</div>
            </div>
            <div className="p-4 bg-[#fdf8ff] rounded-2xl border border-[#cac4d0]">
              <span className="text-gray-500">Delivered Orders Volume</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">₹{deliveredSales}</div>
            </div>
            <div className="p-4 bg-[#fdf8ff] rounded-2xl border border-[#cac4d0]">
              <span className="text-gray-500">Platform Commission (Avg ~10%)</span>
              <div className="text-xl font-bold text-[#6750a4] mt-1">₹{platformCommissionEst}</div>
            </div>
          </div>
          <p className="text-xs text-[#79747e] pt-2">
            * Note: Restaurants collect COD directly upon delivery. Commissions can be settled
            periodically through the platform ledger.
          </p>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-[#cac4d0] shadow-xs space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#49454f]">
            Platform Administrative Audit Trail
          </h2>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-gray-500">No audit logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#f3edf7] text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#21005d]">{log.action}</span>
                    <span className="text-gray-500 ml-2">[{log.entity_type}]</span>
                    {log.details && (
                      <span className="text-gray-600 block text-[11px]">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 border border-[#cac4d0] shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#21005d]">Add New Restaurant in Bargarh</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Biryani & Kabab"
                  value={newRestName}
                  onChange={(e) => setNewRestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Cuisine highlights and specialties"
                  value={newRestDesc}
                  onChange={(e) => setNewRestDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Primary Category</label>
                  <select
                    value={newRestCategory}
                    onChange={(e) => setNewRestCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                  >
                    <option value="Biryani">Biryani</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Indian Food">Indian Food</option>
                    <option value="Tiffin">Tiffin</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Momo">Momo</option>
                    <option value="Sweets">Sweets</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Cafe">Cafe</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 94370 12345"
                    value={newRestPhone}
                    onChange={(e) => setNewRestPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Address in Bargarh *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhatli Chowk, Ward 7, Bargarh"
                  value={newRestAddress}
                  onChange={(e) => setNewRestAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={newRestDeliveryFee}
                    onChange={(e) => setNewRestDeliveryFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={newRestMinOrder}
                    onChange={(e) => setNewRestMinOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Commission %</label>
                  <input
                    type="number"
                    value={newRestCommission}
                    onChange={(e) => setNewRestCommission(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newRestCoverUrl}
                  onChange={(e) => setNewRestCoverUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#6750a4] text-white font-bold"
                >
                  Create Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
