"use client";

import { useState } from "react";

type OrderClientProps = {
  testItemId?: string;
};

export function OrderClient({ testItemId }: OrderClientProps) {
  const [loading, setLoading] = useState(false);

  async function placeTestOrder() {
    if (!testItemId) {
      console.warn("No testItemId provided for OrderClient");
      return;
    }

    setLoading(true);

    const payload = {
      customer_name: "Test User",
      customer_phone: "9999999999",
      delivery_point: "View Point",
      idempotency_key: crypto.randomUUID(), // ✅ browser-safe
      items: [{ id: testItemId, qty: 1 }],
    };

    try {
      const res = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("ORDER RESPONSE:", data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={placeTestOrder}
      disabled={loading || !testItemId}
      className="mt-6 w-full rounded-md bg-teal-700 px-4 py-2 text-white disabled:opacity-50"
    >
      {loading ? "Placing order…" : "Place Test Order"}
    </button>
  );
}
