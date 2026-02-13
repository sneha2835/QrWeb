"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  status: string;
  paymentStatus: string;
  razorpayOrderId?: string | null;
  onUpdated: () => void;
};

export function OrderStatusControl({
  orderId,
  status,
  paymentStatus,
  razorpayOrderId,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function update(payload: Record<string, any>) {
    setLoading(true);
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      onUpdated(); // 🔑 immediate refresh
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 pt-2 flex-wrap">
      {status === "PAYMENT_PENDING" && (
        <button
          disabled={loading}
          onClick={() => update({ status: "CONFIRMED" })}
          className="rounded bg-teal-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Mark CONFIRMED
        </button>
      )}

      {/* 💰 CASH ONLY — hide if Razorpay order exists */}
      {paymentStatus !== "PAID" && !razorpayOrderId && (
        <button
          disabled={loading}
          onClick={() => update({ payment_status: "PAID" })}
          className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Mark Paid (Cash)
        </button>
      )}
    </div>
  );
}
