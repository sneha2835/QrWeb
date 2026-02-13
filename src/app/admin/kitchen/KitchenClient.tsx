"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  item_name: string;
  quantity: number;
};

type Order = {
  id: string;
  customer_name: string;
  delivery_point: string;
  status: string;
  order_items: OrderItem[];
};

export function KitchenClient() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    const res = await fetch("/api/admin/orders", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!res.ok) return;

    const data = await res.json();

    setOrders(
      data.orders.filter((o: Order) =>
        ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)
      )
    );
  }

  useEffect(() => {
  async function init() {
    await load();
  }

  init();

  const id = setInterval(() => {
    load();
  }, 10000);

  return () => clearInterval(id);
}, []);


  return (
    <div className="space-y-6">
      {orders.map(order => (
        <div
          key={order.id}
          className="rounded-xl border p-6 bg-white"
        >
          <p className="text-2xl font-bold">{order.customer_name}</p>
          <p className="text-lg text-slate-600">
            {order.delivery_point}
          </p>

          <ul className="mt-4 text-xl space-y-2">
            {order.order_items.map((item, i) => (
              <li key={i}>
                {item.item_name} × {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {orders.length === 0 && (
        <p className="text-xl text-slate-500">
          No orders in kitchen.
        </p>
      )}
    </div>
  );
}
