'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/dataService';
import { Order, OrderStatus } from '@/types';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'NEW', label: 'Order Placed', icon: '📝' },
  { status: 'ACCEPTED', label: 'Accepted by Restaurant', icon: '👨‍🍳' },
  { status: 'PREPARING', label: 'Cooking & Packing', icon: '🔥' },
  { status: 'READY', label: 'Food Ready', icon: '🥡' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
  { status: 'DELIVERED', label: 'Delivered', icon: '✅' },
];

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    setLoading(true);
    const data = await dataService.getOrderById(orderId);
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="py-20 text-center text-sm text-[#49454f]">
        Locating Order {orderId} in Bargarh...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-[#cac4d0] space-y-3">
        <h2 className="text-xl font-bold text-red-600">Order Not Found</h2>
        <p className="text-xs text-[#49454f]">
          We could not find order "{orderId}". Please verify the Order ID or place a new order.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#6750a4] text-white text-xs font-bold rounded-full"
        >
          Back to Bargarh Food Home
        </Link>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.status === order.order_status);
  const isRejected = order.order_status === 'REJECTED';
  const isCancelled = order.order_status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#cac4d0] shadow-xs text-center space-y-2">
        <div className="inline-block p-3 rounded-full bg-[#eaddff] text-2xl">
          {order.order_status === 'DELIVERED'
            ? '🎉'
            : isRejected || isCancelled
            ? '❌'
            : '🛵'}
        </div>
        <h1 className="text-xl font-bold text-[#21005d]">Order Confirmation</h1>
        <div className="text-sm font-extrabold text-[#6750a4] tracking-wider">
          ORDER ID: {order.id}
        </div>
        <p className="text-xs text-[#49454f]">
          Thank you, <span className="font-semibold">{order.customer_name}</span>. Your order has
          been sent directly to <span className="font-semibold">{order.restaurant_name}</span>.
        </p>

        <div className="pt-2">
          <button
            onClick={fetchOrder}
            className="text-xs text-[#6750a4] hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>🔄</span> Refresh Status
          </button>
        </div>
      </div>

      {/* Status Progress Stepper */}
      <div className="bg-white rounded-3xl p-6 border border-[#cac4d0] shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#79747e] mb-4">
          Live Order Status
        </h2>

        {isRejected ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-xs">
            <span className="font-bold">Order Rejected:</span> The restaurant could not accept this
            order at this time. Please try another restaurant.
          </div>
        ) : isCancelled ? (
          <div className="p-4 bg-gray-50 text-gray-800 rounded-2xl border border-gray-300 text-xs">
            <span className="font-bold">Order Cancelled:</span> This order was cancelled.
          </div>
        ) : (
          <div className="space-y-4">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                      isDone
                        ? 'bg-[#6750a4] text-white shadow-xs'
                        : 'bg-[#f3edf7] text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-[#eaddff]' : ''}`}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-xs font-bold ${
                        isDone ? 'text-[#1c1b1f]' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </div>
                    {isCurrent && (
                      <div className="text-[11px] text-[#6750a4] font-medium">
                        Current progress step
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details & Frozen Prices Snapshot */}
      <div className="bg-white rounded-3xl p-6 border border-[#cac4d0] shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#79747e]">
          Ordered Food Items (Frozen Snapshot)
        </h2>

        <div className="divide-y divide-[#f3edf7] text-xs">
          {order.items?.map((item, index) => (
            <div key={index} className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-[#1c1b1f]">{item.item_name}</span>
                <span className="text-gray-500 block text-[11px]">
                  ₹{item.unit_price} × {item.quantity}
                </span>
              </div>
              <span className="font-bold text-[#1c1b1f]">₹{item.subtotal}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#cac4d0] space-y-1 text-xs text-[#49454f]">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-semibold text-[#1c1b1f]">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-semibold text-[#1c1b1f]">₹{order.delivery_fee}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#cac4d0] text-sm font-bold text-[#21005d]">
            <span>Total to Pay in Cash (COD)</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="pt-3 border-t border-[#f3edf7] text-xs space-y-1 text-[#49454f]">
          <div className="font-bold text-[#1c1b1f]">Delivery Address in Bargarh:</div>
          <p>{order.delivery_address}</p>
          <div className="text-[11px] text-gray-500 mt-1">
            Contact phone: <span className="font-medium text-[#1c1b1f]">{order.customer_phone}</span>
          </div>
          {order.delivery_notes && (
            <div className="text-[11px] text-gray-500">
              Notes: <i>"{order.delivery_notes}"</i>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#f3edf7] text-[#21005d] text-xs font-semibold rounded-full hover:bg-[#eaddff] transition-all"
        >
          ← Return to Bargarh Restaurants
        </Link>
      </div>
    </div>
  );
}
