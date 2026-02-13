"use client";

import { useState } from "react";

function generateIdempotencyKey() {
  return crypto.randomUUID();
}

type MenuItem = {
  id: string;
  name: string;
  price: number;
};

type Props = {
  items: MenuItem[];
};

export default function DamClient({ items }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [point, setPoint] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [idempotencyKey] = useState(generateIdempotencyKey);

  function increment(id: string) {
    setCart(p => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  }

  function decrement(id: string) {
    setCart(p => {
      const q = (p[id] ?? 0) - 1;
      if (q <= 0) {
        const c = { ...p };
        delete c[id];
        return c;
      }
      return { ...p, [id]: q };
    });
  }

  const cartItems = items.filter(i => cart[i.id]);
  const subtotal = cartItems.reduce((s, i) => s + i.price * cart[i.id], 0);

  async function placeOrder() {
    if (!name || !phone || !point || cartItems.length === 0) {
      setMessage("Fill all details.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/order/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        delivery_point: point,
        idempotency_key: idempotencyKey,
        items: cartItems.map(i => ({
          id: i.id,
          qty: cart[i.id],
        })),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Order failed");
      setLoading(false);
      return;
    }

    setOrderId(data.order_id);
    setLoading(false);
  }

  async function handlePayment() {
    if (!orderId) return;

    setLoading(true);

    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Payment init failed");
      setLoading(false);
      return;
    }

    const razorpay = new (window as any).Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpay_order_id,
      handler() {
        setMessage("Payment successful. Awaiting confirmation.");
        setCart({});
      },
    });

    razorpay.open();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <p className="font-semibold">Subtotal: ₹{subtotal}</p>

      <button
        disabled={loading || !!orderId}
        onClick={placeOrder}
        className="w-full bg-teal-700 text-white py-2 rounded"
      >
        {loading ? "Processing..." : "Place Order"}
      </button>

      {orderId && (
        <button
          onClick={handlePayment}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Pay Now
        </button>
      )}

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
