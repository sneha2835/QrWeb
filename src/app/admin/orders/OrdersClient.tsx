"use client";

import { useEffect, useState } from "react";
import { OrderStatusControl } from "./OrderStatusControl";

type OrderItem = {
  item_name: string;
  quantity: number;
  price_at_order: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_point: string;
  total_amount: number;
  status: string;
  payment_status: string;
  razorpay_order_id: string | null;
  order_items: OrderItem[];
};

const statusColor: Record<string, string> = {
  PAYMENT_PENDING: "bg-gray-200 text-gray-800",
  CONFIRMED: "bg-blue-200 text-blue-800",
  PREPARING: "bg-orange-200 text-orange-800",
  OUT_FOR_DELIVERY: "bg-purple-200 text-purple-800",
  DELIVERED: "bg-green-200 text-green-800",
};

const paymentColor: Record<string, string> = {
  PENDING: "bg-yellow-200 text-yellow-800",
  PAID: "bg-green-200 text-green-800",
};

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    const id = setInterval(loadOrders, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <button
        onClick={loadOrders}
        disabled={loading}
        className="rounded bg-slate-200 px-3 py-1 text-sm"
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>

      {orders.map(order => (
        <section
          key={order.id}
          className="rounded border bg-white p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-sm text-slate-600">
                {order.customer_phone} • {order.delivery_point}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={`rounded px-2 py-1 text-xs font-medium ${statusColor[order.status]}`}>
  {order.status}
</span>

<span className={`rounded px-2 py-1 text-xs font-medium ${paymentColor[order.payment_status]}`}>
  {order.payment_status}
</span>

            </div>
          </div>

          <ul className="text-sm space-y-1">
            {order.order_items.map((item, i) => (
              <li key={i}>
                {item.item_name} × {item.quantity}
              </li>
            ))}
          </ul>

          <p className="text-sm font-medium">
            Total: ₹{order.total_amount}
          </p>

          <OrderStatusControl
          orderId={order.id}
          status={order.status}
          paymentStatus={order.payment_status}
          razorpayOrderId={order.razorpay_order_id} // ✅ ADD THIS
          onUpdated={loadOrders}
/>
        </section>
      ))}
    </div>
  );
}
