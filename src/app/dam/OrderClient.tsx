"use client";

import { useState } from "react";

type OrderItem = {
  id: number;
  qty: number;
};

export function OrderClient() {
  const [loading, setLoading] = useState(false);

  async function placeTestOrder() {
    setLoading(true);

    const payload = {
      customer_name: "Test User",
      customer_phone: "9999999999",
      delivery_point: "View Point",
      items: [{ id: 1, qty: 1 }], // 👈 MUST exist in DB
    };

    const res = await fetch("/api/order/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("ORDER RESPONSE:", data);

    setLoading(false);
  }

  return (
    <button
      onClick={placeTestOrder}
      disabled={loading}
      className="mt-6 w-full rounded-md bg-teal-700 px-4 py-2 text-white"
    >
      {loading ? "Placing order…" : "Place Test Order"}
    </button>
  );
}
