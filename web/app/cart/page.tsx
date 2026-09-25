'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cartContext';
import { dataService } from '@/lib/dataService';

export default function CartPage() {
  const router = useRouter();
  const { items, currentRestaurant, updateQuantity, removeFromCart, clearCart, subtotal } =
    useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (items.length === 0 || !currentRestaurant) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="text-5xl">🛒</div>
        <h2 className="text-xl font-bold text-[#21005d]">Your Bargarh Food Cart is Empty</h2>
        <p className="text-xs text-[#49454f]">
          Explore delicious food from local restaurants in Bargarh city!
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#6750a4] text-white text-xs font-bold rounded-full shadow-xs hover:bg-[#523d8c] transition-all"
        >
          Explore Restaurants
        </Link>
      </div>
    );
  }

  const deliveryFee = currentRestaurant.delivery_fee || 0;
  const grandTotal = subtotal + deliveryFee;
  const meetsMinOrder = subtotal >= (currentRestaurant.min_order_amount || 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number for order updates.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('Please enter your delivery street address in Bargarh.');
      return;
    }
    if (!meetsMinOrder) {
      setErrorMsg(
        `Minimum order amount for ${currentRestaurant.name} is ₹${currentRestaurant.min_order_amount}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await dataService.createGuestOrder(
        currentRestaurant,
        customerName.trim(),
        customerPhone.trim(),
        deliveryAddress.trim(),
        deliveryNotes.trim(),
        items
      );
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#21005d]">Checkout & Cart</h1>
          <p className="text-xs text-[#6750a4] font-medium">
            Ordering from: <span className="font-bold">{currentRestaurant.name}</span>
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:underline font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Cart Items & Total */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#cac4d0] shadow-xs space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#49454f]">
              Order Summary
            </h2>

            <div className="divide-y divide-[#f3edf7]">
              {items.map((cartItem) => (
                <div
                  key={cartItem.menuItem.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span>{cartItem.menuItem.is_veg ? '🟢' : '🔴'}</span>
                      <span className="font-semibold text-[#1c1b1f] truncate">
                        {cartItem.menuItem.name}
                      </span>
                    </div>
                    <div className="text-[#79747e] mt-0.5">
                      ₹{cartItem.menuItem.price} × {cartItem.quantity}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#f3edf7] rounded-full px-2 py-0.5 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(cartItem.menuItem.id, -1)}
                        className="w-5 h-5 rounded-full bg-white text-[#21005d] font-bold text-xs flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-bold text-[#21005d] text-xs px-1">
                        {cartItem.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(cartItem.menuItem.id, 1)}
                        className="w-5 h-5 rounded-full bg-white text-[#21005d] font-bold text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold text-[#1c1b1f] w-14 text-right">
                      ₹{cartItem.menuItem.price * cartItem.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Calculation */}
            <div className="pt-3 border-t border-[#cac4d0] space-y-1.5 text-xs text-[#49454f]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#1c1b1f]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Restaurant Delivery Fee</span>
                <span className="font-semibold text-[#1c1b1f]">₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#cac4d0] text-sm font-bold text-[#21005d]">
                <span>Grand Total to Pay (COD)</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            {!meetsMinOrder && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
                Minimum order amount is ₹{currentRestaurant.min_order_amount}. Please add ₹
                {currentRestaurant.min_order_amount - subtotal} more to proceed.
              </div>
            )}
          </div>

          {/* COD Notice Box */}
          <div className="bg-[#eaddff] rounded-3xl p-4 border border-[#d0bcff] text-xs text-[#21005d] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>💵</span> Payment Method: Cash on Delivery (COD) Only
            </div>
            <p className="text-[11px] text-[#49454f]">
              Pay cash directly to the restaurant delivery executive upon receiving your order in
              Bargarh. No online payment needed.
            </p>
          </div>
        </div>

        {/* Right Column: Guest Delivery Details Form */}
        <div className="md:col-span-6">
          <form
            onSubmit={handlePlaceOrder}
            className="bg-white rounded-3xl p-5 border border-[#cac4d0] shadow-xs space-y-4"
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#49454f]">
              Delivery Details (Bargarh City)
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1c1b1f] mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Sahu"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#fdf8ff] border border-[#cac4d0] text-xs focus:outline-none focus:ring-2 focus:ring-[#6750a4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1c1b1f] mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile e.g. 9861012345"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#fdf8ff] border border-[#cac4d0] text-xs focus:outline-none focus:ring-2 focus:ring-[#6750a4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1c1b1f] mb-1">
                Delivery Address in Bargarh *
              </label>
              <textarea
                required
                rows={3}
                placeholder="House / Flat No, Street, Landmark, Ward No / Area in Bargarh"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#fdf8ff] border border-[#cac4d0] text-xs focus:outline-none focus:ring-2 focus:ring-[#6750a4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1c1b1f] mb-1">
                Cooking / Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Less spicy, call before arriving"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#fdf8ff] border border-[#cac4d0] text-xs focus:outline-none focus:ring-2 focus:ring-[#6750a4]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !meetsMinOrder}
              className="w-full py-3.5 bg-[#6750a4] hover:bg-[#523d8c] text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Placing your order...</span>
              ) : (
                <span>Place Order with Cash on Delivery (₹{grandTotal})</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
