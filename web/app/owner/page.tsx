'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/dataService';
import { Restaurant, MenuItem, Order, OrderStatus } from '@/types';

export default function OwnerPortalPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'history'>('orders');
  const [loading, setLoading] = useState(true);

  // New menu item form state
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Biryani');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [newItemImageUrl, setNewItemImageUrl] = useState('');

  useEffect(() => {
    async function init() {
      const all = await dataService.getAllRestaurants();
      setRestaurants(all);
      if (all.length > 0) {
        setSelectedRestaurantId(all[0].id);
      }
      setLoading(false);
    }
    init();
  }, []);

  const refreshRestaurantData = async (restId: string) => {
    if (!restId) return;
    const rOrders = await dataService.getOrdersForRestaurant(restId);
    const rMenu = await dataService.getMenuItemsByRestaurant(restId);
    setOrders(rOrders);
    setMenuItems(rMenu);
  };

  useEffect(() => {
    if (selectedRestaurantId) {
      refreshRestaurantData(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  const currentRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    await dataService.updateOrderStatus(orderId, nextStatus);
    await dataService.recordAudit(
      'ORDER_STATUS_CHANGED',
      'order',
      orderId,
      { nextStatus, restaurantId: selectedRestaurantId }
    );
    if (selectedRestaurantId) {
      refreshRestaurantData(selectedRestaurantId);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const updated = { ...item, is_available: !item.is_available };
    await dataService.saveMenuItem(updated);
    if (selectedRestaurantId) {
      refreshRestaurantData(selectedRestaurantId);
    }
  };

  const handleUpdatePrice = async (item: MenuItem, newPriceStr: string) => {
    const val = parseFloat(newPriceStr);
    if (isNaN(val) || val < 0) return;
    const updated = { ...item, price: val };
    await dataService.saveMenuItem(updated);
    if (selectedRestaurantId) {
      refreshRestaurantData(selectedRestaurantId);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      await dataService.deleteMenuItem(itemId);
      if (selectedRestaurantId) {
        refreshRestaurantData(selectedRestaurantId);
      }
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      restaurant_id: selectedRestaurantId,
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      category_name: newItemCategory,
      price: parseFloat(newItemPrice),
      image_url: newItemImageUrl.trim(),
      is_available: true,
      is_veg: newItemVeg,
    };

    await dataService.saveMenuItem(newItem);
    await dataService.recordAudit('MENU_ITEM_ADDED', 'menu_item', newItem.id, {
      name: newItem.name,
      restaurantId: selectedRestaurantId,
    });

    setShowAddMenuModal(false);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemImageUrl('');

    if (selectedRestaurantId) {
      refreshRestaurantData(selectedRestaurantId);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-[#49454f]">Loading Restaurant Portal...</div>;
  }

  const activeOrders = orders.filter(
    (o) => o.order_status !== 'DELIVERED' && o.order_status !== 'REJECTED' && o.order_status !== 'CANCELLED'
  );
  const deliveredOrders = orders.filter((o) => o.order_status === 'DELIVERED');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Restaurant Isolation Selector */}
      <div className="bg-white rounded-3xl p-5 border border-[#cac4d0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eaddff] rounded-full text-xs font-bold text-[#21005d] mb-1">
            🔒 Restaurant Owner Portal (Isolated Access)
          </div>
          <h1 className="text-xl font-bold text-[#1c1b1f]">
            {currentRestaurant?.name || 'Restaurant Management'}
          </h1>
          <p className="text-xs text-[#49454f]">
            Managing orders & menu for <span className="font-semibold">{currentRestaurant?.address}</span>
          </p>
        </div>

        {/* Multi-Restaurant Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#49454f]">Switch Restaurant:</label>
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-[#fdf8ff] border border-[#cac4d0] text-xs font-bold text-[#21005d] focus:outline-none"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#eaddff] rounded-3xl p-4 border border-[#d0bcff] text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#21005d]">
            Active Orders
          </span>
          <div className="text-2xl font-black text-[#21005d] mt-1">{activeOrders.length}</div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-[#cac4d0] text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#79747e]">
            Delivered Orders
          </span>
          <div className="text-2xl font-black text-[#1c1b1f] mt-1">{deliveredOrders.length}</div>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-[#cac4d0] text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#79747e]">
            Delivered Sales
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalRevenue}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#cac4d0] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-2xl transition-all ${
            activeTab === 'orders'
              ? 'bg-[#6750a4] text-white shadow-xs'
              : 'text-[#49454f] hover:bg-[#f3edf7]'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-2xl transition-all ${
            activeTab === 'menu'
              ? 'bg-[#6750a4] text-white shadow-xs'
              : 'text-[#49454f] hover:bg-[#f3edf7]'
          }`}
        >
          Menu Management ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-2xl transition-all ${
            activeTab === 'history'
              ? 'bg-[#6750a4] text-white shadow-xs'
              : 'text-[#49454f] hover:bg-[#f3edf7]'
          }`}
        >
          Order History ({deliveredOrders.length})
        </button>
      </div>

      {/* Tab 1: Active Orders with Status Progression */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#cac4d0]">
              <p className="text-sm text-gray-500">No pending orders right now.</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 border border-[#cac4d0] shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f3edf7] pb-3">
                  <div>
                    <span className="text-xs font-extrabold text-[#6750a4] tracking-wider">
                      {order.id}
                    </span>
                    <h3 className="font-bold text-sm text-[#1c1b1f]">
                      Customer: {order.customer_name} ({order.customer_phone})
                    </h3>
                    <p className="text-[11px] text-[#49454f]">📍 {order.delivery_address}</p>
                    {order.delivery_notes && (
                      <p className="text-[11px] text-amber-700 italic">Notes: "{order.delivery_notes}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#eaddff] text-[#21005d]">
                      {order.order_status}
                    </span>
                    <div className="text-xs font-bold text-[#1c1b1f] mt-1">
                      COD Total: ₹{order.total_amount}
                    </div>
                  </div>
                </div>

                {/* Items in order */}
                <div className="text-xs space-y-1 bg-[#fdf8ff] p-3 rounded-2xl border border-[#cac4d0]">
                  <div className="font-semibold text-[#79747e] text-[11px]">Items:</div>
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {it.item_name} × {it.quantity}
                      </span>
                      <span className="font-medium">₹{it.subtotal}</span>
                    </div>
                  ))}
                </div>

                {/* Status Progression Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs font-bold text-[#49454f] mr-1">Update Status:</span>

                  {order.order_status === 'NEW' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(order.id, 'ACCEPTED')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-xs"
                      >
                        ✓ Accept Order
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.order_status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'PREPARING')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs"
                    >
                      🔥 Start Cooking & Preparing
                    </button>
                  )}

                  {order.order_status === 'PREPARING' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'READY')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-bold shadow-xs"
                    >
                      🥡 Food Ready & Packed
                    </button>
                  )}

                  {order.order_status === 'READY' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'OUT_FOR_DELIVERY')}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-xs"
                    >
                      🛵 Dispatch Out for Delivery
                    </button>
                  )}

                  {order.order_status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold shadow-xs"
                    >
                      ✅ Delivered (Collect Cash ₹{order.total_amount})
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Menu Management */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#49454f]">
              {currentRestaurant?.name} Menu Items
            </h2>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="px-4 py-2 bg-[#6750a4] hover:bg-[#523d8c] text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <span>+</span> Add Food Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-[#cac4d0] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#cac4d0]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#eaddff] flex items-center justify-center text-2xl shrink-0">
                      🍲
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{item.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                      <span className="text-[10px] bg-[#f3edf7] px-2 py-0.5 rounded-full text-[#49454f]">
                        {item.category_name}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#1c1b1f] truncate mt-0.5">{item.name}</h3>
                    <p className="text-xs text-[#49454f] line-clamp-1">{item.description}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f3edf7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#21005d]">Price: ₹</span>
                    <input
                      type="number"
                      defaultValue={item.price}
                      onBlur={(e) => handleUpdatePrice(item, e.target.value)}
                      className="w-16 px-2 py-1 bg-[#fdf8ff] border border-[#cac4d0] rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        item.is_available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-bold p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Delivered Order History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {deliveredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#cac4d0]">
              <p className="text-sm text-gray-500">No completed orders yet.</p>
            </div>
          ) : (
            deliveredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-4 border border-[#cac4d0] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-extrabold text-[#6750a4]">{order.id}</span>
                  <div className="font-semibold text-[#1c1b1f]">{order.customer_name}</div>
                  <div className="text-[11px] text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700">₹{order.total_amount} (Delivered)</div>
                  <div className="text-[11px] text-gray-500">{order.items?.length || 0} items</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Add Menu Item */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-[#cac4d0] shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#21005d]">Add Menu Item</h3>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mutton Rogan Josh"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Ingredients and taste profile"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
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
                  <label className="block font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    step="1"
                    min="1"
                    placeholder="150"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemVeg}
                    onChange={(e) => setNewItemVeg(e.target.checked)}
                    className="rounded"
                  />
                  <span className="font-semibold">{newItemVeg ? '🟢 Pure Veg' : '🔴 Non-Veg'}</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fdf8ff] border border-[#cac4d0]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#6750a4] text-white font-bold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
